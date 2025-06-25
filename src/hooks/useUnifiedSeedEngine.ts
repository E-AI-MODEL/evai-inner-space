
import { useUnifiedDecisionCore } from './useUnifiedDecisionCore';
import { EmotionDetection } from './useOpenAI';
import { AdvancedSeed } from '../types/seed';
import { ChatHistoryItem } from '../types';

export function useUnifiedSeedEngine() {
  const { makeUnifiedDecision, isProcessing } = useUnifiedDecisionCore();

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

    console.log('🔍 Unified Seed Engine checking input:', input.substring(0, 50));

    try {
      // Use vector API key for embeddings (prefer dedicated vector key, fallback to OpenAI key)
      const vectorApiKey = localStorage.getItem('vector-api-key') || apiKey;
      
      const decision = await makeUnifiedDecision(
        input, 
        apiKey, 
        vectorApiKey, 
        context, 
        history
      );

      if (!decision) {
        console.log('🔍 No unified decision found');
        return null;
      }

      // Convert to EmotionDetection format for compatibility
      const emotionDetection: EmotionDetection = {
        emotion: decision.emotion,
        confidence: decision.confidence,
        response: decision.response,
        triggers: decision.sources[0]?.triggers || [decision.emotion],
        meta: decision.meta,
        label: decision.label,
        reasoning: decision.reasoning,
        symbolicInferences: decision.symbolicInferences
      };

      console.log('✅ Unified seed engine match:', decision.emotion);
      return emotionDetection;

    } catch (error) {
      console.error('🔴 Unified seed engine error:', error);
      return null;
    }
  };

  return {
    checkInput,
    isLoading: isProcessing
  };
}
