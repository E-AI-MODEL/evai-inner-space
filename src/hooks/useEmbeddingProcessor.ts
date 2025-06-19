
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
      console.log('💾 Attempting to store optimized input embedding...');
      
      const wasStored = await storeOptimizedEmbedding(input, vectorApiKey, context);
      
      if (wasStored) {
        console.log('✅ Optimized input embedding stored successfully');
      } else {
        console.log('⏭️ Input embedding skipped due to optimization rules');
      }
    } catch (embeddingError) {
      console.error('⚠️ Failed to store optimized input embedding:', embeddingError);
    }
  };

  const performNeuralSearch = async (
    input: string,
    vectorApiKey: string
  ): Promise<any[]> => {
    console.log('🧠 Performing neural similarity search...');
    let similarities = [];
    
    try {
      if (vectorApiKey?.trim()) {
        similarities = await searchSimilar(input, vectorApiKey, 0.6, 8);
        console.log(`🎯 Found ${similarities.length} neural similarities`);
      }
    } catch (neuralError) {
      console.error('⚠️ Neural search failed:', neuralError);
    }
    
    return similarities;
  };

  const storeConversationEmbedding = async (
    messages: any[],
    vectorApiKey: string,
    conversationId: string
  ): Promise<void> => {
    try {
      console.log('💾 Attempting to store optimized conversation embedding...');
      
      const wasStored = await storeConversationEmbeddingOptimized(
        messages,
        vectorApiKey,
        conversationId
      );
      
      if (wasStored) {
        console.log('✅ Optimized conversation embedding stored successfully');
      } else {
        console.log('⏭️ Conversation embedding skipped due to optimization rules');
      }
    } catch (error) {
      console.error('⚠️ Failed to store optimized conversation embedding:', error);
    }
  };

  return {
    storeInputEmbedding,
    performNeuralSearch,
    storeConversationEmbedding
  };
}
