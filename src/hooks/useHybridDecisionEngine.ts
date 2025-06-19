import { useState } from 'react';
import { AdvancedSeed } from '../types/seed';
import { SimilarityResult } from './useVectorEmbeddings';
import { supabase } from '@/integrations/supabase/client';

export interface SymbolicMatch {
  seed: AdvancedSeed;
  score: number;
  triggers: string[];
  confidence: number;
}

export interface NeuralMatch {
  similarity: SimilarityResult;
  relevanceScore: number;
  contextualFit: number;
}

export interface HybridDecision {
  selectedResponse: string;
  responseType: 'symbolic' | 'neural' | 'hybrid' | 'generated';
  confidence: number;
  reasoning: string;
  symbolicContribution: number;
  neuralContribution: number;
  seed?: AdvancedSeed;
  metadata: Record<string, any>;
}

export function useHybridDecisionEngine() {
  const [isProcessing, setIsProcessing] = useState(false);

  const evaluateSymbolicMatches = (
    input: string,
    seeds: AdvancedSeed[]
  ): SymbolicMatch[] => {
    const normalizedInput = input.toLowerCase();
    const matches: SymbolicMatch[] = [];

    for (const seed of seeds) {
      if (!seed.isActive) continue;

      let score = 0;
      const matchedTriggers: string[] = [];

      // Check trigger matches
      for (const trigger of seed.triggers) {
        if (normalizedInput.includes(trigger.toLowerCase())) {
          matchedTriggers.push(trigger);
          score += 10 * seed.meta.weight;
        }
      }

      if (matchedTriggers.length === 0) continue;

      // Context bonuses
      if (seed.context.severity === 'high' && normalizedInput.includes('help')) score += 5;
      if (seed.context.severity === 'critical' && 
          (normalizedInput.includes('crisis') || normalizedInput.includes('emergency'))) score += 10;

      // Usage penalties
      if (seed.meta.usageCount > 3) score *= 0.8;
      if (seed.meta.lastUsed) {
        const hoursSince = (Date.now() - new Date(seed.meta.lastUsed).getTime()) / (1000 * 60 * 60);
        if (hoursSince < 1) score *= 0.5; // Recent usage penalty
      }

      const confidence = Math.min(0.95, Math.max(0.1, 
        (matchedTriggers.length * 0.3) + (seed.meta.confidence || 0.5)
      ));

      matches.push({
        seed,
        score,
        triggers: matchedTriggers,
        confidence,
      });
    }

    return matches.sort((a, b) => b.score - a.score).slice(0, 5);
  };

  const evaluateNeuralMatches = (
    similarities: SimilarityResult[]
  ): NeuralMatch[] => {
    return similarities.map(similarity => {
      // Calculate relevance based on content type and metadata
      let relevanceScore = similarity.similarity_score;
      
      if (similarity.content_type === 'seed') relevanceScore *= 1.2;
      if (similarity.content_type === 'conversation') relevanceScore *= 0.9;
      
      // Context fit based on metadata
      const contextualFit = similarity.metadata.emotional_context ? 1.1 : 1.0;
      
      return {
        similarity,
        relevanceScore,
        contextualFit: contextualFit * relevanceScore,
      };
    }).sort((a, b) => b.contextualFit - a.contextualFit);
  };

  const makeHybridDecision = async (
    input: string,
    symbolicMatches: SymbolicMatch[],
    neuralMatches: NeuralMatch[],
    context: Record<string, any> = {}
  ): Promise<HybridDecision> => {
    console.log('🧠 Making hybrid decision...');
    console.log(`Symbolic matches: ${symbolicMatches.length}, Neural matches: ${neuralMatches.length}`);

    let decision: HybridDecision;
    const startTime = Date.now();

    // Decision algorithm
    const topSymbolic = symbolicMatches[0];
    const topNeural = neuralMatches[0];

    if (!topSymbolic && !topNeural) {
      // No matches - generate new response
      decision = {
        selectedResponse: 'Ik begrijp je en wil graag helpen. Kun je me meer vertellen over hoe je je voelt?',
        responseType: 'generated',
        confidence: 0.3,
        reasoning: 'No symbolic or neural matches found - using generated fallback',
        symbolicContribution: 0,
        neuralContribution: 0,
        metadata: { fallback: true },
      };
    } else if (topSymbolic && (!topNeural || topSymbolic.confidence > 0.8)) {
      // Strong symbolic match
      decision = {
        selectedResponse: topSymbolic.seed.response.nl,
        responseType: 'symbolic',
        confidence: topSymbolic.confidence,
        reasoning: `Strong symbolic match: ${topSymbolic.triggers.join(', ')}`,
        symbolicContribution: 1.0,
        neuralContribution: 0,
        seed: topSymbolic.seed,
        metadata: { 
          matchedTriggers: topSymbolic.triggers,
          seedId: topSymbolic.seed.id,
        },
      };
    } else if (topNeural && topNeural.contextualFit > 0.8) {
      // Strong neural match
      decision = {
        selectedResponse: topNeural.similarity.content_text,
        responseType: 'neural',
        confidence: topNeural.contextualFit,
        reasoning: `Strong neural similarity: ${topNeural.similarity.similarity_score.toFixed(2)}`,
        symbolicContribution: 0,
        neuralContribution: 1.0,
        metadata: {
          similarityScore: topNeural.similarity.similarity_score,
          sourceType: topNeural.similarity.content_type,
        },
      };
    } else if (topSymbolic && topNeural) {
      // Hybrid decision
      const symbolicWeight = topSymbolic.confidence * 0.6;
      const neuralWeight = topNeural.contextualFit * 0.4;
      
      if (symbolicWeight > neuralWeight) {
        decision = {
          selectedResponse: topSymbolic.seed.response.nl,
          responseType: 'hybrid',
          confidence: (symbolicWeight + neuralWeight) / 2,
          reasoning: `Hybrid decision favoring symbolic (${symbolicWeight.toFixed(2)} vs ${neuralWeight.toFixed(2)})`,
          symbolicContribution: symbolicWeight / (symbolicWeight + neuralWeight),
          neuralContribution: neuralWeight / (symbolicWeight + neuralWeight),
          seed: topSymbolic.seed,
          metadata: {
            hybridWeights: { symbolic: symbolicWeight, neural: neuralWeight },
            secondarySource: topNeural.similarity.content_type,
          },
        };
      } else {
        decision = {
          selectedResponse: topNeural.similarity.content_text,
          responseType: 'hybrid',
          confidence: (symbolicWeight + neuralWeight) / 2,
          reasoning: `Hybrid decision favoring neural (${neuralWeight.toFixed(2)} vs ${symbolicWeight.toFixed(2)})`,
          symbolicContribution: symbolicWeight / (symbolicWeight + neuralWeight),
          neuralContribution: neuralWeight / (symbolicWeight + neuralWeight),
          metadata: {
            hybridWeights: { symbolic: symbolicWeight, neural: neuralWeight },
            fallbackSeed: topSymbolic.seed.id,
          },
        };
      }
    } else {
      // Fallback to best available
      const bestMatch = topSymbolic || { seed: null, confidence: 0.2 };
      decision = {
        selectedResponse: bestMatch.seed?.response.nl || 'Ik hoor je en begrijp dat dit moeilijk voor je is.',
        responseType: topSymbolic ? 'symbolic' : 'generated',
        confidence: bestMatch.confidence,
        reasoning: 'Fallback to best available match',
        symbolicContribution: topSymbolic ? 1.0 : 0,
        neuralContribution: 0,
        seed: bestMatch.seed || undefined,
        metadata: { fallback: true },
      };
    }

    // Log the decision
    try {
      const processingTime = Date.now() - startTime;
      
      // Get the current user to include user_id in the log
      const { data: { user } } = await supabase.auth.getUser();
      
      // Insert the log with user_id included
      await supabase.from('decision_logs').insert({
        user_id: user?.id,
        user_input: input,
        symbolic_matches: symbolicMatches.map(m => ({
          seedId: m.seed.id,
          emotion: m.seed.emotion,
          score: m.score,
          triggers: m.triggers,
          confidence: m.confidence,
        })),
        neural_similarities: neuralMatches.map(m => ({
          contentId: m.similarity.content_id,
          contentType: m.similarity.content_type,
          similarityScore: m.similarity.similarity_score,
          relevanceScore: m.relevanceScore,
        })),
        hybrid_decision: {
          responseType: decision.responseType,
          confidence: decision.confidence,
          reasoning: decision.reasoning,
          symbolicContribution: decision.symbolicContribution,
          neuralContribution: decision.neuralContribution,
        },
        final_response: decision.selectedResponse,
        confidence_score: decision.confidence,
        processing_time_ms: processingTime,
      });
    } catch (error) {
      console.error('Failed to log hybrid decision:', error);
    }

    console.log('✅ Hybrid decision made:', decision.responseType, `${(decision.confidence * 100).toFixed(1)}%`);
    return decision;
  };

  const processHybridDecision = async (
    input: string,
    seeds: AdvancedSeed[],
    similarities: SimilarityResult[],
    context: Record<string, any> = {}
  ): Promise<HybridDecision> => {
    setIsProcessing(true);
    try {
      const symbolicMatches = evaluateSymbolicMatches(input, seeds);
      const neuralMatches = evaluateNeuralMatches(similarities);
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
