
import { Message } from "../types";
import { useSymbolicEngine } from "./useSymbolicEngine";
import { toast } from "@/hooks/use-toast";

export function useAiResponseSymbolic() {
  const { evaluate: evaluateSymbolic } = useSymbolicEngine();

  const processSymbolicInferences = (
    messages: Message[], 
    aiResponse: Message, 
    isSystemReady: boolean
  ): Message => {
    if (!isSystemReady) return aiResponse;

    const extendedMessages = [...messages, aiResponse];
    const aiSymbolic = evaluateSymbolic(extendedMessages, aiResponse);
    
    if (aiSymbolic.length) {
      toast({
        title: "Symbolische observatie",
        description: aiSymbolic.join(" "),
      });
      
      return { ...aiResponse, symbolicInferences: aiSymbolic };
    }

    return aiResponse;
  };

  return {
    processSymbolicInferences
  };
}
