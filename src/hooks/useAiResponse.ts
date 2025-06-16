
import { useState } from "react";
import { Message } from "../types";
import { toast } from "@/hooks/use-toast";
import { useSystemBootstrap } from "./useSystemBootstrap";
import { useLiveMonitoring } from "./useLiveMonitoring";
import { useAiResponseCore } from "./useAiResponseCore";
import { useAiResponseProcessing } from "./useAiResponseProcessing";
import { useAiResponseMetrics } from "./useAiResponseMetrics";
import { useAiResponseSymbolic } from "./useAiResponseSymbolic";
import { useAiResponseAdvanced } from "./useAiResponseAdvanced";

export function useAiResponse(
  messages: Message[],
  addMessage: (message: Message) => void,
  apiKey: string,
  setSeedConfetti: (show: boolean) => void
) {
  const { isSystemReady } = useSystemBootstrap();
  const { isMonitoring, startMonitoring } = useLiveMonitoring();
  
  const { 
    isProcessing, 
    setIsProcessing, 
    generateAiMessage, 
    createErrorMessage, 
    isLoading 
  } = useAiResponseCore(messages, apiKey, setSeedConfetti);
  
  const { prepareHistory } = useAiResponseProcessing();
  const { recordResponseMetrics } = useAiResponseMetrics();
  const { processSymbolicInferences } = useAiResponseSymbolic();
  const { processAdvancedFeatures, triggerLearning } = useAiResponseAdvanced();

  const generateAiResponse = async (
    userMessage: Message,
    context?: { dislikedLabel?: "Valideren" | "Reflectievraag" | "Suggestie" }
  ) => {
    console.log('useAiResponse: generateAiResponse called', { userMessage, context });
    const startTime = Date.now();
    setIsProcessing(true);
    
    // Add user message first
    console.log('useAiResponse: Adding user message');
    addMessage(userMessage);
    
    // Ensure monitoring is active if system is ready
    if (isSystemReady && !isMonitoring) {
      console.log('useAiResponse: Starting monitoring');
      startMonitoring();
    }
    
    try {
      const history = prepareHistory(messages, userMessage);
      console.log('useAiResponse: Prepared history, length:', history.length);

      // Only run advanced features if system is ready
      if (isSystemReady) {
        console.log('useAiResponse: Processing advanced features');
        processAdvancedFeatures(messages, userMessage, isSystemReady);
      }

      console.log('useAiResponse: Generating AI message');
      let aiResp = await generateAiMessage(userMessage, context, history);
      console.log('useAiResponse: AI response generated', aiResp);

      // Record interaction metrics
      const responseTime = Date.now() - startTime;
      recordResponseMetrics(aiResp, responseTime, isSystemReady);

      // Symbolic engine analysis (only if system ready)
      aiResp = processSymbolicInferences(messages, aiResp, isSystemReady);

      console.log('useAiResponse: Adding AI response');
      addMessage(aiResp);
      
      // Trigger learning from the updated conversation (only if system ready)
      if (isSystemReady) {
        triggerLearning(messages, userMessage, aiResp, isSystemReady);
      }
      
    } catch (err) {
      console.error("useAiResponse: Error processing message:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Er ging iets mis bij het verwerken van je bericht.";
      
      const errorResponse = createErrorMessage(userMessage, errorMessage);
      
      // Record error metrics
      const responseTime = Date.now() - startTime;
      recordResponseMetrics(errorResponse, responseTime, isSystemReady);
      
      addMessage(errorResponse);
      toast({
        title: "Fout bij analyse",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      console.log('useAiResponse: Processing complete');
      setIsProcessing(false);
    }
  };

  return { generateAiResponse, isGenerating: isProcessing || isLoading };
}
