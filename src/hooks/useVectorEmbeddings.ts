
export interface SimilarityResult {
  content_id: string;
  content_text: string;
  content_type: string;
  similarity_score: number;
}

export function useVectorEmbeddings() {
  // This hook provides types and utilities for vector embeddings
  // The actual embedding processing is handled by useEmbeddingProcessor
  
  const formatSimilarityResults = (results: any[]): SimilarityResult[] => {
    return results.map(result => ({
      content_id: result.id || result.content_id || 'unknown',
      content_text: result.text || result.content_text || '',
      content_type: result.type || result.content_type || 'unknown',
      similarity_score: typeof result.score === 'number' ? result.score : 0
    }));
  };

  return {
    formatSimilarityResults
  };
}
