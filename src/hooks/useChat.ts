
import { useState, useEffect } from "react";
import { useChatHistory } from "./useChatHistory";
import { Message } from "../types";
import { toast } from "@/hooks/use-toast";

export function useChat(apiKey: string) {
  const { messages, setMessages, clearHistory: clearChatHistory } = useChatHistory();

  const addMessage = (message: Message) => {
    console.log('useChat: Adding message', message);
    setMessages((prev) => [...prev, message]);
  };

  const getEmotionHistory = () => {
    // Extract emotion history from messages with emotional seeds
    return messages
      .filter(msg => msg.emotionSeed && msg.from === 'ai')
      .map(msg => ({
        id: msg.id,
        icon: msg.emotionSeed === 'error' ? 'alert-circle' : 'heart',
        label: msg.emotionSeed || 'Unknown',
        colorClass: msg.accentColor ? `bg-${msg.accentColor}-100` : 'bg-blue-100',
        time: msg.timestamp.toLocaleTimeString('nl-NL', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      }));
  };

  const clearHistory = () => {
    console.log('useChat: Clearing history');
    clearChatHistory();
    toast({
      title: "Geschiedenis gewist",
      description: "De chat is teruggezet naar het begin.",
    });
  };

  return {
    messages,
    addMessage,
    clearHistory,
    getEmotionHistory,
  };
}
