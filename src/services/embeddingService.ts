
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

export const storeEmbedding = async (
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
      metadata: {
        ...metadata,
        embeddingModel: 'text-embedding-3-small', // Track which model was used
      },
    });

  if (error) {
    console.error('Error storing embedding:', error);
    throw error;
  }
};

export const findSimilar = async (
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
