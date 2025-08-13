import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MaintenanceAction {
  type: 'cleanup' | 'optimization' | 'repair' | 'prevention';
  action: string;
  urgency: 'low' | 'medium' | 'high';
  automated: boolean;
  executed: boolean;
  timestamp: Date;
}

export interface MaintenanceResult {
  actionsPerformed: number;
  totalActions: number;
  impactScore: number;
  nextMaintenanceWindow: Date;
  systemHealth: number;
}

export function usePredictiveMaintenanceAgent() {
  const [isMaintaining, setIsMaintaining] = useState(false);

  const performPredictiveMaintenance = useCallback(async (): Promise<MaintenanceResult> => {
    setIsMaintaining(true);
    try {
      const actions: MaintenanceAction[] = [];
      let executedCount = 0;
      let totalImpact = 0;

      // 1. Database Cleanup - Remove old logs
      try {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const { data: oldLogs, error: logError } = await supabase
          .from('api_collaboration_logs')
          .select('id')
          .lt('created_at', oneWeekAgo.toISOString())
          .limit(100);

        if (!logError && oldLogs && oldLogs.length > 10) {
          await supabase
            .from('api_collaboration_logs')
            .delete()
            .lt('created_at', oneWeekAgo.toISOString());

          actions.push({
            type: 'cleanup',
            action: `Cleaned up ${oldLogs.length} old API collaboration logs`,
            urgency: 'low',
            automated: true,
            executed: true,
            timestamp: new Date()
          });
          executedCount++;
          totalImpact += 0.1;
        }
      } catch (error) {
        console.error('Database cleanup failed:', error);
      }

      // 2. Expired Seeds Cleanup
      try {
        const { data: expiredSeeds, error: seedError } = await supabase
          .from('emotion_seeds')
          .select('id, expires_at')
          .not('expires_at', 'is', null)
          .lt('expires_at', new Date().toISOString())
          .eq('active', true);

        if (!seedError && expiredSeeds && expiredSeeds.length > 0) {
          await supabase
            .from('emotion_seeds')
            .update({ active: false, updated_at: new Date().toISOString() })
            .in('id', expiredSeeds.map(seed => seed.id));

          actions.push({
            type: 'cleanup',
            action: `Deactivated ${expiredSeeds.length} expired seeds`,
            urgency: 'medium',
            automated: true,
            executed: true,
            timestamp: new Date()
          });
          executedCount++;
          totalImpact += 0.15;
        }
      } catch (error) {
        console.error('Expired seeds cleanup failed:', error);
      }

      // 3. Vector Embeddings Optimization
      try {
        const { data: duplicateEmbeddings, error: embeddingError } = await supabase
          .from('vector_embeddings')
          .select('content_id, content_type, created_at')
          .order('created_at', { ascending: false });

        if (!embeddingError && duplicateEmbeddings) {
          // Group by content_id and remove duplicates (keep latest)
          const contentGroups = duplicateEmbeddings.reduce((groups, embedding) => {
            const key = `${embedding.content_id}_${embedding.content_type}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(embedding);
            return groups;
          }, {} as Record<string, typeof duplicateEmbeddings>);

          let duplicatesRemoved = 0;
          for (const [_, embeddings] of Object.entries(contentGroups)) {
            if (embeddings.length > 1) {
              // Keep the latest, remove the rest
              const toRemove = embeddings.slice(1);
              duplicatesRemoved += toRemove.length;
            }
          }

          if (duplicatesRemoved > 0) {
            actions.push({
              type: 'optimization',
              action: `Identified ${duplicatesRemoved} duplicate embeddings for cleanup`,
              urgency: 'low',
              automated: false,
              executed: false,
              timestamp: new Date()
            });
          }
        }
      } catch (error) {
        console.error('Embedding optimization check failed:', error);
      }

      // 4. API Performance Monitoring
      try {
        const { data: recentApiLogs, error: apiError } = await supabase
          .from('api_collaboration_logs')
          .select('processing_time_ms, success, created_at')
          .order('created_at', { ascending: false })
          .limit(100);

        if (!apiError && recentApiLogs) {
          const failureRate = recentApiLogs.filter(log => !log.success).length / recentApiLogs.length;
          
          if (failureRate > 0.1) { // More than 10% failures
            actions.push({
              type: 'repair',
              action: `High API failure rate detected (${Math.round(failureRate * 100)}%)`,
              urgency: 'high',
              automated: false,
              executed: false,
              timestamp: new Date()
            });
          }

          const avgProcessingTime = recentApiLogs
            .filter(log => log.processing_time_ms)
            .reduce((sum, log) => sum + (log.processing_time_ms || 0), 0) / 
            Math.max(recentApiLogs.filter(log => log.processing_time_ms).length, 1);

          if (avgProcessingTime > 5000) { // More than 5 seconds
            actions.push({
              type: 'optimization',
              action: `API performance degradation detected (${Math.round(avgProcessingTime)}ms avg)`,
              urgency: 'medium',
              automated: false,
              executed: false,
              timestamp: new Date()
            });
          }
        }
      } catch (error) {
        console.error('API performance check failed:', error);
      }

      // 5. Preventive Actions
      const currentHour = new Date().getHours();
      
      // Schedule next maintenance window during off-peak hours
      const nextMaintenance = new Date();
      if (currentHour < 3) {
        nextMaintenance.setHours(3, 0, 0, 0);
      } else {
        nextMaintenance.setDate(nextMaintenance.getDate() + 1);
        nextMaintenance.setHours(3, 0, 0, 0);
      }

      // Calculate system health score
      const systemHealth = Math.max(0, 1 - (actions.filter(a => a.urgency === 'high').length * 0.3) - 
                                          (actions.filter(a => a.urgency === 'medium').length * 0.1));

      const result: MaintenanceResult = {
        actionsPerformed: executedCount,
        totalActions: actions.length,
        impactScore: totalImpact,
        nextMaintenanceWindow: nextMaintenance,
        systemHealth
      };

      console.log(`🔧 Predictive Maintenance Complete: ${executedCount}/${actions.length} actions performed`);
      return result;

    } catch (error) {
      console.error('❌ Predictive maintenance failed:', error);
      return {
        actionsPerformed: 0,
        totalActions: 0,
        impactScore: 0,
        nextMaintenanceWindow: new Date(),
        systemHealth: 0.5
      };
    } finally {
      setIsMaintaining(false);
    }
  }, []);

  return {
    performPredictiveMaintenance,
    isMaintaining
  };
}
