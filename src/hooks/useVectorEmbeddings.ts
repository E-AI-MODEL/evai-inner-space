
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
      content_id: result.content_id || 'unknown',
      content_text: result.content_text || '',
      content_type: result.content_type || 'unknown',
      similarity_score: typeof result.similarity_score === 'number' ? result.similarity_score : 0
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

      // Store in both old format (for compatibility) and new unified format
      
      // Legacy vector_embeddings table
      const embeddingString = `[${embedding.join(',')}]`;
      await supabase.from('vector_embeddings').insert({
        content_id: contentId,
        content_type: contentType,
        content_text: contentText.substring(0, 2000),
        embedding: embeddingString,
        metadata: metadata || {},
        user_id: user?.id,
      });

      // New unified_knowledge table
      await supabase.from('unified_knowledge').insert({
        user_id: user?.id,
        content_type: 'embedding',
        emotion: metadata?.emotion || 'unknown',
        triggers: metadata?.triggers || [],
        response_text: contentText.substring(0, 2000),
        confidence_score: metadata?.confidence || 0.7,
        usage_count: 0,
        metadata: metadata || {},
        vector_embedding: embeddingString,
        active: true
      });

      console.log(`✅ Stored embedding for ${contentType}: ${contentId} (legacy + unified)`);
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
      
      // Search for similar embeddings using the unified knowledge function
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('🔍 No authenticated user for similarity search');
        return [];
      }

      const embeddingString = `[${queryEmbedding.join(',')}]`;
      const { data, error } = await supabase.rpc('search_unified_knowledge', {
        query_text: query,
        query_embedding: embeddingString,
        user_uuid: user.id,
        similarity_threshold: 0.7,
        max_results: limit
      });

      if (error) {
        console.error('❌ Vector search error:', error);
        return [];
      }

      // Convert unified results to legacy format for compatibility
      const legacyResults = (data || []).map((item: any) => ({
        content_id: item.id,
        content_text: item.response_text || '',
        content_type: item.content_type || 'embedding',
        similarity_score: item.similarity_score || 0
      }));

      return formatSimilarityResults(legacyResults);
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
        const embeddingString = `[${embedding.join(',')}]`;
        
        // Store in legacy format
        await supabase.from('vector_embeddings').insert({
          content_id: seed.id,
          content_type: 'seed',
          content_text: textToEmbed.substring(0, 2000),
          embedding: embeddingString,
          metadata: { 
            emotion: seed.emotion,
            type: seed.type,
            severity: seed.context.severity,
            triggers: seed.triggers
          },
          user_id: user?.id,
        });

        // Store in unified format
        await supabase.from('unified_knowledge').insert({
          user_id: user?.id,
          content_type: 'seed',
          emotion: seed.emotion,
          triggers: seed.triggers,
          response_text: seed.response.nl,
          confidence_score: seed.meta.confidence,
          usage_count: seed.meta.usageCount,
          metadata: { 
            type: seed.type,
            severity: seed.context.severity,
            label: seed.label,
            originalId: seed.id
          },
          vector_embedding: embeddingString,
          active: seed.isActive
        });
        
        successCount++;
        console.log(`✅ Processed seed embedding: ${seed.emotion} (${seed.id}) - both formats`);
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
