
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
    console.log('🔍 Starting enhanced symbolic matching...');
    
    // Enhanced input validation
    if (!input || typeof input !== 'string') {
      console.warn('⚠️ Invalid input for symbolic matching');
      return [];
    }

    if (!seeds || !Array.isArray(seeds)) {
      console.warn('⚠️ Invalid seeds array for symbolic matching');
      return [];
    }

    const normalizedInput = input.toLowerCase().trim();
    const matches: SymbolicMatch[] = [];

    console.log(`📝 Processing input: "${normalizedInput.substring(0, 100)}${normalizedInput.length > 100 ? '...' : ''}"`);
    console.log(`🌱 Active seeds to evaluate: ${seeds.filter(s => s.isActive).length}/${seeds.length}`);

    const activeSeeds = seeds.filter(s => s && s.isActive);

    for (const seed of activeSeeds) {
      try {
        const result = evaluateSingleSeed(seed, normalizedInput);
        if (result) {
          matches.push(result);
        }
      } catch (error) {
        console.error(`❌ Error evaluating seed ${seed.id}:`, error);
      }
    }

    const sortedMatches = matches
      .filter(m => m.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8); // Increased limit for better selection

    console.log(`🏆 Symbolic matching complete: ${sortedMatches.length} quality matches found`);
    
    if (sortedMatches.length > 0) {
      console.log('📊 Top symbolic matches:');
      sortedMatches.slice(0, 3).forEach((match, index) => {
        console.log(`  ${index + 1}. ${match.seed.emotion}: score ${match.score.toFixed(1)}, confidence ${(match.confidence * 100).toFixed(1)}%`);
        console.log(`     Triggers: ${match.triggers.join(', ')}`);
      });
    } else {
      console.log('🔍 No symbolic matches found - consider:');
      console.log('  • Adding more diverse seed triggers');
      console.log('  • Checking seed activation status');
      console.log('  • Reviewing input processing logic');
    }

    return sortedMatches;
  };

  const evaluateSingleSeed = (seed: AdvancedSeed, normalizedInput: string): SymbolicMatch | null => {
    if (!seed.triggers || !Array.isArray(seed.triggers)) {
      console.warn(`⚠️ Seed ${seed.id} has invalid triggers`);
      return null;
    }

    let score = 0;
    const matchedTriggers: string[] = [];

    // Enhanced trigger matching with fuzzy logic
    for (const trigger of seed.triggers) {
      if (!trigger || typeof trigger !== 'string') continue;
      
      const normalizedTrigger = trigger.toLowerCase().trim();
      if (!normalizedTrigger) continue;

      // Exact match (highest score)
      if (normalizedInput.includes(normalizedTrigger)) {
        matchedTriggers.push(trigger);
        score += 15 * (seed.meta?.weight || 1);
        console.log(`✅ Exact trigger match: "${trigger}" (+${15 * (seed.meta?.weight || 1)})`);
        continue;
      }

      // Word boundary match
      const wordBoundaryRegex = new RegExp(`\\b${escapeRegex(normalizedTrigger)}\\b`, 'i');
      if (wordBoundaryRegex.test(normalizedInput)) {
        matchedTriggers.push(trigger);
        score += 12 * (seed.meta?.weight || 1);
        console.log(`✅ Word boundary match: "${trigger}" (+${12 * (seed.meta?.weight || 1)})`);
        continue;
      }

      // Partial/fuzzy matching for longer triggers
      if (normalizedTrigger.length > 4) {
        const similarity = calculateStringSimilarity(normalizedInput, normalizedTrigger);
        if (similarity > 0.7) {
          matchedTriggers.push(trigger);
          score += Math.round(8 * similarity * (seed.meta?.weight || 1));
          console.log(`✅ Fuzzy match: "${trigger}" (${(similarity * 100).toFixed(1)}% similar, +${Math.round(8 * similarity * (seed.meta?.weight || 1))})`);
        }
      }
    }

    if (matchedTriggers.length === 0) {
      return null;
    }

    // Enhanced context bonuses
    score = applyContextBonuses(score, seed, normalizedInput);

    // Enhanced usage penalties
    score = applyUsagePenalties(score, seed);

    // Calculate enhanced confidence
    const confidence = calculateConfidence(matchedTriggers.length, seed, score);

    console.log(`📊 Seed "${seed.emotion}" evaluation complete: score ${score.toFixed(1)}, confidence ${(confidence * 100).toFixed(1)}%`);

    return {
      seed,
      score: Math.max(0, score),
      triggers: matchedTriggers,
      confidence: Math.min(0.98, Math.max(0.05, confidence))
    };
  };

  const applyContextBonuses = (score: number, seed: AdvancedSeed, input: string): number => {
    let bonusScore = score;

    // Severity-based bonuses
    if (seed.context?.severity === 'high' && /\b(help|hulp|crisis)\b/i.test(input)) {
      bonusScore += 8;
      console.log('🆙 High severity + help keywords bonus: +8');
    }
    
    if (seed.context?.severity === 'critical' && /\b(emergency|noodgeval|crisis|gevaar)\b/i.test(input)) {
      bonusScore += 15;
      console.log('🆙 Critical severity + emergency keywords bonus: +15');
    }

    // Emotional intensity bonuses
    const intensityWords = ['heel', 'erg', 'extreem', 'ontzettend', 'vreselijk', 'verschrikkelijk'];
    if (intensityWords.some(word => input.includes(word))) {
      bonusScore += 5;
      console.log('🆙 Emotional intensity bonus: +5');
    }

    // Time-related pattern bonuses
    const timeWords = ['altijd', 'nooit', 'constant', 'steeds', 'elke dag', 'dagelijks'];
    if (timeWords.some(word => input.includes(word))) {
      bonusScore += 3;
      console.log('🆙 Time pattern bonus: +3');
    }

    return bonusScore;
  };

  const applyUsagePenalties = (score: number, seed: AdvancedSeed): number => {
    let penalizedScore = score;

    // Usage count penalty
    const usageCount = seed.meta?.usageCount || 0;
    if (usageCount > 3) {
      const penalty = Math.min(0.3, usageCount * 0.05);
      penalizedScore *= (1 - penalty);
      console.log(`⬇️ Usage count penalty: ${(penalty * 100).toFixed(1)}% reduction`);
    }

    // Recent usage penalty
    if (seed.meta?.lastUsed) {
      try {
        const lastUsedDate = seed.meta.lastUsed instanceof Date 
          ? seed.meta.lastUsed 
          : new Date(seed.meta.lastUsed);
        
        const hoursSince = (Date.now() - lastUsedDate.getTime()) / (1000 * 60 * 60);
        
        if (hoursSince < 1) {
          penalizedScore *= 0.4;
          console.log('⬇️ Recent usage penalty: 60% reduction');
        } else if (hoursSince < 6) {
          penalizedScore *= 0.7;
          console.log('⬇️ Recent usage penalty: 30% reduction');
        }
      } catch (error) {
        console.warn('⚠️ Error processing lastUsed date:', error);
      }
    }

    return penalizedScore;
  };

  const calculateConfidence = (triggerCount: number, seed: AdvancedSeed, score: number): number => {
    const baseConfidence = seed.meta?.confidence || 0.5;
    const triggerBonus = Math.min(0.3, triggerCount * 0.15);
    const scoreBonus = Math.min(0.2, score / 100);
    
    return baseConfidence + triggerBonus + scoreBonus;
  };

  const calculateStringSimilarity = (str1: string, str2: string): number => {
    // Simple Jaccard similarity for fuzzy matching
    const set1 = new Set(str1.split(''));
    const set2 = new Set(str2.split(''));
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  };

  const escapeRegex = (string: string): string => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  return {
    evaluateSymbolicMatches
  };
}
