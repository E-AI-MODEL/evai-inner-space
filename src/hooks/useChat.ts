import { useState, useEffect } from "react";
import { useChatHistory } from "./useChatHistory";
import { Message } from "../types";
import { toast } from "@/hooks/use-toast";
import { useCleanAiResponse } from "./useCleanAiResponse";
import { useFeedbackHandler } from "./useFeedbackHandler";
import { useBackgroundReflectionTrigger } from "./useBackgroundReflectionTrigger";

export function useChat(apiKey: string) {
  const { messages, setMessages, clearHistory: clearChatHistory } = useChatHistory();
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [seedConfetti, setSeedConfetti] = useState(false);

  // CLEAN INTEGRATION: Replace old AI response with clean workflow
  const { generateCleanResponse, isProcessing: isCleanProcessing } = useCleanAiResponse();
  
  const { setFeedback } = useFeedbackHandler(messages, setMessages, async (userMessage) => {
    // Fallback AI response for feedback handler - keeping existing interface
    await generateAiResponse(userMessage);
  });

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

  // CLEAN INTEGRATION: New AI response generation using clean workflow
  const generateAiResponse = async (userMessage: Message) => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key vereist",
        description: "Voer je OpenAI API key in via de instellingen.",
        variant: "destructive",
      });
      return;
    }

    console.log('🎯 Generating AI response using clean workflow for:', userMessage.content);

    try {
      // Generate clean AI response
      const cleanResult = await generateCleanResponse(
        userMessage.content,
        apiKey,
        {
          messages: messages,
          conversationId: `chat-${Date.now()}`
        }
      );

      if (!cleanResult.success) {
        throw new Error('Clean AI response generation failed');
      }

      // Create AI message based on clean response
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        from: "ai",
        label: null,
        content: cleanResult.response,
        emotionSeed: cleanResult.emotionSeed || null,
        animate: true,
        timestamp: new Date(),
        feedback: null,
        meta: `Confidence: ${Math.round(cleanResult.confidence * 100)}%`,
        accentColor: cleanResult.emotionSeed ? getEmotionColor(cleanResult.emotionSeed) : undefined,
        replyTo: userMessage.id
      };

      // Add AI message to chat
      setMessages((prev) => [...prev, aiMessage]);

      // Trigger seed confetti if emotion seed was used
      if (cleanResult.emotionSeed) {
        setSeedConfetti(true);
        console.log('✨ Seed confetti triggered for emotion:', cleanResult.emotionSeed);
      }

      // Show success toast with processing details
      toast({
        title: "🤖 AI Antwoord Gegenereerd",
        description: `Verwerkt in ${cleanResult.processingTime}ms met ${Math.round(cleanResult.confidence * 100)}% vertrouwen`,
      });

    } catch (error) {
      console.error('❌ AI response generation failed:', error);
      
      // Create fallback error message
      const errorMessage: Message = {
        id: `ai-error-${Date.now()}`,
        from: "ai",
        label: "Fout",
        content: "Sorry, ik ondervind momenteel technische problemen. Probeer het opnieuw.",
        emotionSeed: null,
        animate: false,
        timestamp: new Date(),
        feedback: null,
        replyTo: userMessage.id
      };

      setMessages((prev) => [...prev, errorMessage]);

      toast({
        title: "❌ AI Fout",
        description: "Er is een fout opgetreden bij het genereren van een antwoord.",
        variant: "destructive",
      });
    }
  };

  // Helper function to get emotion color (simple mapping)
  const getEmotionColor = (emotion: string): string => {
    const colorMap: Record<string, string> = {
      'emotional-validation': '#10B981', // green
      'anxiety-support': '#3B82F6', // blue  
      'mood-regulation': '#F59E0B', // amber
      'social-connection': '#8B5CF6', // violet
      'self-worth': '#EF4444', // red
    };
    return colorMap[emotion] || '#6B7280'; // default gray
  };

  const onSend = async () => {
    if (!input.trim() || isSending || isCleanProcessing) return;

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
    isProcessing: isSending || isCleanProcessing,
    onSend,
    seedConfetti,
    setFeedback,
    clearHistory,
    // ENHANCED: Expose reflection system state
    pendingReflections,
    isReflectionProcessing
  };
}
