import { useState, useRef } from 'react';
import { useVectorEmbeddings } from './useVectorEmbeddings';
import { Message } from '../types';

interface EmbeddingConfig {
  enabled: boolean;
  throttleMs: number;
  minInputLength: number;
  maxDailyEmbeddings: number;
  skipSimilar: boolean;
}

const DEFAULT_CONFIG: EmbeddingConfig = {
  enabled: true,
  throttleMs: 5000, // 5 seconds between embeddings
  minInputLength: 20, // Minimum input length to create embedding
  maxDailyEmbeddings: 100, // Daily limit
  skipSimilar: true // Skip if very similar content was recently processed
};

export function useOptimizedEmbeddings() {
  const [config, setConfig] = useState<EmbeddingConfig>(DEFAULT_CONFIG);
  const [dailyCount, setDailyCount] = useState(0);
  const lastEmbeddingTime = useRef<number>(0);
  const recentInputs = useRef<string[]>([]);
  const { processAndStore, searchSimilar, isProcessing } = useVectorEmbeddings();

  // Check if we should create an embedding based on smart triggers
  const shouldCreateEmbedding = (input: string): boolean => {
    if (!config.enabled) return false;
    
    // Check daily limit
    if (dailyCount >= config.maxDailyEmbeddings) {
      console.log('📊 Daily embedding limit reached, skipping');
      return false;
    }

    // Check minimum length
    if (input.length < config.minInputLength) {
      console.log('📏 Input too short for embedding, skipping');
      return false;
    }

    // Check throttling
    const now = Date.now();
    if (now - lastEmbeddingTime.current < config.throttleMs) {
      console.log('⏱️ Throttling embedding creation, skipping');
      return false;
    }

    // Check for similar recent inputs
    if (config.skipSimilar) {
      const similarity = checkInputSimilarity(input);
      if (similarity > 0.8) {
        console.log('🔄 Similar input recently processed, skipping');
        return false;
      }
    }

    return true;
  };

  // Simple similarity check for recent inputs
  const checkInputSimilarity = (input: string): number => {
    if (recentInputs.current.length === 0) return 0;
    
    const inputWords = input.toLowerCase().split(/\s+/);
    let maxSimilarity = 0;

    for (const recentInput of recentInputs.current) {
      const recentWords = recentInput.toLowerCase().split(/\s+/);
      const commonWords = inputWords.filter(word => recentWords.includes(word));
      const similarity = commonWords.length / Math.max(inputWords.length, recentWords.length);
      maxSimilarity = Math.max(maxSimilarity, similarity);
    }

    return maxSimilarity;
  };

  // Optimized embedding storage
  const storeOptimizedEmbedding = async (
    input: string,
    vectorApiKey: string,
    context: {
      userId?: string;
      conversationId?: string;
    }
  ): Promise<boolean> => {
    if (!shouldCreateEmbedding(input)) {
      return false;
    }

    try {
      console.log('💾 Creating optimized embedding for input...');
      const inputId = crypto.randomUUID();
      
      await processAndStore(
        inputId,
        'message',
        input,
        vectorApiKey,
        {
          type: 'user_input_optimized',
          userId: context.userId,
          conversationId: context.conversationId || crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          optimized: true,
        }
      );

      // Update tracking
      lastEmbeddingTime.current = Date.now();
      setDailyCount(prev => prev + 1);
      
      // Keep recent inputs for similarity checking (last 5)
      recentInputs.current = [input, ...recentInputs.current.slice(0, 4)];
      
      console.log('✅ Optimized embedding created successfully');
      return true;
    } catch (error) {
      console.error('⚠️ Failed to create optimized embedding:', error);
      return false;
    }
  };

  // Smart conversation embedding (only for significant conversations)
  const storeConversationEmbeddingOptimized = async (
    messages: Message[],
    vectorApiKey: string,
    conversationId: string
  ): Promise<boolean> => {
    // Only create conversation embeddings for substantial conversations
    if (messages.length < 6) {
      console.log('📊 Conversation too short for embedding, skipping');
      return false;
    }

    // Check if conversation has emotional content or significant interaction
    const hasEmotionalContent = messages.some(m => m.emotionSeed || m.label);
    const hasUserEngagement = messages.filter(m => m.from === 'user').length > 2;
    
    if (!hasEmotionalContent && !hasUserEngagement) {
      console.log('📊 Conversation lacks significant content for embedding, skipping');
      return false;
    }

    if (!shouldCreateEmbedding(`conversation-${conversationId}`)) {
      return false;
    }

    try {
      const conversationText = messages
        .slice(-8) // Last 8 messages for context
        .map(m => `${m.from}: ${m.content}`)
        .join('\n');

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
          optimized: true,
          hasEmotionalContent,
          userEngagementLevel: messages.filter(m => m.from === 'user').length
        }
      );

      lastEmbeddingTime.current = Date.now();
      setDailyCount(prev => prev + 1);
      
      console.log('✅ Optimized conversation embedding stored');
      return true;
    } catch (error) {
      console.error('⚠️ Failed to store optimized conversation embedding:', error);
      return false;
    }
  };

  // Update configuration
  const updateConfig = (newConfig: Partial<EmbeddingConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
    console.log('⚙️ Embedding configuration updated:', newConfig);
  };

  // Reset daily counter (call this daily or on app start)
  const resetDailyCount = () => {
    setDailyCount(0);
    console.log('🔄 Daily embedding count reset');
  };

  return {
    storeOptimizedEmbedding,
    storeConversationEmbeddingOptimized,
    searchSimilar,
    updateConfig,
    resetDailyCount,
    config,
    dailyCount,
    isProcessing,
    maxDailyEmbeddings: config.maxDailyEmbeddings,
    embeddingsRemaining: config.maxDailyEmbeddings - dailyCount
  };
}
