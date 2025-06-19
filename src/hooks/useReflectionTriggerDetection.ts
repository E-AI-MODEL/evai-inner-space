
import { Message } from '../types';
import { ReflectionTrigger } from '../types/selfReflection';

export function useReflectionTriggerDetection() {
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

  return {
    detectReflectionTriggers
  };
}
