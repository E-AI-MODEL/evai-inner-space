/**
 * EvAI v16 - Neurosymbolic Hybrid Orchestrator
 * Integreert Policy Engine, Semantic Graph en Validation Layer
 * voor volledig auditable en reproduceerbare beslissingen
 */

import { decideNextStep, Context as PolicyContext, explainDecision } from '../policy/decision.policy';
import { validatePlan, validateResponse, validateEAACompliance } from '../policy/validation.policy';
import { suggestInterventions, getAllowedInterventions } from '../semantics/graph';
import { supabase } from '@/integrations/supabase/client';

// v20 EAA Framework Imports
import { evaluateEAA, validateEAAForStrategy } from '../lib/eaaEvaluator';
import { reflectOnHistory, storeReflectiveMemory } from '../lib/regisseurReflectie';
import { evaluateTD, estimateAIContribution } from '../lib/tdMatrix';
import { evaluateEAIRules, executeEAIAction, createEAIContext } from '../policy/eai.rules';
import type { EAAProfile, TDScore } from '@/types/eaa';
import type { FlowNodeName } from '@/lib/flowEventLogger';

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

  const { getOrCreateSessionId } = await import('@/lib/sessionManager');
  const { logFlowEvent } = await import('@/lib/flowEventLogger');
  const sessionId = getOrCreateSessionId();

  const runStage = async <T>(
    nodeName: FlowNodeName | string,
    stageFn: () => Promise<T>,
    metadataResolver?: (result: T) => Record<string, any> | undefined
  ): Promise<T> => {
    const stageStart = Date.now();
    await logFlowEvent(sessionId, nodeName, 'processing');
    try {
      const result = await stageFn();
      const metadata = metadataResolver ? metadataResolver(result) : undefined;
      await logFlowEvent(sessionId, nodeName, 'completed', Date.now() - stageStart, metadata);
      return result;
    } catch (error) {
      await logFlowEvent(sessionId, nodeName, 'failed', Date.now() - stageStart, {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  };

  await runStage('SAFETY_CHECK', async () => {
    auditLog.push(`🛡️ Safety baseline: consent ${ctx.consent ? 'granted' : 'missing'}`);
    if (!ctx.consent) {
      auditLog.push('⚠️ Missing consent flag in orchestration context');
    }
    return { consent: ctx.consent };
  }, result => ({ consent: result.consent ? 'granted' : 'missing' }));
  
  const defaultEAAProfile: EAAProfile = { ownership: 0.5, autonomy: 0.5, agency: 0.5 };
  let eaaProfile: EAAProfile = defaultEAAProfile;

  eaaProfile = await runStage('RUBRICS_EAA', async () => {
    let profile = defaultEAAProfile;
    try {
      const rubricContext = ctx.rubricAssessments && ctx.rubricAssessments.length > 0 ? {
        riskScore: ctx.rubricAssessments[0].riskScore,
        protectiveScore: ctx.rubricAssessments[0].protectiveScore,
        dominantPattern: ctx.rubricAssessments[0].rubricId
      } : undefined;

      profile = evaluateEAA(ctx.userInput, rubricContext);
      auditLog.push(`🧠 EAA Profile: O=${profile.ownership.toFixed(2)} A=${profile.autonomy.toFixed(2)} Ag=${profile.agency.toFixed(2)}`);
    } catch (err) {
      console.error('⚠️ EAA Evaluation failed:', err);
      auditLog.push('⚠️ EAA Evaluation failed, using defaults');
    }
    return profile;
  }, profile => ({
    ownership: Number(profile.ownership.toFixed(2)),
    autonomy: Number(profile.autonomy.toFixed(2)),
    agency: Number(profile.agency.toFixed(2))
  }));

  await runStage('STRATEGIC_BRIEFING', async () => {
    let advice = { advice: 'geen precedent', reason: 'init', avgAgency: 0.5 };
    try {
      advice = await reflectOnHistory(ctx.userInput, supabase, {
        similarityThreshold: 0.3,
        maxResults: 5
      });
      auditLog.push(`💭 Regisseur: ${advice.advice} (avg_agency=${advice.avgAgency.toFixed(2)})`);
    } catch (err) {
      console.error('⚠️ Regisseur Reflection failed:', err);
      auditLog.push('⚠️ Regisseur Reflection failed');
    }
    return advice;
  }, advice => ({
    avgAgency: Number(advice.avgAgency.toFixed(2)),
    reason: advice.reason
  }));
  
  try {
    const { policyCtx, policyDecision } = await runStage('POLICY_DECISION', async () => {
      const inputComplexity = analyzeInputComplexity(ctx.userInput);
      auditLog.push(`📊 Input complexity: ${JSON.stringify(inputComplexity)}`);

      const policyContext: PolicyContext = {
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

      const decision = await decideNextStep(policyContext);
      const explanation = explainDecision(decision, policyContext);
      auditLog.push(...explanation);

      return { policyCtx: policyContext, policyDecision: decision };
    }, result => ({
      action: result.policyDecision.action,
      confidence: Number(result.policyDecision.confidence.toFixed(2))
    }));

    const semanticStage = await runStage('SEMANTIC_GRAPH', async () => {
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

      return { emotionForInterventions, allowedInterventions, suggestedInterventions };
    }, result => ({
      emotion: result.emotionForInterventions,
      allowed: result.allowedInterventions.length,
      suggested: result.suggestedInterventions.length
    }));

    const generationResult = await runStage('GENERATION', async () => {
      let answer = '';
      let emotion = semanticStage.emotionForInterventions;
      let confidence = policyDecision.confidence;
      let label: 'Valideren' | 'Reflectievraag' | 'Suggestie' | 'Interventie' | 'Fout' = 'Valideren';
      let reasoning = policyDecision.reasoning;
      let processingPath: 'seed' | 'template' | 'llm' | 'crisis' | 'fast' = 'seed';
      let plan: any = null;

      switch (policyDecision.action) {
        case 'USE_SEED':
          auditLog.push(`🎯 Executing: USE_SEED`);
          const seedResult = await compileSeedResponse(ctx, auditLog, eaaProfile);
          answer = seedResult.answer;
          processingPath = 'seed';
          label = 'Valideren';

          if (seedResult.fusionMetadata) {
            auditLog.push(`🧬 Fusion applied: ${seedResult.fusionMetadata.strategy} (${Math.round(seedResult.fusionMetadata.preservationScore * 100)}% preservation)`);
          }
          break;

        case 'FAST_PATH':
          auditLog.push(`⚡ Executing: FAST_PATH`);
          answer = generateFastPathResponse(ctx.userInput);
          processingPath = 'fast';
          label = 'Valideren';
          break;

        case 'TEMPLATE_ONLY':
          auditLog.push(`📋 Executing: TEMPLATE_ONLY`);
          answer = generateTemplateResponse(emotion, semanticStage.allowedInterventions);
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
          try {
            const { data: llmData, error: llmError } = await supabase.functions.invoke('evai-core', {
              body: {
                operation: 'generate-response',
                input: ctx.userInput,
                emotion,
                allowedInterventions: semanticStage.allowedInterventions,
                eaaProfile,
                conversationHistory: ctx.conversationHistory?.slice(-6) || []
              }
            });

            if (llmError || !llmData?.response) {
              console.warn('⚠️ LLM generation failed, using template fallback');
              answer = generateTemplateResponse(emotion, semanticStage.allowedInterventions);
            } else {
              answer = llmData.response;
              auditLog.push(`✅ LLM generated response (${llmData.model || 'unknown'})`);
            }
          } catch (err) {
            console.error('❌ LLM_PLANNING error:', err);
            answer = generateTemplateResponse(emotion, semanticStage.allowedInterventions);
          }
          processingPath = 'llm';
          label = 'Reflectievraag';
          break;
      }

      return { answer, emotion, confidence, label, reasoning, processingPath, plan };
    }, result => ({
      processingPath: result.processingPath,
      label: result.label,
      confidence: Number(result.confidence.toFixed(2))
    }));

    let { answer, emotion, confidence, label, reasoning, processingPath, plan } = generationResult;

    const validationResult = await runStage('VALIDATION_FUSION', async () => {
      let stageAnswer = answer;
      let stageEmotion = emotion;
      let stageConfidence = confidence;
      let stageLabel = label;
      let stageReasoning = reasoning;
      let stageValidated = true;
      let stageConstraintsOK = true;
      let stagePlan = plan;
      let stageTDScore: TDScore = { value: 0.5, flag: '🟢 TD_balanced', shouldBlock: false };

      if (stagePlan) {
        const planValidation = validatePlan(stagePlan, policyCtx);
        stageValidated = planValidation.ok;
        auditLog.push(`🛡️ Plan validation: ${stageValidated ? 'PASSED' : 'FAILED'}`);
        if (!stageValidated) {
          auditLog.push(`  Errors: ${planValidation.errors.join(', ')}`);
        }
        if (planValidation.warnings.length > 0) {
          auditLog.push(`  Warnings: ${planValidation.warnings.join(', ')}`);
        }

        stageConstraintsOK = stageValidated;
        auditLog.push(`🔒 Constraints: ${stageConstraintsOK ? 'SATISFIED' : 'VIOLATED'}`);
      }

      const responseValidation = validateResponse(stageAnswer, stagePlan || {}, policyCtx);
      stageConstraintsOK = responseValidation.ok;
      auditLog.push(`🛡️ Response validation: ${stageConstraintsOK ? 'PASSED' : 'FAILED'}`);
      if (!stageConstraintsOK) {
        auditLog.push(`  Errors: ${responseValidation.errors.join(', ')}`);
        stageAnswer = generateEAAAwareFallback(eaaProfile, stageEmotion);
        stageLabel = 'Fout';
        stageConfidence = 0.3;
      }

      try {
        const aiContribution = estimateAIContribution(stageAnswer);
        stageTDScore = evaluateTD(aiContribution, eaaProfile.agency);
        auditLog.push(`⚖️ TD-Matrix: ${stageTDScore.flag} (TD=${stageTDScore.value.toFixed(2)})`);

        if (stageTDScore.shouldBlock) {
          auditLog.push(`🚨 TD-Matrix BLOCKS output: ${stageTDScore.reason}`);
          stageAnswer = generateEAAAwareFallback(eaaProfile, stageEmotion);
          stageEmotion = 'onzekerheid';
          stageLabel = 'Fout';
          stageReasoning = `TD-Matrix blocked: ${stageTDScore.reason}`;
        }
      } catch (err) {
        console.error('⚠️ TD-Matrix evaluation failed:', err);
        auditLog.push('⚠️ TD-Matrix evaluation failed');
      }

      try {
        const eaiContext = createEAIContext(
          eaaProfile,
          stageTDScore.value,
          {
            riskScore: ctx.rubricAssessments?.[0]?.riskScore,
            protectiveScore: ctx.rubricAssessments?.[0]?.protectiveScore
          }
        );

        const eaiResult = evaluateEAIRules(eaiContext);

        if (eaiResult.triggered && eaiResult.action) {
          const shouldBlock = executeEAIAction(eaiResult.action, auditLog);

          if (shouldBlock) {
            stageAnswer = generateEAAAwareFallback(eaaProfile, stageEmotion);
            stageEmotion = 'onzekerheid';
            stageLabel = 'Fout';
            stageReasoning = `E_AI rule ${eaiResult.ruleId} blocked output`;
          }
        }
      } catch (err) {
        console.error('⚠️ E_AI Rules evaluation failed:', err);
        auditLog.push('⚠️ E_AI Rules evaluation failed');
      }

      if (stageLabel) {
        const eaaValidation = validateEAAForStrategy(eaaProfile, stageLabel);
        if (!eaaValidation.valid) {
          auditLog.push(`⚠️ EAA blocks strategy "${stageLabel}": ${eaaValidation.reason}`);
          stageLabel = 'Reflectievraag';
        }
      }

      try {
        await storeReflectiveMemory(
          supabase,
          ctx.userInput,
          stageAnswer,
          eaaProfile,
          stageLabel || 'Reflectievraag'
        );
      } catch (err) {
        console.error('⚠️ Failed to store reflective memory:', err);
      }

      return {
        answer: stageAnswer,
        emotion: stageEmotion,
        confidence: stageConfidence,
        label: stageLabel,
        reasoning: stageReasoning,
        validated: stageValidated,
        constraintsOK: stageConstraintsOK,
        tdScore: stageTDScore
      };
    }, result => ({
      validated: result.validated,
      constraintsOK: result.constraintsOK,
      label: result.label
    }));

    ({ answer, emotion, confidence, label, reasoning } = validationResult);
    const validated = validationResult.validated;
    const constraintsOK = validationResult.constraintsOK;
    const tdScore = validationResult.tdScore;
    
    // ============ NGBSE CHECK (v20) ============
    await logFlowEvent(sessionId, 'NGBSE_CHECK', 'processing', undefined, { source: 'server' });
    
    const { performNGBSECheck } = await import('@/lib/ngbseEngine');
    const rubricScores = ctx.rubric ? {
      crisis: ctx.rubric.crisis || 0,
      distress: ctx.rubric.distress || 0,
      support: ctx.rubric.support || 0,
      coping: ctx.rubric.coping || 0,
    } : undefined;
    
    const ngbseStartTime = Date.now();
    const ngbseResult = await performNGBSECheck({
      userInput: ctx.userInput,
      aiResponse: answer,
      confidence,
      emotion,
      seedMatchCount: ctx.seed ? 1 : 0,
      rubricScores,
      conversationHistory: ctx.conversationHistory || [],
      sessionId,
    });
    
    await logFlowEvent(sessionId, 'NGBSE_CHECK', 'completed', Date.now() - ngbseStartTime, {
      source: 'server',
      blindspots: ngbseResult.blindspots.length,
      adjustedConfidence: ngbseResult.adjustedConfidence
    });

    if (ngbseResult.blindspots.length > 0) {
      auditLog.push(`🔍 NGBSE: ${ngbseResult.blindspots.length} blindspot(s) detected`);
      confidence = ngbseResult.adjustedConfidence;
    }

    // ============ HITL CHECK (v20) ============
    await logFlowEvent(sessionId, 'HITL_CHECK', 'processing', undefined, { source: 'server' });
    
    const { shouldTriggerHITL, triggerHITL } = await import('@/lib/hitlTriggers');
    const hitlDecision = await shouldTriggerHITL({
      crisisScore: ctx.rubric?.crisis || 0,
      tdValue: tdScore?.value || 0,
      confidence,
      emotion,
      rubrics: ctx.rubric,
      blindspots: ngbseResult.blindspots,
    });
    
    if (hitlDecision.shouldTrigger) {
      auditLog.push(`🚨 HITL triggered: ${hitlDecision.triggerType} (${hitlDecision.severity})`);
      await triggerHITL(ctx.userInput, answer, hitlDecision, {
        sessionId,
        rubrics: ctx.rubric,
        ngbseResult,
      });
      
      await logFlowEvent(sessionId, 'HITL_CHECK', 'completed', 0, {
        source: 'server',
        triggered: true,
        type: hitlDecision.triggerType,
        severity: hitlDecision.severity
      });
      
      if (hitlDecision.blockOutput) {
        answer = "Dit bericht vereist menselijke review. Een specialist bekijkt je bericht zo snel mogelijk.";
        confidence = 0.2;
        label = 'Reflectievraag';
      }
    } else {
      await logFlowEvent(sessionId, 'HITL_CHECK', 'completed', 0, { source: 'server', triggered: false });
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
        semanticInterventions: semanticStage.allowedInterventions,
        validated,
        constraintsOK,
        processingPath,
        auditLog
      }
    };

  } catch (error) {
    console.error('🔴 Orchestration error:', error);
    auditLog.push(`❌ ERROR: ${error instanceof Error ? error.message : String(error)}`);

    // ============ AUTO-HEALING (v20) ============
    await logFlowEvent(sessionId, 'AUTO_HEALING', 'processing', undefined, { source: 'server' });

    const { attemptAutoHeal } = await import('./autoHealing');
    const healingResult = await attemptAutoHeal(
      {
        error: error as Error,
        sessionId,
        userInput: ctx.userInput,
        attemptNumber: 1,
        conversationHistory: ctx.conversationHistory || [],
      },
      async () => orchestrate(ctx)
    );
    
    await logFlowEvent(sessionId, 'AUTO_HEALING', healingResult.success ? 'completed' : 'failed', 0, {
      source: 'server',
      strategy: healingResult.strategy,
      escalated: healingResult.escalateToHITL || false
    });
    
    if (healingResult.success && healingResult.response) {
      return healingResult.response;
    }
    
    if (healingResult.escalateToHITL) {
      auditLog.push('🚨 Auto-healing failed - escalating to HITL');
    }
    
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
 * Generate EAA-aware fallback response (replaces generic fallback)
 */
function generateEAAAwareFallback(eaaProfile: { ownership: number; autonomy: number; agency: number }, emotion: string): string {
  if (eaaProfile.agency < 0.4) {
    return `Wat maakt het nu zo moeilijk voor je?`; // Reflectie bij lage agency
  } else if (eaaProfile.agency < 0.6) {
    return `Ik hoor dat je ${emotion} voelt. Wil je vertellen wat er speelt?`;
  } else {
    return `Het klinkt alsof je ${emotion} ervaart. Hoe kan ik je ondersteunen?`;
  }
}

/**
 * Detect prompt injection attempts
 */
function detectPromptInjection(text: string): { safe: boolean; reason?: string } {
  const suspiciousPatterns = [
    /ignore (previous|all) (instructions?|prompts?)/i,
    /you are now/i,
    /new (role|instruction|prompt):/i,
    /system:\s*\{/i,
    /\[SYSTEM\]/i,
    /<\|im_start\|>/i,
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(text)) {
      return { safe: false, reason: 'Potential prompt injection detected' };
    }
  }
  
  return { safe: true };
}

/**
 * Inject seed template with therapeutic constraints (PRE-LLM layer)
 */
function injectSeedTemplate(
  seedGuidance: string,
  userInput: string,
  emotion: string,
  eaaProfile: { ownership: number; autonomy: number; agency: number },
  conversationHistory: Array<{ role: string; content: string }>
): string {
  // Check for prompt injection in user input
  const injectionCheck = detectPromptInjection(userInput);
  if (!injectionCheck.safe) {
    console.warn('⚠️ Prompt injection attempt detected');
    return seedGuidance; // Return seed as-is without user context
  }
  
  // Replace template parameters
  const conversationSummary = conversationHistory.slice(-3).map(h => h.content).join(' → ');
  let enrichedSeed = seedGuidance
    .replace(/\{\{emotie\}\}/g, emotion)
    .replace(/\{\{agency\}\}/g, `${(eaaProfile.agency * 100).toFixed(0)}%`)
    .replace(/\{\{autonomie\}\}/g, `${(eaaProfile.autonomy * 100).toFixed(0)}%`)
    .replace(/\{\{eigenaarschap\}\}/g, `${(eaaProfile.ownership * 100).toFixed(0)}%`);
  
  // Add therapeutic constraints
  enrichedSeed += `\n\nCONTEXT: Gebruiker zei: "${userInput}"`;
  if (conversationHistory.length > 0) {
    enrichedSeed += `\nGESPREKSVERLOOP: ${conversationSummary}`;
  }
  
  enrichedSeed += `\n\nTHERAPEUTISCHE OPDRACHT:
- Gebruik bovenstaande seed als therapeutische basis (WAT gezegd moet worden)
- Vertaal naar deze specifieke conversatie (HOE het aanvoelt voor deze gebruiker)
- Voeg persoonlijke aansluiting toe zonder de therapeutische intentie te verliezen`;
  
  return enrichedSeed;
}

/**
 * Compile seed response with LLM fusion (SEED + LLM + CONVERSATION)
 * v20 NeSy Fusion: Echte fusion in plaats van "beste antwoord" selectie
 */
async function compileSeedResponse(
  ctx: OrchestrationContext,
  auditLog: string[],
  eaaProfile: { ownership: number; autonomy: number; agency: number }
): Promise<{ answer: string; fusionMetadata?: any }> {
  try {
    const seedGuidance = ctx.seed.response || 'Ik begrijp je.';
    
    // STEP 1: Pre-LLM seed protection - bewaar originele seed core
    const { extractTherapeuticIntent } = await import('./fusionHelpers');
    const seedCore = {
      therapeuticIntent: extractTherapeuticIntent(seedGuidance),
      emotionalTone: ctx.seed.emotion,
      originalResponse: seedGuidance
    };
    
    auditLog.push(`🧬 Seed core extracted: ${JSON.stringify(seedCore.therapeuticIntent)}`);
    
    // STEP 2: Pre-LLM Template Injection met fusion constraints
    const enrichedSeed = injectSeedTemplate(
      seedGuidance,
      ctx.userInput,
      ctx.seed.emotion,
      eaaProfile,
      ctx.conversationHistory
    );
    
    auditLog.push(`🎯 Seed enriched with conversation context`);
    
    // Get allowed interventions
    const allowedInterventions = getEAAAllowedInterventions(ctx.seed.emotion, ctx.rubric);
    
    // STEP 3: LLM Generation met fusion mode enabled
    console.log('🤖 Calling LLM Generator with NeSy fusion mode...');
    const { data, error } = await supabase.functions.invoke('evai-core', {
      body: {
        operation: 'generate-response',
        seedGuidance: enrichedSeed,
        fusionMode: true, // ← NIEUW: Signal fusion mode
        preserveCore: true, // ← NIEUW: Instruction to preserve seed
        seedCore: seedCore, // ← NIEUW: Voor validation
        userInput: ctx.userInput,
        conversationHistory: ctx.conversationHistory.slice(-6),
        emotion: ctx.seed.emotion,
        eaaProfile,
        allowedInterventions
      }
    });
    
    if (error || !data?.response) {
      console.warn('⚠️ LLM generation failed, using EAA-aware fallback:', error);
      auditLog.push(`⚠️ LLM fallback: ${error?.message || 'No response'}`);
      return { answer: generateEAAAwareFallback(eaaProfile, ctx.seed.emotion) };
    }
    
    // STEP 4: Post-LLM Fusion Validation
    const { validateSeedPreservation, blendSeedWithLLM } = await import('./fusionHelpers');
    const fusionCheck = validateSeedPreservation(
      data.response,
      seedCore,
      seedGuidance
    );
    
    if (!fusionCheck.preserved) {
      console.warn('🚨 Fusion validation: Seed core not preserved');
      console.warn(`   Similarity: ${(fusionCheck.similarity * 100).toFixed(0)}%`);
      console.warn(`   Deviations: ${fusionCheck.deviation.join(', ')}`);
      
      auditLog.push(`⚠️ LLM deviated from seed core (similarity: ${(fusionCheck.similarity * 100).toFixed(0)}%)`);
      auditLog.push(`   Deviations: ${fusionCheck.deviation.join(', ')}`);
      
      // Fallback: Weighted blend (70% seed / 30% LLM)
      const blendedAnswer = blendSeedWithLLM(
        seedGuidance,
        data.response,
        fusionCheck
      );
      
      auditLog.push(`🧬 Applied weighted blend: 70% seed / 30% LLM context`);
      
      return { 
        answer: blendedAnswer,
        fusionMetadata: {
          strategy: 'weighted_blend',
          preservationScore: fusionCheck.similarity,
          symbolicWeight: 0.7,
          neuralWeight: 0.3
        }
      };
    }
    
    // STEP 5: EAA Compliance Validation (existing)
    const validationResult = validateEAACompliance(
      data.response,
      eaaProfile,
      allowedInterventions
    );
    
    if (!validationResult.ok) {
      console.warn('⚠️ Post-LLM EAA validation failed:', validationResult.errors);
      auditLog.push(`⚠️ Post-LLM EAA validation failed: ${validationResult.errors.join(', ')}`);
      return { answer: generateEAAAwareFallback(eaaProfile, ctx.seed.emotion) };
    }
    
    if (validationResult.warnings.length > 0) {
      auditLog.push(`⚠️ Post-LLM warnings: ${validationResult.warnings.join(', ')}`);
    }
    
    auditLog.push(`✅ NeSy Fusion complete: seed preserved (${(fusionCheck.similarity * 100).toFixed(0)}%)`);
    return { 
      answer: data.response,
      fusionMetadata: {
        strategy: 'neural_enhanced',
        preservationScore: fusionCheck.similarity,
        symbolicWeight: 0.7,
        neuralWeight: 0.3
      }
    };
  } catch (err) {
    console.error('❌ Seed compilation error:', err);
    auditLog.push(`❌ Compilation error: ${err instanceof Error ? err.message : String(err)}`);
    return { answer: generateEAAAwareFallback(eaaProfile, ctx.seed.emotion) };
  }
}

/**
 * Get allowed interventions based on emotion and rubric (EAA-aware)
 */
function getEAAAllowedInterventions(emotion: string, rubric: any): string[] {
  const interventions = ['validatie', 'reflectie'];
  
  if (rubric?.protectiveScore > 0.5) {
    interventions.push('suggestie');
  }
  
  if (rubric?.protectiveScore > 0.7 && rubric?.riskScore < 0.3) {
    interventions.push('interventie');
  }
  
  return interventions;
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
