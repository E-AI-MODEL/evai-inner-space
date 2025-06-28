
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { generateEmbedding } from '@/lib/embeddingUtils';

interface AdvancedSeedMatch {
  id: string;
  emotion: string;
  response: string;
  confidence: number;
  label?: 'Valideren' | 'Reflectievraag' | 'Suggestie' | 'Interventie' | 'Fout';
  triggers: string[];
  metadata: Record<string, any>;
}

export function useAdvancedSeedMatcher() {
  const [isMatching, setIsMatching] = useState(false);

  const matchAdvancedSeed = useCallback(async (
    userInput: string,
    apiKey?: string,
    threshold: number = 0.7
  ): Promise<AdvancedSeedMatch | null> => {
    if (!userInput?.trim()) {
      return null;
    }

    setIsMatching(true);
    
    try {
      // First try exact keyword matching for speed
      const { data: keywordMatches, error: keywordError } = await supabase
        .from('emotion_seeds')
        .select('*')
        .or(`triggers.cs.{${userInput.toLowerCase()}},emotion.ilike.%${userInput.toLowerCase()}%`)
        .eq('active', true)
        .limit(5);

      if (keywordError) {
        console.warn('Keyword matching failed:', keywordError);
      }

      if (keywordMatches && keywordMatches.length > 0) {
        const bestMatch = keywordMatches[0];
        return {
          id: bestMatch.id,
          emotion: bestMatch.emotion,
          response: bestMatch.response_nl || bestMatch.response || '',
          confidence: 0.9, // High confidence for exact matches
          label: bestMatch.label as any,
          triggers: bestMatch.triggers || [],
          metadata: bestMatch.metadata || {}
        };
      }

      // If no exact matches and we have an API key, try vector similarity
      if (apiKey?.trim()) {
        try {
          const queryEmbedding = await generateEmbedding(userInput, apiKey);
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
            const embeddingString = `[${queryEmbedding.join(',')}]`;
            const { data: vectorMatches, error: vectorError } = await supabase.rpc(
              'search_unified_knowledge',
              {
                query_text: userInput,
                query_embedding: embeddingString,
                user_uuid: user.id,
                similarity_threshold: threshold,
                max_results: 3
              }
            );

            if (vectorError) {
              console.warn('Vector search failed:', vectorError);
            } else if (vectorMatches && vectorMatches.length > 0) {
              const bestMatch = vectorMatches[0];
              return {
                id: bestMatch.id,
                emotion: bestMatch.emotion,
                response: bestMatch.response_text || '',
                confidence: bestMatch.similarity_score,
                label: 'Valideren',
                triggers: bestMatch.triggers || [],
                metadata: bestMatch.metadata || {}
              };
            }
          }
        } catch (embeddingError) {
          console.warn('Vector embedding search failed:', embeddingError);
        }
      }

      return null;
    } catch (error) {
      console.error('Advanced seed matching failed:', error);
      return null;
    } finally {
      setIsMatching(false);
    }
  }, []);

  return {
    matchAdvancedSeed,
    isMatching
  };
}
