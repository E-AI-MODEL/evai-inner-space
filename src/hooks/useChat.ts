
import { useState, useCallback } from 'react';
import { Message, ChatHistoryItem } from '../types';
import { useProcessingOrchestrator } from './useProcessingOrchestrator';
import { v4 as uuidv4 } from 'uuid';

export function useChat(apiKey?: string, apiKey2?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  
  const { orchestrateProcessing, isProcessing, stats } = useProcessingOrchestrator();

  const onSend = useCallback(async (message: string) => {
    if (!message.trim() || isProcessing) {
      return;
    }

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
      // Convert to ChatHistoryItem format
      const history: ChatHistoryItem[] = messages.map(msg => ({
        role: msg.from === 'user' ? 'user' : 'assistant',
        content: msg.content,
        timestamp: msg.timestamp
      }));

      // Process through unified orchestrator
      const result = await orchestrateProcessing(message, history, apiKey, apiKey2);

      const aiResponse: Message = {
        id: uuidv4(),
        from: 'ai',
        content: result.content,
        timestamp: new Date(),
        emotionSeed: result.emotion,
        confidence: result.confidence,
        label: result.label,
        explainText: result.reasoning,
        symbolicInferences: result.symbolicInferences,
        secondaryInsights: result.secondaryInsights,
        meta: {
          processingPath: result.metadata.processingPath,
          totalProcessingTime: result.metadata.totalProcessingTime,
          componentsUsed: result.metadata.componentsUsed
        }
      };

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
        label: 'Fout'
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
  }, [messages, isProcessing, apiKey, apiKey2, orchestrateProcessing]);

  const setFeedback = useCallback((messageId: string, feedback: 'like' | 'dislike') => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, feedback } : msg
    ));
  }, []);

  const clearHistory = useCallback(() => {
    setMessages([]);
    setInput('');
  }, []);

  const getChatStats = useCallback(() => {
    return {
      messageCount: messages.length,
      processingStats: stats,
      lastActivity: messages.length > 0 ? messages[messages.length - 1].timestamp : null
    };
  }, [messages, stats]);

  return {
    messages,
    input,
    setInput,
    isProcessing,
    onSend,
    setFeedback,
    clearHistory,
    getChatStats
  };
}
