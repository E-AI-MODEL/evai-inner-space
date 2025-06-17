
import { useOpenAI, EmotionDetection } from './useOpenAI';
import { useAdvancedSeedMatcher } from './useAdvancedSeedMatcher';
import { AdvancedSeed } from '../types/seed';
import { ChatHistoryItem } from '../types';
import { useSeeds } from './useSeeds';

export function useAdvancedSeedEngine() {
  const { detectEmotion, isLoading } = useOpenAI();
  const { findBestMatch, isMatching } = useAdvancedSeedMatcher();
  const { data: seeds, refetch: refetchSeeds, isLoading: seedsLoading, error: seedsError } = useSeeds();

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
    console.log('🔑 API Key available:', !!apiKey?.trim());
    console.log('📊 Seeds status:', { 
      loading: seedsLoading, 
      error: !!seedsError, 
      count: seeds?.length || 0 
    });

    // Handle seeds loading state
    if (seedsLoading) {
      console.log('⏳ Seeds still loading, waiting...');
      return null;
    }

    // Handle seeds error
    if (seedsError) {
      console.error('🔴 Seeds error:', seedsError);
    }
    
    // Refresh seeds to get latest injected seeds
    try {
      await refetchSeeds();
      console.log('🔄 Seeds refreshed successfully');
    } catch (error) {
      console.error('🔴 Failed to refresh seeds:', error);
    }

    // Try OpenAI first if API key is available
    if (apiKey && apiKey.trim()) {
      console.log('🧠 Using OpenAI detection with API 1...');
      try {
        const aiResult = await detectEmotion(input, apiKey, context, history);
        console.log('✅ OpenAI API 1 result:', {
          emotion: aiResult.emotion, 
          confidence: aiResult.confidence,
          label: aiResult.label
        });
        return aiResult;
      } catch (error) {
        console.error('🔴 OpenAI API 1 detection failed:', error);
        // Continue to advanced seed matching as fallback
      }
    } else {
      console.log('🔑 No OpenAI API key available, using seed matching only');
    }
    
    // Use advanced seed matching as fallback or primary
    const advancedSeeds = seeds || [];
    console.log('📊 Available seeds for matching:', {
      total: advancedSeeds.length,
      active: advancedSeeds.filter(s => s.isActive).length,
      hasValidTriggers: advancedSeeds.filter(s => s.triggers.length > 0).length
    });
    
    if (advancedSeeds.length === 0) {
      console.log('🔴 Geen seeds beschikbaar voor matching');
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
      console.log('✅ Advanced seed match gevonden:', {
        emotion: matchedSeed.emotion,
        type: matchedSeed.type,
        triggers: matchedSeed.triggers,
        usageCount: matchedSeed.meta.usageCount
      });
    } else {
      console.log('🔴 Geen advanced seed match gevonden');
    }
    
    return matchedSeed;
  };

  return { 
    checkInput,
    isLoading: isLoading || isMatching || seedsLoading,
    seedsCount: seeds?.length || 0,
    seedsError: seedsError
  };
}
