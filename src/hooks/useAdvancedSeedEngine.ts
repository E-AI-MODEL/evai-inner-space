
import { useState } from 'react';
import { useSeeds } from './useSeeds';
import { useAdvancedSeedMatcher } from './useAdvancedSeedMatcher';
import { EmotionDetection } from './useOpenAI';
import { AdvancedSeed } from '../types/seed';
import { ChatHistoryItem } from '../types';

export function useAdvancedSeedEngine() {
  const [isLoading, setIsLoading] = useState(false);
  const { data: seeds = [] } = useSeeds();
  const { findBestMatch } = useAdvancedSeedMatcher();

  const checkInput = async (
    input: string,
    apiKey?: string,
    context?: {
      dislikedLabel?: "Valideren" | "Reflectievraag" | "Suggestie";
      secondaryInsights?: string[];
    },
    history?: ChatHistoryItem[]
  ): Promise<EmotionDetection | AdvancedSeed | null> => {
    if (!input?.trim()) return null;

    setIsLoading(true);
    console.log('🔍 Advanced seed engine checking input:', input.substring(0, 50));

    try {
      // Determine context for matching
      const matchingContext = {
        timeOfDay: getTimeOfDay(),
        situation: 'therapy' as const
      };

      // Try to find a matching seed first
      const matchedSeed = await findBestMatch(input, seeds, matchingContext);

      if (matchedSeed) {
        console.log('✅ Seed match found:', matchedSeed.emotion);
        
        // Convert AdvancedSeed to EmotionDetection format for compatibility
        const emotionDetection: EmotionDetection = {
          emotion: matchedSeed.emotion,
          confidence: matchedSeed.meta.confidence,
          response: matchedSeed.response.nl,
          triggers: matchedSeed.triggers,
          meta: `Seed match: ${matchedSeed.emotion} (weight: ${matchedSeed.meta.weight})`,
          label: matchedSeed.label,
          reasoning: `Matched seed: ${matchedSeed.emotion} with triggers: ${matchedSeed.triggers.join(', ')}`,
          symbolicInferences: [
            `🎯 Seed Match: ${matchedSeed.emotion}`,
            `📊 Confidence: ${Math.round(matchedSeed.meta.confidence * 100)}%`,
            `🔗 Triggers: ${matchedSeed.triggers.join(', ')}`,
            `⚖️ Weight: ${matchedSeed.meta.weight}`,
            `📈 Usage Count: ${matchedSeed.meta.usageCount}`
          ]
        };

        return emotionDetection;
      }

      console.log('🔍 No seed match found, advanced engine complete');
      return null;

    } catch (error) {
      console.error('🔴 Advanced seed engine error:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getTimeOfDay = (): 'morning' | 'afternoon' | 'evening' | 'night' => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
  };

  return {
    checkInput,
    isLoading
  };
}
