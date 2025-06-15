
import { useState, useEffect } from "react";
import { useSeedEngine, Seed } from "./useSeedEngine";
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
    replyTo: "user-1",
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
      id: `user-${Date.now()}`,
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
          id: `ai-openai-${Date.now()}`,
          from: "ai",
          label: label,
          accentColor: getLabelVisuals(label).accentColor,
          content: matchedResult.response,
          showExplain: showExplain,
          explainText: matchedResult.reasoning,
          emotionSeed: matchedResult.emotion,
          animate: true,
          meta: `AI – ${Math.round(matchedResult.confidence * 100)}%`,
          brilliant: true,
          timestamp: new Date(),
          replyTo: userMessage.id,
        };
      } else if (matchedResult) {
        const seedResult = matchedResult as Seed;
        setSeedConfetti(true);
        toast({
          title: "Seed gevonden!",
          description: `De emotie '${
            seedResult.emotion
          }' werd herkend.`,
        });

        const label = seedResult.label || "Valideren";
        aiResp = {
          id: `ai-seed-${Date.now()}`,
          from: "ai",
          label: label,
          accentColor: getLabelVisuals(label).accentColor,
          content: seedResult.response,
          showExplain: showExplain,
          explainText: `Lokale herkenning: Woorden zoals '${seedResult.triggers.join(
            ", "
          )}' duiden op de emotie '${seedResult.emotion}'.`,
          emotionSeed: seedResult.emotion,
          animate: true,
          meta: seedResult.meta || "Lokaal",
          brilliant: true,
          timestamp: new Date(),
          replyTo: userMessage.id,
        };
      } else {
        const label = "Valideren";
        aiResp = {
          id: `ai-new-${Date.now()}`,
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
          replyTo: userMessage.id,
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
