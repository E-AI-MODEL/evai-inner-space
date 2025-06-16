
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
import { useSystemBootstrap } from "./useSystemBootstrap";

export function useAiResponse(
  messages: Message[],
  addMessage: (message: Message) => void,
  apiKey: string,
  setSeedConfetti: (show: boolean) => void
) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { checkInput, isLoading: isSeedEngineLoading } = useSeedEngine();
  const { recordInteraction, isMonitoring, startMonitoring } = useLiveMonitoring();
  const { learnFromConversation } = useLearningEngine();
  const { analyzeForInjectionNeeds } = useSeedInjection();
  const { assessMessage } = useEvAI56Rubrics();
  const { isSystemReady } = useSystemBootstrap();

  // Symbolic neurosymbolic features engine
  const { evaluate: evaluateSymbolic } = useSymbolicEngine();

  const generateAiResponse = async (
    userMessage: Message,
    context?: { dislikedLabel?: "Valideren" | "Reflectievraag" | "Suggestie" }
  ) => {
    const startTime = Date.now();
    setIsProcessing(true);
    
    // Add user message first
    addMessage(userMessage);
    
    // Ensure monitoring is active if system is ready
    if (isSystemReady && !isMonitoring) {
      startMonitoring();
    }
    
    try {
      const messageIndex = messages.findIndex(m => m.id === userMessage.id);
      const history: ChatHistoryItem[] = messages
        .slice(0, messageIndex >= 0 ? messageIndex : messages.length)
        .map(msg => ({
          role: msg.from === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));

      // Only run advanced features if system is ready
      if (isSystemReady) {
        // Analyze for seed injection needs
        analyzeForInjectionNeeds([...messages, userMessage]);

        // Assess message with rubrics
        const rubricAssessments = assessMessage(userMessage.content);
        console.log('Rubric assessments:', rubricAssessments);
        
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
      }

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
          title: "Advanced Seed Match!",
          description: `Emotie '${seedResult.emotion}' herkend via advanced matching`,
        });

        const label = seedResult.label || "Valideren";
        aiResp = {
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
      if (isSystemReady) {
        recordInteraction(aiResp, responseTime);
      }

      // Symbolic engine analysis (only if system ready)
      if (isSystemReady) {
        const extendedMessages = [...messages, aiResp];
        const aiSymbolic = evaluateSymbolic(extendedMessages, aiResp);
        if (aiSymbolic.length) {
          aiResp = { ...aiResp, symbolicInferences: aiSymbolic };
          toast({
            title: "Symbolische observatie",
            description: aiSymbolic.join(" "),
          });
        }
      }

      addMessage(aiResp);
      
      // Trigger learning from the updated conversation (only if system ready)
      if (isSystemReady) {
        setTimeout(() => {
          learnFromConversation([...messages, userMessage, aiResp]);
        }, 1000);
      }
      
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
      if (isSystemReady) {
        recordInteraction(errorResponse, responseTime);
      }
      
      addMessage(errorResponse);
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
