
import { SimilarityResult } from './useVectorEmbeddings';

export interface NeuralMatch {
  similarity: SimilarityResult;
  relevanceScore: number;
  contextualFit: number;
}

export function useNeuralEvaluation() {
  const evaluateNeuralMatches = (similarities: SimilarityResult[]): NeuralMatch[] => {
    console.log('🧠 Starting neural evaluation...');
    
    if (!similarities || !Array.isArray(similarities) || similarities.length === 0) {
      console.log('🔍 No similarities to evaluate');
      return [];
    }

    const matches: NeuralMatch[] = [];

    for (const similarity of similarities) {
      try {
        const match = evaluateSingleSimilarity(similarity);
        if (match && match.contextualFit > 0.5) {
          matches.push(match);
        }
      } catch (error) {
        console.error('❌ Error evaluating similarity:', error);
      }
    }

    const sortedMatches = matches
      .sort((a, b) => b.contextualFit - a.contextualFit)
      .slice(0, 5);

    console.log(`🧠 Neural evaluation complete: ${sortedMatches.length} quality matches`);
    
    if (sortedMatches.length > 0) {
      console.log('📊 Top neural matches:');
      sortedMatches.slice(0, 3).forEach((match, index) => {
        console.log(`  ${index + 1}. Score: ${match.similarity.similarity_score?.toFixed(2)}, Fit: ${match.contextualFit.toFixed(2)}`);
      });
    }

    return sortedMatches;
  };

  const evaluateSingleSimilarity = (similarity: SimilarityResult): NeuralMatch | null => {
    if (!similarity || typeof similarity.similarity_score !== 'number') {
      return null;
    }

    // Calculate relevance score based on similarity score
    let relevanceScore = similarity.similarity_score;

    // Boost score for emotional content
    if (similarity.content_text) {
      const emotionalWords = [
        'feel', 'voelen', 'emotion', 'emotie', 'stress', 'angst', 'blij', 'verdrietig',
        'angry', 'boos', 'happy', 'gelukkig', 'sad', 'worried', 'bezorgd'
      ];
      
      const hasEmotionalContent = emotionalWords.some(word => 
        similarity.content_text.toLowerCase().includes(word)
      );
      
      if (hasEmotionalContent) {
        relevanceScore *= 1.2;
      }
    }

    // Calculate contextual fit (how well it fits therapeutic context)
    let contextualFit = relevanceScore;

    // Boost for therapeutic content
    if (similarity.content_type === 'therapeutic_response' || 
        similarity.content_type === 'seed_response') {
      contextualFit *= 1.3;
    }

    // Penalty for very short or very long content
    if (similarity.content_text) {
      const length = similarity.content_text.length;
      if (length < 20 || length > 500) {
        contextualFit *= 0.8;
      }
    }

    // Ensure scores are within bounds
    relevanceScore = Math.min(1, Math.max(0, relevanceScore));
    contextualFit = Math.min(1, Math.max(0, contextualFit));

    return {
      similarity,
      relevanceScore,
      contextualFit
    };
  };

  return {
    evaluateNeuralMatches
  };
}
