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
      console.log('🔴 OpenAI key 2 not available');
      return null;
    }

    setIsAnalyzing(true);
    console.log('🧠 Starting OpenAI secondary neurosymbolic analysis...');

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

      const response = await fetch('/api/openai-secondary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
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

      const data = await response.json();

      if (!response.ok) {
        const proxyError = data?.error?.message || `${response.status} ${response.statusText}`;
        throw new Error(`OpenAI proxy fout: ${proxyError}`);
      }

      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No content received from OpenAI API');
      }

      console.log('🟢 OpenAI secondary raw response:', content);

      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const analysis = JSON.parse(jsonMatch[0]);
          console.log('✅ OpenAI secondary analysis successful:', analysis);
          return analysis;
        } else {
          return {
            patterns: ['Complexe emotionele structuur gedetecteerd'],
            insights: [content.substring(0, 100) + '...'],
            confidence: 0.75
          };
        }
      } catch (parseError) {
        console.error('JSON parse error, using fallback:', parseError);
        return {
          patterns: ['Neurosymbolische analyse uitgevoerd'],
          insights: ['OpenAI detecteerde complexe patronen'],
          confidence: 0.70
        };
      }
    } catch (error) {
      console.error('🔴 OpenAI secondary API error:', error);
      throw new Error(`OpenAI fout: ${error instanceof Error ? error.message : 'Onbekende fout'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateSeed = async (
    emotion: string,
    context: string,
    apiKey: string
  ): Promise<string | null> => {
    if (!apiKey || !apiKey.trim()) return null;

    setIsAnalyzing(true);
    console.log('🌱 OpenAI secondary seed generation...');

    try {
      const prompt = `Genereer een therapeutische seed voor emotie "${emotion}" in context "${context}".

Maak een empathische Nederlandse response van 50-80 woorden die:
- Valideert de emotie
- Biedt therapeutische ondersteuning
- Stimuleert zelfreflectie

Geef alleen de response tekst terug, geen JSON.`;

      const response = await fetch('/api/openai-secondary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        body: JSON.stringify({
          model: 'gpt-4.1-2025-04-14',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.8,
          max_tokens: 200
        })
      });

      const data = await response.json();

      if (!response.ok) {
        const proxyError = data?.error?.message || `${response.status}`;
        throw new Error(`OpenAI proxy fout: ${proxyError}`);
      }

      const seedResponse = data.choices[0]?.message?.content?.trim();

      console.log('✅ OpenAI secondary seed generated:', seedResponse?.substring(0, 50) + '...');
      return seedResponse || null;

    } catch (error) {
      console.error('🔴 OpenAI seed generation error:', error);
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
