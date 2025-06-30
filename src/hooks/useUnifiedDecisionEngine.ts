
import { useState, useCallback } from 'react';
import { NeurosymbolicDecision, ProcessingContext, UnifiedResponse } from '@/types/core';
import { useAdvancedSeedMatcher } from './useAdvancedSeedMatcher';
import type { StrategicBriefing } from '@/types';
import { useOpenAI } from './useOpenAI';
import { useSymbolicEngine } from './useSymbolicEngine';
import { useVectorEmbeddings } from './useVectorEmbeddings';

export function useUnifiedDecisionEngine() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastDecision, setLastDecision] = useState<NeurosymbolicDecision | null>(null);
  
  const { matchAdvancedSeed } = useAdvancedSeedMatcher();
  const { detectEmotion } = useOpenAI();
  const { processSymbolic } = useSymbolicEngine();
  const { searchSimilarEmbeddings } = useVectorEmbeddings();

  const processInput = useCallback(async (
    context: ProcessingContext,
    apiKey?: string,
    apiKey2?: string
  ): Promise<UnifiedResponse> => {
    setIsProcessing(true);
    const startTime = Date.now();
    const componentsUsed: string[] = [];

    try {
      console.log('🧠 Starting unified neurosymbolic processing...');

      // Phase 1: Parallel processing of all engines
      const [symbolicResult, seedResult, vectorResult] = await Promise.allSettled([
        processSymbolic?.(context.userInput, context.conversationHistory).catch(() => null),
        matchAdvancedSeed?.(context.userInput, apiKey).catch(() => null),
        searchSimilarEmbeddings?.(context.userInput, localStorage.getItem('vector-api-key') || '').catch(() => null)
      ]);

      // Collect results
      const symbolic = symbolicResult.status === 'fulfilled' ? symbolicResult.value : null;
      const seed = seedResult.status === 'fulfilled' ? seedResult.value : null;
      const vector = vectorResult.status === 'fulfilled' ? vectorResult.value : null;

      if (symbolic) componentsUsed.push('Symbolic Engine');
      if (seed) componentsUsed.push('Advanced Seed Matcher');
      if (vector) componentsUsed.push('Vector Search');

      // Phase 2: Hybrid decision making with weighted scoring
      let finalResult: UnifiedResponse;
      let processingPath: 'symbolic' | 'hybrid' | 'neural' = 'neural';

      // Calculate confidence scores
      const symbolicScore = symbolic?.confidence || 0;
      const seedScore = seed?.confidence || 0;
      const vectorScore = vector?.length ? 0.6 : 0;

      console.log('📊 Engine scores:', { symbolicScore, seedScore, vectorScore });

      // Weighted hybrid decision
      if (symbolicScore > 0.8 || (symbolicScore > 0.6 && seedScore > 0.7)) {
        // High confidence symbolic or combined symbolic+seed
        processingPath = symbolic && seed ? 'hybrid' : 'symbolic';
        finalResult = {
          content: symbolic?.response || seed?.response || 'Ik begrijp je gevoel.',
          emotion: symbolic?.emotion || seed?.emotion || 'begrip',
          confidence: Math.max(symbolicScore, seedScore),
          label: symbolic?.label || seed?.label || 'Valideren',
          reasoning: `Hybride beslissing: Symbolisch (${Math.round(symbolicScore * 100)}%) + Seeds (${Math.round(seedScore * 100)}%)`,
          symbolicInferences: [
            `🎯 Methode: ${processingPath}`,
            `🧠 Symbolisch: ${Math.round(symbolicScore * 100)}%`,
            `🌱 Seeds: ${Math.round(seedScore * 100)}%`,
            `🔍 Vector: ${Math.round(vectorScore * 100)}%`
          ],
          metadata: {
            processingPath,
            totalProcessingTime: Date.now() - startTime,
            componentsUsed
          }
        };
      } else {
        // Fallback to neural with context from other engines
        componentsUsed.push('Neural Engine (OpenAI)');
        const neuralResult = await detectEmotion(
          context.userInput, 
          apiKey || '', 
          undefined, 
          context.conversationHistory
        );

        // Enhance neural result with symbolic insights
        const enhancedInferences = [
          ...neuralResult.symbolicInferences || [],
          symbolic ? `🔗 Symbolisch: ${symbolic.emotion}` : '',
          seed ? `🌱 Seed: ${seed.emotion}` : '',
          vector?.length ? `🔍 Vector matches: ${vector.length}` : ''
        ].filter(Boolean);

        finalResult = {
          content: neuralResult.response,
          emotion: neuralResult.emotion,
          confidence: neuralResult.confidence,
          label: neuralResult.label || 'Valideren',
          reasoning: `Neurale analyse verrijkt met ${componentsUsed.length - 1} andere bronnen`,
          symbolicInferences: enhancedInferences,
          metadata: {
            processingPath: 'neural',
            totalProcessingTime: Date.now() - startTime,
            componentsUsed
          }
        };
      }

      const processingTime = Date.now() - startTime;
      const decision: NeurosymbolicDecision = {
        type: processingPath,
        confidence: finalResult.confidence,
        reasoning: [finalResult.reasoning],
        source: 'unified_decision_engine',
        processingTime,
        metadata: {
          processingTime,
          fallbackUsed: processingPath === 'neural',
          priority: processingPath === 'symbolic' ? 'high' : processingPath === 'hybrid' ? 'medium' : 'low',
          componentsUsed
        }
      };
      
      setLastDecision(decision);
      console.log(`✅ Unified processing complete: ${processingPath} (${processingTime}ms)`);
      
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
  }, [matchAdvancedSeed, detectEmotion, processSymbolic, searchSimilarEmbeddings]);

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
