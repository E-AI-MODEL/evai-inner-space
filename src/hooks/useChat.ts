
import { useState, useEffect } from "react";
import { useChatHistory } from "./useChatHistory";
import { Message } from "../types";
import { toast } from "@/hooks/use-toast";
import { useFeedbackHandler } from "./useFeedbackHandler";
import { useBackgroundReflectionTrigger } from "./useBackgroundReflectionTrigger";
import { useAiResponse } from "./useAiResponse";

export function useChat(apiKey: string) {
  const { messages, setMessages, clearHistory: clearChatHistory } = useChatHistory();
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [seedConfetti, setSeedConfetti] = useState(false);

  const { setFeedback } = useFeedbackHandler(messages, setMessages, async (userMessage) => {
    // Fallback AI response for feedback handler
    await generateAiResponse(userMessage);
  });

  // Background reflection system integration
  const {
    pendingReflections,
    isProcessing: isReflectionProcessing
  } = useBackgroundReflectionTrigger(messages, apiKey);

  // Original AI response system
  const { generateAiResponse: generateOriginalAiResponse, isGenerating } = useAiResponse(
    messages,
    setMessages,
    apiKey,
    setSeedConfetti
  );

  useEffect(() => {
    if (seedConfetti) {
      const timer = setTimeout(() => setSeedConfetti(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [seedConfetti]);

  // Show toast when new reflection questions are generated
  useEffect(() => {
    if (pendingReflections.length > 0) {
      const latestReflection = pendingReflections[pendingReflections.length - 1];
      const isRecent = Date.now() - latestReflection.triggeredAt.getTime() < 10000; // Within last 10 seconds
      
      if (isRecent) {
        toast({
          title: `🤔 Nieuwe reflectievraag: ${latestReflection.emotion}`,
          description: `Gebaseerd op ${latestReflection.batchInfo.seedCount} verlopende seeds. Wordt automatisch getoond tijdens het gesprek.`,
        });
      }
    }
  }, [pendingReflections]);

  // Use original AI response generation
  const generateAiResponse = async (userMessage: Message) => {
    console.log('🎯 Generating AI response using original workflow for:', userMessage.content);
    await generateOriginalAiResponse(userMessage);
  };

  const onSend = async () => {
    if (!input.trim() || isSending || isGenerating) return;

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
    isProcessing: isSending || isGenerating,
    onSend,
    seedConfetti,
    setFeedback,
    clearHistory,
    // Expose reflection system state
    pendingReflections,
    isReflectionProcessing
  };
}
