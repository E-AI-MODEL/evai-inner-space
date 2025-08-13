import { useState, useCallback } from 'react';
import { useSeeds } from './useSeeds';
import { useEnhancedSeedGeneration } from './useEnhancedSeedGeneration';
import { useOpenAI } from './useOpenAI';
import { AdvancedSeed } from '../types/seed';

export interface PredictiveSeed {
  emotion: string;
  scenario: string;
  confidence: number;
  timeWindow: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export function useProactiveSeedGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { data: existingSeeds } = useSeeds();
  const { generateEnhancedSeed } = useEnhancedSeedGeneration();
  const openAI = useOpenAI();

  const generatePredictiveSeeds = useCallback(async (): Promise<PredictiveSeed[]> => {
    // Skip actual generation for now - focus on prediction logic
    const apiKey = 'temp-placeholder';
    
    setIsGenerating(true);
    try {
      // Analyze current seed gaps and usage patterns
      const currentHour = new Date().getHours();
      const dayOfWeek = new Date().getDay();
      
      // Time-based emotion predictions
      const timeBasedPredictions: PredictiveSeed[] = [];
      
      // Morning patterns (7-11)
      if (currentHour >= 6 && currentHour <= 10) {
        timeBasedPredictions.push({
          emotion: 'anxiety',
          scenario: 'morning work anxiety preparation',
          confidence: 0.85,
          timeWindow: 'next 2 hours',
          priority: 'high'
        });
      }
      
      // Evening patterns (18-22)
      if (currentHour >= 17 && currentHour <= 21) {
        timeBasedPredictions.push({
          emotion: 'stress',
          scenario: 'end-of-day decompression support',
          confidence: 0.80,
          timeWindow: 'next 3 hours',
          priority: 'medium'
        });
      }
      
      // Weekend patterns
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        timeBasedPredictions.push({
          emotion: 'loneliness',
          scenario: 'weekend social connection support',
          confidence: 0.75,
          timeWindow: 'weekend period',
          priority: 'medium'
        });
      }

      // Check for seed gaps in existing database
      const emotionCoverage = existingSeeds?.reduce((acc, seed) => {
        acc[seed.emotion] = (acc[seed.emotion] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Generate seeds for under-represented emotions
      const underRepresentedEmotions = ['grief', 'shame', 'overwhelm', 'hope', 'gratitude'];
      for (const emotion of underRepresentedEmotions) {
        if ((emotionCoverage[emotion] || 0) < 3) {
          timeBasedPredictions.push({
            emotion,
            scenario: `proactive ${emotion} support preparation`,
            confidence: 0.70,
            timeWindow: 'next 24 hours',
            priority: 'low'
          });
        }
      }

      // Actually generate the most critical predicted seeds
      const criticalPredictions = timeBasedPredictions
        .filter(p => p.priority === 'high' || p.priority === 'critical')
        .slice(0, 2);

      for (const prediction of criticalPredictions) {
        try {
          await generateEnhancedSeed({
            emotion: prediction.emotion,
            severity: prediction.priority === 'critical' ? 'critical' : 'high',
            context: `Proactively generated for predicted scenario: ${prediction.scenario}`
          }, apiKey);
          
          console.log(`🌱 Generated predictive seed for ${prediction.emotion} (${prediction.scenario})`);
        } catch (error) {
          console.error(`❌ Failed to generate predictive seed for ${prediction.emotion}:`, error);
        }
      }

      return timeBasedPredictions;
      
    } catch (error) {
      console.error('❌ Predictive seed generation failed:', error);
      return [];
    } finally {
      setIsGenerating(false);
    }
  }, [openAI, existingSeeds, generateEnhancedSeed]);

  return {
    generatePredictiveSeeds,
    isGenerating
  };
}