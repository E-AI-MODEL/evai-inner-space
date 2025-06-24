
import { useState } from 'react';
import { generateEmbedding } from '../lib/embeddingUtils';
import { supabase } from '@/integrations/supabase/client';
import { AdvancedSeed } from '../types/seed';

export interface SimilarityResult {
  content_id: string;
  content_text: string;
  content_type: string;
  similarity_score: number;
}

export function useVectorEmbeddings() {
  const [isProcessing, setIsProcessing] = useState(false);

  const formatSimilarityResults = (results: any[]): SimilarityResult[] => {
    return results.map(result => ({
      content_id: result.id || result.content_id || 'unknown',
      content_text: result.text || result.content_text || '',
      content_type: result.type || result.content_type || 'unknown',
      similarity_score: typeof result.score === 'number' ? result.score : 0
    }));
  };

  const processAndStore = async (
    contentId: string,
    contentType: string,
    contentText: string,
    apiKey: string,
    metadata?: Record<string, any>
  ): Promise<void> => {
    if (!apiKey || !contentText?.trim()) {
      throw new Error('API key and content text are required');
    }

    setIsProcessing(true);
    try {
      const embedding = await generateEmbedding(contentText, apiKey);
      const { data: { user } } = await supabase.auth.getUser();

      await supabase.from('vector_embeddings').insert({
        content_id: contentId,
        content_type: contentType,
        content_text: contentText.substring(0, 2000),
        embedding: `[${embedding.join(',')}]`,
        metadata: metadata || {},
        user_id: user?.id,
      });

      console.log(`✅ Stored embedding for ${contentType}: ${contentId}`);
    } catch (error) {
      console.error('❌ Failed to process and store embedding:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const searchSimilar = async (
    query: string,
    apiKey: string,
    limit: number = 5
  ): Promise<SimilarityResult[]> => {
    if (!query?.trim() || !apiKey?.trim()) {
      console.log('🔍 Search skipped: missing query or API key');
      return [];
    }

    setIsProcessing(true);
    try {
      // Generate embedding for query
      const queryEmbedding = await generateEmbedding(query, apiKey);
      
      // Search for similar embeddings using Supabase's vector similarity
      const { data, error } = await supabase.rpc('match_embeddings', {
        query_embedding: queryEmbedding,
        match_threshold: 0.7,
        match_count: limit
      });

      if (error) {
        console.error('❌ Vector search error:', error);
        return [];
      }

      return formatSimilarityResults(data || []);
    } catch (error) {
      console.error('❌ Failed to search similar embeddings:', error);
      return [];
    } finally {
      setIsProcessing(false);
    }
  };

  const processSeedBatch = async (
    seeds: AdvancedSeed[],
    apiKey: string
  ): Promise<{ success: number; failed: number }> => {
    if (!apiKey) {
      console.error('API key is required for batch processing.');
      return { success: 0, failed: seeds.length };
    }

    setIsProcessing(true);
    let successCount = 0;
    let failedCount = 0;

    const { data: { user } } = await supabase.auth.getUser();

    for (const seed of seeds) {
      try {
        const textToEmbed = `Emotie: ${seed.emotion}. Triggers: ${seed.triggers.join(', ')}. Response: ${seed.response.nl}`;
        
        const embedding = await generateEmbedding(textToEmbed, apiKey);
        
        await supabase.from('vector_embeddings').insert({
          content_id: seed.id,
          content_type: 'seed',
          content_text: textToEmbed.substring(0, 2000),
          embedding: `[${embedding.join(',')}]`,
          metadata: { 
            emotion: seed.emotion,
            type: seed.type,
            severity: seed.context.severity,
          },
          user_id: user?.id,
        });
        
        successCount++;
        console.log(`✅ Processed seed embedding: ${seed.emotion} (${seed.id})`);
      } catch (error) {
        console.error(`Failed to process seed ${seed.id} (${seed.emotion}):`, error);
        failedCount++;
      }
    }

    setIsProcessing(false);
    console.log(`🎯 Batch processing complete: ${successCount} success, ${failedCount} failed`);
    return { success: successCount, failed: failedCount };
  };

  return {
    formatSimilarityResults,
    processAndStore,
    searchSimilar,
    processSeedBatch,
    isProcessing
  };
}
