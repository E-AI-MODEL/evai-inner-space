
import { useState, useEffect } from "react";
import { useChatHistory } from "./useChatHistory";
import { Message } from "../types";
import { toast } from "@/hooks/use-toast";
import { useAiResponse } from "./useAiResponse";
import { useFeedbackHandler } from "./useFeedbackHandler";
import { useBackgroundReflectionTrigger } from "./useBackgroundReflectionTrigger";

export function useChat(apiKey: string) {
  const { messages, setMessages, clearHistory: clearChatHistory } = useChatHistory();
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [seedConfetti, setSeedConfetti] = useState(false);

  const { generateAiResponse, isGenerating } = useAiResponse(
    messages,
    setMessages,
    apiKey,
    setSeedConfetti
  );
  
  const { setFeedback } = useFeedbackHandler(messages, setMessages, generateAiResponse);

  // ENHANCED: Background reflection system integration
  const {
    pendingReflections,
    isProcessing: isReflectionProcessing
  } = useBackgroundReflectionTrigger(messages, apiKey);

  useEffect(() => {
    if (seedConfetti) {
      const timer = setTimeout(() => setSeedConfetti(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [seedConfetti]);

  // ENHANCED: Show toast when new reflection questions are generated
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
    // ENHANCED: Expose reflection system state
    pendingReflections,
    isReflectionProcessing
  };
}
