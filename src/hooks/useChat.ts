import { useState, useEffect } from "react";
import { useSeedEngine, Seed } from "./useSeedEngine";
import { toast } from "@/hooks/use-toast";
import { getLabelVisuals } from "../lib/emotion-visuals";
import { Message, ChatHistoryItem } from "../types";
import { loadFeedback, saveFeedback } from "../lib/feedbackStorage";
import { useChatHistory } from "./useChatHistory";

export function useChat(apiKey: string) {
  const { messages, setMessages, clearHistory: clearChatHistory } = useChatHistory();
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

  const generateAiResponse = async (
    userMessage: Message,
    context?: { dislikedLabel?: "Valideren" | "Reflectievraag" | "Suggestie" }
  ) => {
    setIsProcessing(true);
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
          explainText: `Lokale herkenning: Woorden zoals '${seedResult.triggers.join(
            ", "
          )}' duiden op de emotie '${seedResult.emotion}'.`,
          emotionSeed: seedResult.emotion,
          animate: true,
          meta: seedResult.meta || "Lokaal",
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
          meta: context?.dislikedLabel ? "Feedback" : "",
          brilliant: false,
          timestamp: new Date(),
          replyTo: userMessage.id,
          feedback: null,
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
        feedback: null,
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

  const onSend = async () => {
    if (!input.trim() || isProcessing) return;

    setIsProcessing(true); // Prevent input while creating user message
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
  };
  
  const handleDislike = async (dislikedMessage: Message) => {
    const originalUserMessage = messages.find(m => m.id === dislikedMessage.replyTo);

    if (!originalUserMessage || !dislikedMessage.label || dislikedMessage.label === 'Fout') {
      return;
    }
    
    await generateAiResponse(originalUserMessage, { dislikedLabel: dislikedMessage.label });
  };
  
  const setFeedback = (messageId: string, feedback: 'like' | 'dislike') => {
    const storedFeedback = loadFeedback();
    const currentFeedbackForMessage = storedFeedback[messageId];
    const newFeedback = currentFeedbackForMessage === feedback ? null : feedback;
    
    const updatedFeedbackStore = { ...storedFeedback, [messageId]: newFeedback };
    saveFeedback(updatedFeedbackStore);

    let dislikedMessage: Message | undefined;
    setMessages(prevMessages =>
      prevMessages.map(msg => {
        if (msg.id === messageId) {
          // Clone the message to avoid mutation issues before passing to handler
          dislikedMessage = { ...msg, feedback: newFeedback };
          return { ...msg, feedback: newFeedback };
        }
        return msg;
      })
    );
    
    if (newFeedback === 'dislike' && dislikedMessage) {
      handleDislike(dislikedMessage);
    }
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
    isProcessing: isProcessing || isLoading,
    onSend,
    seedConfetti,
    setFeedback,
    clearHistory,
  };
}
