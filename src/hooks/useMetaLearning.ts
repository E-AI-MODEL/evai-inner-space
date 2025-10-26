import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LearningPattern {
  pattern_type: 'common_failure' | 'success_factor' | 'user_preference' | 'temporal_pattern';
  description: string;
  frequency: number;
  confidence: number;
  examples: string[];
  actionable_insight: string;
}

export interface MetaLearningInsights {
  total_decisions: number;
  success_rate: number;
  avg_confidence: number;
  patterns: LearningPattern[];
  recommendations: string[];
}

export function useMetaLearning() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeSystemLearning = useCallback(async (): Promise<MetaLearningInsights> => {
    setIsAnalyzing(true);
    try {
      console.log('🧠 Meta-Learning: Analyzing system learning patterns...');

      // Get decision logs
      const { data: decisions, error: decisionsError } = await supabase
        .from('decision_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (decisionsError) throw decisionsError;

      // Get API collaboration logs
      const { data: apiLogs, error: apiError } = await supabase
        .from('api_collaboration_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (apiError) throw apiError;

      const patterns: LearningPattern[] = [];
      const recommendations: string[] = [];

      // Pattern 1: Common Failures
      const failedDecisions = (apiLogs || []).filter(log => !log.success);
      if (failedDecisions.length > 3) {
        const errorTypes = failedDecisions.map(log => 
          (log.error_details as any)?.error || 'unknown'
        );
        const mostCommonError = errorTypes.reduce((acc, error) => {
          acc[error] = (acc[error] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const topError = Object.entries(mostCommonError)
          .sort((a, b) => (b[1] as number) - (a[1] as number))[0] as [string, number];
        
        if (topError) {
          patterns.push({
            pattern_type: 'common_failure',
            description: `Common error: ${topError[0]}`,
            frequency: topError[1] as number,
            confidence: 0.9,
            examples: failedDecisions.slice(0, 3).map(log => 
              (log.error_details as any)?.error || 'unknown'
            ),
            actionable_insight: `Implement better error handling for: ${topError[0]}`
          });

          recommendations.push(`Fix recurring error: ${topError[0]}`);
        }
      }

      // Pattern 2: Success Factors
      const successfulDecisions = (decisions || []).filter(d => d.confidence_score > 0.8);
      if (successfulDecisions.length > 5) {
        const successEmotions = successfulDecisions.map(d => 
          (d.hybrid_decision as any)?.emotion || 'unknown'
        );
        const emotionCounts = successEmotions.reduce((acc, emotion) => {
          acc[emotion] = (acc[emotion] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const topEmotions = Object.entries(emotionCounts)
          .sort((a, b) => (b[1] as number) - (a[1] as number))
          .slice(0, 3) as [string, number][];

        if (topEmotions.length > 0) {
          patterns.push({
            pattern_type: 'success_factor',
            description: `High success rate for emotions: ${topEmotions.map(e => e[0]).join(', ')}`,
            frequency: topEmotions.reduce((sum, e) => sum + (e[1] as number), 0),
            confidence: 0.85,
            examples: topEmotions.map(e => `${e[0]}: ${e[1]} successes`),
            actionable_insight: 'Generate more seeds for these successful emotion patterns'
          });

          recommendations.push(`Expand knowledge base for: ${topEmotions[0][0]}`);
        }
      }

      // Pattern 3: User Preferences
      const userInputPatterns = (decisions || []).map(d => d.user_input?.length || 0);
      const avgInputLength = userInputPatterns.reduce((a, b) => a + b, 0) / userInputPatterns.length;

      if (avgInputLength < 50) {
        patterns.push({
          pattern_type: 'user_preference',
          description: 'Users prefer short, concise messages',
          frequency: userInputPatterns.filter(l => l < 50).length,
          confidence: 0.75,
          examples: ['Average input length: ' + Math.round(avgInputLength) + ' chars'],
          actionable_insight: 'Optimize responses for brief conversations'
        });

        recommendations.push('Keep responses concise and actionable');
      }

      // Pattern 4: Temporal Patterns
      const hourlyDistribution = (decisions || []).reduce((acc, d) => {
        const hour = new Date(d.created_at).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      const peakHour = Object.entries(hourlyDistribution)
        .sort((a, b) => (b[1] as number) - (a[1] as number))[0] as [string, number] | undefined;

      if (peakHour) {
        patterns.push({
          pattern_type: 'temporal_pattern',
          description: `Peak usage at ${peakHour[0]}:00 - ${parseInt(peakHour[0]) + 1}:00`,
          frequency: peakHour[1],
          confidence: 0.8,
          examples: [`${peakHour[1]} interactions during peak hour`],
          actionable_insight: 'Prepare context-appropriate responses for this time period'
        });
      }

      // Calculate overall stats
      const totalDecisions = (decisions || []).length;
      const successfulApiCalls = (apiLogs || []).filter(log => log.success).length;
      const totalApiCalls = (apiLogs || []).length;
      const successRate = totalApiCalls > 0 ? (successfulApiCalls / totalApiCalls) * 100 : 0;
      const avgConfidence = totalDecisions > 0
        ? (decisions || []).reduce((sum, d) => sum + ((d.confidence_score as number) || 0), 0) / totalDecisions
        : 0;

      console.log(`✅ Meta-Learning analysis complete: ${patterns.length} patterns found`);

      return {
        total_decisions: totalDecisions,
        success_rate: Math.round(successRate * 100) / 100,
        avg_confidence: Math.round(avgConfidence * 100) / 100,
        patterns,
        recommendations
      };

    } catch (error) {
      console.error('❌ Meta-learning analysis failed:', error);
      return {
        total_decisions: 0,
        success_rate: 0,
        avg_confidence: 0,
        patterns: [],
        recommendations: []
      };
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  return {
    analyzeSystemLearning,
    isAnalyzing
  };
}
