
import { SymbolicMatch } from './useSymbolicMatching';
import { NeuralMatch } from './useNeuralEvaluation';

export interface HybridDecision {
  emotion: string;
  response: string;
  confidence: number;
  reasoning: string;
  label: "Valideren" | "Reflectievraag" | "Suggestie";
  symbolicInferences: string[];
  meta: string;
  method: 'symbolic' | 'neural' | 'hybrid';
}

export function useDecisionMaking() {
  const makeHybridDecision = async (
    input: string,
    symbolicMatches: SymbolicMatch[],
    neuralMatches: NeuralMatch[],
    context: Record<string, any> = {}
  ): Promise<HybridDecision> => {
    console.log('🤖 Making hybrid decision...');

    // Determine decision method based on available matches
    let method: 'symbolic' | 'neural' | 'hybrid' = 'symbolic';
    let primarySource: SymbolicMatch | NeuralMatch | null = null;

    if (symbolicMatches.length > 0 && neuralMatches.length > 0) {
      method = 'hybrid';
      // Prefer symbolic if score is high enough
      if (symbolicMatches[0].score > 5) {
        primarySource = symbolicMatches[0];
      } else {
        primarySource = neuralMatches[0];
      }
    } else if (symbolicMatches.length > 0) {
      method = 'symbolic';
      primarySource = symbolicMatches[0];
    } else if (neuralMatches.length > 0) {
      method = 'neural';
      primarySource = neuralMatches[0];
    }

    if (!primarySource) {
      // Fallback decision
      return {
        emotion: 'onbekend',
        response: 'Ik begrijp dat je iets op je hart hebt. Kun je me daar meer over vertellen?',
        confidence: 0.3,
        reasoning: 'Geen matches gevonden, fallback response gebruikt',
        label: 'Valideren',
        symbolicInferences: ['🤔 Geen specifieke patronen gedetecteerd'],
        meta: 'Fallback decision',
        method: 'symbolic'
      };
    }

    // Extract information based on source type
    let emotion: string;
    let response: string;
    let confidence: number;
    let label: "Valideren" | "Reflectievraag" | "Suggestie";

    if ('seed' in primarySource) {
      // Symbolic match
      const symbolicSource = primarySource as SymbolicMatch;
      emotion = symbolicSource.seed.emotion;
      response = symbolicSource.seed.response.nl;
      confidence = Math.min(1, symbolicSource.score / 10);
      label = symbolicSource.seed.label;
    } else {
      // Neural match
      const neuralSource = primarySource as NeuralMatch;
      emotion = 'neural_detected';
      response = neuralSource.similarity.content_text || 'Ik begrijp je gevoel.';
      confidence = neuralSource.contextualFit;
      label = 'Valideren'; // Default for neural matches
    }

    // Apply context modifications
    if (context.dislikedLabel && context.dislikedLabel === label) {
      // Change label if user disliked it
      const alternatives: ("Valideren" | "Reflectievraag" | "Suggestie")[] = 
        ['Valideren', 'Reflectievraag', 'Suggestie'].filter(l => l !== context.dislikedLabel);
      label = alternatives[0];
    }

    // Create reasoning
    const reasoning = method === 'hybrid' 
      ? `Hybride beslissing: ${symbolicMatches.length} symbolische + ${neuralMatches.length} neurale matches`
      : method === 'symbolic'
      ? `Symbolische match: ${(primarySource as SymbolicMatch).reasoning}`
      : `Neurale match: similarity ${((primarySource as NeuralMatch).contextualFit * 100).toFixed(1)}%`;

    // Create symbolic inferences
    const symbolicInferences = [
      `🎯 Methode: ${method}`,
      `💡 Emotie: ${emotion}`,
      `📊 Vertrouwen: ${Math.round(confidence * 100)}%`,
      `🏷️ Label: ${label}`
    ];

    if (symbolicMatches.length > 0) {
      symbolicInferences.push(`🌱 Symbolische matches: ${symbolicMatches.length}`);
    }

    if (neuralMatches.length > 0) {
      symbolicInferences.push(`🧠 Neurale matches: ${neuralMatches.length}`);
    }

    const decision: HybridDecision = {
      emotion,
      response,
      confidence,
      reasoning,
      label,
      symbolicInferences,
      meta: `Hybrid Decision Engine v3.0 - ${method}`,
      method
    };

    console.log('✅ Hybrid decision made:', decision.emotion, 'via', method);
    return decision;
  };

  return {
    makeHybridDecision
  };
}
