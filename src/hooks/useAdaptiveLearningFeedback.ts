import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SeedEffectiveness {
  seed_id: string;
  emotion: string;
  total_usage: number;
  positive_feedback: number;
  negative_feedback: number;
  effectiveness_score: number;
  avg_confidence: number;
  last_used: string;
  trend: 'improving' | 'stable' | 'declining';
}

export function useAdaptiveLearningFeedback() {
  const trackSeedEffectiveness = useCallback(async (): Promise<SeedEffectiveness[]> => {
    try {
      console.log('📊 Tracking seed effectiveness...');
      
      // Get all seeds with their feedback data
      const { data: seeds, error: seedError } = await supabase
        .from('emotion_seeds')
        .select('id, emotion, meta, weight, updated_at')
        .eq('active', true);

      if (seedError) throw seedError;

      // Get feedback data
      const { data: feedback, error: feedbackError } = await supabase
        .from('seed_feedback')
        .select('seed_id, rating, created_at')
        .order('created_at', { ascending: false });

      if (feedbackError) throw feedbackError;

      // Get usage from unified_knowledge
      const { data: knowledgeUsage, error: knowledgeError } = await supabase
        .from('unified_knowledge')
        .select('id, emotion, usage_count, confidence_score, last_used')
        .eq('content_type', 'seed')
        .eq('active', true);

      if (knowledgeError) throw knowledgeError;

      const effectiveness: SeedEffectiveness[] = (seeds || []).map(seed => {
        const seedFeedback = (feedback || []).filter(f => f.seed_id === seed.id);
        const positiveCount = seedFeedback.filter(f => f.rating === 'like').length;
        const negativeCount = seedFeedback.filter(f => f.rating === 'dislike').length;
        const totalFeedback = positiveCount + negativeCount;

        const knowledgeItem = (knowledgeUsage || []).find(k => k.id === seed.id);
        const usageCount = knowledgeItem?.usage_count || (seed.meta as any)?.usageCount || 0;
        const avgConfidence = knowledgeItem?.confidence_score || 0.7;

        // Calculate effectiveness score (0-100)
        let effectivenessScore = 50; // Base score
        
        if (totalFeedback > 0) {
          const feedbackRatio = positiveCount / totalFeedback;
          effectivenessScore = feedbackRatio * 100;
        }

        // Boost for high usage
        if (usageCount > 10) effectivenessScore += 10;
        if (usageCount > 50) effectivenessScore += 15;

        // Boost for high confidence
        if (avgConfidence > 0.8) effectivenessScore += 10;

        // Penalize for negative feedback
        if (negativeCount > positiveCount) effectivenessScore -= 20;

        effectivenessScore = Math.max(0, Math.min(100, effectivenessScore));

        // Determine trend
        let trend: 'improving' | 'stable' | 'declining' = 'stable';
        if (totalFeedback >= 3) {
          const recentFeedback = seedFeedback.slice(0, 3);
          const recentPositive = recentFeedback.filter(f => f.rating === 'like').length;
          const oldFeedback = seedFeedback.slice(3, 6);
          const oldPositive = oldFeedback.filter(f => f.rating === 'like').length;

          if (recentPositive > oldPositive) trend = 'improving';
          else if (recentPositive < oldPositive) trend = 'declining';
        }

        return {
          seed_id: seed.id,
          emotion: seed.emotion,
          total_usage: usageCount,
          positive_feedback: positiveCount,
          negative_feedback: negativeCount,
          effectiveness_score: Math.round(effectivenessScore),
          avg_confidence: avgConfidence,
          last_used: knowledgeItem?.last_used || seed.updated_at,
          trend
        };
      });

      // Sort by effectiveness
      effectiveness.sort((a, b) => b.effectiveness_score - a.effectiveness_score);

      console.log(`✅ Tracked ${effectiveness.length} seeds effectiveness`);
      return effectiveness;

    } catch (error) {
      console.error('❌ Seed effectiveness tracking failed:', error);
      return [];
    }
  }, []);

  const pruneIneffectiveSeeds = useCallback(async (threshold: number = 20): Promise<number> => {
    try {
      console.log(`🔧 Pruning seeds with effectiveness < ${threshold}%...`);
      
      const effectiveness = await trackSeedEffectiveness();
      const ineffectiveSeeds = effectiveness.filter(s => 
        s.effectiveness_score < threshold && 
        s.total_usage > 5 // Only prune seeds that have been tested
      );

      if (ineffectiveSeeds.length === 0) {
        console.log('✅ No seeds to prune');
        return 0;
      }

      // Deactivate ineffective seeds
      const { error } = await supabase
        .from('emotion_seeds')
        .update({ active: false })
        .in('id', ineffectiveSeeds.map(s => s.seed_id));

      if (error) throw error;

      console.log(`✅ Pruned ${ineffectiveSeeds.length} ineffective seeds`);
      return ineffectiveSeeds.length;

    } catch (error) {
      console.error('❌ Seed pruning failed:', error);
      return 0;
    }
  }, [trackSeedEffectiveness]);

  return {
    trackSeedEffectiveness,
    pruneIneffectiveSeeds
  };
}
