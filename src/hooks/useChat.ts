
import { useState } from "react";
import { useChatHistory } from "./useChatHistory";
import { Message } from "../types";
import { toast } from "@/hooks/use-toast";

export function useChat(apiKey: string) {
  const { messages, setMessages, clearHistory: clearChatHistory } = useChatHistory();
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [seedConfetti, setSeedConfetti] = useState(false);

  const setFeedback = (messageId: string, feedback: 'like' | 'dislike') => {
    setMessages(prev =>
      prev.map(m => (m.id === messageId ? { ...m, feedback } : m))
    );
  };

  const generateAiResponse = async (_userMessage: Message) => {
    const aiMessage: Message = {
      id: `ai-${Date.now()}`,
      from: 'ai',
      label: null,
      content: 'AI response is niet beschikbaar.',
      emotionSeed: null,
      animate: true,
      timestamp: new Date(),
      feedback: null,
    };
    setMessages(prev => [...prev, aiMessage]);
  };

  const onSend = async () => {
    if (!input.trim() || isSending) return;

    setIsSending(true);
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      from: "user",
      label: null,
      content: input.trim(),
      emotionSeed: null,
      animate: false,
      timestamp: new Date(),
      feedback: null,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    await generateAiResponse(userMessage);
    setIsSending(false);
  };
  
  const clearHistory = () => {
    clearChatHistory();
    toast({
        title: "Geschiedenis gewist",
        description: "De chat is teruggezet naar het begin.",
    });
  };

  return {
    messages,
    input,
    setInput,
    isProcessing: isSending,
    onSend,
    seedConfetti,
    setFeedback,
    clearHistory
  };
}
