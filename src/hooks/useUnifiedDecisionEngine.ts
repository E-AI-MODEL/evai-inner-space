
import { useState, useCallback } from 'react';
import { NeurosymbolicDecision, ProcessingContext, UnifiedResponse } from '@/types/core';
import { useAdvancedSeedMatcher } from './useAdvancedSeedMatcher';
import type { StrategicBriefing } from '@/types';
import { useOpenAI } from './useOpenAI';
import { useOpenAISecondary } from './useOpenAISecondary';
import { useEvAI56Rubrics } from './useEvAI56Rubrics';

export function useUnifiedDecisionEngine() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastDecision, setLastDecision] = useState<NeurosymbolicDecision | null>(null);
  
  const { matchAdvancedSeed } = useAdvancedSeedMatcher();
  const { detectEmotion } = useOpenAI();
  const { createStrategicBriefing } = useOpenAISecondary();
  const { assessMessage } = useEvAI56Rubrics();

  const processInput = useCallback(async (
    context: ProcessingContext,
    apiKey?: string,
    apiKey2?: string
  ): Promise<UnifiedResponse> => {
    setIsProcessing(true);
    const startTime = Date.now();
    const componentsUsed: string[] = [];

    try {
      console.log('🧠 Starting unified processing...');

      // Run rubric assessment and seed matching in parallel
      const [assessments, seed] = await Promise.all([
        Promise.resolve(assessMessage(context.userInput)),
        matchAdvancedSeed?.(context.userInput, apiKey).catch(() => null)
      ]);

      if (assessments.length) componentsUsed.push('Rubrics');
      if (seed) componentsUsed.push('Advanced Seed Matcher');

      // Generate strategic briefing using API 2
      let briefing: StrategicBriefing | null = null;
      if (apiKey2?.trim()) {
        try {
          briefing = await createStrategicBriefing(
            context.userInput,
            assessments.map(a => a.rubricId),
            seed?.emotion || null,
            apiKey2
          );
          if (briefing) componentsUsed.push('Strategic Briefing');
        } catch (err) {
          console.warn('⚠️ Strategic briefing failed', err);
        }
      }

      // Build final prompt for API 1
      const finalPrompt = briefing
        ? `Doel: ${briefing.goal}\nContext: ${briefing.context}\nKernpunten: ${briefing.keyPoints.join(', ')}\n\nGebruiker: ${context.userInput}`
        : context.userInput;

      // Obtain neural response
      componentsUsed.push('Neural Engine (OpenAI)');
      const neuralResult = await detectEmotion(
        finalPrompt,
        apiKey || '',
        undefined,
        context.conversationHistory
      );

      const finalResult: UnifiedResponse = {
        content: neuralResult.response,
        emotion: neuralResult.emotion,
        confidence: neuralResult.confidence,
        label: neuralResult.label || 'Valideren',
        reasoning: neuralResult.reasoning || 'Neurale analyse',
        symbolicInferences: neuralResult.symbolicInferences || [],
        metadata: {
          processingPath: 'neural',
          totalProcessingTime: Date.now() - startTime,
          componentsUsed
        }
      };

      const processingTime = Date.now() - startTime;
      const decision: NeurosymbolicDecision = {
        type: 'neural',
        confidence: finalResult.confidence,
        reasoning: [finalResult.reasoning],
        source: 'unified_decision_engine',
        processingTime,
        metadata: {
          processingTime,
          fallbackUsed: false,
          priority: 'medium',
          componentsUsed
        }
      };

      setLastDecision(decision);
      console.log(`✅ Unified processing complete (${processingTime}ms)`);

      return finalResult;



    } catch (error) {
      console.error('🔴 Unified decision engine failed:', error);
      
      const processingTime = Date.now() - startTime;
      const errorDecision: NeurosymbolicDecision = {
        type: 'neural',
        confidence: 0,
        reasoning: [`Error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        source: 'error_handler',
        processingTime,
        metadata: {
          processingTime,
          fallbackUsed: true,
          priority: 'low',
          componentsUsed: ['Error Handler']
        }
      };
      
      setLastDecision(errorDecision);
      
      return {
        content: 'Ik begrijp je vraag niet helemaal. Kun je het anders formuleren?',
        emotion: 'error',
        confidence: 0,
        label: 'Fout',
        reasoning: 'Processing error occurred',
        symbolicInferences: ['❌ Processing failed'],
        metadata: {
          processingPath: 'error',
          totalProcessingTime: processingTime,
          componentsUsed: ['Error Handler']
        }
      };
    } finally {
      setIsProcessing(false);
    }
  }, [matchAdvancedSeed, detectEmotion, createStrategicBriefing, assessMessage]);

  const getDecisionAnalytics = useCallback(() => {
    return {
      lastDecision,
      isProcessing,
    };
  }, [lastDecision, isProcessing]);

  return {
    processInput,
    isProcessing,
    lastDecision,
    getDecisionAnalytics
  };
}
