import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useEnhancedEvAI56Rubrics } from './useEnhancedEvAI56Rubrics';

export interface EmotionalRisk {
  pattern: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  indicators: string[];
  timeframe: string;
  intervention: string;
}

export interface RiskPredictionResult {
  highRisk: EmotionalRisk[];
  mediumRisk: EmotionalRisk[];
  confidence: number;
  totalRisks: number;
}

export function useRiskPredictionEngine() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { performEnhancedAssessment } = useEnhancedEvAI56Rubrics();

  const predictEmotionalRisks = useCallback(async (): Promise<RiskPredictionResult> => {
    setIsAnalyzing(true);
    try {
      // Get recent conversation patterns from decision logs
      const { data: recentLogs, error } = await supabase
        .from('decision_logs')
        .select('user_input, confidence_score, rubrics_analysis, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Graceful degradation: Check for empty data
      if (!recentLogs || recentLogs.length === 0) {
        console.log('⚠️ No recent logs for risk prediction - using time-based patterns only');
        
        const risks: EmotionalRisk[] = [];
        
        // Still provide seasonal risk even without conversation data
        const currentMonth = new Date().getMonth();
        if (currentMonth >= 10 || currentMonth <= 1) {
          risks.push({
            pattern: 'seasonal_affective_risk',
            riskLevel: 'low',
            confidence: 0.6,
            indicators: ['Winter season', 'Reduced daylight', 'Potential seasonal depression'],
            timeframe: 'next 30 days',
            intervention: 'Light therapy suggestions and mood monitoring'
          });
        }
        
        return {
          highRisk: [],
          mediumRisk: risks,
          confidence: 0.5,
          totalRisks: risks.length
        };
      }

      const risks: EmotionalRisk[] = [];
      let totalConfidence = 0;

      if (recentLogs && recentLogs.length > 0) {
        // Analyze confidence trends
        const confidenceScores = recentLogs.map(log => log.confidence_score).filter(Boolean);
        const avgConfidence = confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length;
        
        if (avgConfidence < 0.6) {
          risks.push({
            pattern: 'declining_ai_confidence',
            riskLevel: 'high',
            confidence: 0.9,
            indicators: ['Low AI confidence scores', 'Complex emotional states', 'Unclear user communication'],
            timeframe: 'immediate',
            intervention: 'Activate enhanced emotional support protocols'
          });
        }

        // Analyze conversation frequency patterns
        const now = new Date();
        const last24h = recentLogs.filter(log => 
          new Date(log.created_at) > new Date(now.getTime() - 24 * 60 * 60 * 1000)
        );

        if (last24h.length > 15) {
          risks.push({
            pattern: 'excessive_conversation_frequency',
            riskLevel: 'medium',
            confidence: 0.8,
            indicators: ['High conversation frequency', 'Potential dependency behavior', 'Emotional overreliance'],
            timeframe: 'next 12 hours',
            intervention: 'Introduce self-regulation techniques and breaks'
          });
        }

        if (last24h.length < 2 && recentLogs.length > 5) {
          risks.push({
            pattern: 'sudden_communication_drop',
            riskLevel: 'medium',
            confidence: 0.75,
            indicators: ['Sudden decrease in interaction', 'Potential emotional withdrawal', 'Risk of isolation'],
            timeframe: 'next 24 hours',
            intervention: 'Proactive check-in and engagement strategies'
          });
        }

        // Analyze emotional content patterns
        const emotionalKeywords = ['crisis', 'hopeless', 'suicide', 'harm', 'emergency', 'can\'t cope'];
        const riskIndicators = recentLogs.filter(log => 
          emotionalKeywords.some(keyword => 
            log.user_input?.toLowerCase().includes(keyword)
          )
        );

        if (riskIndicators.length > 0) {
          risks.push({
            pattern: 'crisis_language_detection',
            riskLevel: 'critical',
            confidence: 0.95,
            indicators: ['Crisis language detected', 'Emergency emotional state', 'Immediate intervention needed'],
            timeframe: 'immediate',
            intervention: 'Immediate crisis intervention protocol activation'
          });
        }

        // Time-based risk prediction
        const currentHour = new Date().getHours();
        if (currentHour >= 22 || currentHour <= 6) {
          const lateNightConversations = recentLogs.filter(log => {
            const logHour = new Date(log.created_at).getHours();
            return logHour >= 22 || logHour <= 6;
          });

          if (lateNightConversations.length > 5) {
            risks.push({
              pattern: 'sleep_disruption_pattern',
              riskLevel: 'medium',
              confidence: 0.7,
              indicators: ['Late night conversation patterns', 'Potential sleep disruption', 'Circadian rhythm concerns'],
              timeframe: 'next 7 days',
              intervention: 'Sleep hygiene and routine optimization support'
            });
          }
        }

        totalConfidence = risks.length > 0 ? 
          risks.reduce((sum, risk) => sum + risk.confidence, 0) / risks.length : 0;
      }

      // Predictive seasonal/temporal risks
      const currentMonth = new Date().getMonth();
      if (currentMonth >= 10 || currentMonth <= 1) { // Winter months
        risks.push({
          pattern: 'seasonal_affective_risk',
          riskLevel: 'low',
          confidence: 0.6,
          indicators: ['Winter season', 'Reduced daylight', 'Potential seasonal depression'],
          timeframe: 'next 30 days',
          intervention: 'Light therapy suggestions and mood monitoring'
        });
      }

      const result: RiskPredictionResult = {
        highRisk: risks.filter(r => r.riskLevel === 'high' || r.riskLevel === 'critical'),
        mediumRisk: risks.filter(r => r.riskLevel === 'medium'),
        confidence: totalConfidence,
        totalRisks: risks.length
      };

      console.log(`🔍 Risk Prediction Complete: ${result.highRisk.length} high-risk, ${result.mediumRisk.length} medium-risk patterns detected`);
      
      return result;
      
    } catch (error) {
      console.error('❌ Risk prediction failed:', error);
      return {
        highRisk: [],
        mediumRisk: [],
        confidence: 0,
        totalRisks: 0
      };
    } finally {
      setIsAnalyzing(false);
    }
  }, [performEnhancedAssessment]);

  return {
    predictEmotionalRisks,
    isAnalyzing
  };
}