
import { AdvancedSeed } from '../types/seed';

export interface SymbolicMatch {
  seed: AdvancedSeed;
  score: number;
  triggers: string[];
  confidence: number;
}

export function useSymbolicMatching() {
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

  return {
    evaluateSymbolicMatches,
  };
}
