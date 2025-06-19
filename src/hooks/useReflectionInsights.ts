
import { ReflectionTrigger, ReflectionInsight } from '../types/selfReflection';

export function useReflectionInsights() {
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

  return {
    generateInsights
  };
}
