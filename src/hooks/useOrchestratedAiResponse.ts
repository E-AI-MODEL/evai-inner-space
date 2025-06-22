import { useOpenAI, EmotionDetection } from './useOpenAI';
import { Message, ChatHistoryItem } from '../types';
import { useState } from 'react';

export function useOrchestratedAiResponse(apiKey: string) {
  const { detectEmotion, isLoading } = useOpenAI();
  const [isProcessing, setIsProcessing] = useState(false);

  const analysisPhase = (messages: Message[]): ChatHistoryItem[] => {
    return messages.slice(-6).map(m => ({
      role: m.from === 'user' ? 'user' as const : 'assistant' as const,
      content: m.content
    }));
  };

  const strategyPhase = (_history: ChatHistoryItem[]) => {
    return {};
  };

  const promptPhase = async (
    userMessage: Message,
    history: ChatHistoryItem[]
  ): Promise<EmotionDetection> => {
    return detectEmotion(userMessage.content, apiKey, undefined, history);
  };

  const packagingPhase = (
    ai: EmotionDetection
  ): Message => ({
    id: `ai-${Date.now()}`,
    from: 'ai',
    label: ai.label,
    content: ai.response,
    emotionSeed: ai.emotion,
    animate: true,
    timestamp: new Date(),
    feedback: null,
  });

  const orchestrateResponse = async (
    userMessage: Message,
    historyMessages: Message[]
  ): Promise<Message | null> => {
    if (!apiKey.trim()) return null;
    setIsProcessing(true);
    try {
      const history = analysisPhase(historyMessages);
      strategyPhase(history);
      const ai = await promptPhase(userMessage, history);
      return packagingPhase(ai);
    } finally {
      setIsProcessing(false);
    }
  };

  return { orchestrateResponse, isProcessing: isProcessing || isLoading };
}
