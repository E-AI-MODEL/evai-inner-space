
import { useState, useEffect, useCallback } from 'react';
import { useExpiredSeedDetector } from './useExpiredSeedDetector';
import { useReflectionQuestionGenerator } from './useReflectionQuestionGenerator';
import { Message } from '../types';

export interface PendingReflection {
  id: string;
  emotion: string;
  question: string;
  context: string;
  confidence: number;
  triggeredAt: Date;
  batchInfo: {
    seedCount: number;
    averageUsage: number;
  };
}

export function useBackgroundReflectionTrigger(
  conversationMessages: Message[],
  apiKey: string
) {
  const [pendingReflections, setPendingReflections] = useState<PendingReflection[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastProcessTime, setLastProcessTime] = useState<Date | null>(null);
  
  const { expiredBatches, markSeedsAsProcessed } = useExpiredSeedDetector();
  const { generateReflectionQuestion, isGenerating } = useReflectionQuestionGenerator();

  const processExpiredBatches = useCallback(async () => {
    if (!apiKey?.trim() || expiredBatches.length === 0 || isGenerating) {
      return;
    }

    console.log(`🔄 Processing ${expiredBatches.length} expired seed batches for reflection questions...`);
    setIsProcessing(true);

    try {
      const newReflections: PendingReflection[] = [];

      for (const batch of expiredBatches) {
        try {
          console.log(`⚡ Processing batch for emotion: ${batch.emotion}`);
          
          const reflectionQuestion = await generateReflectionQuestion(
            batch,
            conversationMessages,
            apiKey
          );

          if (reflectionQuestion) {
            const pendingReflection: PendingReflection = {
              id: reflectionQuestion.id,
              emotion: reflectionQuestion.emotion,
              question: reflectionQuestion.question,
              context: reflectionQuestion.context,
              confidence: reflectionQuestion.confidence,
              triggeredAt: new Date(),
              batchInfo: reflectionQuestion.batchInfo
            };

            newReflections.push(pendingReflection);
            
            // Mark the seeds in this batch as processed
            await markSeedsAsProcessed(batch.emotion);
            
            console.log(`✅ Created reflection question for ${batch.emotion}: "${reflectionQuestion.question.substring(0, 50)}..."`);
          }
          
          // Add small delay between batches to avoid rate limiting
          if (expiredBatches.length > 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
        } catch (error) {
          console.error(`❌ Error processing batch for ${batch.emotion}:`, error);
        }
      }

      if (newReflections.length > 0) {
        setPendingReflections(prev => [...prev, ...newReflections]);
        console.log(`🎯 Generated ${newReflections.length} reflection questions`);
      }

      setLastProcessTime(new Date());
      
    } catch (error) {
      console.error('❌ Error processing expired batches:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [expiredBatches, conversationMessages, apiKey, generateReflectionQuestion, markSeedsAsProcessed, isGenerating]);

  // Auto-process expired batches when they're detected
  useEffect(() => {
    if (expiredBatches.length > 0 && !isProcessing && !isGenerating) {
      // Add a small delay to avoid immediate processing
      const timer = setTimeout(processExpiredBatches, 2000);
      return () => clearTimeout(timer);
    }
  }, [expiredBatches, processExpiredBatches, isProcessing, isGenerating]);

  const consumePendingReflection = (reflectionId: string): PendingReflection | null => {
    const reflection = pendingReflections.find(r => r.id === reflectionId);
    if (reflection) {
      setPendingReflections(prev => prev.filter(r => r.id !== reflectionId));
      console.log(`📝 Consumed reflection question: ${reflection.emotion}`);
      return reflection;
    }
    return null;
  };

  const getNextPendingReflection = (): PendingReflection | null => {
    if (pendingReflections.length === 0) return null;
    
    // Return the oldest reflection question
    const oldest = pendingReflections.sort((a, b) => 
      a.triggeredAt.getTime() - b.triggeredAt.getTime()
    )[0];
    
    return oldest;
  };

  const clearAllPendingReflections = () => {
    setPendingReflections([]);
    console.log('🧹 Cleared all pending reflection questions');
  };

  // Cleanup old pending reflections (older than 1 hour)
  useEffect(() => {
    const cleanup = () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      setPendingReflections(prev => 
        prev.filter(r => r.triggeredAt > oneHourAgo)
      );
    };

    const interval = setInterval(cleanup, 10 * 60 * 1000); // Check every 10 minutes
    return () => clearInterval(interval);
  }, []);

  return {
    pendingReflections,
    isProcessing: isProcessing || isGenerating,
    lastProcessTime,
    consumePendingReflection,
    getNextPendingReflection,
    clearAllPendingReflections,
    processExpiredBatches
  };
}
