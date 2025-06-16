
import { useState, useCallback } from "react";
import { Message } from "../types";

const initialMessages: Message[] = [
  {
    id: "user-1",
    from: "user",
    label: null,
    content: "Hoi EvAI, ik zou graag even willen praten.",
    emotionSeed: null,
    animate: false,
    timestamp: new Date(Date.now() - 120000),
    feedback: null,
  },
  {
    id: "ai-1",
    from: "ai",
    label: null,
    accentColor: undefined,
    content: "Natuurlijk! Ik ben er om naar je te luisteren. Vertel, wat houdt je bezig op dit moment?",
    explainText: "Dit is een startbericht om je te verwelkomen.",
    emotionSeed: null,
    animate: true,
    meta: "Welkom",
    brilliant: false,
    timestamp: new Date(Date.now() - 60000),
    replyTo: "user-1",
    feedback: null,
  },
];

export function useChatCore() {
  const [messages, setMessages] = useState<Message[]>(() => {
    // Try to load from storage, but don't block if it fails
    try {
      const stored = localStorage.getItem('evai-chat-history');
      if (stored) {
        const parsed = JSON.parse(stored) as Message[];
        return parsed.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      }
    } catch (error) {
      console.warn('Failed to load chat history:', error);
    }
    return initialMessages;
  });

  const addMessage = useCallback((message: Message) => {
    console.log('ChatCore: Adding message', message.id);
    setMessages(prev => {
      const newMessages = [...prev, message];
      // Save to storage asynchronously
      setTimeout(() => {
        try {
          localStorage.setItem('evai-chat-history', JSON.stringify(newMessages));
        } catch (error) {
          console.warn('Failed to save chat history:', error);
        }
      }, 0);
      return newMessages;
    });
  }, []);

  const clearHistory = useCallback(() => {
    console.log('ChatCore: Clearing history');
    setMessages(initialMessages);
    try {
      localStorage.removeItem('evai-chat-history');
    } catch (error) {
      console.warn('Failed to clear storage:', error);
    }
  }, []);

  return {
    messages,
    addMessage,
    clearHistory
  };
}
