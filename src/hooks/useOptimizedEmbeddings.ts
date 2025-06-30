
import { useState } from 'react';
import { useVectorEmbeddings } from './useVectorEmbeddings';

interface EmbeddingConfig {
  enabled: boolean;
  throttleMs: number;
  minInputLength: number;
  maxDailyEmbeddings: number;
  skipSimilar: boolean;
}

export function useOptimizedEmbeddings() {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [config, setConfig] = useState<EmbeddingConfig>({
    enabled: true,
    throttleMs: 5000,
    minInputLength: 10,
    maxDailyEmbeddings: 100,
    skipSimilar: true
  });
  const [dailyCount, setDailyCount] = useState(0);
  
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

  const updateConfig = (newConfig: EmbeddingConfig) => {
    setConfig(newConfig);
  };

  const resetDailyCount = () => {
    setDailyCount(0);
  };

  const embeddingsRemaining = config.maxDailyEmbeddings - dailyCount;

  return {
    processAndStore,
    searchSimilar,
    processSeedBatch,
    isProcessing: isProcessing || isOptimizing,
    config,
    updateConfig,
    dailyCount,
    maxDailyEmbeddings: config.maxDailyEmbeddings,
    embeddingsRemaining,
    resetDailyCount
  };
}
