
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { incrementApiUsage } from '@/utils/apiUsageTracker';

export interface SimilarityResult {
  content_id: string;
  content_type: string;
  content_text: string;
  similarity_score: number;
  metadata?: any;
}

export function useVectorEmbeddings() {
  const [isSearching, setIsSearching] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const searchSimilarEmbeddings = async (
    query: string,
    apiKey: string,
    threshold: number = 0.7,
    maxResults: number = 5
  ): Promise<SimilarityResult[]> => {
    if (!query?.trim()) {
      console.log('⚠️ No query provided');
      return [];
    }

    setIsSearching(true);
    
    try {
      console.log('🔍 Searching vector embeddings for:', query.substring(0, 50));
      
      // Generate embedding for query via backend
      incrementApiUsage('vector');
      const { data, error } = await supabase.functions.invoke('openai-embedding', {
        body: { input: query, model: 'text-embedding-3-small' }
      });

      if (error) {
        console.error('❌ Embedding edge error:', error);
        return [];
      }

      const queryEmbedding = (data as any)?.embedding;
      if (!queryEmbedding) {
        console.error('❌ No embedding returned from edge function');
        return [];
      }

      // Search similar embeddings using Supabase function
      const { data: results, error: rpcError } = await supabase.rpc('find_similar_embeddings', {
        query_embedding: `[${(queryEmbedding as number[]).join(',')}]`,
        similarity_threshold: threshold,
        max_results: maxResults
      });

      if (rpcError) {
        console.error('❌ Supabase vector search error:', rpcError);
        return [];
      }

      console.log(`✅ Found ${results?.length || 0} vector matches`);
      return results || [];

    } catch (error) {
      console.error('🔴 Vector search error:', error);
      return [];
    } finally {
      setIsSearching(false);
    }
  };

  const processSeedBatch = async (
    seeds: any[],
    apiKey: string
  ): Promise<{ success: number; failed: number }> => {
    setIsProcessing(true);
    let success = 0;
    let failed = 0;

    try {
      for (const seed of seeds) {
        try {
          // Generate embedding for seed via backend
          incrementApiUsage('vector');
          const text = seed.response?.nl || seed.emotion;
          const { data, error } = await supabase.functions.invoke('openai-embedding', {
            body: { input: text, model: 'text-embedding-3-small' }
          });

          if (error) {
            console.error('❌ Embedding edge error for seed:', seed.id, error);
            failed++;
            continue;
          }

          const embedding = (data as any)?.embedding;
          if (!embedding) {
            console.error('❌ No embedding returned for seed:', seed.id);
            failed++;
            continue;
          }

          // Store in vector_embeddings table
          const { error: upsertError } = await supabase
            .from('vector_embeddings')
            .upsert({
              content_id: seed.id,
              content_type: 'seed',
              content_text: text,
              embedding: `[${(embedding as number[]).join(',')}]`,
              metadata: {
                emotion: seed.emotion,
                confidence: seed.meta?.confidence || 0.7
              }
            });

          if (upsertError) {
            console.error('❌ Failed to store embedding:', upsertError);
            failed++;
          } else {
            success++;
          }
        } catch (error) {
          console.error('❌ Failed to process seed:', seed.id, error);
          failed++;
        }
      }
    } finally {
      setIsProcessing(false);
    }

    return { success, failed };
  };

  return {
    searchSimilarEmbeddings,
    processSeedBatch,
    isSearching,
    isProcessing
  };
}
