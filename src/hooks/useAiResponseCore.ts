
import { useState } from "react";
import { Message } from "../types";
import { useSeedEngine } from "./useSeedEngine";
import { getLabelVisuals } from "../lib/emotion-visuals";
import { toast } from "@/hooks/use-toast";

export function useAiResponseCore(
  messages: Message[],
  apiKey: string,
  setSeedConfetti: (show: boolean) => void
) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { checkInput, isLoading: isSeedEngineLoading } = useSeedEngine();

  const generateAiMessage = async (
    userMessage: Message,
    context?: { dislikedLabel?: "Valideren" | "Reflectievraag" | "Suggestie" },
    history: any[] = []
  ): Promise<Message> => {
    console.log('AiResponseCore: generateAiMessage called');
    console.log('User message:', userMessage.content);
    console.log('Context:', context);
    console.log('History length:', history.length);
    console.log('API key available:', !!apiKey);
    
    try {
      const matchedResult = await checkInput(userMessage.content, apiKey, context, history);
      console.log('AiResponseCore: checkInput result:', matchedResult);
      
      if (matchedResult && "confidence" in matchedResult) {
        console.log('AiResponseCore: OpenAI result detected');
        setSeedConfetti(true);
        toast({
          title: "AI Emotiedetectie",
          description: `${matchedResult.emotion} gedetecteerd (${Math.round(
            matchedResult.confidence * 100
          )}% zekerheid)`,
        });

        const label = matchedResult.label || "Valideren";
        return {
          id: `ai-openai-${Date.now()}`,
          from: "ai",
          label: label,
          accentColor: getLabelVisuals(label).accentColor,
          content: matchedResult.response,
          explainText: matchedResult.reasoning,
          emotionSeed: matchedResult.emotion,
          animate: true,
          meta: `AI – ${Math.round(matchedResult.confidence * 100)}%`,
          brilliant: true,
          timestamp: new Date(),
          replyTo: userMessage.id,
          feedback: null,
        };
      } else if (matchedResult && typeof matchedResult === 'object') {
        console.log('AiResponseCore: Seed result detected');
        const seedResult = matchedResult;
        setSeedConfetti(true);
        toast({
          title: "Seed Match!",
          description: `Emotie '${seedResult.emotion}' herkend`,
        });

        const label = seedResult.label || "Valideren";
        return {
          id: `ai-seed-${Date.now()}`,
          from: "ai",
          label: label,
          accentColor: getLabelVisuals(label).accentColor,
          content: seedResult.response,
          explainText: `Seed match: '${seedResult.triggers?.join?.(", ") || "unknown"}'`,
          emotionSeed: seedResult.emotion,
          animate: true,
          meta: seedResult.meta || "Seed",
          brilliant: true,
          timestamp: new Date(),
          replyTo: userMessage.id,
          feedback: null,
        };
      } else {
        console.log('AiResponseCore: No match found, creating default response');
        const label = "Valideren";
        return {
          id: context?.dislikedLabel ? `ai-feedback-${Date.now()}`: `ai-new-${Date.now()}`,
          from: "ai",
          label: label,
          accentColor: getLabelVisuals(label).accentColor,
          content: context?.dislikedLabel 
            ? "Het spijt me dat mijn vorige antwoord niet hielp. Ik zal proberen hier rekening mee te houden." 
            : "Ik hoor iets bijzonders in je bericht, vertel gerust meer.",
          explainText: context?.dislikedLabel ? "Nieuw antwoord na feedback." : "Geen specifieke emotie gedetecteerd.",
          emotionSeed: null,
          animate: true,
          meta: context?.dislikedLabel ? "Feedback" : "Default",
          brilliant: false,
          timestamp: new Date(),
          replyTo: userMessage.id,
          feedback: null,
        };
      }
    } catch (error) {
      console.error('AiResponseCore: Error in generateAiMessage:', error);
      throw error;
    }
  };

  const createErrorMessage = (userMessage: Message, errorMessage: string): Message => {
    return {
      id: `ai-error-${Date.now()}`,
      from: "ai",
      label: "Fout",
      content: errorMessage,
      emotionSeed: "error",
      animate: true,
      timestamp: new Date(),
      accentColor: getLabelVisuals("Fout").accentColor,
      brilliant: false,
      replyTo: userMessage.id,
      feedback: null,
    };
  };

  return {
    isProcessing,
    setIsProcessing,
    generateAiMessage,
    createErrorMessage,
    isLoading: isSeedEngineLoading
  };
}
