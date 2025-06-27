
import { useState, useCallback } from 'react';
import { Message, ChatHistoryItem } from '../types';
import { useSeedEngine } from './useSeedEngine';
import { useOpenAI, EmotionDetection } from './useOpenAI';
import { useOpenAISecondary } from './useOpenAISecondary';
import { AdvancedSeed } from '../types/seed';
import { v4 as uuidv4 } from 'uuid';

export function useChat(apiKey?: string, apiKey2?: string) {
  console.log('🔥 useChat hook called with keys:', { 
    key1: apiKey ? 'present' : 'missing', 
    key2: apiKey2 ? 'present' : 'missing' 
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  console.log('🔥 useChat initial state:', {
    messagesLength: messages.length,
    inputLength: input.length,
    isProcessing
  });

  let seedEngineHook, openAIHook, openAISecondaryHook;
  
  try {
    console.log('🔥 Initializing hooks...');
    seedEngineHook = useSeedEngine();
    openAIHook = useOpenAI();
    openAISecondaryHook = useOpenAISecondary();
    console.log('🔥 All hooks initialized successfully');
  } catch (error) {
    console.error('🔴 Error initializing hooks:', error);
    // Provide fallback functions
    seedEngineHook = { checkInput: async () => null };
    openAIHook = { detectEmotion: async () => ({ response: 'Error', emotion: 'error', confidence: 0, label: 'Fout' }) };
    openAISecondaryHook = { analyzeNeurosymbolic: async () => null };
  }

  const { checkInput } = seedEngineHook;
  const { detectEmotion } = openAIHook;
  const { analyzeNeurosymbolic } = openAISecondaryHook;

  const onSend = useCallback(async (message: string) => {
    console.log('🔥 onSend called with message:', message.substring(0, 50) + '...');
    
    if (!message.trim() || isProcessing) {
      console.log('🔥 onSend early return - empty message or processing');
      return;
    }

    setIsProcessing(true);
    console.log('🔥 Set processing to true');
    
    // Add user message
    const userMessage: Message = {
      id: uuidv4(),
      from: 'user',
      content: message,
      timestamp: new Date()
    };
    
    console.log('🔥 Adding user message:', userMessage.id);
    setMessages(prev => {
      console.log('🔥 Previous messages count:', prev.length);
      return [...prev, userMessage];
    });
    setInput('');

    try {
      // Convert to ChatHistoryItem format for API calls
      const history: ChatHistoryItem[] = messages.map(msg => ({
        role: msg.from === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      console.log('🔥 Prepared history with', history.length, 'items');

      // Try unified seed engine first
      console.log('🚀 Processing with Unified Decision Core...');
      let unifiedResult;
      try {
        unifiedResult = await checkInput(message, apiKey, undefined, history);
        console.log('🔥 Unified result:', unifiedResult ? 'success' : 'null');
      } catch (error) {
        console.error('🔴 Unified decision core failed:', error);
        unifiedResult = null;
      }
      
      let aiResponse: Message;

      if (unifiedResult) {
        console.log('🔥 Processing unified result...');
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
            console.log('🧠 Running secondary neurosymbolic analysis...');
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
            console.warn('⚠️ Secondary analysis failed, continuing without it');
          }
        }
      } else {
        // Fallback to direct OpenAI call
        console.log('🔄 Fallback to direct OpenAI detection...');
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

      console.log('🔥 Adding AI response:', aiResponse.id);
      setMessages(prev => {
        console.log('🔥 Adding AI message to', prev.length, 'existing messages');
        return [...prev, aiResponse];
      });
      console.log('✅ Response generated successfully');

    } catch (error) {
      console.error('🔴 Chat processing error:', error);
      
      const errorMessage: Message = {
        id: uuidv4(),
        from: 'ai',
        content: error instanceof Error ? error.message : 'Er ging iets mis. Probeer het opnieuw.',
        timestamp: new Date(),
        emotionSeed: 'error',
        confidence: 0,
        label: 'Valideren'
      };
      
      console.log('🔥 Adding error message:', errorMessage.id);
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      console.log('🔥 Setting processing to false');
      setIsProcessing(false);
    }
  }, [messages, isProcessing, apiKey, apiKey2, checkInput, detectEmotion, analyzeNeurosymbolic]);

  const setFeedback = useCallback((messageId: string, feedback: 'like' | 'dislike') => {
    console.log('🔥 Setting feedback for message:', messageId, feedback);
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, feedback } : msg
    ));
  }, []);

  const clearHistory = useCallback(() => {
    console.log('🔥 Clearing chat history');
    setMessages([]);
    setInput('');
  }, []);

  const result = {
    messages,
    input,
    setInput,
    isProcessing,
    onSend,
    setFeedback,
    clearHistory
  };

  console.log('🔥 useChat returning:', {
    messagesLength: result.messages.length,
    hasOnSend: typeof result.onSend === 'function',
    hasSetInput: typeof result.setInput === 'function'
  });

  return result;
}
