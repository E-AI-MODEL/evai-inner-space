
import { useState, useCallback } from 'react';
import { Message, ChatHistoryItem, UnifiedResponse } from '../types';
import { useProcessingOrchestrator } from './useProcessingOrchestrator';
import { v4 as uuidv4 } from 'uuid';
import { useSelfLearningManager } from './useSelfLearningManager';

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  
  console.log('🔄 useChat hook initialized - Production mode');
  const { orchestrateProcessing, isProcessing, stats } = useProcessingOrchestrator();
  const { analyzeTurn } = useSelfLearningManager();

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

      // Get real API keys from localStorage
      const storedApiKey = localStorage.getItem('openai-api-key') || undefined;
      const storedApiKey2 = localStorage.getItem('openai-api-key-2') || undefined;
      
      // Validate API keys are real (not mock)
      if (storedApiKey && (storedApiKey.includes('demo') || storedApiKey.includes('test') || storedApiKey.includes('mock'))) {
        throw new Error('Mock API keys zijn niet toegestaan. Configureer een echte OpenAI API key.');
      }
      
      if (storedApiKey2 && (storedApiKey2.includes('demo') || storedApiKey2.includes('test') || storedApiKey2.includes('mock'))) {
        throw new Error('Mock API keys zijn niet toegestaan. Configureer een echte OpenAI API key.');
      }

      if (!storedApiKey || !storedApiKey.startsWith('sk-')) {
        throw new Error('Geen geldige OpenAI API key gevonden. Configureer eerst je API key in de instellingen.');
      }
      
      console.log('🔑 Using real API keys - Primary:', !!storedApiKey, 'Secondary:', !!storedApiKey2);
      console.log('📋 History length:', history.length);

      // Process through the orchestrator with real API keys
      console.log('🎼 Calling orchestrateProcessing with real API keys...');
      const result: UnifiedResponse = await orchestrateProcessing(message, history, storedApiKey, storedApiKey2);
      console.log('✅ orchestrateProcessing returned result:', result);

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
        },
        feedback: null
      };

      setMessages(prev => [...prev, aiResponse]);

      // Proactief zelflerend proces (fire-and-forget)
      void analyzeTurn(
        message,
        result,
        [...history, { role: 'user', content: message }]
      );

    } catch (error) {
      console.error('Chat processing error:', error);
      
      const errorMessage: Message = {
        id: uuidv4(),
        from: 'ai',
        content: error instanceof Error ? error.message : 'Er ging iets mis. Controleer je API configuratie.',
        timestamp: new Date(),
        emotionSeed: 'error',
        confidence: 0,
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
