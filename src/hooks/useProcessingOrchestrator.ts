
import { useState, useCallback } from 'react';
import { ProcessingContext, UnifiedResponse } from '@/types/core';
import { useUnifiedDecisionCore, DecisionResult } from './useUnifiedDecisionCore';

interface ProcessingStats {
  totalRequests: number;
  averageProcessingTime: number;
  successRate: number;
  lastProcessingTime: number;
}

export function useProcessingOrchestrator() {
  const [stats, setStats] = useState<ProcessingStats>({
    totalRequests: 0,
    averageProcessingTime: 0,
    successRate: 100,
    lastProcessingTime: 0
  });

  const { makeUnifiedDecision, isProcessing } = useUnifiedDecisionCore();

  const orchestrateProcessing = useCallback(async (
    userInput: string,
    conversationHistory: any[],
    apiKey?: string,
    apiKey2?: string
  ): Promise<UnifiedResponse> => {
      const startTime = Date.now();
      
    try {
        const vectorApiKey = localStorage.getItem('vector-api-key') || apiKey;
        
        const decisionResult: DecisionResult | null = await makeUnifiedDecision(
            userInput,
            apiKey,
            vectorApiKey,
            {}, // context for disliked labels etc.
            conversationHistory
        );

        if (!decisionResult) {
            throw new Error("Unified Decision Core returned no result.");
        }

        const processingTime = Date.now() - startTime;
        setStats(prev => ({
          totalRequests: prev.totalRequests + 1,
          averageProcessingTime: (prev.averageProcessingTime * prev.totalRequests + processingTime) / (prev.totalRequests + 1),
          successRate: ((prev.successRate * prev.totalRequests + 100) / (prev.totalRequests + 1)),
          lastProcessingTime: processingTime,
        }));

        return {
          content: decisionResult.response,
          emotion: decisionResult.emotion,
          confidence: decisionResult.confidence,
          label: decisionResult.label,
          reasoning: decisionResult.reasoning,
          symbolicInferences: decisionResult.symbolicInferences,
          metadata: {
              processingPath: 'hybrid',
              totalProcessingTime: processingTime,
              componentsUsed: [`Unified Core (${decisionResult.sources.length} sources)`],
              fallback: false
          }
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error("Orchestration error:", error);
      throw error;
    }
  }, [makeUnifiedDecision, stats]);

  return {
    orchestrateProcessing,
    isProcessing,
    stats
  };
}
