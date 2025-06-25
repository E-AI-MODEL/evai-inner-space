
import { useState } from 'react';
import { useUnifiedSeedEngine } from './useUnifiedSeedEngine';
import { EmotionDetection } from './useOpenAI';
import { AdvancedSeed } from '../types/seed';
import { ChatHistoryItem } from '../types';

export function useAdvancedSeedEngine() {
  const [isLoading, setIsLoading] = useState(false);
  const { checkInput: checkUnifiedInput, isLoading: isUnifiedLoading } = useUnifiedSeedEngine();

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
    console.log('🔍 Advanced seed engine delegating to unified core:', input.substring(0, 50));

    try {
      // Delegate to the unified decision core
      const result = await checkUnifiedInput(input, apiKey, context, history);
      
      if (result) {
        console.log('✅ Unified core provided result:', result);
        return result;
      }

      console.log('🔍 No result from unified core');
      return null;

    } catch (error) {
      console.error('🔴 Advanced seed engine error:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    checkInput,
    isLoading: isLoading || isUnifiedLoading
  };
}
