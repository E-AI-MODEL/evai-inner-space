
import { useOpenAI, EmotionDetection } from './useOpenAI';
import { useAdvancedSeedMatcher } from './useAdvancedSeedMatcher';
import { AdvancedSeed } from '../types/seed';
import { ChatHistoryItem } from '../types';
import { loadAdvancedSeeds } from '../lib/advancedSeedStorage';

export function useAdvancedSeedEngine() {
  const { detectEmotion, isLoading } = useOpenAI();
  const { findBestMatch, isMatching } = useAdvancedSeedMatcher();

  const checkInput = async (
    input: string, 
    apiKey?: string,
    context?: { dislikedLabel?: "Valideren" | "Reflectievraag" | "Suggestie" },
    history?: ChatHistoryItem[]
  ): Promise<EmotionDetection | AdvancedSeed | null> => {
    console.log('AdvancedSeedEngine: checkInput called');
    
    // Try OpenAI first if API key is available
    if (apiKey && apiKey.trim()) {
      console.log('AdvancedSeedEngine: Trying OpenAI first');
      try {
        const aiResult = await detectEmotion(input, apiKey, context, history);
        console.log('AdvancedSeedEngine: OpenAI result:', aiResult);
        return aiResult;
      } catch (error) {
        console.log('AdvancedSeedEngine: OpenAI failed, falling back to seeds:', error);
      }
    }
    
    // Check for advanced seeds
    const advancedSeeds = loadAdvancedSeeds();
    console.log('AdvancedSeedEngine: Advanced seeds available:', advancedSeeds.length);
    
    if (advancedSeeds.length === 0) {
      console.log('AdvancedSeedEngine: No advanced seeds available');
      return null;
    }
    
    // Skip feedback handling for now - advanced engine doesn't implement it yet
    if (context?.dislikedLabel) {
      console.log('AdvancedSeedEngine: Skipping due to disliked label');
      return null;
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
      userAge: 'adult' as const
    };
    
    console.log('AdvancedSeedEngine: Using matching context:', matchingContext);
    const result = findBestMatch(input, matchingContext);
    console.log('AdvancedSeedEngine: Match result:', result);
    
    return result;
  };

  return { 
    checkInput,
    isLoading: isLoading || isMatching,
  };
}
