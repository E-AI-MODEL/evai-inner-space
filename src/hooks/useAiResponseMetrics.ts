
import { Message } from "../types";
import { useLiveMonitoring } from "./useLiveMonitoring";

export function useAiResponseMetrics() {
  const { recordInteraction } = useLiveMonitoring();

  const recordResponseMetrics = (
    aiResponse: Message, 
    responseTime: number, 
    isSystemReady: boolean
  ) => {
    if (isSystemReady) {
      recordInteraction(aiResponse, responseTime);
    }
  };

  return {
    recordResponseMetrics
  };
}
