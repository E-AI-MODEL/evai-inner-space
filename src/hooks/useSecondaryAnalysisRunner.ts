import { createStrategicBriefing, StrategicBriefing } from './useOpenAISecondary';
import { EnhancedRubricResult } from './useEnhancedEvAI56Rubrics';

/**
 * Conditional Strategic Analysis Runner
 * Only triggers briefing generation when therapeutically necessary
 */
export async function runConditionalSecondaryAnalysis(
  userInput: string,
  conversationHistory: any[],
  rubricResult: EnhancedRubricResult | null,
  lastConfidence?: number
): Promise<StrategicBriefing | undefined> {
  
  console.log('🔍 Evaluating need for Strategic Briefing...');

  // CONDITION 1: High risk score (requires strategic direction)
  const highRisk = (rubricResult?.overallRisk || 0) > 70;
  
  // CONDITION 2: High distress (requires careful handling)
  const highDistress = (rubricResult?.overallRisk || 0) > 80;
  
  // CONDITION 3: Early conversation (first 3 messages - establish strategy)
  const earlyConversation = conversationHistory.length < 3;
  
  // CONDITION 4: Low confidence (previous response uncertain)
  const lowConfidence = (lastConfidence || 1.0) < 0.60;

  const shouldCreateBriefing = highRisk || highDistress || earlyConversation || lowConfidence;

  if (!shouldCreateBriefing) {
    console.log('⏭️ Skipping briefing - conditions not met:', {
      risk: rubricResult?.overallRisk,
      historyLength: conversationHistory.length,
      lastConfidence
    });
    return undefined;
  }

  console.log('✅ Briefing needed:', {
    highRisk,
    highDistress,
    earlyConversation,
    lowConfidence,
    riskScore: rubricResult?.overallRisk
  });

  try {
    const briefing = await createStrategicBriefing(
      userInput,
      rubricResult ? {
        overallRisk: rubricResult.overallRisk,
        overallProtective: rubricResult.overallProtective,
        dominantPattern: rubricResult.dominantPattern,
        assessments: rubricResult.assessments
      } : undefined,
      conversationHistory
    );

    return briefing;
  } catch (error) {
    console.error('🔴 Conditional briefing failed:', error);
    return undefined; // Fail gracefully - continue without briefing
  }
}
