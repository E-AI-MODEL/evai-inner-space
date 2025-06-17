
import { AdvancedSeed } from '../types/seed';

export interface MatchingContext {
  userAge?: 'child' | 'teen' | 'adult' | 'senior';
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  situation?: 'work' | 'home' | 'school' | 'social' | 'therapy';
}

export function matchSeed(
  input: string,
  seeds: AdvancedSeed[],
  context?: MatchingContext
): AdvancedSeed | null {
  const normalized = input.toLowerCase();
  const activeSeeds = seeds.filter(s => s.isActive);
  const candidates: Array<{ seed: AdvancedSeed; score: number }> = [];

  for (const seed of activeSeeds) {
    let score = 0;
    const triggerMatches = seed.triggers.filter(t => normalized.includes(t.toLowerCase()));
    if (triggerMatches.length === 0) continue;

    score = triggerMatches.length * 10 * seed.meta.weight;

    if (context) {
      if (context.userAge && seed.context.userAge === context.userAge) score += 5;
      if (context.timeOfDay && seed.context.timeOfDay === context.timeOfDay) score += 3;
      if (context.situation && seed.context.situation === context.situation) score += 5;
    }

    if (seed.meta.lastUsed) {
      const lastUsedDate = seed.meta.lastUsed instanceof Date 
        ? seed.meta.lastUsed 
        : new Date(seed.meta.lastUsed);
      const hoursSince = (Date.now() - lastUsedDate.getTime()) / (1000 * 60 * 60);
      if (hoursSince > 24) score += 2;
    } else {
      score += 3;
    }

    if (seed.meta.ttl && seed.meta.lastUsed) {
      const lastUsedDate = seed.meta.lastUsed instanceof Date 
        ? seed.meta.lastUsed 
        : new Date(seed.meta.lastUsed);
      const minutesSince = (Date.now() - lastUsedDate.getTime()) / (1000 * 60);
      if (minutesSince < seed.meta.ttl) score *= 0.5;
    }

    if (seed.meta.usageCount > 5) {
      score *= Math.max(0.3, 1 - seed.meta.usageCount * 0.1);
    }

    candidates.push({ seed, score });
  }

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.score - a.score);
  const top = candidates.slice(0, Math.min(3, candidates.length));
  const total = top.reduce((sum, c) => sum + c.score, 0);
  let rnd = Math.random() * total;
  for (const cand of top) {
    rnd -= cand.score;
    if (rnd <= 0) return cand.seed;
  }
  return candidates[0].seed;
}
