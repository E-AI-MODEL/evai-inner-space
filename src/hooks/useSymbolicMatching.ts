
import { AdvancedSeed } from '../types/seed';

export interface SymbolicMatch {
  seed: AdvancedSeed;
  score: number;
  matchedTriggers: string[];
  reasoning: string;
}

export function useSymbolicMatching() {
  const evaluateSymbolicMatches = (input: string, seeds: AdvancedSeed[]): SymbolicMatch[] => {
    console.log('🎯 Starting symbolic matching...');
    
    if (!seeds || seeds.length === 0) {
      console.log('🔍 No seeds available for symbolic matching');
      return [];
    }

    const normalized = input.toLowerCase();
    const matches: SymbolicMatch[] = [];

    for (const seed of seeds) {
      if (!seed.isActive) continue;

      const matchedTriggers = seed.triggers.filter(trigger => 
        normalized.includes(trigger.toLowerCase())
      );

      if (matchedTriggers.length === 0) continue;

      // Calculate symbolic score
      let score = matchedTriggers.length * seed.meta.weight;
      
      // Boost for exact emotion matches
      if (normalized.includes(seed.emotion.toLowerCase())) {
        score += 2;
      }

      // Context matching bonuses
      if (seed.context.severity === 'high' && 
          (normalized.includes('zeer') || normalized.includes('erg'))) {
        score += 1;
      }

      // Usage frequency consideration
      if (seed.meta.usageCount > 10) {
        score *= 0.9; // Slight penalty for overused seeds
      }

      const reasoning = `Matched ${matchedTriggers.length} triggers: ${matchedTriggers.join(', ')}`;

      matches.push({
        seed,
        score,
        matchedTriggers,
        reasoning
      });
    }

    // Sort by score and return top matches
    const sortedMatches = matches
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    console.log(`🎯 Symbolic matching complete: ${sortedMatches.length} matches`);
    return sortedMatches;
  };

  return {
    evaluateSymbolicMatches
  };
}
