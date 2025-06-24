
import { useState, useCallback } from 'react';
import { Message } from '../types';
import { useOrchestratedAiResponse } from './useOrchestratedAiResponse';
import { toast } from '@/hooks/use-toast';

export function useChat(apiKey: string, apiKey2?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const { orchestrateResponse, isProcessing } = useOrchestratedAiResponse(apiKey, apiKey2);

  const onSend = useCallback(async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      from: 'user',
      label: null,
      content: input.trim(),
      emotionSeed: null,
      timestamp: new Date(),
      feedback: null
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput('');

    try {
      // Get AI response through orchestrated flow
      const aiResponse = await orchestrateResponse(userMessage, messages);
      
      if (aiResponse) {
        setMessages(prev => [...prev, aiResponse]);
        
        // Show success toast for special responses
        if (aiResponse.meta && typeof aiResponse.meta === 'object' && aiResponse.meta.autoSeed) {
          toast({
            title: "AI heeft geleerd! 🌱",
            description: `Nieuwe seed aangemaakt: ${aiResponse.meta.autoSeed}`,
          });
        }
      } else {
        throw new Error('Geen response ontvangen van AI');
      }
    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMessage: Message = {
        id: `ai-error-${Date.now()}`,
        from: 'ai',
        label: 'Fout',
        content: error instanceof Error ? error.message : 'Er is een onbekende fout opgetreden.',
        emotionSeed: 'error',
        timestamp: new Date(),
        feedback: null
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Fout in gesprek",
        description: "Er ging iets mis. Probeer het opnieuw.",
        variant: "destructive"
      });
    }
  }, [input, isProcessing, orchestrateResponse, messages]);

  const setFeedback = useCallback((messageId: string, feedback: 'like' | 'dislike') => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, feedback } : msg
    ));
    
    // Show feedback toast
    toast({
      title: feedback === 'like' ? "Bedankt voor je feedback! 👍" : "Feedback ontvangen 👎",
      description: feedback === 'like' 
        ? "De AI leert van positieve feedback"
        : "De AI zal proberen te verbeteren",
    });
  }, []);

  const clearHistory = useCallback(() => {
    setMessages([]);
    toast({
      title: "Geschiedenis gewist",
      description: "Alle berichten zijn verwijderd",
    });
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
