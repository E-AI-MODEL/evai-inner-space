
import { useState, useEffect } from 'react';
import { useSeeds } from './useSeeds';
import { AdvancedSeed } from '../types/seed';

export interface ExpiredSeedBatch {
  emotion: string;
  expiredSeeds: AdvancedSeed[];
  totalCount: number;
  averageUsage: number;
  lastExpired: Date;
}

export function useExpiredSeedDetector() {
  const [expiredBatches, setExpiredBatches] = useState<ExpiredSeedBatch[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const { data: seeds, refetch } = useSeeds();

  const detectExpiredSeeds = async (): Promise<ExpiredSeedBatch[]> => {
    if (!seeds) return [];
    
    setIsDetecting(true);
    try {
      const now = new Date();
      const expiredSeeds = seeds.filter(seed => {
        if (!seed.meta.ttl || seed.meta.ttl <= 0) return false;
        
        const expiryTime = new Date(seed.createdAt);
        expiryTime.setMinutes(expiryTime.getMinutes() + seed.meta.ttl);
        
        return now > expiryTime && seed.isActive;
      });

      // Group expired seeds by emotion
      const emotionGroups = expiredSeeds.reduce((groups, seed) => {
        const emotion = seed.emotion;
        if (!groups[emotion]) {
          groups[emotion] = [];
        }
        groups[emotion].push(seed);
        return groups;
      }, {} as Record<string, AdvancedSeed[]>);

      // Create batches for emotions with multiple expired seeds
      const batches: ExpiredSeedBatch[] = Object.entries(emotionGroups)
        .filter(([_, seeds]) => seeds.length >= 2) // Only create batches for 2+ expired seeds
        .map(([emotion, expiredSeeds]) => ({
          emotion,
          expiredSeeds,
          totalCount: expiredSeeds.length,
          averageUsage: expiredSeeds.reduce((sum, seed) => sum + (seed.meta.usageCount || 0), 0) / expiredSeeds.length,
          lastExpired: new Date(Math.max(...expiredSeeds.map(seed => {
            const expiryTime = new Date(seed.createdAt);
            expiryTime.setMinutes(expiryTime.getMinutes() + (seed.meta.ttl || 0));
            return expiryTime.getTime();
          })))
        }));

      console.log(`🕐 Detected ${batches.length} expired seed batches:`, batches.map(b => `${b.emotion} (${b.totalCount})`));
      
      setExpiredBatches(batches);
      return batches;
      
    } catch (error) {
      console.error('❌ Error detecting expired seeds:', error);
      return [];
    } finally {
      setIsDetecting(false);
    }
  };

  const markSeedsAsProcessed = async (batchEmotion: string) => {
    const batch = expiredBatches.find(b => b.emotion === batchEmotion);
    if (!batch) return;

    try {
      // In a real implementation, you would update the database to mark these seeds as processed
      // For now, we'll just remove them from the expired batches list
      setExpiredBatches(prev => prev.filter(b => b.emotion !== batchEmotion));
      
      console.log(`✅ Marked ${batch.totalCount} expired seeds for emotion "${batchEmotion}" as processed`);
      
      // Refetch seeds to get updated state
      await refetch();
      
    } catch (error) {
      console.error('❌ Error marking seeds as processed:', error);
    }
  };

  // Auto-detect expired seeds every 5 minutes
  useEffect(() => {
    const interval = setInterval(detectExpiredSeeds, 5 * 60 * 1000);
    
    // Initial detection
    detectExpiredSeeds();
    
    return () => clearInterval(interval);
  }, [seeds]);

  return {
    expiredBatches,
    isDetecting,
    detectExpiredSeeds,
    markSeedsAsProcessed
  };
}
