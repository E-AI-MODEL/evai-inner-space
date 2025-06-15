import { useState, useEffect } from "react";
import { useSeedEngine, Seed } from "./useSeedEngine";
import { toast } from "@/hooks/use-toast";
import { getLabelVisuals } from "../lib/emotion-visuals";
import { Message } from "../types";

const FEEDBACK_STORAGE_KEY = 'evai-message-feedback';

// Load feedback from localStorage
const loadFeedback = (): Record<string, 'like' | 'dislike' | null> => {
  try {
    const stored = localStorage.getItem(FEEDBACK_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    console.error("Failed to load feedback from localStorage", e);
    return {};
  }
};

// Save feedback to localStorage
const saveFeedback = (feedbackStore: Record<string, 'like' | 'dislike' | null>) => {
  try {
    localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(feedbackStore));
  } catch (e) {
    console.error("Failed to save feedback to localStorage", e);
  }
};

const initialMessages: Message[] = [
  {
    id: "user-1",
    from: "user",
    label: null,
    content: "Ik voel stress en paniek, alles wordt me te veel.",
    emotionSeed: null,
    animate: false,
    timestamp: new Date(Date.now() - 120000),
    feedback: null,
  },
  {
    id: "ai-1",
    from: "ai",
    label: "Valideren",
    accentColor: getLabelVisuals("Valideren").accentColor,
    content: "Ik hoor veel stress en onrust in je woorden.",
    explainText: "Demo seed detectie voor 'stress en paniek'.",
    emotionSeed: "stress",
    animate: true,
    meta: "Demo",
    brilliant: true,
    timestamp: new Date(Date.now() - 60000),
    replyTo: "user-1",
    feedback: null,
  },
];

// Apply stored feedback to initial messages
const getInitialMessagesWithFeedback = (): Message[] => {
    const storedFeedback = loadFeedback();
    return initialMessages.map(msg => ({
        ...msg,
        feedback: storedFeedback[msg.id] || null
    }));
};

export function useChat(apiKey: string) {
  const [messages, setMessages] = useState<Message[]>(getInitialMessagesWithFeedback);
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
      const matchedResult = await checkInput(userMessage.content, apiKey, context);
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

    if (!originalUserMessage || !dislikedMessage.label || !['Valideren', 'Reflectievraag', 'Suggestie'].includes(dislikedMessage.label)) {
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

  return {
    messages,
    input,
    setInput,
    isProcessing: isProcessing || isLoading,
    onSend,
    seedConfetti,
    setFeedback,
  };
}
