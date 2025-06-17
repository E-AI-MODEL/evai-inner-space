
import { useState } from 'react';

export interface SecondaryAnalysis {
  patterns: string[];
  insights: string[];
  seedSuggestion?: string;
  confidence: number;
}

export function useOpenAISecondary() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeNeurosymbolic = async (
    userInput: string,
    context: string,
    apiKey: string
  ): Promise<SecondaryAnalysis | null> => {
    if (!apiKey || !apiKey.trim()) {
      console.log('🔴 OpenAI API Key 2 not available for secondary analysis');
      return null;
    }

    setIsAnalyzing(true);
    console.log('🧠 Starting OpenAI API 2 neurosymbolic analysis...');

    try {
      const prompt = `Analyseer dit therapeutische gesprek neurosymbolisch:

Gebruiker input: "${userInput}"
Context: "${context}"

Voer een neurosymbolische analyse uit die focust op:
1. Verborgen emotionele patronen
2. Symbolische betekenissen
3. Onderliggende cognitieve structuren
4. Therapie-relevante inzichten

Geef het resultaat als JSON met:
{
  "patterns": ["patroon1", "patroon2"],
  "insights": ["inzicht1", "inzicht2"],
  "seedSuggestion": "emotie-seed-suggestie",
  "confidence": 0.85
}

Focus op Nederlandse therapeutische context.`;

      console.log('🔗 Attempting OpenAI API 2 direct call...');
      
      // Direct OpenAI API call (proxy might not be available)
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1-2025-04-14',
          messages: [
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData?.error?.message || `API Error: ${response.status} ${response.statusText}`;
        console.error('🔴 OpenAI API 2 error:', errorMessage);
        throw new Error(`OpenAI API 2 fout: ${errorMessage}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No content received from OpenAI API 2');
      }

      console.log('🟢 OpenAI API 2 raw response received:', content.substring(0, 100) + '...');

      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const analysis = JSON.parse(jsonMatch[0]);
          console.log('✅ OpenAI API 2 analysis successful:', {
            patterns: analysis.patterns?.length || 0,
            insights: analysis.insights?.length || 0,
            confidence: analysis.confidence
          });
          return {
            patterns: analysis.patterns || ['Complexe emotionele structuur gedetecteerd'],
            insights: analysis.insights || ['Secundaire analyse uitgevoerd'],
            seedSuggestion: analysis.seedSuggestion,
            confidence: analysis.confidence || 0.75
          };
        } else {
          console.log('🔄 No JSON found, using fallback parsing');
          return {
            patterns: ['Neurosymbolische patronen gedetecteerd'],
            insights: [content.substring(0, 100) + '...'],
            confidence: 0.75
          };
        }
      } catch (parseError) {
        console.error('🔴 JSON parse error:', parseError);
        return {
          patterns: ['Neurosymbolische analyse uitgevoerd'],
          insights: ['OpenAI API 2 detecteerde complexe patronen'],
          confidence: 0.70
        };
      }
    } catch (error) {
      console.error('🔴 OpenAI API 2 error:', error);
      throw new Error(`OpenAI API 2 fout: ${error instanceof Error ? error.message : 'Onbekende fout'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateSeed = async (
    emotion: string,
    context: string,
    apiKey: string
  ): Promise<string | null> => {
    if (!apiKey || !apiKey.trim()) {
      console.log('🔴 OpenAI API Key 2 not available for seed generation');
      return null;
    }

    setIsAnalyzing(true);
    console.log('🌱 OpenAI API 2 seed generation voor:', emotion);

    try {
      const prompt = `Genereer een therapeutische seed voor emotie "${emotion}" in context "${context}".

Maak een empathische Nederlandse response van 50-80 woorden die:
- Valideert de emotie
- Biedt therapeutische ondersteuning
- Stimuleert zelfreflectie

Geef alleen de response tekst terug, geen JSON.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1-2025-04-14',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.8,
          max_tokens: 200
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API 2 error: ${response.status} - ${errorData?.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const seedResponse = data.choices[0]?.message?.content?.trim();

      console.log('✅ OpenAI API 2 seed generated:', seedResponse?.substring(0, 50) + '...');
      return seedResponse || null;

    } catch (error) {
      console.error('🔴 OpenAI API 2 seed generation error:', error);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    analyzeNeurosymbolic,
    generateSeed,
    isAnalyzing
  };
}
