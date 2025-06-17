
import { useOpenAI, EmotionDetection } from './useOpenAI';
import { useAdvancedSeedMatcher } from './useAdvancedSeedMatcher';
import { AdvancedSeed } from '../types/seed';
import { ChatHistoryItem } from '../types';
import { useSeeds } from './useSeeds';

export function useAdvancedSeedEngine() {
  const { detectEmotion, isLoading } = useOpenAI();
  const { findBestMatch, isMatching } = useAdvancedSeedMatcher();
  const { data: seeds, refetch: refetchSeeds } = useSeeds();

  const checkInput = async (
    input: string, 
    apiKey?: string,
    context?: { 
      dislikedLabel?: "Valideren" | "Reflectievraag" | "Suggestie",
      secondaryInsights?: string[]
    },
    history?: ChatHistoryItem[]
  ): Promise<EmotionDetection | AdvancedSeed | null> => {
    console.log('🚀 Advanced Seed Engine check voor:', input.substring(0, 50));
    
    // Refresh seeds to get latest injected seeds
    try {
      await refetchSeeds();
      console.log('🔄 Seeds refreshed');
    } catch (error) {
      console.error('🔴 Failed to refresh seeds:', error);
    }

    // Try OpenAI first if API key is available
    if (apiKey && apiKey.trim()) {
      console.log('🧠 Using OpenAI detection...');
      try {
        const aiResult = await detectEmotion(input, apiKey, context, history);
        console.log('✅ OpenAI result:', aiResult.emotion, 'Confidence:', aiResult.confidence);
        return aiResult;
      } catch (error) {
        console.error('🔴 OpenAI detection failed:', error);
        // Continue to advanced seed matching as fallback
      }
    }
    
    // Use advanced seed matching as fallback or primary
    const advancedSeeds = seeds || [];
    console.log('📊 Available seeds:', advancedSeeds.length, 'Active:', advancedSeeds.filter(s => s.isActive).length);
    
    if (advancedSeeds.length === 0) {
      console.log('🔴 Geen seeds beschikbaar');
      return null;
    }
    
    // Skip advanced matching for disliked labels (let OpenAI handle it)
    if (context?.dislikedLabel && apiKey) {
      console.log('🔄 Skipping advanced matching for disliked label, deferring to OpenAI');
      return null;
    }
    
    // Determine context from input and current time
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
    
    console.log('🎯 Matching context:', matchingContext);
    
    const matchedSeed = await findBestMatch(input, advancedSeeds, matchingContext);
    
    if (matchedSeed) {
      console.log('✅ Advanced seed match gevonden:', matchedSeed.emotion, 'Type:', matchedSeed.type);
    } else {
      console.log('🔴 Geen advanced seed match gevonden');
    }
    
    return matchedSeed;
  };

  return { 
    checkInput,
    isLoading: isLoading || isMatching,
  };
}
