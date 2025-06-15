import { useOpenAI, EmotionDetection } from './useOpenAI';
import seeds from "../seeds.json";

// Behoud de originele Seed interface voor fallback
export interface Seed {
  emotion: string;
  triggers: string[];
  response: string;
  meta?: string;
  label?: "Valideren" | "Reflectievraag" | "Suggestie";
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
  const { detectEmotion, isLoading } = useOpenAI();

  const checkInput = async (
    input: string, 
    apiKey?: string,
    context?: { dislikedLabel?: "Valideren" | "Reflectievraag" | "Suggestie" }
  ): Promise<EmotionDetection | Seed | null> => {
    // Als we een API key hebben, probeer OpenAI
    if (apiKey && apiKey.trim()) {
      const aiResult = await detectEmotion(input, apiKey, context);
      return aiResult;
    }
    
    // Fallback naar lokale seed matching als er geen API key is
    // Als er feedback is gegeven, kan de lokale engine geen alternatief bieden.
    if (context?.dislikedLabel) {
      return null;
    }
    return matchSeed(input, seeds as Seed[]);
  };

  return { 
    checkInput,
    isLoading,
  };
}
