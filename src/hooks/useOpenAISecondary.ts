
import { useState } from 'react';
import { OPENAI_MODEL } from '../openaiConfig';
import type { StrategicBriefing } from '../types';
import { incrementApiUsage } from '@/utils/apiUsageTracker';
import { supabase } from '@/integrations/supabase/client';

export function useOpenAISecondary() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const createStrategicBriefing = async (
    userInput: string,
    rubricAssessments: string[],
    seedMatch: string | null,
    apiKey: string // kept for compatibility, ignored since we now use backend
  ): Promise<StrategicBriefing | null> => {
    if (!userInput?.trim()) return null;

    setIsAnalyzing(true);
    incrementApiUsage('openai2');
    try {
      const prompt = `Maak een strategische briefing voor een therapeutische AI op basis van de volgende gegevens:
Gebruiker input: "${userInput}"
Rubric beoordelingen: ${rubricAssessments.length ? rubricAssessments.join(', ') : 'geen'}
Seed match: ${seedMatch || 'geen'}
Geef je antwoord in JSON met de velden goal, context, keyPoints (array) en priority.`;

      const { data, error } = await supabase.functions.invoke('openai-chat', {
        body: {
          model: OPENAI_MODEL,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.4,
          max_tokens: 300,
          response_format: { type: 'json_object' },
          use_secondary: true
        }
      });

      if (error) {
        console.error('Strategic briefing generation failed (edge):', error);
        return null;
      }

      const content = (data as any)?.content;
      if (!content) {
        console.error('Geen content ontvangen van edge function');
        return null;
      }

      const briefing = JSON.parse(content) as StrategicBriefing;
      if (!Array.isArray(briefing.keyPoints)) briefing.keyPoints = [];
      return briefing;
    } catch (err) {
      console.error('Strategic briefing generation failed', err);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return { createStrategicBriefing, isAnalyzing };
}
