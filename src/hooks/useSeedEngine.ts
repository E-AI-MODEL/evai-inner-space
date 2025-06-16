
import { useOpenAI, EmotionDetection } from './useOpenAI';
import { useAdvancedSeedEngine } from './useAdvancedSeedEngine';
import { ChatHistoryItem } from '../types';
import { loadAdvancedSeeds } from '../lib/advancedSeedStorage';

export interface Seed {
  emotion: string;
  triggers: string[];
  response: string;
  meta?: string;
  label?: "Valideren" | "Reflectievraag" | "Suggestie";
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
    console.log('SeedEngine: checkInput called with:', { input, hasApiKey: !!apiKey, context });
    
    // Always try advanced seeds first
    const advancedSeeds = loadAdvancedSeeds();
    console.log('SeedEngine: Advanced seeds loaded:', advancedSeeds.length);
    
    if (advancedSeeds.length > 0) {
      console.log('SeedEngine: Using advanced seed engine');
      const result = await checkAdvancedInput(input, apiKey, context, history);
      
      if (result && 'id' in result && !('confidence' in result)) {
        console.log('SeedEngine: Advanced seed matched:', result);
        let legacyLabel: "Valideren" | "Reflectievraag" | "Suggestie" = "Valideren";
        if (result.label === "Reflectievraag") legacyLabel = "Reflectievraag";
        else if (result.label === "Suggestie") legacyLabel = "Suggestie";
        
        return {
          emotion: result.emotion,
          triggers: result.triggers,
          response: result.response.nl,
          meta: `${result.meta.weight}x – ${result.context.severity}`,
          label: legacyLabel
        };
      }
      
      console.log('SeedEngine: Returning result from advanced engine:', result);
      return result as EmotionDetection | null;
    }
    
    // Only use OpenAI if advanced seeds are not available AND API key exists
    if (apiKey && apiKey.trim()) {
      console.log('SeedEngine: Using OpenAI fallback');
      const aiResult = await detectEmotion(input, apiKey, context, history);
      return aiResult;
    }
    
    console.log('SeedEngine: No seeds or API key available');
    return null;
  };

  return { 
    checkInput,
    isLoading,
  };
}
