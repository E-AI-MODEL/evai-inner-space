
import { useOpenAI, EmotionDetection } from './useOpenAI';
import { useOpenAISecondary } from './useOpenAISecondary';
import { Message, ChatHistoryItem } from '../types';
import { useState } from 'react';
import { useSeeds } from './useSeeds';
import { useEmbeddingProcessor } from './useEmbeddingProcessor';
import { useHybridDecisionEngine } from './useHybridDecisionEngine';

export function useOrchestratedAiResponse(apiKey: string, apiKey2?: string) {
  const { detectEmotion, isLoading } = useOpenAI();
  const { createStrategicBriefing } = useOpenAISecondary();
  const { data: seeds = [] } = useSeeds();
  const { performNeuralSearch } = useEmbeddingProcessor();
  const { processHybridDecision } = useHybridDecisionEngine();
  const [vectorApiKey] = useState(() => localStorage.getItem('vector-api-key') || '');
  const [isProcessing, setIsProcessing] = useState(false);

  const analysisPhase = (messages: Message[]): ChatHistoryItem[] => {
    return messages.slice(-6).map(m => ({
      role: m.from === 'user' ? 'user' as const : 'assistant' as const,
      content: m.content,
      from: m.from
    }));
  };

  const strategyPhase = (_history: ChatHistoryItem[]) => {
    return {};
  };

  const promptPhase = async (
    userMessage: Message,
    history: ChatHistoryItem[]
  ): Promise<EmotionDetection> => {
    try {
      const result = await detectEmotion(userMessage.content, apiKey, undefined, history);
      console.log('🎯 Primary AI response generated successfully');
      return result;
    } catch (error) {
      console.error('🔴 Primary AI response failed:', error);
      // Fallback response with all required EmotionDetection properties
      return {
        emotion: 'understanding',
        confidence: 0.7,
        label: 'Valideren',
        response: 'Ik begrijp je en wil graag helpen. Kun je me meer vertellen over hoe je je voelt?',
        triggers: ['fallback_response'],
        meta: 'Fallback response due to API error',
        reasoning: 'Fallback response due to API error',
        symbolicInferences: ['fallback_response']
      };
    }
  };

  const enhancementPhase = async (
    userMessage: Message,
    history: ChatHistoryItem[],
    primaryResponse: EmotionDetection
  ): Promise<{
    analysisData: {
      gapAnalysisFeedback: string;
      symbolicInferences: string[];
    };
  }> => {
    if (!apiKey2?.trim()) {
      return {
        analysisData: {
          gapAnalysisFeedback: '',
          symbolicInferences: primaryResponse.symbolicInferences || []
        }
      };
    }

    try {
      console.log('🔬 Generating strategic briefing...');
      const briefing = await createStrategicBriefing(
        userMessage.content,
        [],
        null,
        apiKey2
      );

      const feedback = briefing
        ? `Doel: ${briefing.goal}. Kernpunten: ${briefing.keyPoints.slice(0, 2).join(', ')}`
        : '';

      return {
        analysisData: {
          gapAnalysisFeedback: feedback,
          symbolicInferences: primaryResponse.symbolicInferences || []
        }
      };

    } catch (error) {
      console.error('🔴 Enhancement phase error (continuing with fallback):', error);
      return {
        analysisData: {
          gapAnalysisFeedback: 'Strategische briefing niet beschikbaar',
          symbolicInferences: primaryResponse.symbolicInferences || []
        }
      };
    }
  };

  const packagingPhase = (
    ai: EmotionDetection,
    enhancement: {
      analysisData: {
        gapAnalysisFeedback: string;
        symbolicInferences: string[];
      };
    }
  ): Message => ({
    id: `ai-${Date.now()}`,
    from: 'ai',
    label: ai.label,
    content: ai.response, // Clean primary response only
    emotionSeed: ai.emotion,
    animate: true,
    timestamp: new Date(),
    feedback: null,
    symbolicInferences: enhancement.analysisData.symbolicInferences,
    explainText: ai.reasoning,
    meta: enhancement.analysisData.gapAnalysisFeedback ? {
      gapAnalysis: enhancement.analysisData.gapAnalysisFeedback,
      flowStatus: 'optimized'
    } : undefined
  });

  const orchestrateResponse = async (
    userMessage: Message,
    historyMessages: Message[]
  ): Promise<Message | null> => {
    if (!apiKey.trim()) return null;
    setIsProcessing(true);
    
    try {
      console.log('🚀 Starting orchestrated AI response flow...');
      
      const history = analysisPhase(historyMessages);
      strategyPhase(history);
      
      const ai = await promptPhase(userMessage, history);
      const enhancement = await enhancementPhase(userMessage, history, ai);

      // Enhanced hybrid decision making
      let finalAi = ai;
      try {
        const similarities = await performNeuralSearch(
          userMessage.content,
          vectorApiKey
        );
        const topSimilarities = similarities.slice(0, 5);

        const decision = await processHybridDecision(
          userMessage.content,
          seeds,
          topSimilarities,
          { primaryEmotion: ai.emotion, confidence: enhancement.analysisData.gapAnalysisFeedback ? 0.9 : 0.7 }
        );

        if (decision && decision.confidence > 0.8) {
          finalAi = {
            ...ai,
            response: decision.response,
            reasoning: decision.reasoning
          };
          console.log('🎯 High-confidence hybrid decision applied');
        }
      } catch (hybridError) {
        console.warn('⚠️ Hybrid decision failed, using primary response:', hybridError);
      }

      const result = packagingPhase(finalAi, enhancement);
      console.log('✅ Orchestrated response completed successfully');
      return result;
      
    } catch (error) {
      console.error('🔴 Orchestration failed completely:', error);
      return {
        id: `ai-error-${Date.now()}`,
        from: 'ai',
        label: 'Fout',
        content: 'Er is een technische fout opgetreden. Probeer het opnieuw.',
        emotionSeed: 'error',
        animate: false,
        timestamp: new Date(),
        feedback: null
      };
    } finally {
      setIsProcessing(false);
    }
  };

  return { orchestrateResponse, isProcessing: isProcessing || isLoading };
}
