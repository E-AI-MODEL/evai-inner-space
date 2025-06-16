
import { useState } from 'react';
import { AdvancedSeed } from '../types/seed';
import { incrementSeedUsage } from '../lib/advancedSeedStorage';

interface MatchingContext {
  userAge?: 'child' | 'teen' | 'adult' | 'senior';
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  situation?: 'work' | 'home' | 'school' | 'social' | 'therapy';
  previousEmotions?: string[];
  sessionDuration?: number;
}

export function useAdvancedSeedMatcher() {
  const [isMatching, setIsMatching] = useState(false);

  const findBestMatch = (
    input: string,
    seeds: AdvancedSeed[],
    context?: MatchingContext
  ): AdvancedSeed | null => {
    setIsMatching(true);

    try {
      const activeSeeds = seeds.filter(seed => seed.isActive);
      if (activeSeeds.length === 0) return null;

      const inputLower = input.toLowerCase();
      const candidates: Array<{ seed: AdvancedSeed; score: number }> = [];

      for (const seed of activeSeeds) {
        let score = 0;
        
        // Check trigger matches
        const triggerMatches = seed.triggers.filter(trigger => 
          inputLower.includes(trigger.toLowerCase())
        );
        
        if (triggerMatches.length === 0) continue;
        
        // Base score from trigger matches
        score = triggerMatches.length * 10;
        
        // Apply weight multiplier
        score *= seed.meta.weight;
        
        // Context matching bonuses
        if (context) {
          if (context.userAge && seed.context.userAge === context.userAge) {
            score += 5;
          }
          if (context.timeOfDay && seed.context.timeOfDay === context.timeOfDay) {
            score += 3;
          }
          if (context.situation && seed.context.situation === context.situation) {
            score += 5;
          }
        }
        
        // Recency bonus (less recently used seeds get slight bonus)
        if (seed.meta.lastUsed) {
          const hoursSinceLastUse = (Date.now() - seed.meta.lastUsed.getTime()) / (1000 * 60 * 60);
          if (hoursSinceLastUse > 24) score += 2;
        } else {
          score += 3; // Never used bonus
        }
        
        // TTL check
        if (seed.meta.ttl && seed.meta.lastUsed) {
          const minutesSinceLastUse = (Date.now() - seed.meta.lastUsed.getTime()) / (1000 * 60);
          if (minutesSinceLastUse < seed.meta.ttl) {
            score *= 0.5; // Reduce score if within TTL
          }
        }
        
        // Diversity penalty for overused seeds
        if (seed.meta.usageCount > 5) {
          score *= Math.max(0.3, 1 - (seed.meta.usageCount * 0.1));
        }
        
        candidates.push({ seed, score });
      }
      
      if (candidates.length === 0) return null;
      
      // Sort by score and apply some randomness for variety
      candidates.sort((a, b) => b.score - a.score);
      
      // Weighted random selection from top candidates
      const topCandidates = candidates.slice(0, Math.min(3, candidates.length));
      const totalScore = topCandidates.reduce((sum, c) => sum + c.score, 0);
      
      let random = Math.random() * totalScore;
      for (const candidate of topCandidates) {
        random -= candidate.score;
        if (random <= 0) {
          void incrementSeedUsage(candidate.seed.id);
          return candidate.seed;
        }
      }
      
      // Fallback to highest scored
      const selected = candidates[0].seed;
      void incrementSeedUsage(selected.id);
      return selected;
      
    } finally {
      setIsMatching(false);
    }
  };

  return { findBestMatch, isMatching };
}
