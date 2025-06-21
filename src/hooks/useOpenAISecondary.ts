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
    // Simplified validation - reduce noise
    if (!apiKey?.trim() || !apiKey.startsWith('sk-')) {
      return null;
    }

    setIsAnalyzing(true);

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
        throw new Error(`API fout: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('Geen content ontvangen');
      }

      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const analysis = JSON.parse(jsonMatch[0]);
          
          // Ensure valid structure with safe defaults
          return {
            patterns: Array.isArray(analysis.patterns) ? analysis.patterns.slice(0, 3) : ['Neurosymbolische patronen gedetecteerd'],
            insights: Array.isArray(analysis.insights) ? analysis.insights.slice(0, 3) : ['Secundaire analyse uitgevoerd'],
            seedSuggestion: typeof analysis.seedSuggestion === 'string' ? analysis.seedSuggestion : undefined,
            confidence: typeof analysis.confidence === 'number' && !isNaN(analysis.confidence) ? 
              Math.max(0.1, Math.min(1, analysis.confidence)) : 0.75
          };
        } else {
          return {
            patterns: ['Neurosymbolische analyse uitgevoerd'],
            insights: [content.substring(0, 100) + '...'],
            confidence: 0.75
          };
        }
      } catch (parseError) {
        return {
          patterns: ['Neurosymbolische analyse uitgevoerd'],
          insights: ['Analyse voltooid maar parsing gefaald'],
          confidence: 0.70
        };
      }
    } catch (error) {
      // Simplified error - no console spam
      throw new Error(`Secundaire analyse fout: ${error instanceof Error ? error.message : 'Onbekende fout'}`);
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
