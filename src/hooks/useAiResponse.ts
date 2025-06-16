
import { useState } from "react";
import { useSeedEngine, Seed } from "./useSeedEngine";
import { toast } from "@/hooks/use-toast";
import { getLabelVisuals } from "../lib/emotion-visuals";
import { Message, ChatHistoryItem } from "../types";
import { useSymbolicEngine } from "./useSymbolicEngine";

export function useAiResponse(
  messages: Message[],
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  apiKey: string,
  setSeedConfetti: (show: boolean) => void
) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { checkInput, isLoading: isSeedEngineLoading } = useSeedEngine();

  // Symbolic neurosymbolic features engine
  const { evaluate: evaluateSymbolic } = useSymbolicEngine();

  const generateAiResponse = async (
    userMessage: Message,
    context?: { dislikedLabel?: "Valideren" | "Reflectievraag" | "Suggestie" }
  ) => {
    setIsProcessing(true);
    
    // Check AI integration status
    const googleApiKey = localStorage.getItem('google-api-key');
    const hasOpenAI = apiKey && apiKey.trim().length > 0;
    const hasGoogle = googleApiKey && googleApiKey.trim().length > 0;
    
    console.log('🤖 AI Integration Status:', {
      openAI: hasOpenAI ? 'Active' : 'Inactive',
      google: hasGoogle ? 'Active' : 'Inactive',
      fullIntegration: hasOpenAI && hasGoogle
    });

    try {
      const messageIndex = messages.findIndex(m => m.id === userMessage.id);
      const history: ChatHistoryItem[] = messages
        .slice(0, messageIndex >= 0 ? messageIndex : messages.length)
        .map(msg => ({
          role: msg.from === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));

      const matchedResult = await checkInput(userMessage.content, apiKey, context, history);
      let aiResp: Message;

      if (matchedResult && "confidence" in matchedResult) {
        setSeedConfetti(true);
        toast({
          title: "🧠 AI Emotiedetectie (OpenAI)",
          description: `${matchedResult.emotion} gedetecteerd (${Math.round(
            matchedResult.confidence * 100
          )}% zekerheid)`,
        });

        const label = matchedResult.label || "Valideren";
        aiResp = {
          id: `ai-openai-${Date.now()}`,
          from: "ai",
          label: label,
          accentColor: getLabelVisuals(label).accentColor,
          content: matchedResult.response,
          explainText: matchedResult.reasoning,
          emotionSeed: matchedResult.emotion,
          animate: true,
          meta: `OpenAI – ${Math.round(matchedResult.confidence * 100)}%`,
          brilliant: true,
          timestamp: new Date(),
          replyTo: userMessage.id,
          feedback: null,
        };
      } else if (matchedResult) {
        const seedResult = matchedResult;
        setSeedConfetti(true);
        toast({
          title: "🎯 Advanced Seed Match",
          description: `Neurosymbolische match voor '${seedResult.emotion}'`,
        });

        const label = seedResult.label || "Valideren";
        aiResp = {
          id: `ai-seed-${Date.now()}`,
          from: "ai",
          label: label,
          accentColor: getLabelVisuals(label).accentColor,
          content: seedResult.response,
          explainText: `Advanced Seed: ${seedResult.triggers.join(", ")} → ${seedResult.emotion}`,
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
        aiResp = {
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
          meta: context?.dislikedLabel ? "Feedback" : "Basis",
          brilliant: false,
          timestamp: new Date(),
          replyTo: userMessage.id,
          feedback: null,
        };
      }

      // Enhanced Symbolic engine analysis (works with Google API if available)
      const extendedMessages = [...messages, aiResp];
      const aiSymbolic = evaluateSymbolic(extendedMessages, aiResp);
      if (aiSymbolic.length) {
        aiResp = { ...aiResp, symbolicInferences: aiSymbolic };
        
        // Show neurosymbolic toast only if Google API is active
        if (hasGoogle) {
          toast({
            title: "🧠 Neurosymbolische Analyse (Google)",
            description: aiSymbolic.join(" • "),
          });
        }
      }

      // Integration success notification
      if (hasOpenAI && hasGoogle && matchedResult) {
        console.log('✅ Full AI Integration Active: OpenAI + Google working together');
      }

      setMessages((prev) => [...prev, aiResp]);
    } catch (err) {
      console.error("Error processing message:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Er ging iets mis bij het verwerken van je bericht.";
      const errorResponse: Message = {
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
      setMessages((prev) => [...prev, errorResponse]);
      toast({
        title: "Fout bij AI analyse",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return { generateAiResponse, isGenerating: isProcessing || isSeedEngineLoading };
}
