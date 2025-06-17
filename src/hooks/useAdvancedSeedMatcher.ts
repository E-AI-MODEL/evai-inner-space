
import { useState } from 'react';
import { AdvancedSeed } from '../types/seed';
import { incrementSeedUsage } from '../lib/advancedSeedStorage';

export interface MatchingContext {
  userAge?: 'child' | 'teen' | 'adult' | 'senior';
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  situation?: 'work' | 'home' | 'school' | 'social' | 'therapy';
}

export function useAdvancedSeedMatcher() {
  const [isMatching, setIsMatching] = useState(false);

  const findBestMatch = async (
    input: string,
    seeds: AdvancedSeed[],
    context?: MatchingContext
  ): Promise<AdvancedSeed | null> => {
    if (seeds.length === 0) return null;

    setIsMatching(true);
    console.log('🔍 Advanced seed matching voor:', input.substring(0, 50));

    try {
      const normalized = input.toLowerCase();
      const activeSeeds = seeds.filter(s => s.isActive);
      
      if (activeSeeds.length === 0) {
        console.log('🔴 Geen actieve seeds beschikbaar');
        return null;
      }

      const candidates: Array<{ seed: AdvancedSeed; score: number }> = [];

      for (const seed of activeSeeds) {
        let score = 0;
        
        // Check trigger matches
        const triggerMatches = seed.triggers.filter(trigger => 
          normalized.includes(trigger.toLowerCase())
        );
        
        if (triggerMatches.length === 0) continue;

        // Base score from triggers and weight
        score = triggerMatches.length * 10 * seed.meta.weight;

        // Context matching bonuses
        if (context) {
          if (context.userAge && seed.context.userAge === context.userAge) score += 5;
          if (context.timeOfDay && seed.context.timeOfDay === context.timeOfDay) score += 3;
          if (context.situation && seed.context.situation === context.situation) score += 5;
        }

        // Freshness bonus (prefer less recently used seeds)
        if (seed.meta.lastUsed) {
          const hoursSince = (Date.now() - seed.meta.lastUsed.getTime()) / (1000 * 60 * 60);
          if (hoursSince > 24) score += 2;
        } else {
          score += 3; // Bonus for never used seeds
        }

        // TTL penalty (reduce score if recently used within TTL)
        if (seed.meta.ttl && seed.meta.lastUsed) {
          const minutesSince = (Date.now() - seed.meta.lastUsed.getTime()) / (1000 * 60);
          if (minutesSince < seed.meta.ttl) {
            score *= 0.5;
          }
        }

        // Usage frequency penalty (prefer less overused seeds)
        if (seed.meta.usageCount > 5) {
          score *= Math.max(0.3, 1 - seed.meta.usageCount * 0.1);
        }

        candidates.push({ seed, score });
        console.log(`🎯 Candidate: ${seed.emotion} - Score: ${score.toFixed(1)} (triggers: ${triggerMatches.length}, weight: ${seed.meta.weight}, usage: ${seed.meta.usageCount})`);
      }

      if (candidates.length === 0) {
        console.log('🔴 Geen matching candidates gevonden');
        return null;
      }

      // Sort by score and select probabilistically from top candidates
      candidates.sort((a, b) => b.score - a.score);
      const topCandidates = candidates.slice(0, Math.min(3, candidates.length));
      
      console.log('🏆 Top candidates:', topCandidates.map(c => `${c.seed.emotion}(${c.score.toFixed(1)})`).join(', '));

      // Weighted random selection from top candidates
      const totalScore = topCandidates.reduce((sum, c) => sum + c.score, 0);
      let randomValue = Math.random() * totalScore;

      for (const candidate of topCandidates) {
        randomValue -= candidate.score;
        if (randomValue <= 0) {
          const selectedSeed = candidate.seed;
          console.log('✅ Seed geselecteerd:', selectedSeed.emotion, 'Score:', candidate.score.toFixed(1));
          
          // Increment usage count in background
          try {
            await incrementSeedUsage(selectedSeed.id);
            console.log('📊 Usage count updated voor seed:', selectedSeed.id);
          } catch (error) {
            console.error('🔴 Failed to increment usage:', error);
          }
          
          return selectedSeed;
        }
      }

      // Fallback to first candidate
      const fallbackSeed = candidates[0].seed;
      console.log('🔄 Fallback naar eerste candidate:', fallbackSeed.emotion);
      
      try {
        await incrementSeedUsage(fallbackSeed.id);
      } catch (error) {
        console.error('🔴 Failed to increment usage (fallback):', error);
      }
      
      return fallbackSeed;

    } catch (error) {
      console.error('🔴 Advanced seed matching error:', error);
      return null;
    } finally {
      setIsMatching(false);
    }
  };

  return { findBestMatch, isMatching };
}
