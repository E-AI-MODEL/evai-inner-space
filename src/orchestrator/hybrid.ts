/**
 * EvAI v16 - Neurosymbolic Hybrid Orchestrator
 * Integreert Policy Engine, Semantic Graph en Validation Layer
 * voor volledig auditable en reproduceerbare beslissingen
 */

import { decideNextStep, Context as PolicyContext, explainDecision } from '../policy/decision.policy';
import { validatePlan, validateResponse } from '../policy/validation.policy';
import { suggestInterventions, getAllowedInterventions, checkContraIndications } from '../semantics/graph';
import { supabase } from '@/integrations/supabase/client';
import { extractContextParams } from '../utils/contextExtractor';

// v20 EAA Framework Imports
import { evaluateEAA, validateEAAForStrategy } from '../lib/eaaEvaluator';
import { reflectOnHistory, storeReflectiveMemory } from '../lib/regisseurReflectie';
import { evaluateTD, estimateAIContribution } from '../lib/tdMatrix';
import { evaluateEAIRules, executeEAIAction, createEAIContext } from '../policy/eai.rules';
import type { EAAProfile, TDScore, EAIRuleResult } from '@/types/eaa';

export interface OrchestrationContext {
  userInput: string;
  rubric: {
    crisis: number;
    distress: number;
    support: number;
    coping: number;
    overallRisk: number;
    overallProtective: number;
    dominantPattern: string;
  };
  seed: {
    matchScore: number;
    templateId?: string;
    emotion?: string;
    response?: string;
  };
  consent: boolean;
  conversationHistory: any[];
  topEmotion?: string;
  rubricAssessments?: Array<{
    rubricId: string;
    riskScore: number;
    protectiveScore: number;
    triggers?: string[];
    confidenceLevel?: string;
    reasoning?: string;
  }>;
}

export interface OrchestrationResult {
  answer: string;
  emotion: string;
  confidence: number;
  label: 'Valideren' | 'Reflectievraag' | 'Suggestie' | 'Interventie' | 'Fout';
  reasoning: string;
  metadata: {
    policyDecision: string;
    ruleId: string;
    semanticInterventions: string[];
    validated: boolean;
    constraintsOK: boolean;
    processingPath: 'seed' | 'template' | 'llm' | 'crisis' | 'fast';
    auditLog: string[];
  };
}

/**
 * 🎯 Main Orchestration Function
 * Coordineert hele neurosymbolische pipeline
 */
export async function orchestrate(
  ctx: OrchestrationContext
): Promise<OrchestrationResult> {
  const startTime = Date.now();
  const auditLog: string[] = [];
  
  auditLog.push(`🚀 EvAI v20 Orchestration started at ${new Date().toISOString()}`);
  auditLog.push(`📝 Input: "${ctx.userInput.substring(0, 50)}..."`);
  
  // ============ LAYER 8: EAA EVALUATION (v20) ============
  let eaaProfile: EAAProfile = { ownership: 0.5, autonomy: 0.5, agency: 0.5 };
  try {
    const rubricContext = ctx.rubricAssessments && ctx.rubricAssessments.length > 0 ? {
      riskScore: ctx.rubricAssessments[0].riskScore,
      protectiveScore: ctx.rubricAssessments[0].protectiveScore,
      dominantPattern: ctx.rubricAssessments[0].rubricId
    } : undefined;
    
    eaaProfile = evaluateEAA(ctx.userInput, rubricContext);
    auditLog.push(`🧠 EAA Profile: O=${eaaProfile.ownership.toFixed(2)} A=${eaaProfile.autonomy.toFixed(2)} Ag=${eaaProfile.agency.toFixed(2)}`);
  } catch (err) {
    console.error('⚠️ EAA Evaluation failed:', err);
    auditLog.push('⚠️ EAA Evaluation failed, using defaults');
  }
  
  // ============ REGISSEUR REFLECTIE (v20) ============
  let regisseurAdvice = { advice: 'geen precedent', reason: 'init', avgAgency: 0.5 };
  try {
    regisseurAdvice = await reflectOnHistory(ctx.userInput, supabase, {
      similarityThreshold: 0.3,
      maxResults: 5
    });
    auditLog.push(`💭 Regisseur: ${regisseurAdvice.advice} (avg_agency=${regisseurAdvice.avgAgency.toFixed(2)})`);
  } catch (err) {
    console.error('⚠️ Regisseur Reflection failed:', err);
    auditLog.push('⚠️ Regisseur Reflection failed');
  }
  
  try {
    // STAP 1: Analyze input complexity
    const inputComplexity = analyzeInputComplexity(ctx.userInput);
    auditLog.push(`📊 Input complexity: ${JSON.stringify(inputComplexity)}`);

    // STAP 2: Policy Engine - decide next step
    const policyCtx: PolicyContext = {
      rubric: {
        crisis: ctx.rubric.crisis,
        distress: ctx.rubric.distress,
        support: ctx.rubric.support,
        coping: ctx.rubric.coping
      },
      seed: ctx.seed,
      consent: ctx.consent,
      inputComplexity
    };

    const policyDecision = await decideNextStep(policyCtx);
    const explanation = explainDecision(policyDecision, policyCtx);
    auditLog.push(...explanation);

    // STAP 3: Semantic Layer - determine allowed interventions
    const emotionForInterventions = ctx.topEmotion || ctx.seed.emotion || 'neutraal';
    const allowedInterventions = getAllowedInterventions(emotionForInterventions, {
      crisis: ctx.rubric.crisis,
      coping: ctx.rubric.coping,
      distress: ctx.rubric.distress
    });
    
    const suggestedInterventions = suggestInterventions(emotionForInterventions);
    auditLog.push(`💡 Semantic Layer:`);
    auditLog.push(`  • Emotion: ${emotionForInterventions}`);
    auditLog.push(`  • Suggested interventions: ${suggestedInterventions.map(i => i.intervention).join(', ')}`);
    auditLog.push(`  • Allowed interventions: ${allowedInterventions.join(', ')}`);

    // STAP 4: Execute decision
    let answer = '';
    let emotion = emotionForInterventions;
    let confidence = policyDecision.confidence;
    let label: 'Valideren' | 'Reflectievraag' | 'Suggestie' | 'Interventie' | 'Fout' = 'Valideren';
    let reasoning = policyDecision.reasoning;
    let processingPath: 'seed' | 'template' | 'llm' | 'crisis' | 'fast' = 'seed';
    let plan: any = null;
    let validated = true;
    let constraintsOK = true;

    switch (policyDecision.action) {
      case 'USE_SEED':
        auditLog.push(`🎯 Executing: USE_SEED`);
        const seedResult = await compileSeedResponse(ctx, auditLog);
        answer = seedResult.answer;
        processingPath = 'seed';
        label = 'Valideren';
        break;

      case 'FAST_PATH':
        auditLog.push(`⚡ Executing: FAST_PATH`);
        answer = generateFastPathResponse(ctx.userInput);
        processingPath = 'fast';
        label = 'Valideren';
        break;

      case 'TEMPLATE_ONLY':
        auditLog.push(`📋 Executing: TEMPLATE_ONLY`);
        answer = generateTemplateResponse(emotion, allowedInterventions);
        processingPath = 'template';
        label = 'Valideren';
        break;

      case 'ESCALATE_INTERVENTION':
        auditLog.push(`🚨 Executing: ESCALATE_INTERVENTION`);
        plan = {
          goal: 'safety',
          strategy: 'refer',
          steps: ['veiligheid garanderen', 'contact opnemen met volwassene'],
          interventions: ['verwijzing', 'veiligheid']
        };
        answer = generateCrisisResponse(ctx);
        processingPath = 'crisis';
        label = 'Interventie';
        confidence = 0.95;
        break;

      case 'LLM_PLANNING':
        auditLog.push(`🧠 Executing: LLM_PLANNING`);
        // v20: LLM generation with v20 validation
        try {
          // Call edge function for LLM generation
          const { data: llmData, error: llmError } = await supabase.functions.invoke('evai-core', {
            body: {
              operation: 'generate-response',
              input: ctx.userInput,
              emotion,
              allowedInterventions,
              eaaProfile,
              conversationHistory: ctx.conversationHistory?.slice(-6) || []
            }
          });
          
          if (llmError || !llmData?.response) {
            console.warn('⚠️ LLM generation failed, using template fallback');
            answer = generateTemplateResponse(emotion, allowedInterventions);
          } else {
            answer = llmData.response;
            auditLog.push(`✅ LLM generated response (${llmData.model || 'unknown'})`);
          }
        } catch (err) {
          console.error('❌ LLM_PLANNING error:', err);
          answer = generateTemplateResponse(emotion, allowedInterventions);
        }
        processingPath = 'llm';
        label = 'Reflectievraag';
        break;
    }

    // STAP 5: Validate plan (traditional validation + Z3 constraints)
    if (plan) {
      const planValidation = validatePlan(plan, policyCtx);
      validated = planValidation.ok;
      auditLog.push(`🛡️ Plan validation: ${validated ? 'PASSED' : 'FAILED'}`);
      if (!validated) {
        auditLog.push(`  Errors: ${planValidation.errors.join(', ')}`);
      }
      if (planValidation.warnings.length > 0) {
        auditLog.push(`  Warnings: ${planValidation.warnings.join(', ')}`);
      }

      // 🔒 Constraint validation - Z3 layer removed (deprecated)
      // Constraints are now validated via policy and validation layers
      constraintsOK = validated;
      auditLog.push(`🔒 Constraints: ${constraintsOK ? 'SATISFIED' : 'VIOLATED'}`);
    }

    const responseValidation = validateResponse(answer, plan || {}, policyCtx);
    constraintsOK = responseValidation.ok;
    auditLog.push(`🛡️ Response validation: ${constraintsOK ? 'PASSED' : 'FAILED'}`);
    if (!constraintsOK) {
      auditLog.push(`  Errors: ${responseValidation.errors.join(', ')}`);
      // BLOCK response if validation failed
      answer = generateSafetyFallbackResponse();
      label = 'Fout';
      confidence = 0.3;
    }

    // STAP 6: Log decision for audit trail
    // ============ TD-MATRIX EVALUATION (v20) ============
    let tdScore: TDScore = { value: 0.5, flag: '🟢 TD_balanced', shouldBlock: false };
    try {
      const aiContribution = estimateAIContribution(answer);
      tdScore = evaluateTD(aiContribution, eaaProfile.agency);
      auditLog.push(`⚖️ TD-Matrix: ${tdScore.flag} (TD=${tdScore.value.toFixed(2)})`);
      
      if (tdScore.shouldBlock) {
        auditLog.push(`🚨 TD-Matrix BLOCKS output: ${tdScore.reason}`);
        answer = generateSafetyFallbackResponse();
        emotion = 'onzekerheid';
        label = 'Fout';
        reasoning = `TD-Matrix blocked: ${tdScore.reason}`;
      }
    } catch (err) {
      console.error('⚠️ TD-Matrix evaluation failed:', err);
      auditLog.push('⚠️ TD-Matrix evaluation failed');
    }
    
    // ============ E_AI RULES ENGINE (v20) ============
    let eaiResult: EAIRuleResult = { triggered: false };
    try {
      const eaiContext = createEAIContext(
        eaaProfile,
        tdScore.value,
        {
          riskScore: ctx.rubricAssessments?.[0]?.riskScore,
          protectiveScore: ctx.rubricAssessments?.[0]?.protectiveScore
        }
      );
      
      eaiResult = evaluateEAIRules(eaiContext);
      
      if (eaiResult.triggered && eaiResult.action) {
        const shouldBlock = executeEAIAction(eaiResult.action, auditLog);
        
        if (shouldBlock) {
          answer = generateSafetyFallbackResponse();
          emotion = 'onzekerheid';
          label = 'Fout';
          reasoning = `E_AI rule ${eaiResult.ruleId} blocked output`;
        }
      }
    } catch (err) {
      console.error('⚠️ E_AI Rules evaluation failed:', err);
      auditLog.push('⚠️ E_AI Rules evaluation failed');
    }
    
    // ============ EAA STRATEGY VALIDATION (v20) ============
    if (label) {
      const eaaValidation = validateEAAForStrategy(eaaProfile, label);
      if (!eaaValidation.valid) {
        auditLog.push(`⚠️ EAA blocks strategy "${label}": ${eaaValidation.reason}`);
        label = 'Reflectievraag';
      }
    }
    
    // ============ STORE REFLECTIVE MEMORY (v20) ============
    try {
      await storeReflectiveMemory(
        supabase,
        ctx.userInput,
        answer,
        eaaProfile,
        label || 'Reflectievraag'
      );
    } catch (err) {
      console.error('⚠️ Failed to store reflective memory:', err);
    }
    
    const processingTime = Date.now() - startTime;
    auditLog.push(`⏱️ Total processing time: ${processingTime}ms`);
    
    await logDecisionToDatabase({
      ctx,
      policyDecision: policyDecision.action,
      ruleId: policyDecision.ruleId,
      answer,
      emotion,
      confidence,
      validated,
      constraintsOK,
      processingTime,
      auditLog
    });

    // STAP 7: Return result
    return {
      answer,
      emotion,
      confidence,
      label,
      reasoning: policyDecision.reasoning,
      metadata: {
        policyDecision: policyDecision.action,
        ruleId: policyDecision.ruleId,
        semanticInterventions: allowedInterventions,
        validated,
        constraintsOK,
        processingPath,
        auditLog
      }
    };

  } catch (error) {
    console.error('🔴 Orchestration error:', error);
    auditLog.push(`❌ ERROR: ${error instanceof Error ? error.message : String(error)}`);
    
    return {
      answer: 'Het spijt me, er ging iets mis. Kun je het opnieuw proberen?',
      emotion: 'error',
      confidence: 0.1,
      label: 'Fout',
      reasoning: 'System error during orchestration',
      metadata: {
        policyDecision: 'ERROR',
        ruleId: 'error',
        semanticInterventions: [],
        validated: false,
        constraintsOK: false,
        processingPath: 'seed',
        auditLog
      }
    };
  }
}

/**
 * Analyze input complexity
 */
function analyzeInputComplexity(input: string) {
  const length = input.trim().length;
  const isGreeting = /^(hi|hallo|hey|hoi|dag|hello|yo|hé|hee|sup|hiya|ok|oké|ja|nee|hmm)[\s!?.]*$/i.test(input.trim());
  const isComplex = length > 20 && !isGreeting;

  return { length, isGreeting, isComplex };
}

/**
 * Generate fast path response for simple greetings
 */
function generateFastPathResponse(input: string): string {
  const greetings = [
    'Hoi! Hoe kan ik je helpen?',
    'Hey! Vertel, waar loop je tegenaan?',
    'Hallo! Fijn dat je er bent. Wat wil je delen?'
  ];
  return greetings[Math.floor(Math.random() * greetings.length)];
}

/**
 * Generate template response based on emotion and allowed interventions
 */
function generateTemplateResponse(emotion: string, allowedInterventions: string[]): string {
  if (allowedInterventions.includes('valideren')) {
    return `Ik hoor dat je ${emotion} voelt. Dat is helemaal begrijpelijk.`;
  } else if (allowedInterventions.includes('empathie')) {
    return `Het klinkt alsof je ${emotion} ervaart. Ik ben er voor je.`;
  } else {
    return `Dank je voor het delen van je gevoel van ${emotion}.`;
  }
}

/**
 * Generate crisis response
 */
function generateCrisisResponse(ctx: OrchestrationContext): string {
  return `Ik merk dat je in een moeilijke situatie zit. Het is belangrijk dat je niet alleen bent hiermee. Kun je contact opnemen met een volwassene die je vertrouwt, of bel 113 voor directe ondersteuning?`;
}

/**
 * Generate safety fallback response
 */
function generateSafetyFallbackResponse(): string {
  return 'Het spijt me, ik kan hier niet goed op reageren. Laten we het over iets anders hebben, of zoek hulp bij een volwassene als het dringend is.';
}

/**
 * Compile seed response with template parameters
 */
async function compileSeedResponse(
  ctx: OrchestrationContext, 
  auditLog: string[]
): Promise<{ answer: string }> {
  try {
    // Extract context parameters from user input
    const contextParams = extractContextParams(ctx.userInput, ctx.conversationHistory);
    auditLog.push(`📋 Extracted params: ${JSON.stringify(contextParams)}`);
    
    // Use seed response directly if no templateId
    if (!ctx.seed.templateId) {
      console.log('ℹ️ No templateId, using direct response');
      return { answer: ctx.seed.response || 'Ik begrijp je.' };
    }
    
    // Try to load seed for template compilation
    console.log(`🔍 Loading seed ${ctx.seed.templateId} for template compilation...`);
    const { data: seedData, error } = await supabase
      .from('unified_knowledge')
      .select('*')
      .eq('id', ctx.seed.templateId)
      .maybeSingle();
    
    if (error) {
      console.error('⚠️ Failed to load seed:', error);
      auditLog.push(`⚠️ Seed load error: ${error.message}`);
      return { answer: ctx.seed.response || 'Ik begrijp je.' };
    }
    
    if (!seedData) {
      console.warn('⚠️ Seed not found in database, using fallback');
      auditLog.push('⚠️ Seed not found, using fallback response');
      return { answer: ctx.seed.response || 'Ik begrijp je.' };
    }
    
    // Build seed object for compilation
    const seedForCompilation = {
      id: seedData.id,
      emotion: seedData.emotion,
      type: (seedData.metadata as any)?.type || 'validation',
      label: (seedData.metadata as any)?.label || 'Valideren',
      triggers: seedData.triggers || [],
      response: { nl: seedData.response_text || ctx.seed.response || 'Ik begrijp je.' },
      context: (seedData.metadata as any)?.context || { severity: 'medium' },
      meta: (seedData.metadata as any)?.meta || {},
      tags: (seedData.metadata as any)?.tags || [],
      createdAt: new Date(seedData.created_at || Date.now()),
      updatedAt: new Date(seedData.updated_at || Date.now()),
      createdBy: (seedData.metadata as any)?.createdBy || 'system',
      isActive: seedData.active,
      version: '1.0'
    } as any;
    
    // Template compilation (simplified - ReflectionCompiler deprecated)
    let responseText = seedForCompilation.response.nl;
    
    // Simple parameter replacement for common placeholders
    if (/\{[a-zA-Z_]+\}/.test(responseText)) {
      for (const [key, value] of Object.entries(contextParams)) {
        const placeholder = new RegExp(`\\{${key}\\}`, 'g');
        responseText = responseText.replace(placeholder, value);
      }
      // Fallback replacements for unreplaced placeholders
      responseText = responseText.replace(/\{timeOfDay\}/g, 'nu');
      responseText = responseText.replace(/\{situation\}/g, 'in deze situatie');
      responseText = responseText.replace(/\{recentEvent\}/g, 'recent');
      responseText = responseText.replace(/\{temporalRef\}/g, 'op dit moment');
      auditLog.push(`🔧 Template compiled with params`);
      console.log('✅ Template compiled successfully');
    } else {
      console.log('ℹ️ No template parameters found, using response directly');
    }
    
    return { answer: responseText };
    
  } catch (err) {
    console.error('❌ compileSeedResponse error:', err);
    auditLog.push(`❌ Compilation error: ${err instanceof Error ? err.message : String(err)}`);
    // Always return a safe fallback
    return { answer: ctx.seed.response || 'Ik begrijp je. Kun je me meer vertellen?' };
  }
}

/**
 * Log decision to database for audit trail
 */
async function logDecisionToDatabase(params: {
  ctx: OrchestrationContext;
  policyDecision: string;
  ruleId: string;
  answer: string;
  emotion: string;
  confidence: number;
  validated: boolean;
  constraintsOK: boolean;
  processingTime: number;
  auditLog: string[];
}) {
  try {
    const sessionId = sessionStorage.getItem('evai-current-session-id') || 'hybrid-' + Date.now();
    
    await supabase.rpc('log_unified_decision_v3', {
      p_user_input: params.ctx.userInput,
      p_emotion: params.emotion,
      p_response: params.answer,
      p_confidence: params.confidence,
      p_label: 'Valideren',
      p_sources: [{ 
        id: params.ruleId, 
        emotion: params.emotion,
        confidence: params.confidence,
        content_type: 'policy',
        similarity: 0
      }],
      p_conversation_id: sessionId,
      p_processing_time_ms: params.processingTime,
      p_api_collaboration: {
        api1Used: params.policyDecision === 'LLM_PLANNING',
        api2Used: false,
        vectorApiUsed: false,
        googleApiUsed: false,
        seedGenerated: false,
        secondaryAnalysis: false
      }
    });

    console.log('✅ Decision logged to database');
  } catch (error) {
    console.error('❌ Failed to log decision:', error);
  }
}
