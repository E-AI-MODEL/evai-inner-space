import { useAdvancedSeedEngine } from './useAdvancedSeedEngine';
import { EmotionDetection } from './useOpenAI';
import { AdvancedSeed } from '../types/seed';
import { ChatHistoryItem } from '../types';

// Keep the original Seed interface for backward compatibility
export interface Seed {
  emotion: string;
  triggers: string[];
  response: string;
  meta?: string;
  label?: "Valideren" | "Reflectievraag" | "Suggestie";
}

export function useSeedEngine() {
  const { checkInput: checkAdvancedInput, isLoading } = useAdvancedSeedEngine();

  const checkInput = async (
    input: string,
    apiKey?: string,
    context?: {
      dislikedLabel?: "Valideren" | "Reflectievraag" | "Suggestie";
      secondaryInsights?: string[];
    },
    history?: ChatHistoryItem[]
  ): Promise<EmotionDetection | AdvancedSeed | null> => {
    // Direct pass-through to advanced seed engine
    return await checkAdvancedInput(input, apiKey, context, history);
  };

  return { 
    checkInput,
    isLoading,
  };
}
