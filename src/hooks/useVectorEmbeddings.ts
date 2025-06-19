import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface VectorEmbedding {
  id: string;
  content_id: string;
  content_type: 'seed' | 'message' | 'conversation';
  content_text: string;
  embedding?: number[];
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface SimilarityResult {
  content_id: string;
  content_type: string;
  content_text: string;
  similarity_score: number;
  metadata: Record<string, any>;
}

export function useVectorEmbeddings() {
  const [isProcessing, setIsProcessing] = useState(false);

  const generateEmbedding = async (text: string, apiKey: string): Promise<number[]> => {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-ada-002',
        input: text.substring(0, 8000), // Limit input length
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI Embedding API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  };

  const storeEmbedding = async (
    content_id: string,
    content_type: 'seed' | 'message' | 'conversation',
    content_text: string,
    embedding: number[],
    metadata: Record<string, any> = {}
  ): Promise<void> => {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('vector_embeddings')
      .insert({
        user_id: user?.id,
        content_id,
        content_type,
        content_text: content_text.substring(0, 2000), // Limit text length for storage
        embedding: `[${embedding.join(',')}]`, // Store as text representation
        metadata,
      });

    if (error) {
      console.error('Error storing embedding:', error);
      throw error;
    }
  };

  const findSimilar = async (
    queryEmbedding: number[],
    threshold: number = 0.7,
    maxResults: number = 10
  ): Promise<SimilarityResult[]> => {
    try {
      const { data, error } = await supabase.rpc('find_similar_embeddings', {
        query_embedding: `[${queryEmbedding.join(',')}]`,
        similarity_threshold: threshold,
        max_results: maxResults,
      });

      if (error) {
        console.error('Error finding similar embeddings:', error);
        return [];
      }

      // Cast the metadata from Json to Record<string, any>
      return (data || []).map(item => ({
        ...item,
        metadata: (item.metadata as Record<string, any>) || {},
      }));
    } catch (error) {
      console.error('Vector similarity search failed:', error);
      return [];
    }
  };

  const processAndStore = async (
    content_id: string,
    content_type: 'seed' | 'message' | 'conversation',
    content_text: string,
    apiKey: string,
    metadata: Record<string, any> = {}
  ): Promise<void> => {
    setIsProcessing(true);
    try {
      console.log(`🧠 Generating embedding for ${content_type}:`, content_text.substring(0, 100));
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
      console.log('🔍 Searching for similar content:', queryText.substring(0, 100));
      const queryEmbedding = await generateEmbedding(queryText, apiKey);
      const results = await findSimilar(queryEmbedding, threshold, maxResults);
      console.log(`✅ Found ${results.length} similar items`);
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
    isProcessing,
  };
}
