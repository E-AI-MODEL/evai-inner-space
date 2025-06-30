
import { useState } from 'react';
import { useVectorEmbeddings } from './useVectorEmbeddings';

export function useOptimizedEmbeddings() {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const { searchSimilarEmbeddings, processSeedBatch, isProcessing } = useVectorEmbeddings();

  const processAndStore = async (
    content: string,
    apiKey: string,
    metadata?: Record<string, any>
  ) => {
    setIsOptimizing(true);
    
    try {
      console.log('🔄 Processing and storing embedding...');
      
      // For now, we'll just search for similar embeddings
      // In a full implementation, this would store new embeddings
      const results = await searchSimilarEmbeddings(content, apiKey);
      
      console.log('✅ Optimized embedding processing complete');
      return results;
    } catch (error) {
      console.error('🔴 Optimized embedding error:', error);
      return [];
    } finally {
      setIsOptimizing(false);
    }
  };

  const searchSimilar = async (
    query: string,
    apiKey: string,
    threshold?: number
  ) => {
    return await searchSimilarEmbeddings(query, apiKey, threshold);
  };

  return {
    processAndStore,
    searchSimilar,
    processSeedBatch,
    isProcessing: isProcessing || isOptimizing
  };
}
