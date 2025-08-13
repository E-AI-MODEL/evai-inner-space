import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UserNeedAnticipation {
  id: string;
  need: string;
  confidence: number;
  timeframe: string;
  triggers: string[];
  suggestedAction: string;
  priority: 'low' | 'medium' | 'high';
  category: 'emotional' | 'informational' | 'supportive' | 'crisis';
}

export function useContextAwareAnticipation() {
  const [isAnticipating, setIsAnticipating] = useState(false);

  const anticipateUserNeeds = useCallback(async (): Promise<UserNeedAnticipation[]> => {
    setIsAnticipating(true);
    try {
      const anticipations: UserNeedAnticipation[] = [];
      
      // Get recent user interaction patterns
      const { data: recentLogs, error } = await supabase
        .from('decision_logs')
        .select('user_input, final_response, confidence_score, created_at')
        .order('created_at', { ascending: false })
        .limit(15);

      if (error) throw error;

      if (recentLogs && recentLogs.length > 0) {
        // 1. Emotional Pattern Anticipation
        const emotionalKeywords = {
          anxiety: ['worried', 'anxious', 'nervous', 'stress', 'panic'],
          depression: ['sad', 'down', 'hopeless', 'empty', 'tired'],
          anger: ['angry', 'frustrated', 'mad', 'irritated', 'furious'],
          grief: ['loss', 'grief', 'died', 'death', 'mourning'],
          loneliness: ['alone', 'lonely', 'isolated', 'disconnect']
        };

        for (const [emotion, keywords] of Object.entries(emotionalKeywords)) {
          const mentionCount = recentLogs.filter(log => 
            keywords.some(keyword => 
              log.user_input?.toLowerCase().includes(keyword)
            )
          ).length;

          if (mentionCount >= 2) {
            anticipations.push({
              id: crypto.randomUUID(),
              need: `${emotion} support and coping strategies`,
              confidence: Math.min(0.6 + (mentionCount * 0.1), 0.95),
              timeframe: 'next conversation',
              triggers: keywords.filter(keyword => 
                recentLogs.some(log => log.user_input?.toLowerCase().includes(keyword))
              ),
              suggestedAction: `Prepare specialized ${emotion} intervention responses`,
              priority: mentionCount >= 3 ? 'high' : 'medium',
              category: 'emotional'
            });
          }
        }

        // 2. Information Need Anticipation
        const questionPatterns = recentLogs.filter(log => 
          log.user_input?.includes('?') || 
          /\b(how|what|why|when|where)\b/i.test(log.user_input || '')
        );

        if (questionPatterns.length >= 3) {
          anticipations.push({
            id: crypto.randomUUID(),
            need: 'educational content and explanations',
            confidence: 0.8,
            timeframe: 'immediate',
            triggers: ['question patterns', 'information seeking behavior'],
            suggestedAction: 'Prepare comprehensive educational responses',
            priority: 'medium',
            category: 'informational'
          });
        }

        // 3. Crisis Pattern Anticipation
        const crisisIndicators = ['crisis', 'emergency', 'help', 'suicide', 'harm', 'can\'t cope'];
        const crisisCount = recentLogs.filter(log => 
          crisisIndicators.some(indicator => 
            log.user_input?.toLowerCase().includes(indicator)
          )
        ).length;

        if (crisisCount > 0) {
          anticipations.push({
            id: crypto.randomUUID(),
            need: 'immediate crisis intervention support',
            confidence: 0.95,
            timeframe: 'immediate',
            triggers: crisisIndicators.filter(indicator => 
              recentLogs.some(log => log.user_input?.toLowerCase().includes(indicator))
            ),
            suggestedAction: 'Activate crisis intervention protocols',
            priority: 'high',
            category: 'crisis'
          });
        }

        // 4. Support Pattern Anticipation
        const supportKeywords = ['support', 'help', 'advice', 'guidance', 'need'];
        const supportMentions = recentLogs.filter(log => 
          supportKeywords.some(keyword => 
            log.user_input?.toLowerCase().includes(keyword)
          )
        ).length;

        if (supportMentions >= 2) {
          anticipations.push({
            id: crypto.randomUUID(),
            need: 'structured support and guidance',
            confidence: 0.75,
            timeframe: 'next 2 conversations',
            triggers: supportKeywords.filter(keyword => 
              recentLogs.some(log => log.user_input?.toLowerCase().includes(keyword))
            ),
            suggestedAction: 'Prepare structured support frameworks',
            priority: 'medium',
            category: 'supportive'
          });
        }

        // 5. Confidence Pattern Analysis
        const lowConfidenceResponses = recentLogs.filter(log => 
          log.confidence_score && log.confidence_score < 0.6
        ).length;

        if (lowConfidenceResponses >= 3) {
          anticipations.push({
            id: crypto.randomUUID(),
            need: 'clearer communication and understanding',
            confidence: 0.85,
            timeframe: 'ongoing',
            triggers: ['low AI confidence patterns', 'communication difficulties'],
            suggestedAction: 'Enhance communication clarity strategies',
            priority: 'high',
            category: 'supportive'
          });
        }
      }

      // 6. Time-based Anticipations
      const currentHour = new Date().getHours();
      const dayOfWeek = new Date().getDay();

      // Morning anticipations
      if (currentHour >= 6 && currentHour <= 9) {
        anticipations.push({
          id: crypto.randomUUID(),
          need: 'morning motivation and energy support',
          confidence: 0.7,
          timeframe: 'next 3 hours',
          triggers: ['morning time pattern'],
          suggestedAction: 'Prepare energizing and motivational content',
          priority: 'low',
          category: 'emotional'
        });
      }

      // Evening anticipations
      if (currentHour >= 19 && currentHour <= 22) {
        anticipations.push({
          id: crypto.randomUUID(),
          need: 'evening reflection and relaxation support',
          confidence: 0.65,
          timeframe: 'next 2 hours',
          triggers: ['evening time pattern'],
          suggestedAction: 'Prepare calming and reflective responses',
          priority: 'low',
          category: 'emotional'
        });
      }

      // Weekend anticipations
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        anticipations.push({
          id: crypto.randomUUID(),
          need: 'weekend social connection and activity support',
          confidence: 0.6,
          timeframe: 'weekend period',
          triggers: ['weekend time pattern'],
          suggestedAction: 'Prepare social and activity-focused content',
          priority: 'low',
          category: 'supportive'
        });
      }

      console.log(`🔮 Anticipated ${anticipations.length} user needs based on context analysis`);
      return anticipations;

    } catch (error) {
      console.error('❌ Context-aware anticipation failed:', error);
      return [];
    } finally {
      setIsAnticipating(false);
    }
  }, []);

  return {
    anticipateUserNeeds,
    isAnticipating
  };
}