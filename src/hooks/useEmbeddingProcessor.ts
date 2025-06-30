
import { useState } from 'react';
import { SimilarityResult, useVectorEmbeddings } from './useVectorEmbeddings';

export function useEmbeddingProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { searchSimilarEmbeddings } = useVectorEmbeddings();

  const performNeuralSearch = async (
    query: string,
    vectorApiKey: string
  ): Promise<SimilarityResult[]> => {
    if (!query?.trim() || !vectorApiKey?.trim()) {
      console.log('🔍 Neural search skipped: missing query or API key');
      return [];
    }

    setIsProcessing(true);
    console.log('🧠 Starting neural search for:', query.substring(0, 50));

    try {
      const results = await searchSimilarEmbeddings(query, vectorApiKey);
      console.log(`✅ Neural search complete: ${results.length} similarities found`);
      return results;

    } catch (error) {
      console.error('🔴 Neural search error:', error);
      return [];
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    performNeuralSearch,
    isProcessing
  };
}
