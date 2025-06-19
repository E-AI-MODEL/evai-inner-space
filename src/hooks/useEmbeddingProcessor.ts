
import { useVectorEmbeddings } from './useVectorEmbeddings';

export function useEmbeddingProcessor() {
  const { searchSimilar, processAndStore } = useVectorEmbeddings();

  const storeInputEmbedding = async (
    input: string,
    vectorApiKey: string,
    context: {
      userId?: string;
      conversationId?: string;
    }
  ): Promise<void> => {
    try {
      console.log('💾 Storing input embedding...');
      const inputId = crypto.randomUUID();
      
      await processAndStore(
        inputId,
        'message',
        input,
        vectorApiKey,
        {
          type: 'user_input',
          userId: context.userId,
          conversationId: context.conversationId || crypto.randomUUID(),
          timestamp: new Date().toISOString(),
        }
      );
      console.log('✅ Input embedding stored successfully');
    } catch (embeddingError) {
      console.error('⚠️ Failed to store input embedding:', embeddingError);
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
      const conversationText = messages
        .slice(-6) // Last 6 messages for context
        .map(m => `${m.from}: ${m.content}`)
        .join('\n');

      // Use proper UUID for conversation ID
      const properConversationId = conversationId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) 
        ? conversationId 
        : crypto.randomUUID();

      await processAndStore(
        properConversationId,
        'conversation',
        conversationText,
        vectorApiKey,
        {
          messageCount: messages.length,
          lastTimestamp: messages[messages.length - 1]?.timestamp,
          dominantEmotions: messages
            .filter(m => m.emotionSeed)
            .map(m => m.emotionSeed)
            .slice(-3),
        }
      );
      
      console.log('✅ Conversation embedding stored');
    } catch (error) {
      console.error('⚠️ Failed to store conversation embedding:', error);
    }
  };

  return {
    storeInputEmbedding,
    performNeuralSearch,
    storeConversationEmbedding
  };
}
