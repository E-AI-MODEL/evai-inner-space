/**
 * EvAI v16 - Neurosymbolic Hybrid Orchestrator
 * Integreert Policy Engine, Semantic Graph en Validation Layer
 * voor volledig auditable en reproduceerbare beslissingen
 */

import { decideNextStep, Context as PolicyContext, explainDecision } from '../policy/decision.policy';
import { validatePlan, validateResponse } from '../policy/validation.policy';
import { checkConstraints, ConstraintContext } from '../policy/constraints';
import { suggestInterventions, getAllowedInterventions, checkContraIndications } from '../semantics/graph';
import { supabase } from '@/integrations/supabase/client';

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
  
  auditLog.push(`🚀 EvAI v16 Orchestration started at ${new Date().toISOString()}`);
  auditLog.push(`📝 Input: "${ctx.userInput.substring(0, 50)}..."`);
  
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
    let processingPath: 'seed' | 'template' | 'llm' | 'crisis' | 'fast' = 'seed';
    let plan: any = null;
    let validated = true;
    let constraintsOK = true;

    switch (policyDecision.action) {
      case 'USE_SEED':
        auditLog.push(`🎯 Executing: USE_SEED`);
        answer = ctx.seed.response || 'Ik begrijp je.';
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
        // Hier zou de LLM-call komen met de allowed interventions als constraints
        // Voor nu: fallback naar template
        answer = generateTemplateResponse(emotion, allowedInterventions);
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

      // 🔒 Z3 Constraint Layer - Formele verificatie
      const constraintCtx: ConstraintContext = {
        rubric: policyCtx.rubric,
        seed: policyCtx.seed,
        plan: {
          strategy: plan.strategy,
          containsPII: plan.containsPII,
          length: plan.goal ? plan.goal.length + (plan.steps?.join('').length || 0) : 0
        }
      };
      
      const constraintResult = await checkConstraints(constraintCtx);
      constraintsOK = constraintResult.ok;
      auditLog.push(`🔒 Z3 Constraints: ${constraintsOK ? 'SATISFIED' : 'VIOLATED'}`);
      
      if (!constraintsOK) {
        auditLog.push(`  Violations: ${constraintResult.violations.join('; ')}`);
        // BLOCK plan if constraints violated
        validated = false;
      }
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
      p_label: 'Valideren', // Will be enhanced later
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
