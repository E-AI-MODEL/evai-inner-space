import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TherapeuticWindow {
  id: string;
  type: 'emotional_receptivity' | 'learning_readiness' | 'crisis_opportunity' | 'growth_moment';
  confidence: number;
  timeframe: string;
  indicators: string[];
  suggestedIntervention: string;
  priority: 'low' | 'medium' | 'high';
  detectedAt: Date;
}

export function useTherapeuticWindowDetector() {
  const [isDetecting, setIsDetecting] = useState(false);

  const detectOptimalInterventionWindows = useCallback(async (): Promise<TherapeuticWindow[]> => {
    setIsDetecting(true);
    try {
      const windows: TherapeuticWindow[] = [];
      
      // Get recent conversation data
      const { data: recentLogs, error } = await supabase
        .from('decision_logs')
        .select('user_input, confidence_score, final_response, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Graceful degradation: Check for empty data
      if (!recentLogs || recentLogs.length === 0) {
        console.log('⚠️ No recent logs for therapeutic window detection - using time-based windows only');
        
        const windows: TherapeuticWindow[] = [];
        const now = new Date();
        const currentHour = new Date().getHours();
        
        // Still provide time-based windows even without conversation data
        if (currentHour >= 7 && currentHour <= 9) {
          windows.push({
            id: crypto.randomUUID(),
            type: 'emotional_receptivity',
            confidence: 0.70,
            timeframe: 'next 2 hours',
            indicators: ['Morning energy patterns', 'Day planning mindset', 'Fresh mental state'],
            suggestedIntervention: 'Goal-setting and motivation enhancement strategies',
            priority: 'medium',
            detectedAt: now
          });
        }

        if (currentHour >= 19 && currentHour <= 21) {
          windows.push({
            id: crypto.randomUUID(),
            type: 'learning_readiness',
            confidence: 0.65,
            timeframe: 'next 90 minutes',
            indicators: ['Evening reflection time', 'Day processing opportunity', 'Calm mental state'],
            suggestedIntervention: 'Reflective exercises and day integration activities',
            priority: 'low',
            detectedAt: now
          });
        }
        
        console.log(`🎯 Detected ${windows.length} time-based therapeutic windows (no conversation data)`);
        return windows;
      }

      const now = new Date();
      
      if (recentLogs && recentLogs.length > 0) {
        // Check for emotional receptivity windows
        const highConfidenceInteractions = recentLogs.filter(log => 
          log.confidence_score && log.confidence_score > 0.8
        );

        if (highConfidenceInteractions.length >= 3) {
          windows.push({
            id: crypto.randomUUID(),
            type: 'emotional_receptivity',
            confidence: 0.85,
            timeframe: 'next 30 minutes',
            indicators: ['High AI confidence', 'Clear communication patterns', 'Engaged conversation flow'],
            suggestedIntervention: 'Introduce deeper therapeutic concepts or coping strategies',
            priority: 'high',
            detectedAt: now
          });
        }

        // Check for learning readiness
        const questionPatterns = recentLogs.filter(log => 
          log.user_input?.includes('?') || 
          log.user_input?.toLowerCase().includes('how') ||
          log.user_input?.toLowerCase().includes('why') ||
          log.user_input?.toLowerCase().includes('what')
        );

        if (questionPatterns.length >= 2) {
          windows.push({
            id: crypto.randomUUID(),
            type: 'learning_readiness',
            confidence: 0.80,
            timeframe: 'next 15 minutes',
            indicators: ['Question-asking behavior', 'Curiosity signals', 'Information-seeking patterns'],
            suggestedIntervention: 'Provide educational content about emotional regulation techniques',
            priority: 'medium',
            detectedAt: now
          });
        }

        // Check for crisis opportunity (when user expresses struggle but is engaged)
        const struggleEngagement = recentLogs.filter(log => {
          const input = log.user_input?.toLowerCase() || '';
          return (input.includes('difficult') || input.includes('hard') || input.includes('struggle')) &&
                 log.confidence_score && log.confidence_score > 0.7;
        });

        if (struggleEngagement.length > 0) {
          windows.push({
            id: crypto.randomUUID(),
            type: 'crisis_opportunity',
            confidence: 0.90,
            timeframe: 'immediate',
            indicators: ['Expressed difficulty with high engagement', 'Receptive to support', 'Clear communication'],
            suggestedIntervention: 'Offer specific coping tools and immediate support strategies',
            priority: 'high',
            detectedAt: now
          });
        }

        // Check for growth moments (positive sentiment + reflection)
        const growthMoments = recentLogs.filter(log => {
          const input = log.user_input?.toLowerCase() || '';
          return (input.includes('understand') || input.includes('realize') || 
                  input.includes('better') || input.includes('progress')) &&
                 log.confidence_score && log.confidence_score > 0.75;
        });

        if (growthMoments.length > 0) {
          windows.push({
            id: crypto.randomUUID(),
            type: 'growth_moment',
            confidence: 0.75,
            timeframe: 'next 20 minutes',
            indicators: ['Positive progress language', 'Self-reflection signals', 'Growth mindset indicators'],
            suggestedIntervention: 'Reinforce progress and introduce advanced therapeutic concepts',
            priority: 'medium',
            detectedAt: now
          });
        }
      }

      // Time-based therapeutic windows
      const currentHour = new Date().getHours();
      
      // Morning motivation window
      if (currentHour >= 7 && currentHour <= 9) {
        windows.push({
          id: crypto.randomUUID(),
          type: 'emotional_receptivity',
          confidence: 0.70,
          timeframe: 'next 2 hours',
          indicators: ['Morning energy patterns', 'Day planning mindset', 'Fresh mental state'],
          suggestedIntervention: 'Goal-setting and motivation enhancement strategies',
          priority: 'medium',
          detectedAt: now
        });
      }

      // Evening reflection window
      if (currentHour >= 19 && currentHour <= 21) {
        windows.push({
          id: crypto.randomUUID(),
          type: 'learning_readiness',
          confidence: 0.65,
          timeframe: 'next 90 minutes',
          indicators: ['Evening reflection time', 'Day processing opportunity', 'Calm mental state'],
          suggestedIntervention: 'Reflective exercises and day integration activities',
          priority: 'low',
          detectedAt: now
        });
      }

      console.log(`🎯 Detected ${windows.length} therapeutic intervention windows`);
      return windows;
      
    } catch (error) {
      console.error('❌ Therapeutic window detection failed:', error);
      return [];
    } finally {
      setIsDetecting(false);
    }
  }, []);

  return {
    detectOptimalInterventionWindows,
    isDetecting
  };
}