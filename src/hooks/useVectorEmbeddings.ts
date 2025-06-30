
import { useState } from 'react';

export interface SimilarityResult {
  content_id: string;
  content_type: string;
  content_text: string;
  similarity_score: number;
  metadata?: any;
}

export function useVectorEmbeddings() {
  const [isSearching, setIsSearching] = useState(false);

  const searchSimilarEmbeddings = async (
    query: string,
    apiKey: string,
    threshold: number = 0.7,
    maxResults: number = 5
  ): Promise<SimilarityResult[]> => {
    if (!apiKey?.trim()) {
      console.log('⚠️ No vector API key provided');
      return [];
    }

    setIsSearching(true);
    
    try {
      console.log('🔍 Searching vector embeddings for:', query.substring(0, 50));
      
      // Generate embedding for query
      const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: query,
          model: 'text-embedding-3-small'
        })
      });

      if (!embeddingResponse.ok) {
        throw new Error(`Embedding API error: ${embeddingResponse.status}`);
      }

      const embeddingData = await embeddingResponse.json();
      const queryEmbedding = embeddingData.data[0].embedding;

      // Search similar embeddings in database (mock implementation)
      // In real implementation, this would call Supabase function
      const mockResults: SimilarityResult[] = [
        {
          content_id: 'mock-1',
          content_type: 'therapeutic_response',
          content_text: 'Ik begrijp dat je je overweldigd voelt door alles wat er gebeurt.',
          similarity_score: 0.85,
          metadata: { emotion: 'overweldiging' }
        },
        {
          content_id: 'mock-2', 
          content_type: 'seed_response',
          content_text: 'Het is normaal om je zo te voelen in deze situatie.',
          similarity_score: 0.78,
          metadata: { emotion: 'validatie' }
        }
      ];

      console.log(`✅ Found ${mockResults.length} vector matches`);
      return mockResults.filter(r => r.similarity_score >= threshold).slice(0, maxResults);

    } catch (error) {
      console.error('🔴 Vector search error:', error);
      return [];
    } finally {
      setIsSearching(false);
    }
  };

  return {
    searchSimilarEmbeddings,
    isSearching
  };
}
