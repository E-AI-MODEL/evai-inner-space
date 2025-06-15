
import { useState } from "react";
import { useSeedEngine, Seed } from "./useSeedEngine";
import { toast } from "@/hooks/use-toast";
import { getLabelVisuals } from "../lib/emotion-visuals";
import { Message, ChatHistoryItem } from "../types";
import { useSymbolicEngine } from "./useSymbolicEngine";
import { useLiveMonitoring } from "./useLiveMonitoring";
import { useLearningEngine } from "./useLearningEngine";
import { useSeedInjection } from "./useSeedInjection";
import { useEvAI56Rubrics } from "./useEvAI56Rubrics";

export function useAiResponse(
  messages: Message[],
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  apiKey: string,
  setSeedConfetti: (show: boolean) => void
) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { checkInput, isLoading: isSeedEngineLoading } = useSeedEngine();
  const { recordInteraction, startMonitoring } = useLiveMonitoring();
  const { learnFromConversation } = useLearningEngine();
  const { analyzeForInjectionNeeds } = useSeedInjection();
  const { assessMessage } = useEvAI56Rubrics();

  // Symbolic neurosymbolic features engine
  const { evaluate: evaluateSymbolic } = useSymbolicEngine();

  const generateAiResponse = async (
    userMessage: Message,
    context?: { dislikedLabel?: "Valideren" | "Reflectievraag" | "Suggestie" }
  ) => {
    const startTime = Date.now();
    setIsProcessing(true);
    
    // Start live monitoring if not already active
    startMonitoring();
    
    try {
      const messageIndex = messages.findIndex(m => m.id === userMessage.id);
      const history: ChatHistoryItem[] = messages
        .slice(0, messageIndex >= 0 ? messageIndex : messages.length)
        .map(msg => ({
          role: msg.from === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));

      // Analyze for seed injection needs
      analyzeForInjectionNeeds([...messages, userMessage]);

      // Assess message with rubrics
      const rubricAssessments = assessMessage(userMessage.content);
      console.log('Rubric assessments:', rubricAssessments);

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
        const seedResult = matchedResult;
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

      // Record interaction metrics
      const responseTime = Date.now() - startTime;
      recordInteraction(aiResp, responseTime);

      // Symbolic engine analysis (evaluates using current + the new AI message)
      const extendedMessages = [...messages, aiResp];
      const aiSymbolic = evaluateSymbolic(extendedMessages, aiResp);
      if (aiSymbolic.length) {
        aiResp = { ...aiResp, symbolicInferences: aiSymbolic };
        toast({
          title: "Symbolische observatie",
          description: aiSymbolic.join(" "),
        });
      }

      // Add rubric insights if any high-risk factors detected
      if (rubricAssessments.length > 0) {
        const highRiskAssessments = rubricAssessments.filter(a => a.overallScore > 1.5);
        if (highRiskAssessments.length > 0) {
          toast({
            title: "Rubric Alert",
            description: `${highRiskAssessments.length} risicofactor(en) gedetecteerd`,
            variant: "destructive"
          });
        }
      }

      setMessages((prev) => {
        const updatedMessages = [...prev, aiResp];
        
        // Trigger learning from the updated conversation
        setTimeout(() => {
          learnFromConversation(updatedMessages);
        }, 1000);
        
        return updatedMessages;
      });
      
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
      
      // Record error metrics
      const responseTime = Date.now() - startTime;
      recordInteraction(errorResponse, responseTime);
      
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

  return { generateAiResponse, isGenerating: isProcessing || isSeedEngineLoading };
}
