
import { AdvancedSeed } from '../types/seed';
import { SymbolicMatch } from './useSymbolicMatching';
import { NeuralMatch } from './useNeuralEvaluation';
import { supabase } from '@/integrations/supabase/client';

export interface HybridDecision {
  selectedResponse: string;
  responseType: 'symbolic' | 'neural' | 'hybrid' | 'generated' | 'ai_injected';
  confidence: number;
  reasoning: string;
  symbolicContribution: number;
  neuralContribution: number;
  seed?: AdvancedSeed;
  metadata: Record<string, any>;
}

export function useDecisionMaking() {
  const makeHybridDecision = async (
    input: string,
    symbolicMatches: SymbolicMatch[],
    neuralMatches: NeuralMatch[],
    context: Record<string, any> = {}
  ): Promise<HybridDecision> => {
    // Enhanced input validation with safe defaults
    if (!input || typeof input !== 'string') {
      return createFallbackDecision('Invalid input provided');
    }

    let decision: HybridDecision;
    const startTime = Date.now();
    const timestamp = Date.now();
    const randomFactor = Math.random();

    // Get best matches with proper validation and NaN protection
    const topSymbolic = symbolicMatches?.length > 0 ? symbolicMatches[0] : null;
    const topNeural = neuralMatches?.length > 0 ? neuralMatches[0] : null;

    if (!topSymbolic && !topNeural) {
      decision = createFallbackDecision('No matches found', randomFactor, timestamp);
    } else if (topSymbolic && (!topNeural || (isValidNumber(topSymbolic.confidence) && topSymbolic.confidence > 0.8))) {
      decision = createSymbolicDecision(topSymbolic, randomFactor, timestamp);
    } else if (topNeural && isValidNeuralMatch(topNeural)) {
      decision = createNeuralDecision(topNeural, timestamp);
    } else if (topSymbolic && topNeural) {
      decision = createHybridDecision(topSymbolic, topNeural, randomFactor, timestamp);
    } else {
      decision = createFallbackDecision('Insufficient match quality', randomFactor, timestamp, topSymbolic);
    }

    // Safe logging without console spam
    await logDecisionSafely(input, symbolicMatches, neuralMatches, decision, startTime);

    return decision;
  };

  // Safe number validation to prevent NaN issues
  const isValidNumber = (value: any): value is number => {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
  };

  const safeNumber = (value: any, fallback: number): number => {
    return isValidNumber(value) ? value : fallback;
  };

  const createFallbackDecision = (
    reason: string, 
    randomFactor = Math.random(), 
    timestamp = Date.now(), 
    fallbackSeed?: SymbolicMatch | null
  ): HybridDecision => {
    const fallbackResponses = [
      'Ik begrijp je en wil graag helpen. Kun je me meer vertellen over hoe je je voelt?',
      'Ik merk dat je iets deelt dat belangrijk voor je is. Wat speelt er precies?',
      'Het klinkt alsof er iets is waar je mee bezig bent. Kun je daar meer over vertellen?',
      'Ik hoor je. Wat zou het meest helpend zijn om nu te bespreken?',
      'Dank je voor het delen. Wat voel je het sterkst op dit moment?'
    ];
    
    const responseIndex = Math.floor(safeNumber(randomFactor, 0.5) * fallbackResponses.length);
    const selectedResponse = fallbackResponses[responseIndex] || fallbackResponses[0];
    
    return {
      selectedResponse,
      responseType: 'generated',
      confidence: Math.max(0.3, 0.3 + (safeNumber(randomFactor, 0.5) * 0.2)),
      reasoning: `${reason} - using varied fallback response ${responseIndex + 1}`,
      symbolicContribution: 0,
      neuralContribution: 0,
      seed: fallbackSeed?.seed,
      metadata: { 
        fallback: true, 
        responseIndex, 
        timestamp,
        reason
      }
    };
  };

  const createSymbolicDecision = (
    topSymbolic: SymbolicMatch, 
    randomFactor: number, 
    timestamp: number
  ): HybridDecision => {
    let response = topSymbolic.seed?.response?.nl || 'Ik begrijp je situatie.';
    
    // Add slight variation occasionally with safe number handling
    const safeRandomFactor = safeNumber(randomFactor, 0.5);
    if (safeRandomFactor > 0.7 && response) {
      const variations = [
        `${response}`,
        `${response} Wat denk jij hierover?`,
        `${response} Hoe voel je je daarbij?`,
      ];
      response = variations[Math.floor(safeRandomFactor * variations.length)] || response;
    }
    
    return {
      selectedResponse: response,
      responseType: 'symbolic',
      confidence: Math.min(0.95, Math.max(0.1, safeNumber(topSymbolic.confidence, 0.5))),
      reasoning: `Strong symbolic match: ${topSymbolic.triggers?.join(', ') || 'emotion trigger'} (variation: ${safeRandomFactor > 0.7})`,
      symbolicContribution: 1.0,
      neuralContribution: 0,
      seed: topSymbolic.seed,
      metadata: { 
        matchedTriggers: topSymbolic.triggers || [],
        seedId: topSymbolic.seed?.id,
        variation: safeRandomFactor > 0.7,
        timestamp
      }
    };
  };

  const createNeuralDecision = (topNeural: NeuralMatch, timestamp: number): HybridDecision => {
    const similarity = safeNumber(topNeural.similarity?.similarity_score, 0);
    const contextualFit = safeNumber(topNeural.contextualFit, 0);
    
    return {
      selectedResponse: topNeural.similarity?.content_text || 'Ik begrijp je bericht.',
      responseType: 'neural',
      confidence: Math.min(0.95, Math.max(0.1, contextualFit)),
      reasoning: `Strong neural similarity: ${similarity.toFixed(2)} (contextual fit: ${contextualFit.toFixed(2)})`,
      symbolicContribution: 0,
      neuralContribution: 1.0,
      metadata: {
        similarityScore: similarity,
        contextualFit: contextualFit,
        sourceType: topNeural.similarity?.content_type || 'unknown',
        timestamp
      }
    };
  };

  const createHybridDecision = (
    topSymbolic: SymbolicMatch,
    topNeural: NeuralMatch,
    randomFactor: number,
    timestamp: number
  ): HybridDecision => {
    const symbolicConfidence = safeNumber(topSymbolic.confidence, 0);
    const neuralFit = safeNumber(topNeural.contextualFit, 0);
    const safeRandomFactor = safeNumber(randomFactor, 0.5);
    
    const symbolicWeight = symbolicConfidence * (0.6 + safeRandomFactor * 0.2);
    const neuralWeight = neuralFit * (0.4 + safeRandomFactor * 0.2);
    
    const totalWeight = symbolicWeight + neuralWeight;
    const symbolicRatio = totalWeight > 0 ? symbolicWeight / totalWeight : 0.5;
    const neuralRatio = totalWeight > 0 ? neuralWeight / totalWeight : 0.5;
    
    if (symbolicWeight > neuralWeight) {
      return {
        selectedResponse: topSymbolic.seed?.response?.nl || 'Ik begrijp je situatie.',
        responseType: 'hybrid',
        confidence: Math.min(0.95, Math.max(0.1, (symbolicWeight + neuralWeight) / 2)),
        reasoning: `Hybrid decision favoring symbolic (${symbolicWeight.toFixed(2)} vs ${neuralWeight.toFixed(2)})`,
        symbolicContribution: symbolicRatio,
        neuralContribution: neuralRatio,
        seed: topSymbolic.seed,
        metadata: {
          hybridWeights: { symbolic: symbolicWeight, neural: neuralWeight },
          secondarySource: topNeural.similarity?.content_type || 'unknown',
          timestamp
        }
      };
    } else {
      return {
        selectedResponse: topNeural.similarity?.content_text || 'Ik begrijp je bericht.',
        responseType: 'hybrid',
        confidence: Math.min(0.95, Math.max(0.1, (symbolicWeight + neuralWeight) / 2)),
        reasoning: `Hybrid decision favoring neural (${neuralWeight.toFixed(2)} vs ${symbolicWeight.toFixed(2)})`,
        symbolicContribution: symbolicRatio,
        neuralContribution: neuralRatio,
        metadata: {
          hybridWeights: { symbolic: symbolicWeight, neural: neuralWeight },
          fallbackSeed: topSymbolic.seed?.id,
          timestamp
        }
      };
    }
  };

  const isValidNeuralMatch = (match: NeuralMatch): boolean => {
    if (!match || !match.similarity) return false;
    const score = safeNumber(match.similarity.similarity_score, 0);
    const fit = safeNumber(match.contextualFit, 0);
    return score > 0.5 && fit > 0.5;
  };

  const logDecisionSafely = async (
    input: string,
    symbolicMatches: SymbolicMatch[],
    neuralMatches: NeuralMatch[],
    decision: HybridDecision,
    startTime: number
  ) => {
    try {
      const processingTime = Date.now() - startTime;
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user?.id) {
        const conversationId = crypto.randomUUID();
        
        await supabase.from('decision_logs').insert({
          user_id: user.id,
          conversation_id: conversationId,
          user_input: input.substring(0, 1000),
          symbolic_matches: symbolicMatches.slice(0, 5).map(m => ({
            seedId: m.seed?.id || 'unknown',
            emotion: m.seed?.emotion || 'unknown',
            score: safeNumber(m.score, 0),
            triggers: Array.isArray(m.triggers) ? m.triggers : [],
            confidence: safeNumber(m.confidence, 0)
          })),
          neural_similarities: neuralMatches.slice(0, 5).map(m => ({
            contentId: m.similarity?.content_id || 'unknown',
            contentType: m.similarity?.content_type || 'unknown',
            similarityScore: safeNumber(m.similarity?.similarity_score, 0),
            relevanceScore: safeNumber(m.relevanceScore, 0)
          })),
          hybrid_decision: {
            responseType: decision.responseType,
            confidence: safeNumber(decision.confidence, 0),
            reasoning: decision.reasoning || 'No reasoning provided',
            symbolicContribution: safeNumber(decision.symbolicContribution, 0),
            neuralContribution: safeNumber(decision.neuralContribution, 0),
            timestamp: decision.metadata?.timestamp || Date.now()
          },
          final_response: decision.selectedResponse?.substring(0, 1000) || 'No response',
          confidence_score: safeNumber(decision.confidence, 0),
          processing_time_ms: processingTime
        });
      }
    } catch (error) {
      // Silent logging failure - no console spam
    }
  };

  return {
    makeHybridDecision
  };
}
