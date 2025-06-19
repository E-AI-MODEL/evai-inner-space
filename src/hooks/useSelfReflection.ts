import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Message } from '../types';
import { AdvancedSeed } from '../types/seed';

export interface ReflectionTrigger {
  type: 'feedback' | 'pattern' | 'error' | 'improvement';
  context: Record<string, any>;
  priority: number;
}

export interface ReflectionInsight {
  category: string;
  description: string;
  confidence: number;
  actionable: boolean;
}

export interface ReflectionAction {
  type: 'generate_seed' | 'adjust_weights' | 'improve_response' | 'flag_issue';
  description: string;
  parameters: Record<string, any>;
}

export function useSelfReflection() {
  const [isReflecting, setIsReflecting] = useState(false);

  const detectReflectionTriggers = (
    messages: Message[],
    recentDecisions: any[] = []
  ): ReflectionTrigger[] => {
    const triggers: ReflectionTrigger[] = [];

    // Feedback-based triggers
    const recentFeedback = messages
      .filter(m => m.feedback)
      .slice(-5);

    if (recentFeedback.length >= 3) {
      const negativeCount = recentFeedback.filter(m => 
        m.feedback === 'dislike'
      ).length;

      if (negativeCount >= 2) {
        triggers.push({
          type: 'feedback',
          context: {
            negativeCount,
            totalFeedback: recentFeedback.length,
            patterns: recentFeedback.map(m => ({
              messageId: m.id,
              label: m.label,
              feedback: m.feedback,
            })),
          },
          priority: 9,
        });
      }
    }

    // Pattern-based triggers
    const recentMessages = messages.slice(-10);
    const labelCounts = recentMessages.reduce((acc, m) => {
      if (m.from === 'ai' && m.label) {
        acc[m.label] = (acc[m.label] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const dominantLabel = Object.entries(labelCounts)
      .sort(([,a], [,b]) => b - a)[0];

    if (dominantLabel && dominantLabel[1] >= 4) {
      triggers.push({
        type: 'pattern',
        context: {
          dominantLabel: dominantLabel[0],
          frequency: dominantLabel[1],
          totalMessages: recentMessages.length,
          distribution: labelCounts,
        },
        priority: 6,
      });
    }

    // Low confidence decisions
    const lowConfidenceCount = recentDecisions.filter(d => d.confidence < 0.5).length;
    if (lowConfidenceCount >= 3) {
      triggers.push({
        type: 'improvement',
        context: {
          lowConfidenceCount,
          averageConfidence: recentDecisions.reduce((sum, d) => sum + d.confidence, 0) / recentDecisions.length,
          decisions: recentDecisions.slice(0, 5),
        },
        priority: 7,
      });
    }

    return triggers.sort((a, b) => b.priority - a.priority);
  };

  const generateInsights = async (
    trigger: ReflectionTrigger,
    apiKey?: string
  ): Promise<ReflectionInsight[]> => {
    const insights: ReflectionInsight[] = [];

    switch (trigger.type) {
      case 'feedback':
        const feedbackContext = trigger.context;
        const negativeRatio = feedbackContext.negativeCount / feedbackContext.totalFeedback;
        
        insights.push({
          category: 'Response Quality',
          description: `${(negativeRatio * 100).toFixed(1)}% of recent responses received negative feedback`,
          confidence: 0.9,
          actionable: true,
        });

        // Analyze feedback patterns
        const labelIssues = feedbackContext.patterns.reduce((acc: Record<string, number>, p: any) => {
          if (p.feedback === 'dislike') {
            acc[p.label] = (acc[p.label] || 0) + 1;
          }
          return acc;
        }, {});

        Object.entries(labelIssues).forEach(([label, count]) => {
          insights.push({
            category: 'Label Performance',
            description: `"${label}" responses frequently receive negative feedback (${count} times)`,
            confidence: 0.8,
            actionable: true,
          });
        });
        break;

      case 'pattern':
        const patternContext = trigger.context;
        insights.push({
          category: 'Response Diversity',
          description: `Over-reliance on "${patternContext.dominantLabel}" responses (${patternContext.frequency}/${patternContext.totalMessages})`,
          confidence: 0.85,
          actionable: true,
        });
        break;

      case 'improvement':
        const improvementContext = trigger.context;
        insights.push({
          category: 'Decision Confidence',
          description: `Low decision confidence detected (avg: ${(improvementContext.averageConfidence * 100).toFixed(1)}%)`,
          confidence: 0.9,
          actionable: true,
        });
        break;
    }

    return insights;
  };

  const planActions = (
    insights: ReflectionInsight[],
    context: Record<string, any>
  ): ReflectionAction[] => {
    const actions: ReflectionAction[] = [];

    for (const insight of insights.filter(i => i.actionable && i.confidence > 0.7)) {
      switch (insight.category) {
        case 'Response Quality':
          actions.push({
            type: 'improve_response',
            description: 'Analyze failed responses and generate improved alternatives',
            parameters: {
              focusArea: 'response_quality',
              feedbackPatterns: context.feedbackPatterns || [],
            },
          });
          break;

        case 'Label Performance':
          actions.push({
            type: 'adjust_weights',
            description: `Reduce weight for problematic label responses`,
            parameters: {
              adjustmentType: 'weight_reduction',
              targetLabels: insight.description.match(/"([^"]+)"/)?.[1] || '',
              reduction: 0.2,
            },
          });
          break;

        case 'Response Diversity':
          actions.push({
            type: 'generate_seed',
            description: 'Generate seeds for underrepresented emotional categories',
            parameters: {
              diversityFocus: true,
              avoidLabels: [context.dominantLabel],
              targetEmotions: ['uncertainty', 'curiosity', 'reflection'],
            },
          });
          break;

        case 'Decision Confidence':
          actions.push({
            type: 'improve_response',
            description: 'Enhance decision-making algorithm parameters',
            parameters: {
              focusArea: 'confidence_threshold',
              adjustConfidenceWeights: true,
            },
          });
          break;
      }
    }

    return actions;
  };

  const executeReflection = async (
    messages: Message[],
    recentDecisions: any[] = [],
    apiKey?: string
  ): Promise<{
    insights: ReflectionInsight[];
    actions: ReflectionAction[];
    newSeedsGenerated: number;
  }> => {
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
