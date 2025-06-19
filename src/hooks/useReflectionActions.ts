
import { ReflectionInsight, ReflectionAction } from '../types/selfReflection';

export function useReflectionActions() {
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

  return {
    planActions
  };
}
