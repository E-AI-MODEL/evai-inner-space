
import { SimilarityResult } from './useVectorEmbeddings';

export interface NeuralMatch {
  similarity: SimilarityResult;
  relevanceScore: number;
  contextualFit: number;
}

export function useNeuralEvaluation() {
  const evaluateNeuralMatches = (
    similarities: SimilarityResult[]
  ): NeuralMatch[] => {
    console.log('🧠 Evaluating neural matches...');
    console.log('🔍 Similarities to process:', similarities.length);

    const matches = similarities.map(similarity => {
      // Calculate relevance based on content type and metadata
      let relevanceScore = similarity.similarity_score;
      
      if (similarity.content_type === 'seed') relevanceScore *= 1.2;
      if (similarity.content_type === 'conversation') relevanceScore *= 0.9;
      
      // Context fit based on metadata
      const contextualFit = similarity.metadata?.emotional_context ? 1.1 : 1.0;
      
      const finalScore = contextualFit * relevanceScore;
      
      console.log(`🧠 Neural match: ${similarity.content_type}, score: ${similarity.similarity_score} → ${finalScore}`);
      
      return {
        similarity,
        relevanceScore,
        contextualFit: finalScore,
      };
    }).sort((a, b) => b.contextualFit - a.contextualFit);

    console.log('🏆 Top neural matches:', matches.slice(0, 3).map(m => ({
      type: m.similarity.content_type,
      score: m.similarity.similarity_score,
      finalScore: m.contextualFit
    })));

    return matches;
  };

  return {
    evaluateNeuralMatches,
  };
}
