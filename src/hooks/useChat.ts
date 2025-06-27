
import { useState, useCallback } from 'react';
import { Message, ChatHistoryItem } from '../types';
import { useSeedEngine } from './useSeedEngine';
import { useOpenAI, EmotionDetection } from './useOpenAI';
import { useOpenAISecondary } from './useOpenAISecondary';
import { AdvancedSeed } from '../types/seed';
import { v4 as uuidv4 } from 'uuid';

export function useChat(apiKey?: string, apiKey2?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const { checkInput } = useSeedEngine();
  const { detectEmotion } = useOpenAI();
  const { analyzeNeurosymbolic } = useOpenAISecondary();

  const onSend = useCallback(async (message: string) => {
    if (!message.trim() || isProcessing) {
      return;
    }

    setIsProcessing(true);
    
    // Add user message
    const userMessage: Message = {
      id: uuidv4(),
      from: 'user',
      content: message,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      // Convert to ChatHistoryItem format for API calls
      const history: ChatHistoryItem[] = messages.map(msg => ({
        role: msg.from === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      // Try unified seed engine first
      let unifiedResult;
      try {
        unifiedResult = await checkInput(message, apiKey, undefined, history);
      } catch (error) {
        console.error('Unified decision core failed:', error);
        unifiedResult = null;
      }
      
      let aiResponse: Message;

      if (unifiedResult) {
        // Handle unified result (could be EmotionDetection or AdvancedSeed)
        if ('confidence' in unifiedResult && typeof unifiedResult.confidence === 'number') {
          // It's an EmotionDetection from OpenAI
          const emotionResult = unifiedResult as EmotionDetection;
          aiResponse = {
            id: uuidv4(),
            from: 'ai',
            content: emotionResult.response,
            timestamp: new Date(),
            emotionSeed: emotionResult.emotion,
            confidence: emotionResult.confidence,
            label: emotionResult.label,
            explainText: emotionResult.reasoning,
            symbolicInferences: emotionResult.symbolicInferences || []
          };
        } else {
          // It's an AdvancedSeed from database
          const seedResult = unifiedResult as AdvancedSeed;
          aiResponse = {
            id: uuidv4(),
            from: 'ai',
            content: seedResult.response.nl,
            timestamp: new Date(),
            emotionSeed: seedResult.emotion,
            confidence: seedResult.meta.confidence,
            label: seedResult.label,
            explainText: `Seed match: ${seedResult.emotion}`,
            symbolicInferences: [`🌱 Seed: ${seedResult.emotion}`, `🎯 Type: ${seedResult.type}`]
          };
        }

        // Try secondary analysis if API key 2 is available
        if (apiKey2?.trim()) {
          try {
            const secondaryAnalysis = await analyzeNeurosymbolic(
              message,
              aiResponse.content,
              apiKey2
            );
            
            if (secondaryAnalysis) {
              aiResponse.secondaryInsights = secondaryAnalysis.insights.slice(0, 3);
              if (secondaryAnalysis.patterns.length > 0) {
                aiResponse.symbolicInferences = [
                  ...(aiResponse.symbolicInferences || []),
                  ...secondaryAnalysis.patterns.slice(0, 2).map(p => `🔍 ${p}`)
                ];
              }
            }
          } catch (error) {
            console.warn('Secondary analysis failed, continuing without it');
          }
        }
      } else {
        // Fallback to direct OpenAI call
        if (!apiKey?.trim()) {
          throw new Error('OpenAI API key is required');
        }

        const fallbackResult = await detectEmotion(message, apiKey, undefined, history);
        aiResponse = {
          id: uuidv4(),
          from: 'ai',
          content: fallbackResult.response,
          timestamp: new Date(),
          emotionSeed: fallbackResult.emotion,
          confidence: fallbackResult.confidence,
          label: fallbackResult.label,
          explainText: fallbackResult.reasoning,
          symbolicInferences: fallbackResult.symbolicInferences || []
        };
      }

      setMessages(prev => [...prev, aiResponse]);

    } catch (error) {
      console.error('Chat processing error:', error);
      
      const errorMessage: Message = {
        id: uuidv4(),
        from: 'ai',
        content: error instanceof Error ? error.message : 'Er ging iets mis. Probeer het opnieuw.',
        timestamp: new Date(),
        emotionSeed: 'error',
        confidence: 0,
        label: 'Valideren'
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  }, [messages, isProcessing, apiKey, apiKey2, checkInput, detectEmotion, analyzeNeurosymbolic]);

  const setFeedback = useCallback((messageId: string, feedback: 'like' | 'dislike') => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, feedback } : msg
    ));
  }, []);

  const clearHistory = useCallback(() => {
    setMessages([]);
    setInput('');
  }, []);

  return {
    messages,
    input,
    setInput,
    isProcessing,
    onSend,
    setFeedback,
    clearHistory
  };
}
