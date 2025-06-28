
import { useState, useCallback } from 'react';
import { ProcessingContext, UnifiedResponse } from '@/types/core';
import { useUnifiedDecisionEngine } from './useUnifiedDecisionEngine';

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

  const { processInput, isProcessing, lastDecision } = useUnifiedDecisionEngine();

  const orchestrateProcessing = useCallback(async (
    userInput: string,
    conversationHistory: any[],
    apiKey?: string,
    apiKey2?: string
  ): Promise<UnifiedResponse> => {
    const startTime = Date.now();
    
    try {
      const context: ProcessingContext = {
        userInput,
        conversationHistory,
        sessionMetadata: {
          sessionId: `session_${Date.now()}`,
          totalMessages: conversationHistory.length + 1,
          averageResponseTime: stats.averageProcessingTime,
          lastActivity: new Date()
        },
        timestamp: new Date()
      };

      const result = await processInput(context, apiKey, apiKey2);
      const processingTime = Date.now() - startTime;

      // Update stats
      setStats(prev => ({
        totalRequests: prev.totalRequests + 1,
        averageProcessingTime: (prev.averageProcessingTime * prev.totalRequests + processingTime) / (prev.totalRequests + 1),
        successRate: ((prev.successRate * prev.totalRequests + 100) / (prev.totalRequests + 1)),
        lastProcessingTime: processingTime
      }));

      return result;
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      // Update stats with failure
      setStats(prev => ({
        totalRequests: prev.totalRequests + 1,
        averageProcessingTime: (prev.averageProcessingTime * prev.totalRequests + processingTime) / (prev.totalRequests + 1),
        successRate: ((prev.successRate * prev.totalRequests + 0) / (prev.totalRequests + 1)),
        lastProcessingTime: processingTime
      }));

      throw error;
    }
  }, [processInput, stats]);

  return {
    orchestrateProcessing,
    isProcessing,
    stats,
    lastDecision
  };
}
