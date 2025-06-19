
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
  responseType: 'symbolic' | 'neural' | 'hybrid' | 'generated' | 'ai_injected';
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

    console.log('🔍 Evaluating symbolic matches...');
    console.log('📝 Normalized input:', normalizedInput);
    console.log('🌱 Seeds to check:', seeds.length);

    for (const seed of seeds) {
      if (!seed.isActive) {
        console.log(`⏭️ Skipping inactive seed: ${seed.emotion}`);
        continue;
      }

      let score = 0;
      const matchedTriggers: string[] = [];

      console.log(`🔎 Checking seed: ${seed.emotion}`);
      console.log(`🎯 Triggers to check:`, seed.triggers);

      // Check trigger matches
      for (const trigger of seed.triggers || []) {
        const normalizedTrigger = trigger.toLowerCase();
        if (normalizedInput.includes(normalizedTrigger)) {
          matchedTriggers.push(trigger);
          score += 10 * (seed.meta?.weight || 1);
          console.log(`✅ Trigger matched: "${trigger}" (score +${10 * (seed.meta?.weight || 1)})`);
        } else {
          console.log(`❌ Trigger not matched: "${trigger}"`);
        }
      }

      if (matchedTriggers.length === 0) {
        console.log(`⏭️ No triggers matched for seed: ${seed.emotion}`);
        continue;
      }

      // Context bonuses
      if (seed.context?.severity === 'high' && normalizedInput.includes('help')) {
        score += 5;
        console.log('🆙 High severity + help bonus: +5');
      }
      if (seed.context?.severity === 'critical' && 
          (normalizedInput.includes('crisis') || normalizedInput.includes('emergency'))) {
        score += 10;
        console.log('🆙 Critical severity + crisis bonus: +10');
      }

      // Usage penalties
      if ((seed.meta?.usageCount || 0) > 3) {
        score *= 0.8;
        console.log('⬇️ Usage penalty applied: 0.8x');
      }
      if (seed.meta?.lastUsed) {
        const hoursSince = (Date.now() - new Date(seed.meta.lastUsed).getTime()) / (1000 * 60 * 60);
        if (hoursSince < 1) {
          score *= 0.5;
          console.log('⬇️ Recent usage penalty: 0.5x');
        }
      }

      const confidence = Math.min(0.95, Math.max(0.1, 
        (matchedTriggers.length * 0.3) + (seed.meta?.confidence || 0.5)
      ));

      console.log(`📊 Seed ${seed.emotion} final score: ${score}, confidence: ${confidence}`);

      matches.push({
        seed,
        score,
        triggers: matchedTriggers,
        confidence,
      });
    }

    const sortedMatches = matches.sort((a, b) => b.score - a.score).slice(0, 5);
    console.log(`🏆 Top symbolic matches:`, sortedMatches.map(m => ({
      emotion: m.seed.emotion,
      score: m.score,
      triggers: m.triggers
    })));

    return sortedMatches;
  };

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

    // Decision algorithm with better randomization to prevent same responses
    const topSymbolic = symbolicMatches[0];
    const topNeural = neuralMatches[0];
    const timestamp = Date.now();
    const randomFactor = Math.random(); // Add randomization

    if (!topSymbolic && !topNeural) {
      // Generate varied fallback responses
      const fallbackResponses = [
        'Ik begrijp je en wil graag helpen. Kun je me meer vertellen over hoe je je voelt?',
        'Ik merk dat je iets deelt dat belangrijk voor je is. Wat speelt er precies?',
        'Het klinkt alsof er iets is waar je mee bezig bent. Kun je daar meer over vertellen?',
        'Ik hoor je. Wat zou het meest helpend zijn om nu te bespreken?',
        'Dank je voor het delen. Wat voel je het sterkst op dit moment?'
      ];
      
      const selectedResponse = fallbackResponses[Math.floor(randomFactor * fallbackResponses.length)];
      
      decision = {
        selectedResponse,
        responseType: 'generated',
        confidence: 0.3 + (randomFactor * 0.2), // Vary confidence slightly
        reasoning: `No matches found - using varied fallback response ${Math.floor(randomFactor * 5) + 1}`,
        symbolicContribution: 0,
        neuralContribution: 0,
        metadata: { fallback: true, responseIndex: Math.floor(randomFactor * 5), timestamp },
      };
    } else if (topSymbolic && (!topNeural || topSymbolic.confidence > 0.8)) {
      // Strong symbolic match but add slight variation
      let response = topSymbolic.seed.response.nl;
      if (randomFactor > 0.7) {
        // Occasionally add a slight variation
        const variations = [
          `${response}`,
          `${response} Wat denk jij hierover?`,
          `${response} Hoe voel je je daarbij?`,
        ];
        response = variations[Math.floor(randomFactor * variations.length)];
      }
      
      decision = {
        selectedResponse: response,
        responseType: 'symbolic',
        confidence: topSymbolic.confidence,
        reasoning: `Strong symbolic match: ${topSymbolic.triggers.join(', ')} (variation: ${randomFactor > 0.7})`,
        symbolicContribution: 1.0,
        neuralContribution: 0,
        seed: topSymbolic.seed,
        metadata: { 
          matchedTriggers: topSymbolic.triggers,
          seedId: topSymbolic.seed.id,
          variation: randomFactor > 0.7,
          timestamp,
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
          timestamp,
        },
      };
    } else if (topSymbolic && topNeural) {
      // Hybrid decision with randomization
      const symbolicWeight = topSymbolic.confidence * (0.6 + randomFactor * 0.2);
      const neuralWeight = topNeural.contextualFit * (0.4 + randomFactor * 0.2);
      
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
            timestamp,
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
            timestamp,
          },
        };
      }
    } else {
      // Fallback to best available with variation
      const bestMatch = topSymbolic || { seed: null, confidence: 0.2 };
      const fallbackResponses = [
        bestMatch.seed?.response.nl || 'Ik hoor je en begrijp dat dit moeilijk voor je is.',
        'Dank je voor het delen. Dat klinkt als iets belangrijks voor je.',
        'Ik begrijp dat dit complex is. Kun je me helpen het beter te begrijpen?',
        'Het lijkt alsof er veel speelt. Waar wil je mee beginnen?'
      ];
      
      const selectedResponse = fallbackResponses[Math.floor(randomFactor * fallbackResponses.length)];
      
      decision = {
        selectedResponse,
        responseType: topSymbolic ? 'symbolic' : 'generated',
        confidence: bestMatch.confidence + (randomFactor * 0.1),
        reasoning: `Fallback to best available match with variation ${Math.floor(randomFactor * 4)}`,
        symbolicContribution: topSymbolic ? 1.0 : 0,
        neuralContribution: 0,
        seed: bestMatch.seed || undefined,
        metadata: { fallback: true, variationIndex: Math.floor(randomFactor * 4), timestamp },
      };
    }

    // Log the decision (with better error handling)
    try {
      const processingTime = Date.now() - startTime;
      
      // Get the current user to include user_id in the log
      const { data: { user } } = await supabase.auth.getUser();
      
      // Only try to log if we have a user
      if (user?.id) {
        // Generate proper UUID for logging
        const conversationId = crypto.randomUUID();
        
        // Insert the log with user_id included
        await supabase.from('decision_logs').insert({
          user_id: user.id,
          conversation_id: conversationId,
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
            timestamp: decision.metadata.timestamp,
          },
          final_response: decision.selectedResponse,
          confidence_score: decision.confidence,
          processing_time_ms: processingTime,
        });
        
        console.log('✅ Decision logged successfully');
      } else {
        console.warn('⚠️ No user found, skipping decision log');
      }
    } catch (error) {
      console.error('Failed to log hybrid decision:', error);
      // Don't fail the main process
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
