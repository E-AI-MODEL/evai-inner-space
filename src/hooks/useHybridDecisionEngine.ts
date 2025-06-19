
import { useState } from 'react';
import { AdvancedSeed } from '../types/seed';
import { SimilarityResult } from './useVectorEmbeddings';
import { useSymbolicMatching, SymbolicMatch } from './useSymbolicMatching';
import { useNeuralEvaluation, NeuralMatch } from './useNeuralEvaluation';
import { useDecisionMaking, HybridDecision } from './useDecisionMaking';

export type { SymbolicMatch, NeuralMatch, HybridDecision };

export function useHybridDecisionEngine() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { evaluateSymbolicMatches } = useSymbolicMatching();
  const { evaluateNeuralMatches } = useNeuralEvaluation();
  const { makeHybridDecision } = useDecisionMaking();

  const processHybridDecision = async (
    input: string,
    seeds: AdvancedSeed[],
    similarities: SimilarityResult[],
    context: Record<string, any> = {}
  ): Promise<HybridDecision> => {
    setIsProcessing(true);
    try {
      console.log('🚀 Starting hybrid decision process...');
      console.log('📊 Input stats:', {
        inputLength: input.length,
        seedsCount: seeds.length,
        similaritiesCount: similarities.length
      });

      const symbolicMatches = evaluateSymbolicMatches(input, seeds);
      const neuralMatches = evaluateNeuralMatches(similarities);
      
      console.log('📈 Match summary:', {
        symbolicMatches: symbolicMatches.length,
        neuralMatches: neuralMatches.length,
        topSymbolic: symbolicMatches[0]?.score || 0,
        topNeural: neuralMatches[0]?.contextualFit || 0
      });

      return await makeHybridDecision(input, symbolicMatches, neuralMatches, context);
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processHybridDecision,
    evaluateSymbolicMatches,
    evaluateNeuralMatches,
    makeHybridDecision,
    isProcessing,
  };
}
