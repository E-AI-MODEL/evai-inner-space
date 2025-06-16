
import { useOpenAI, EmotionDetection } from './useOpenAI';
import { useAdvancedSeedEngine } from './useAdvancedSeedEngine';
import seeds from "../seeds.json";
import { ChatHistoryItem } from '../types';
import { loadAdvancedSeeds } from '../lib/advancedSeedStorage';

// Keep the original Seed interface for backward compatibility
export interface Seed {
  emotion: string;
  triggers: string[];
  response: string;
  meta?: string;
  label?: "Valideren" | "Reflectievraag" | "Suggestie";
}

// Fallback function for legacy seed matching
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
  const { checkInput: checkAdvancedInput } = useAdvancedSeedEngine();

  const checkInput = async (
    input: string, 
    apiKey?: string,
    context?: { dislikedLabel?: "Valideren" | "Reflectievraag" | "Suggestie" },
    history?: ChatHistoryItem[]
  ): Promise<EmotionDetection | Seed | null> => {
    // Check if we have advanced seeds available
    const advancedSeeds = loadAdvancedSeeds();
    
    if (advancedSeeds.length > 0) {
      // Use advanced seed engine
      const result = await checkAdvancedInput(input, apiKey, context, history);
      
      // Convert AdvancedSeed to Seed interface for backward compatibility
      if (result && 'id' in result && !('confidence' in result)) {
        // Map the advanced label to legacy label, excluding "Interventie" 
        let legacyLabel: "Valideren" | "Reflectievraag" | "Suggestie" = "Valideren";
        if (result.label === "Reflectievraag") legacyLabel = "Reflectievraag";
        else if (result.label === "Suggestie") legacyLabel = "Suggestie";
        // "Interventie" will default to "Valideren" for backward compatibility
        
        return {
          emotion: result.emotion,
          triggers: result.triggers,
          response: result.response.nl,
          meta: `${result.meta.weight}x – ${result.context.severity}`,
          label: legacyLabel
        };
      }
      
      return result as EmotionDetection | null;
    }
    
    // Fallback to original logic
    if (apiKey && apiKey.trim()) {
      const aiResult = await detectEmotion(input, apiKey, context, history);
      return aiResult;
    }
    
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
