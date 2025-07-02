
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Message } from '../types';
import { ReflectionResult } from '../types/selfReflection';
import { ANONYMOUS_SUPER_USER } from './useAuth';
import { useOpenAI } from './useOpenAI';

export function useSelfReflection() {
  const [isReflecting, setIsReflecting] = useState(false);
  const { detectEmotion } = useOpenAI();

  const executeReflection = async (
    feedbackType: 'positive' | 'negative',
    originalMessage: Message,
    context: {
      userInput: string;
      aiResponse: string;
      emotion: string;
      confidence: number;
      seedId?: string;
    },
    apiKey?: string
  ): Promise<ReflectionResult> => {
    setIsReflecting(true);
    console.log('🔄 Starting self-reflection process...', { feedbackType, context });

    try {
      if (feedbackType === 'positive') {
        return await handlePositiveFeedback(context);
      } else {
        return await handleNegativeFeedback(context, apiKey);
      }
    } catch (error) {
      console.error('🔴 Self-reflection failed:', error);
      return { insights: [], actions: [], newSeedsGenerated: 0 };
    } finally {
      setIsReflecting(false);
    }
  };

  const handlePositiveFeedback = async (context: any): Promise<ReflectionResult> => {
    console.log('👍 Processing positive feedback...');
    
    const insights = [{
      category: 'positive_reinforcement',
      description: `Successful response for emotion: ${context.emotion}`,
      confidence: context.confidence,
      actionable: true
    }];

    const actions = [];

    // Verhoog usage count voor seed indien bekend
    if (context.seedId) {
      try {
        await supabase.rpc('increment_seed_usage', { seed_id: context.seedId });
        actions.push({
          type: 'adjust_weights' as const,
          description: `Increased usage count for seed ${context.seedId}`,
          parameters: { seedId: context.seedId, adjustment: 'positive' }
        });
      } catch (error) {
        console.error('Failed to increment seed usage:', error);
      }
    }

    // Log positive feedback
    await supabase.from('seed_feedback').insert({
      user_id: ANONYMOUS_SUPER_USER.id,
      seed_id: context.seedId || null,
      rating: 'up',
      notes: `Positive feedback for ${context.emotion} response`
    });

    return { insights, actions, newSeedsGenerated: 0 };
  };

  const handleNegativeFeedback = async (context: any, apiKey?: string): Promise<ReflectionResult> => {
    console.log('👎 Processing negative feedback...');
    
    const insights = [{
      category: 'improvement_needed',
      description: `Poor response for emotion: ${context.emotion}`,
      confidence: 1 - context.confidence,
      actionable: true
    }];

    const actions = [];

    // Verlaag weight voor seed indien bekend
    if (context.seedId) {
      try {
        await supabase
          .from('emotion_seeds')
          .update({ 
            weight: 0.5, // Verlaag weight
            meta: {
              negativeFeedback: 1 // Gebruik direct object ipv raw SQL
            }
          })
          .eq('id', context.seedId);

        actions.push({
          type: 'adjust_weights' as const,
          description: `Decreased weight for seed ${context.seedId}`,
          parameters: { seedId: context.seedId, adjustment: 'negative' }
        });
      } catch (error) {
        console.error('Failed to adjust seed weight:', error);
      }
    }

    // Genereer nieuwe seed gebaseerd op de mislukking
    if (apiKey?.trim()) {
      try {
        const improvementAnalysis = await analyzeFailure(context, apiKey);
        const newSeed = await generateImprovedSeed(context, improvementAnalysis, apiKey);
        
        if (newSeed) {
          await supabase.from('emotion_seeds').insert({
            user_id: ANONYMOUS_SUPER_USER.id,
            emotion: newSeed.emotion,
            response: { nl: newSeed.response },
            label: newSeed.label,
            active: true,
            weight: 1.2, // Hogere weight voor nieuwe seed
            meta: {
              createdBy: 'ai-feedback-loop',
              originalContext: context.userInput,
              improvementReason: improvementAnalysis,
              confidence: newSeed.confidence,
              triggers: newSeed.triggers || []
            }
          });

          actions.push({
            type: 'generate_seed' as const,
            description: `Generated improved seed for ${newSeed.emotion}`,
            parameters: { 
              emotion: newSeed.emotion,
              response: newSeed.response,
              confidence: newSeed.confidence
            }
          });

          insights.push({
            category: 'seed_generation',
            description: `Created new seed based on feedback analysis`,
            confidence: newSeed.confidence,
            actionable: true
          });
        }
      } catch (error) {
        console.error('Failed to generate improved seed:', error);
      }
    }

    // Log negative feedback
    await supabase.from('seed_feedback').insert({
      user_id: ANONYMOUS_SUPER_USER.id,
      seed_id: context.seedId || null,
      rating: 'down',
      notes: `Negative feedback for ${context.emotion} response`
    });

    return { 
      insights, 
      actions, 
      newSeedsGenerated: actions.filter(a => a.type === 'generate_seed').length 
    };
  };

  const analyzeFailure = async (context: any, apiKey: string): Promise<string> => {
    const prompt = `Analyseer waarom deze AI-respons negatieve feedback kreeg:

Gebruiker input: "${context.userInput}"
AI respons: "${context.aiResponse}"
Gedetecteerde emotie: ${context.emotion}
Vertrouwen: ${context.confidence}

Geef een korte analyse (max 100 woorden) over wat er verbeterd kan worden.`;

    try {
      const analysis = await detectEmotion(prompt, apiKey);
      return analysis.response;
    } catch (error) {
      return 'Analyse van feedback gefaald - algemene verbetering nodig';
    }
  };

  const generateImprovedSeed = async (context: any, analysis: string, apiKey: string) => {
    const prompt = `Creeer een verbeterde AI-respons gebaseerd op deze feedback analyse:

Originele context: "${context.userInput}"
Analyse: "${analysis}"
Emotie: ${context.emotion}

Genereer een betere respons als JSON:
{
  "emotion": "...",
  "response": "...",
  "label": "Valideren|Reflectievraag|Suggestie",
  "confidence": 0.8,
  "triggers": ["trigger1", "trigger2"]
}`;

    try {
      const result = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          response_format: { type: 'json_object' }
        })
      });

      const data = await result.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (content) {
        return JSON.parse(content);
      }
    } catch (error) {
      console.error('Failed to generate improved seed:', error);
    }
    
    return null;
  };

  return {
    executeReflection,
    isReflecting,
  };
}

// Re-export types for backward compatibility
export type {
  ReflectionTrigger,
  ReflectionInsight,
  ReflectionAction
} from '../types/selfReflection';
