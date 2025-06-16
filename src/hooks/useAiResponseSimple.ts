
import { useState, useCallback } from "react";
import { Message } from "../types";
import { toast } from "@/hooks/use-toast";

export function useAiResponseSimple(
  addMessage: (message: Message) => void,
  apiKey: string
) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateResponse = useCallback(async (userMessage: Message) => {
    console.log('AiResponseSimple: Generating response for:', userMessage.content);
    setIsGenerating(true);

    // Add user message immediately
    addMessage(userMessage);

    try {
      // Simple response generation - no complex dependencies
      const aiResponse: Message = {
        id: `ai-simple-${Date.now()}`,
        from: "ai",
        label: "Valideren",
        content: "Ik hoor wat je zegt. Kun je me daar meer over vertellen?",
        explainText: "Eenvoudige respons tijdens systeemherstel.",
        emotionSeed: null,
        animate: true,
        meta: "Basis",
        brilliant: false,
        timestamp: new Date(),
        replyTo: userMessage.id,
        feedback: null,
      };

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('AiResponseSimple: Adding AI response');
      addMessage(aiResponse);

    } catch (error) {
      console.error('AiResponseSimple: Error:', error);
      
      const errorResponse: Message = {
        id: `ai-error-${Date.now()}`,
        from: "ai",
        label: "Fout",
        content: "Er ging iets mis. Probeer het nog eens.",
        emotionSeed: "error",
        animate: true,
        timestamp: new Date(),
        brilliant: false,
        replyTo: userMessage.id,
        feedback: null,
      };
      
      addMessage(errorResponse);
      toast({
        title: "Fout",
        description: "Er ging iets mis bij het verwerken van je bericht.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [addMessage]);

  return {
    generateResponse,
    isGenerating
  };
}
