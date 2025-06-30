
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
    if (!apiKey?.trim()) {
      console.log('⚠️ No vector API key provided');
      return [];
    }

    setIsSearching(true);
    
    try {
      console.log('🔍 Searching vector embeddings for:', query.substring(0, 50));
      
      // Generate embedding for query
      incrementApiUsage('vector');
      const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: query,
          model: 'text-embedding-3-small'
        })
      });

      if (!embeddingResponse.ok) {
        throw new Error(`Embedding API error: ${embeddingResponse.status}`);
      }

      const embeddingData = await embeddingResponse.json();
      const queryEmbedding = embeddingData.data[0].embedding;

      // Search similar embeddings using Supabase function
      const { data, error } = await supabase.rpc('find_similar_embeddings', {
        query_embedding: `[${queryEmbedding.join(',')}]`,
        similarity_threshold: threshold,
        max_results: maxResults
      });

      if (error) {
        console.error('❌ Supabase vector search error:', error);
        return [];
      }

      console.log(`✅ Found ${data?.length || 0} vector matches`);
      return data || [];

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
          // Generate embedding for seed
          incrementApiUsage('vector');
          const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              input: seed.response?.nl || seed.emotion,
              model: 'text-embedding-3-small'
            })
          });

          if (!embeddingResponse.ok) {
            throw new Error(`Embedding API error: ${embeddingResponse.status}`);
          }

          const embeddingData = await embeddingResponse.json();
          const embedding = embeddingData.data[0].embedding;

          // Store in vector_embeddings table
          const { error } = await supabase
            .from('vector_embeddings')
            .upsert({
              content_id: seed.id,
              content_type: 'seed',
              content_text: seed.response?.nl || seed.emotion,
              embedding: `[${embedding.join(',')}]`,
              metadata: {
                emotion: seed.emotion,
                confidence: seed.meta?.confidence || 0.7
              }
            });

          if (error) {
            console.error('❌ Failed to store embedding:', error);
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
