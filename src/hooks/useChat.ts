
import { useState } from "react";
import { useChatHistory } from "./useChatHistory";
import { useOpenAI } from "./useOpenAI";
import { Message } from "../types";
import { toast } from "@/hooks/use-toast";

export function useChat(apiKey: string) {
  const { messages, setMessages, clearHistory: clearChatHistory } = useChatHistory();
  const { detectEmotion, isLoading } = useOpenAI();
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const setFeedback = (messageId: string, feedback: 'like' | 'dislike') => {
    setMessages(prev =>
      prev.map(m => (m.id === messageId ? { ...m, feedback } : m))
    );
  };

  const generateAiResponse = async (userMessage: Message) => {
    if (!apiKey.trim()) {
      const errorMessage: Message = {
        id: `ai-${Date.now()}`,
        from: 'ai',
        label: 'Fout',
        content: 'OpenAI API key is niet ingesteld. Ga naar instellingen om deze in te voeren.',
        emotionSeed: null,
        animate: true,
        timestamp: new Date(),
        feedback: null,
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    try {
      // Create conversation history for context
      const conversationHistory = messages.slice(-6).map(msg => ({
        role: msg.from === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      const emotionResponse = await detectEmotion(
        userMessage.content,
        apiKey,
        undefined,
        conversationHistory
      );

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        from: 'ai',
        label: emotionResponse.label,
        content: emotionResponse.response,
        emotionSeed: emotionResponse.emotion,
        animate: true,
        timestamp: new Date(),
        feedback: null,
      };

      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('Error generating AI response:', error);
      
      const errorMessage: Message = {
        id: `ai-${Date.now()}`,
        from: 'ai',
        label: 'Fout',
        content: error instanceof Error ? error.message : 'Er is een fout opgetreden. Probeer het opnieuw.',
        emotionSeed: null,
        animate: true,
        timestamp: new Date(),
        feedback: null,
      };
      setMessages(prev => [...prev, errorMessage]);
    }
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
    isProcessing: isSending || isLoading,
    onSend,
    setFeedback,
    clearHistory
  };
}
