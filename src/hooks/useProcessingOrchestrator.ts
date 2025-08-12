
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

  const validateApiKey = (apiKey: string): boolean => {
    if (!apiKey || !apiKey.trim()) return false;
    if (!apiKey.startsWith('sk-')) return false;
    if (apiKey.includes('demo') || apiKey.includes('test') || apiKey.includes('mock') || apiKey.includes('dev')) {
      return false;
    }
    return true;
  };

  const orchestrateProcessing = useCallback(async (
    userInput: string,
    conversationHistory: any[],
    apiKey?: string,
    apiKey2?: string
  ): Promise<UnifiedResponse> => {
    console.log('🎼 Production orchestration starting...');
    console.log('📝 User input:', userInput.substring(0, 50) + '...');
    console.log('📚 Conversation history length:', conversationHistory?.length || 0);
    console.log('📊 Current stats:', stats);
    console.log('🧠 Knowledge stats:', knowledgeStats);
    
    const startTime = Date.now();
    
    try {
      // Optional API key validation: if provided, ensure it's valid; else rely on server-side keys via Edge Functions
      if (apiKey && !validateApiKey(apiKey)) {
        throw new Error('OpenAI API key ongeldig. Verwijder of vervang in instellingen.');
      }

      if (apiKey2 && !validateApiKey(apiKey2)) {
        console.warn('⚠️ Secondary API key is invalid, continuing without it');
      }

      if (apiKey) {
        // Pre-flight API key validation
        console.log('🧪 Validating API key functionality...');
        const keyTest = await testOpenAIApiKey(apiKey);
        if (!keyTest.isValid) {
          console.error('❌ API Key validation failed:', keyTest.error);
          throw new Error(`API Key validatie mislukt: ${keyTest.error}`);
        }
        console.log('✅ API Key validation passed');
      } else {
        console.log('🔐 No client API key provided — using server-side keys via Edge Functions');
      }

      const vectorApiKey = localStorage.getItem('vector-api-key') || apiKey;
      const googleApiKey = localStorage.getItem('google-api-key') || '';
      
      // Validate vector API key if present
      if (vectorApiKey && !validateApiKey(vectorApiKey)) {
        console.warn('⚠️ Vector API key is invalid, falling back to primary key');
      }
      
      console.log('🧠 Calling Unified Decision Core with validated keys...');
      console.log('📊 Knowledge base status:', knowledgeStats.total > 0 ? 'Active' : 'Initializing');
      
      const decisionResult: DecisionResult | null = await makeUnifiedDecision(
        userInput,
        apiKey,
        validateApiKey(vectorApiKey) ? vectorApiKey : apiKey,
        googleApiKey,
        undefined,
        conversationHistory
      );

      if (!decisionResult) {
        console.error('❌ Unified Decision Core returned no result');
        throw new Error("Geen resultaat van de AI processing core. Controleer je API configuratie.");
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
            `Knowledge Base: ${knowledgeStats.total} items`,
            'OpenAI via Edge Functions'
          ],
          fallback: false,
          apiCollaboration: {
            api1Used: !!apiKey,
            api2Used: !!apiKey2 && validateApiKey(apiKey2),
            vectorApiUsed: !!vectorApiKey && validateApiKey(vectorApiKey),
            googleApiUsed: !!googleApiKey,
            seedGenerated: false,
            secondaryAnalysis: false
          }
        }
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      console.error('🔴 Production orchestration error:', error);
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

      // Enhanced error handling for production
      if (errorMessage.includes('API key') || errorMessage.includes('401')) {
        throw new Error('API key probleem gedetecteerd. Controleer je OpenAI API key in de instellingen en zorg dat het een echte (geen mock) key is.');
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
