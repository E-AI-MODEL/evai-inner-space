
import { useOptimizedEmbeddings } from './useOptimizedEmbeddings';

export function useEmbeddingProcessor() {
  const { storeOptimizedEmbedding, storeConversationEmbeddingOptimized, searchSimilar } = useOptimizedEmbeddings();

  const storeInputEmbedding = async (
    input: string,
    vectorApiKey: string,
    context: {
      userId?: string;
      conversationId?: string;
    }
  ): Promise<void> => {
    try {
      const wasStored = await storeOptimizedEmbedding(input, vectorApiKey, context);
      // Silent operation - no logging
    } catch (embeddingError) {
      // Silent failure
    }
  };

  const performNeuralSearch = async (
    input: string,
    vectorApiKey: string
  ): Promise<any[]> => {
    let similarities = [];
    
    try {
      if (!vectorApiKey?.trim() || !input || input.trim().length < 3) {
        return [];
      }
      
      // Enhanced search with better parameters
      similarities = await searchSimilar(input, vectorApiKey, 0.5, 10);
      
      // Silent success - no logging spam
      
    } catch (neuralError) {
      // Silent failure
    }
    
    return similarities || [];
  };

  const storeConversationEmbedding = async (
    messages: any[],
    vectorApiKey: string,
    conversationId: string
  ): Promise<void> => {
    try {
      if (!messages || messages.length === 0) {
        return;
      }
      
      const wasStored = await storeConversationEmbeddingOptimized(
        messages,
        vectorApiKey,
        conversationId
      );
      
      // Silent operation
    } catch (error) {
      // Silent failure
    }
  };

  return {
    storeInputEmbedding,
    performNeuralSearch,
    storeConversationEmbedding
  };
}
