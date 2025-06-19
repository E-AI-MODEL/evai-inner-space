
import { useState } from 'react';
import { generateEmbedding } from '../lib/embeddingUtils';
import { storeEmbedding, findSimilar } from '../services/embeddingService';
import type { VectorEmbedding, SimilarityResult } from '../services/embeddingService';
import { useSeedBatchProcessor } from './useSeedBatchProcessor';

export type { VectorEmbedding, SimilarityResult };

export function useVectorEmbeddings() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { processSeedBatch, isProcessing: isBatchProcessing } = useSeedBatchProcessor();

  const processAndStore = async (
    content_id: string,
    content_type: 'seed' | 'message' | 'conversation',
    content_text: string,
    apiKey: string,
    metadata: Record<string, any> = {}
  ): Promise<void> => {
    setIsProcessing(true);
    try {
      console.log(`🧠 Generating embedding for ${content_type} using text-embedding-3-small:`, content_text.substring(0, 100));
      const embedding = await generateEmbedding(content_text, apiKey);
      await storeEmbedding(content_id, content_type, content_text, embedding, metadata);
      console.log(`✅ Embedding stored for ${content_type}: ${content_id}`);
    } catch (error) {
      console.error(`❌ Failed to process embedding for ${content_type}:`, error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const searchSimilar = async (
    queryText: string,
    apiKey: string,
    threshold: number = 0.7,
    maxResults: number = 5
  ): Promise<SimilarityResult[]> => {
    setIsProcessing(true);
    try {
      console.log('🔍 Searching for similar content using text-embedding-3-small:', queryText.substring(0, 100));
      const queryEmbedding = await generateEmbedding(queryText, apiKey);
      const results = await findSimilar(queryEmbedding, threshold, maxResults);
      console.log(`✅ Found ${results.length} similar items using vector search`);
      return results;
    } catch (error) {
      console.error('❌ Similarity search failed:', error);
      return [];
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processAndStore,
    searchSimilar,
    generateEmbedding,
    findSimilar,
    isProcessing: isProcessing || isBatchProcessing,
    processSeedBatch,
  };
}
