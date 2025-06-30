import { useState } from 'react';
import { OPENAI_MODEL } from '../openaiConfig';
import type { StrategicBriefing } from '../types';

export function useOpenAISecondary() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const createStrategicBriefing = async (
    userInput: string,
    rubricAssessments: string[],
    seedMatch: string | null,
    apiKey: string
  ): Promise<StrategicBriefing | null> => {
    if (!apiKey?.trim()) return null;

    setIsAnalyzing(true);
    try {
      const prompt = `Maak een strategische briefing voor een therapeutische AI op basis van de volgende gegevens:\n` +
        `Gebruiker input: "${userInput}"\n` +
        `Rubric beoordelingen: ${rubricAssessments.length ? rubricAssessments.join(', ') : 'geen'}\n` +
        `Seed match: ${seedMatch || 'geen'}\n` +
        `Geef je antwoord in JSON met de velden goal, context, keyPoints (array) en priority.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.4,
          max_tokens: 300,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error('Geen content ontvangen');

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
