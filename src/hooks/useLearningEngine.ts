
import { useState, useEffect } from 'react';
import { Message } from '../types';
import { AdvancedSeed } from '../types/seed';
import { loadAdvancedSeeds, saveAdvancedSeeds } from '../lib/advancedSeedStorage';
import { toast } from '@/hooks/use-toast';

interface LearningPattern {
  id: string;
  pattern: string;
  confidence: number;
  positiveCount: number;
  negativeCount: number;
  createdAt: Date;
  lastSeen: Date;
}

interface SeedPerformanceMetrics {
  seedId: string;
  successRate: number;
  averageConfidence: number;
  feedbackScore: number;
  contextualEffectiveness: Record<string, number>;
  lastOptimized: Date;
}

const LEARNING_STORAGE_KEY = 'evai-learning-patterns';
const PERFORMANCE_STORAGE_KEY = 'evai-seed-performance';

export function useLearningEngine() {
  const [isLearning, setIsLearning] = useState(false);
  const [patterns, setPatterns] = useState<LearningPattern[]>([]);
  const [metrics, setMetrics] = useState<SeedPerformanceMetrics[]>([]);

  useEffect(() => {
    loadLearningData();
  }, []);

  const loadLearningData = () => {
    try {
      const storedPatterns = localStorage.getItem(LEARNING_STORAGE_KEY);
      const storedMetrics = localStorage.getItem(PERFORMANCE_STORAGE_KEY);
      
      if (storedPatterns) {
        const parsedPatterns = JSON.parse(storedPatterns).map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          lastSeen: new Date(p.lastSeen)
        }));
        setPatterns(parsedPatterns);
      }
      
      if (storedMetrics) {
        const parsedMetrics = JSON.parse(storedMetrics).map((m: any) => ({
          ...m,
          lastOptimized: new Date(m.lastOptimized)
        }));
        setMetrics(parsedMetrics);
      }
    } catch (error) {
      console.error('Error loading learning data:', error);
    }
  };

  const saveLearningData = () => {
    try {
      localStorage.setItem(LEARNING_STORAGE_KEY, JSON.stringify(patterns));
      localStorage.setItem(PERFORMANCE_STORAGE_KEY, JSON.stringify(metrics));
    } catch (error) {
      console.error('Error saving learning data:', error);
    }
  };

  const learnFromConversation = async (messages: Message[]) => {
    setIsLearning(true);
    
    try {
      // Analyze conversation patterns
      const conversationPatterns = extractConversationPatterns(messages);
      
      // Update pattern recognition
      updatePatterns(conversationPatterns);
      
      // Learn from feedback
      learnFromFeedback(messages);
      
      // Optimize seed weights
      await optimizeSeedWeights(messages);
      
      saveLearningData();
      
    } catch (error) {
      console.error('Learning error:', error);
    } finally {
      setIsLearning(false);
    }
  };

  const extractConversationPatterns = (messages: Message[]): string[] => {
    const patterns: string[] = [];
    
    // Extract emotional escalation patterns
    const userMessages = messages.filter(m => m.from === 'user');
    for (let i = 0; i < userMessages.length - 1; i++) {
      const current = userMessages[i];
      const next = userMessages[i + 1];
      
      if (current.emotionSeed && next.emotionSeed) {
        patterns.push(`transition:${current.emotionSeed}->${next.emotionSeed}`);
      }
    }
    
    // Extract response effectiveness patterns
    const aiMessages = messages.filter(m => m.from === 'ai' && m.feedback);
    aiMessages.forEach(msg => {
      if (msg.label && msg.emotionSeed) {
        patterns.push(`response:${msg.label}:${msg.emotionSeed}:${msg.feedback}`);
      }
    });
    
    return patterns;
  };

  const updatePatterns = (newPatterns: string[]) => {
    const updatedPatterns = [...patterns];
    
    newPatterns.forEach(pattern => {
      const existing = updatedPatterns.find(p => p.pattern === pattern);
      
      if (existing) {
        existing.lastSeen = new Date();
        existing.confidence = Math.min(1, existing.confidence + 0.1);
      } else {
        updatedPatterns.push({
          id: `pattern-${Date.now()}-${Math.random()}`,
          pattern,
          confidence: 0.5,
          positiveCount: 0,
          negativeCount: 0,
          createdAt: new Date(),
          lastSeen: new Date()
        });
      }
    });
    
    setPatterns(updatedPatterns);
  };

  const learnFromFeedback = (messages: Message[]) => {
    const feedbackMessages = messages.filter(m => m.feedback && m.from === 'ai');
    
    feedbackMessages.forEach(msg => {
      if (!msg.replyTo) return;
      
      const seedId = msg.id;
      let seedMetrics = metrics.find(m => m.seedId === seedId);
      
      if (!seedMetrics) {
        seedMetrics = {
          seedId,
          successRate: 0.5,
          averageConfidence: 0.5,
          feedbackScore: 0,
          contextualEffectiveness: {},
          lastOptimized: new Date()
        };
        setMetrics(prev => [...prev, seedMetrics!]);
      }
      
      // Update feedback score
      const feedbackValue = msg.feedback === 'like' ? 1 : -1;
      seedMetrics.feedbackScore += feedbackValue * 0.1;
      seedMetrics.feedbackScore = Math.max(-1, Math.min(1, seedMetrics.feedbackScore));
      
      // Update success rate
      const isSuccess = msg.feedback === 'like';
      seedMetrics.successRate = (seedMetrics.successRate * 0.9) + (isSuccess ? 0.1 : 0);
    });
  };

  const optimizeSeedWeights = async (messages: Message[]) => {
    const seeds = loadAdvancedSeeds();
    let hasUpdates = false;
    
    seeds.forEach(seed => {
      const seedMetrics = metrics.find(m => m.seedId === seed.id);
      if (!seedMetrics) return;
      
      // Calculate new weight based on performance
      const performanceScore = (
        seedMetrics.successRate * 0.4 +
        seedMetrics.averageConfidence * 0.3 +
        Math.max(0, seedMetrics.feedbackScore) * 0.3
      );
      
      const newWeight = Math.max(0.1, Math.min(3.0, performanceScore * 2));
      
      if (Math.abs(seed.meta.weight - newWeight) > 0.1) {
        seed.meta.weight = newWeight;
        seed.updatedAt = new Date();
        hasUpdates = true;
      }
    });
    
    if (hasUpdates) {
      saveAdvancedSeeds(seeds);
      toast({
        title: "Seeds geoptimaliseerd",
        description: "Seed gewichten zijn bijgewerkt op basis van performance data."
      });
    }
  };

  const getPerformanceInsights = () => {
    const totalPatterns = patterns.length;
    const recentPatterns = patterns.filter(p => 
      Date.now() - p.lastSeen.getTime() < 24 * 60 * 60 * 1000
    );
    
    const avgSeedPerformance = metrics.length > 0 
      ? metrics.reduce((acc, m) => acc + m.successRate, 0) / metrics.length 
      : 0;
    
    return {
      totalPatterns,
      recentPatterns: recentPatterns.length,
      avgPerformance: avgSeedPerformance,
      learningVelocity: recentPatterns.length / Math.max(1, totalPatterns),
      topPerformers: metrics
        .sort((a, b) => b.successRate - a.successRate)
        .slice(0, 5)
    };
  };

  return {
    isLearning,
    patterns,
    metrics,
    learnFromConversation,
    getPerformanceInsights,
    loadLearningData
  };
}
