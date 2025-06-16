
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
    const matchedResult = await checkInput(userMessage.content, apiKey, context, history);
    
    if (matchedResult && "confidence" in matchedResult) {
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
    } else if (matchedResult) {
      const seedResult = matchedResult;
      setSeedConfetti(true);
      toast({
        title: "Advanced Seed Match!",
        description: `Emotie '${seedResult.emotion}' herkend via advanced matching`,
      });

      const label = seedResult.label || "Valideren";
      return {
        id: `ai-seed-${Date.now()}`,
        from: "ai",
        label: label,
        accentColor: getLabelVisuals(label).accentColor,
        content: seedResult.response,
        explainText: `Advanced seed match: '${seedResult.triggers.join(", ")}'`,
        emotionSeed: seedResult.emotion,
        animate: true,
        meta: seedResult.meta || "Advanced",
        brilliant: true,
        timestamp: new Date(),
        replyTo: userMessage.id,
        feedback: null,
      };
    } else {
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
        meta: context?.dislikedLabel ? "Feedback" : "",
        brilliant: false,
        timestamp: new Date(),
        replyTo: userMessage.id,
        feedback: null,
      };
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
