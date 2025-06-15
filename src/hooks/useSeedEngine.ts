
import { useOpenAI, EmotionDetection } from './useOpenAI';
import seeds from "../seeds.json";

// Behoud de originele Seed interface voor fallback
export interface Seed {
  emotion: string;
  triggers: string[];
  response: string;
  meta?: string;
}

// Functie om fallback seeds te matchen (als OpenAI faalt)
function matchSeed(input: string, seeds: Seed[]): Seed | null {
  const lowered = input.toLowerCase();
  for (const seed of seeds) {
    for (const trigger of seed.triggers) {
      if (lowered.includes(trigger.toLowerCase())) {
        return seed;
      }
    }
  }
  return null;
}

export function useSeedEngine() {
  const { detectEmotion, isLoading, error } = useOpenAI();

  const checkInput = async (input: string, apiKey?: string): Promise<EmotionDetection | Seed | null> => {
    // Als we een API key hebben, probeer OpenAI
    if (apiKey && apiKey.trim()) {
      const aiResult = await detectEmotion(input, apiKey);
      if (aiResult) {
        return aiResult;
      }
      // Als OpenAI faalt, val terug op lokale seeds
    }
    
    // Fallback naar lokale seed matching
    return matchSeed(input, seeds as Seed[]);
  };

  return { 
    checkInput,
    isLoading,
    error 
  };
}
