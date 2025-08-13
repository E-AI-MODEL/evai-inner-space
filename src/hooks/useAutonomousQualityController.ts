import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSeeds } from './useSeeds';

export interface QualityOptimization {
  type: 'seed_performance' | 'api_efficiency' | 'response_quality' | 'system_health';
  action: string;
  impact: number;
  applied: boolean;
  timestamp: Date;
}

export interface QualityControlResult {
  optimizationsApplied: number;
  totalOptimizations: number;
  confidence: number;
  impactScore: number;
  recommendations: QualityOptimization[];
}

export function useAutonomousQualityController() {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const { data: seeds, refetch: refetchSeeds } = useSeeds();

  const performAutonomousOptimizations = useCallback(async (): Promise<QualityControlResult> => {
    setIsOptimizing(true);
    try {
      const optimizations: QualityOptimization[] = [];
      let appliedCount = 0;
      let totalImpact = 0;

      // 1. Seed Performance Optimization
      if (seeds) {
        // Identify underperforming seeds
        const underperformingSeeds = seeds.filter(seed => {
          const usageCount = seed.meta?.usageCount || 0;
          const confidence = seed.meta?.confidence || 0;
          return usageCount < 2 && confidence < 0.7 && seed.isActive;
        });

        if (underperformingSeeds.length > 5) {
          try {
            // Deactivate lowest performing seeds
            const lowestPerforming = underperformingSeeds
              .sort((a, b) => (a.meta?.confidence || 0) - (b.meta?.confidence || 0))
              .slice(0, 3);

            for (const seed of lowestPerforming) {
              await supabase
                .from('emotion_seeds')
                .update({ active: false, updated_at: new Date().toISOString() })
                .eq('id', seed.id);
            }

            optimizations.push({
              type: 'seed_performance',
              action: `Deactivated ${lowestPerforming.length} underperforming seeds`,
              impact: 0.2,
              applied: true,
              timestamp: new Date()
            });
            appliedCount++;
            totalImpact += 0.2;
          } catch (error) {
            console.error('Seed optimization failed:', error);
          }
        }

        // Skip weight optimization - not available in current schema
      }

      // 2. API Efficiency Optimization
      const { data: apiLogs, error: apiError } = await supabase
        .from('api_collaboration_logs')
        .select('processing_time_ms, success, created_at')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!apiError && apiLogs) {
        const recentLogs = apiLogs.filter(log => 
          new Date(log.created_at) > new Date(Date.now() - 60 * 60 * 1000) // Last hour
        );

        const avgProcessingTime = recentLogs.reduce((sum, log) => 
          sum + (log.processing_time_ms || 0), 0) / Math.max(recentLogs.length, 1);

        if (avgProcessingTime > 3000) { // > 3 seconds
          optimizations.push({
            type: 'api_efficiency',
            action: `Detected slow API performance (${Math.round(avgProcessingTime)}ms avg)`,
            impact: 0.1,
            applied: false,
            timestamp: new Date()
          });
        }

        const successRate = recentLogs.filter(log => log.success).length / Math.max(recentLogs.length, 1);
        if (successRate < 0.9) {
          optimizations.push({
            type: 'api_efficiency',
            action: `API success rate below threshold (${Math.round(successRate * 100)}%)`,
            impact: 0.15,
            applied: false,
            timestamp: new Date()
          });
        }
      }

      // 3. Response Quality Optimization
      const { data: decisionLogs, error: decisionError } = await supabase
        .from('decision_logs')
        .select('confidence_score, processing_time_ms, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

      if (!decisionError && decisionLogs) {
        const avgConfidence = decisionLogs.reduce((sum, log) => 
          sum + (log.confidence_score || 0), 0) / Math.max(decisionLogs.length, 1);

        if (avgConfidence < 0.7) {
          optimizations.push({
            type: 'response_quality',
            action: `Low average confidence detected (${Math.round(avgConfidence * 100)}%)`,
            impact: 0.2,
            applied: false,
            timestamp: new Date()
          });
        }
      }

      // 4. System Health Optimization
      const now = new Date();
      const currentHour = now.getHours();
      
      // Off-peak optimization scheduling
      if (currentHour >= 2 && currentHour <= 6) {
        optimizations.push({
          type: 'system_health',
          action: 'Optimal time for system maintenance and heavy processing',
          impact: 0.05,
          applied: false,
          timestamp: new Date()
        });
      }

      // Auto-refresh seeds if needed
      if (appliedCount > 0) {
        await refetchSeeds();
      }

      const result: QualityControlResult = {
        optimizationsApplied: appliedCount,
        totalOptimizations: optimizations.length,
        confidence: optimizations.length > 0 ? 0.85 : 0.5,
        impactScore: totalImpact,
        recommendations: optimizations
      };

      console.log(`⚙️ Quality Control Complete: ${appliedCount}/${optimizations.length} optimizations applied`);
      return result;

    } catch (error) {
      console.error('❌ Autonomous quality control failed:', error);
      return {
        optimizationsApplied: 0,
        totalOptimizations: 0,
        confidence: 0,
        impactScore: 0,
        recommendations: []
      };
    } finally {
      setIsOptimizing(false);
    }
  }, [seeds, refetchSeeds]);

  return {
    performAutonomousOptimizations,
    isOptimizing
  };
}