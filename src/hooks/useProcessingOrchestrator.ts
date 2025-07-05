
import { useState, useCallback } from 'react';
import { ProcessingContext, UnifiedResponse } from '@/types/core';
import { useUnifiedDecisionCore, DecisionResult } from './useUnifiedDecisionCore';
import { testOpenAIApiKey } from '@/utils/apiKeyTester';

interface ProcessingStats {
  totalRequests: number;
  averageProcessingTime: number;
  successRate: number;
  lastProcessingTime: number;
  errorCount: number;
  lastError?: string;
}

export function useProcessingOrchestrator() {
  const [stats, setStats] = useState<ProcessingStats>({
    totalRequests: 0,
    averageProcessingTime: 0,
    successRate: 100,
    lastProcessingTime: 0,
    errorCount: 0
  });

  const { makeUnifiedDecision, isProcessing, knowledgeStats } = useUnifiedDecisionCore();

  const orchestrateProcessing = useCallback(async (
    userInput: string,
    conversationHistory: any[],
    apiKey?: string,
    apiKey2?: string
  ): Promise<UnifiedResponse> => {
    console.log('🎼 Processing orchestration starting...');
    console.log('📊 Current stats:', stats);
    console.log('🧠 Knowledge stats:', knowledgeStats);
    console.log('🔑 API Key 1 available:', !!apiKey);
    console.log('🔑 API Key 2 available:', !!apiKey2);
    
    const startTime = Date.now();
    
    try {
      // Pre-flight API key validation
      if (apiKey) {
        console.log('🧪 Pre-flight API key validation...');
        const keyTest = await testOpenAIApiKey(apiKey);
        if (!keyTest.isValid) {
          console.error('❌ API Key validation failed:', keyTest.error);
          throw new Error(`API Key validation failed: ${keyTest.error}`);
        }
        console.log('✅ API Key validation passed');
      }

      const vectorApiKey = localStorage.getItem('vector-api-key') || apiKey;
      
      console.log('🧠 Calling Unified Decision Core...');
      console.log('📊 Knowledge base status:', knowledgeStats.total > 0 ? 'Active' : 'Initializing');
      
      const decisionResult: DecisionResult | null = await makeUnifiedDecision(
        userInput,
        apiKey,
        vectorApiKey,
        {}, // context for disliked labels etc.
        conversationHistory
      );

      if (!decisionResult) {
        console.error('❌ Unified Decision Core returned no result');
        throw new Error("Unified Decision Core returned no result.");
      }

      const processingTime = Date.now() - startTime;
      console.log(`✅ Processing completed in ${processingTime}ms`);

      // Update success stats
      setStats(prev => ({
        totalRequests: prev.totalRequests + 1,
        averageProcessingTime: (prev.averageProcessingTime * prev.totalRequests + processingTime) / (prev.totalRequests + 1),
        successRate: ((prev.successRate * prev.totalRequests + 100) / (prev.totalRequests + 1)),
        lastProcessingTime: processingTime,
        errorCount: prev.errorCount,
        lastError: undefined
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
          componentsUsed: [
            `Unified Core (${decisionResult.sources.length} sources)`,
            `Knowledge Base: ${knowledgeStats.total} items`
          ],
          fallback: false,
          apiCollaboration: {
            api1Used: !!apiKey,
            api2Used: !!apiKey2,
            vectorApiUsed: !!vectorApiKey,
            seedGenerated: false,
            secondaryAnalysis: false
          }
        }
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      console.error('🔴 Orchestration error:', error);
      console.error('   Processing time before error:', processingTime + 'ms');
      console.error('   Error type:', error instanceof Error ? error.constructor.name : typeof error);

      // Update error stats
      setStats(prev => ({
        totalRequests: prev.totalRequests + 1,
        averageProcessingTime: (prev.averageProcessingTime * prev.totalRequests + processingTime) / (prev.totalRequests + 1),
        successRate: ((prev.successRate * prev.totalRequests + 0) / (prev.totalRequests + 1)),
        lastProcessingTime: processingTime,
        errorCount: prev.errorCount + 1,
        lastError: errorMessage
      }));

      // Enhanced error handling with fallback
      if (errorMessage.includes('API key') || errorMessage.includes('401')) {
        throw new Error('API key probleem gedetecteerd. Controleer je OpenAI API key in de instellingen.');
      } else if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
        throw new Error('API limiet bereikt. Probeer het over een paar minuten opnieuw.');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        throw new Error('Netwerkfout. Controleer je internetverbinding en probeer opnieuw.');
      } else {
        throw new Error(`Er ging iets mis tijdens de verwerking: ${errorMessage}`);
      }
    }
  }, [makeUnifiedDecision, knowledgeStats]);

  return {
    orchestrateProcessing,
    isProcessing,
    stats,
    knowledgeStats
  };
}
