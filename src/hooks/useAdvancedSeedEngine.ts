
import { useOpenAI, EmotionDetection } from './useOpenAI';
import { useAdvancedSeedMatcher } from './useAdvancedSeedMatcher';
import { AdvancedSeed } from '../types/seed';
import { ChatHistoryItem } from '../types';
import { useSeeds } from './useSeeds';

export function useAdvancedSeedEngine() {
  const { detectEmotion, isLoading } = useOpenAI();
  const { findBestMatch, isMatching } = useAdvancedSeedMatcher();
  const { data: seeds } = useSeeds();

  const checkInput = async (
    input: string, 
    apiKey?: string,
    context?: { dislikedLabel?: "Valideren" | "Reflectievraag" | "Suggestie" },
    history?: ChatHistoryItem[]
  ): Promise<EmotionDetection | AdvancedSeed | null> => {
    // Try OpenAI first if API key is available
    if (apiKey && apiKey.trim()) {
      const aiResult = await detectEmotion(input, apiKey, context, history);
      return aiResult;
    }
    
    const advancedSeeds = seeds || [];
    if (advancedSeeds.length === 0) {
      return null;
    }
    
    // Use advanced matching
    if (context?.dislikedLabel) {
      return null; // Advanced engine can handle feedback in future versions
    }
    
    // Determine context from input and time
    const currentHour = new Date().getHours();
    let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' = 'morning';
    if (currentHour >= 12 && currentHour < 17) timeOfDay = 'afternoon';
    else if (currentHour >= 17 && currentHour < 21) timeOfDay = 'evening';
    else if (currentHour >= 21 || currentHour < 6) timeOfDay = 'night';
    
    const matchingContext = {
      timeOfDay,
      situation: 'therapy' as const,
      userAge: 'adult' as const // Default, could be enhanced with user profiling
    };
    
    return findBestMatch(input, advancedSeeds, matchingContext);
  };

  return { 
    checkInput,
    isLoading: isLoading || isMatching,
  };
}
