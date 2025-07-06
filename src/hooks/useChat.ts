
import { useState, useCallback } from 'react';
import { Message, ChatHistoryItem, UnifiedResponse } from '../types';
import { useProcessingOrchestrator } from './useProcessingOrchestrator';
import { v4 as uuidv4 } from 'uuid';

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  
  console.log('🔄 useChat hook initialized');
  const { orchestrateProcessing, isProcessing, stats } = useProcessingOrchestrator();

  const onSend = useCallback(async (message: string) => {
    console.log('📤 useChat onSend called with message:', message);
    console.log('📊 isProcessing state:', isProcessing);
    if (!message.trim() || isProcessing) {
      console.log('❌ Message blocked - empty or processing');
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

      const storedApiKey = localStorage.getItem('openai-api-key') || undefined;
      const storedApiKey2 = localStorage.getItem('openai-api-key-2') || undefined;
      
      console.log('🔑 API Keys found - Primary:', !!storedApiKey, 'Secondary:', !!storedApiKey2);
      console.log('📋 History length:', history.length);

      // Process through the new, simplified orchestrator
      console.log('🎼 Calling orchestrateProcessing...');
      const result: UnifiedResponse = await orchestrateProcessing(message, history, storedApiKey, storedApiKey2);
      console.log('✅ orchestrateProcessing returned result:', result);

      const aiResponse: Message = {
        id: uuidv4(),
        from: 'ai',
        content: result.content,
        // @ts-ignore
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
        },
        feedback: null
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
        // @ts-ignore
        label: 'Fout',
        feedback: null
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
  }, [messages, isProcessing, orchestrateProcessing]);

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
