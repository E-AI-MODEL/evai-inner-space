
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
      console.log('💾 Storing optimized input embedding...');
      console.log(`📝 Input length: ${input.length} chars`);
      
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
    console.log('🧠 Performing enhanced neural similarity search...');
    console.log(`🔍 Search query: "${input.substring(0, 100)}${input.length > 100 ? '...' : ''}"`);
    
    let similarities = [];
    
    try {
      if (!vectorApiKey?.trim()) {
        console.warn('⚠️ No vector API key provided for neural search');
        return [];
      }

      if (!input || input.trim().length < 3) {
        console.warn('⚠️ Input too short for meaningful neural search');
        return [];
      }
      
      // Enhanced search with better parameters
      similarities = await searchSimilar(input, vectorApiKey, 0.5, 10); // Lower threshold, more results
      
      console.log(`🎯 Neural search results: ${similarities.length} matches found`);
      
      if (similarities.length > 0) {
        console.log('🔍 Top neural matches:', similarities.slice(0, 3).map(sim => ({
          type: sim.content_type,
          similarity: sim.similarity_score?.toFixed(3) || 'N/A',
          preview: sim.content_text?.substring(0, 50) || 'No content'
        })));
      } else {
        console.log('🔍 No neural matches found - this may indicate:');
        console.log('  • Limited embedding data in database');
        console.log('  • Search threshold too high');
        console.log('  • Input doesn\'t match existing content patterns');
      }
      
    } catch (neuralError) {
      console.error('❌ Neural search failed:', neuralError);
      console.error('🔧 Neural search error details:', {
        errorMessage: neuralError.message,
        hasApiKey: !!vectorApiKey,
        inputLength: input.length
      });
    }
    
    return similarities || [];
  };

  const storeConversationEmbedding = async (
    messages: any[],
    vectorApiKey: string,
    conversationId: string
  ): Promise<void> => {
    try {
      console.log('💾 Storing optimized conversation embedding...');
      console.log(`💬 Messages to process: ${messages.length}`);
      
      if (!messages || messages.length === 0) {
        console.log('⏭️ No messages to store');
        return;
      }
      
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
