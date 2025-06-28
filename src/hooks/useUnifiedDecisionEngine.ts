
import { useState, useCallback } from 'react';
import { NeurosymbolicDecision, ProcessingContext, UnifiedResponse } from '@/types/core';
import { useAdvancedSeedMatcher } from './useAdvancedSeedMatcher';
import { useOpenAI } from './useOpenAI';
import { useSymbolicEngine } from './useSymbolicEngine';

export function useUnifiedDecisionEngine() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastDecision, setLastDecision] = useState<NeurosymbolicDecision | null>(null);
  
  const { matchAdvancedSeed } = useAdvancedSeedMatcher();
  const { detectEmotion } = useOpenAI();
  const { processSymbolic } = useSymbolicEngine();

  const processInput = useCallback(async (
    context: ProcessingContext,
    apiKey?: string,
    apiKey2?: string
  ): Promise<UnifiedResponse> => {
    setIsProcessing(true);
    const startTime = Date.now();
    const componentsUsed: string[] = [];

    try {
      // Phase 1: Symbolic Pattern Matching (fastest, most accurate for known patterns)
      let symbolicResult = null;
      try {
        componentsUsed.push('Symbolic Engine');
        symbolicResult = await processSymbolic(context.userInput, context.conversationHistory);
        
        if (symbolicResult && symbolicResult.confidence > 0.8) {
          const processingTime = Date.now() - startTime;
          const decision: NeurosymbolicDecision = {
            type: 'symbolic',
            confidence: symbolicResult.confidence,
            reasoning: [`High-confidence symbolic match: ${symbolicResult.pattern}`],
            source: 'symbolic_engine',
            processingTime,
            metadata: {
              processingTime,
              fallbackUsed: false,
              priority: 'high',
              componentsUsed
            }
          };
          
          setLastDecision(decision);
          return {
            content: symbolicResult.response,
            emotion: symbolicResult.emotion,
            confidence: symbolicResult.confidence,
            label: symbolicResult.label,
            reasoning: `Symbolic pattern match: ${symbolicResult.pattern}`,
            symbolicInferences: symbolicResult.inferences || [],
            metadata: {
              processingPath: 'symbolic',
              totalProcessingTime: processingTime,
              componentsUsed
            }
          };
        }
      } catch (error) {
        console.warn('Symbolic processing failed, continuing with neural:', error);
      }

      // Phase 2: Advanced Seed Matching (database lookup with embeddings)
      let seedResult = null;
      try {
        componentsUsed.push('Advanced Seed Matcher');
        seedResult = await matchAdvancedSeed(context.userInput, apiKey);
        
        if (seedResult && seedResult.confidence > 0.7) {
          const processingTime = Date.now() - startTime;
          const decision: NeurosymbolicDecision = {
            type: 'hybrid',
            confidence: seedResult.confidence,
            reasoning: [`Advanced seed match: ${seedResult.emotion}`, `Similarity: ${seedResult.confidence}`],
            source: 'advanced_seed_engine',
            processingTime,
            metadata: {
              processingTime,
              fallbackUsed: false,
              priority: 'medium',
              componentsUsed
            }
          };
          
          setLastDecision(decision);
          return {
            content: seedResult.response,
            emotion: seedResult.emotion,
            confidence: seedResult.confidence,
            label: seedResult.label || 'Valideren',
            reasoning: `Advanced seed match: ${seedResult.emotion}`,
            symbolicInferences: [`🌱 Seed: ${seedResult.emotion}`, `🎯 Confidence: ${Math.round(seedResult.confidence * 100)}%`],
            metadata: {
              processingPath: 'hybrid',
              totalProcessingTime: processingTime,
              componentsUsed
            }
          };
        }
      } catch (error) {
        console.warn('Advanced seed matching failed, continuing with neural:', error);
      }

      // Phase 3: Neural Processing (OpenAI fallback)
      if (!apiKey) {
        throw new Error('No suitable processing method available - API key required for neural processing');
      }

      componentsUsed.push('Neural Engine (OpenAI)');
      const neuralResult = await detectEmotion(
        context.userInput, 
        apiKey, 
        undefined, 
        context.conversationHistory
      );

      const processingTime = Date.now() - startTime;
      const decision: NeurosymbolicDecision = {
        type: 'neural',
        confidence: neuralResult.confidence,
        reasoning: [neuralResult.reasoning || 'Neural network processing'],
        source: 'openai_engine',
        processingTime,
        metadata: {
          processingTime,
          fallbackUsed: true,
          priority: 'low',
          componentsUsed
        }
      };
      
      setLastDecision(decision);
      
      // Try secondary analysis if available
      let secondaryInsights: string[] | undefined;
      if (apiKey2) {
        try {
          componentsUsed.push('Secondary Analysis');
          // Secondary analysis would go here - placeholder for now
          secondaryInsights = ['Secondary analysis placeholder'];
        } catch (error) {
          console.warn('Secondary analysis failed:', error);
        }
      }

      return {
        content: neuralResult.response,
        emotion: neuralResult.emotion,
        confidence: neuralResult.confidence,
        label: neuralResult.label || 'Valideren',
        reasoning: neuralResult.reasoning || 'Neural processing',
        symbolicInferences: neuralResult.symbolicInferences || [],
        secondaryInsights,
        metadata: {
          processingPath: 'neural',
          totalProcessingTime: processingTime,
          componentsUsed
        }
      };

    } catch (error) {
      console.error('Unified decision engine failed:', error);
      
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
  }, [matchAdvancedSeed, detectEmotion, processSymbolic]);

  const getDecisionAnalytics = useCallback(() => {
    return {
      lastDecision,
      isProcessing,
      // Add more analytics as needed
    };
  }, [lastDecision, isProcessing]);

  return {
    processInput,
    isProcessing,
    lastDecision,
    getDecisionAnalytics
  };
}
