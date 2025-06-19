
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Message } from '../types';
import { ReflectionResult } from '../types/selfReflection';
import { useReflectionTriggerDetection } from './useReflectionTriggerDetection';
import { useReflectionInsights } from './useReflectionInsights';
import { useReflectionActions } from './useReflectionActions';

export function useSelfReflection() {
  const [isReflecting, setIsReflecting] = useState(false);
  
  const { detectReflectionTriggers } = useReflectionTriggerDetection();
  const { generateInsights } = useReflectionInsights();
  const { planActions } = useReflectionActions();

  const executeReflection = async (
    messages: Message[],
    recentDecisions: any[] = [],
    apiKey?: string
  ): Promise<ReflectionResult> => {
    setIsReflecting(true);
    console.log('🤔 Starting self-reflection process...');

    try {
      // Detect triggers
      const triggers = detectReflectionTriggers(messages, recentDecisions);
      console.log(`🎯 Detected ${triggers.length} reflection triggers`);

      if (triggers.length === 0) {
        return { insights: [], actions: [], newSeedsGenerated: 0 };
      }

      // Process highest priority trigger
      const primaryTrigger = triggers[0];
      const insights = await generateInsights(primaryTrigger, apiKey);
      const actions = planActions(insights, primaryTrigger.context);

      console.log(`💡 Generated ${insights.length} insights, ${actions.length} actions`);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Log reflection
      try {
        await supabase.from('reflection_logs').insert({
          user_id: user?.id,
          trigger_type: primaryTrigger.type,
          context: primaryTrigger.context,
          insights: insights.map(i => ({
            category: i.category,
            description: i.description,
            confidence: i.confidence,
          })),
          actions_taken: actions.map(a => ({
            type: a.type,
            description: a.description,
          })),
          new_seeds_generated: 0, // Will be updated if seeds are actually generated
          learning_impact: insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length,
        });
      } catch (error) {
        console.error('Failed to log reflection:', error);
      }

      return {
        insights,
        actions,
        newSeedsGenerated: 0, // Placeholder - would be implemented in actual action execution
      };

    } finally {
      setIsReflecting(false);
    }
  };

  return {
    executeReflection,
    detectReflectionTriggers,
    generateInsights,
    planActions,
    isReflecting,
  };
}

// Re-export types for backward compatibility
export type {
  ReflectionTrigger,
  ReflectionInsight,
  ReflectionAction
} from '../types/selfReflection';
