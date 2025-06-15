
import { useState, useEffect } from "react";
import { useSeedEngine } from "./useSeedEngine";
import { toast } from "@/hooks/use-toast";
import { getLabelVisuals } from "../lib/emotion-visuals";
import { Message } from "../types";

const initialMessages: Message[] = [
  {
    id: "user-1",
    from: "user",
    label: null,
    content: "Ik voel stress en paniek, alles wordt me te veel.",
    emotionSeed: null,
    animate: false,
    timestamp: new Date(Date.now() - 120000),
  },
  {
    id: "ai-1",
    from: "ai",
    label: "Valideren",
    accentColor: getLabelVisuals("Valideren").accentColor,
    content: "Ik hoor veel stress en onrust in je woorden.",
    showExplain: false,
    explainText: "Demo seed detectie voor 'stress en paniek'.",
    emotionSeed: "stress",
    animate: true,
    meta: "Demo",
    brilliant: true,
    timestamp: new Date(Date.now() - 60000),
  },
];

export function useChat(apiKey: string, showExplain: boolean) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [seedConfetti, setSeedConfetti] = useState(false);
  const { checkInput, isLoading } = useSeedEngine();

  useEffect(() => {
    if (seedConfetti) {
      const timer = setTimeout(() => setSeedConfetti(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [seedConfetti]);

  const onSend = async () => {
    if (!input.trim() || isProcessing) return;

    setIsProcessing(true);
    const userMessage: Message = {
      id: `user-${messages.length + 1}`,
      from: "user",
      label: null,
      content: input.trim(),
      emotionSeed: null,
      animate: false,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput("");

    try {
      const matchedResult = await checkInput(currentInput, apiKey);
      let aiResp: Message;

      if (matchedResult && "confidence" in matchedResult) {
        setSeedConfetti(true);
        toast({
          title: "AI Emotiedetectie",
          description: `${matchedResult.emotion} gedetecteerd (${Math.round(
            matchedResult.confidence * 100
          )}% zekerheid)`,
        });

        const label = matchedResult.label || "Valideren";
        aiResp = {
          id: `ai-openai-${messages.length + 1}`,
          from: "ai",
          label: label,
          accentColor: getLabelVisuals(label).accentColor,
          content: matchedResult.response,
          showExplain: showExplain,
          explainText: `OpenAI detectie: ${
            matchedResult.emotion
          } (${Math.round(matchedResult.confidence * 100)}% zekerheid)`,
          emotionSeed: matchedResult.emotion,
          animate: true,
          meta: `AI – ${Math.round(matchedResult.confidence * 100)}%`,
          brilliant: true,
          timestamp: new Date(),
        };
      } else if (matchedResult) {
        setSeedConfetti(true);
        toast({
          title: "Seed gevonden!",
          description: `De emotie '${
            (matchedResult as any).emotion
          }' werd herkend.`,
        });

        const label = (matchedResult as any).label || "Valideren";
        aiResp = {
          id: `ai-seed-${messages.length + 1}`,
          from: "ai",
          label: label,
          accentColor: getLabelVisuals(label).accentColor,
          content: (matchedResult as any).response,
          showExplain: showExplain,
          explainText: `Lokale seed: ${(matchedResult as any).emotion}`,
          emotionSeed: (matchedResult as any).emotion,
          animate: true,
          meta: (matchedResult as any).meta || "Lokaal",
          brilliant: true,
          timestamp: new Date(),
        };
      } else {
        const label = "Valideren";
        aiResp = {
          id: `ai-new-${messages.length + 1}`,
          from: "ai",
          label: label,
          accentColor: getLabelVisuals(label).accentColor,
          content: "Ik hoor iets bijzonders in je bericht, vertel gerust meer.",
          showExplain: showExplain,
          explainText: "Geen specifieke emotie gedetecteerd.",
          emotionSeed: null,
          animate: true,
          meta: "",
          brilliant: false,
          timestamp: new Date(),
        };
      }
      setMessages((prev) => [...prev, aiResp]);
    } catch (err) {
      console.error("Error processing message:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Er ging iets mis bij het verwerken van je bericht.";
      const errorResponse: Message = {
        id: `ai-error-${messages.length + 1}`,
        from: "ai",
        label: "Fout",
        content: errorMessage,
        emotionSeed: "error",
        animate: true,
        timestamp: new Date(),
        accentColor: getLabelVisuals("Fout").accentColor,
        brilliant: false,
      };
      setMessages((prev) => [...prev, errorResponse]);
      toast({
        title: "Fout bij analyse",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    messages,
    input,
    setInput,
    isProcessing: isProcessing || isLoading,
    onSend,
    seedConfetti,
  };
}
