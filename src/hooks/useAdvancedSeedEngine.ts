
import { useOpenAI, EmotionDetection } from './useOpenAI';
import { useAdvancedSeedMatcher } from './useAdvancedSeedMatcher';
import { AdvancedSeed, LegacySeed } from '../types/seed';
import { ChatHistoryItem } from '../types';
import { loadAdvancedSeeds } from '../lib/advancedSeedStorage';
import { migrateLegacySeeds } from '../utils/seedMigration';
import seeds from "../seeds.json";

export function useAdvancedSeedEngine() {
  const { detectEmotion, isLoading } = useOpenAI();
  const { findBestMatch, isMatching } = useAdvancedSeedMatcher();

  const checkInput = async (
    input: string, 
    apiKey?: string,
    context?: { dislikedLabel?: "Valideren" | "Reflectievraag" | "Suggestie" },
    history?: ChatHistoryItem[]
  ): Promise<EmotionDetection | AdvancedSeed | LegacySeed | null> => {
    // Try OpenAI first if API key is available
    if (apiKey && apiKey.trim()) {
      const aiResult = await detectEmotion(input, apiKey, context, history);
      return aiResult;
    }
    
    // Check for advanced seeds
    let advancedSeeds = loadAdvancedSeeds();
    
    // If no advanced seeds exist, migrate legacy seeds
    if (advancedSeeds.length === 0) {
      const legacySeeds = seeds as LegacySeed[];
      if (legacySeeds.length > 0) {
        // For first run, return legacy seed matching
        const lowered = input.toLowerCase();
        for (const seed of legacySeeds) {
          for (const trigger of seed.triggers) {
            if (lowered.includes(trigger.toLowerCase())) {
              return seed;
            }
          }
        }
      }
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
    
    return findBestMatch(input, matchingContext);
  };

  return { 
    checkInput,
    isLoading: isLoading || isMatching,
  };
}
