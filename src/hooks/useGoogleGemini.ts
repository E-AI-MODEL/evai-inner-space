
import { useState } from 'react';

export interface GeminiAnalysis {
  patterns: string[];
  insights: string[];
  seedSuggestion?: string;
  confidence: number;
}

export function useGoogleGemini() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeNeurosymbolic = async (
    userInput: string,
    context: string,
    apiKey: string
  ): Promise<GeminiAnalysis | null> => {
    if (!apiKey || !apiKey.trim()) {
      console.log('🔴 Google API key not available');
      return null;
    }

    setIsAnalyzing(true);
    console.log('🧠 Starting Google Gemini neurosymbolic analysis...');

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

      const response = await fetch('/api/google-gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 500,
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Google API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!content) {
        throw new Error('No content received from Google API');
      }

      console.log('🟢 Google Gemini raw response:', content);

      // Parse JSON response
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const analysis = JSON.parse(jsonMatch[0]);
          console.log('✅ Google Gemini analysis successful:', analysis);
          return analysis;
        } else {
          // Fallback parsing
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
          insights: ['Google Gemini detecteerde complexe patronen'],
          confidence: 0.70
        };
      }

    } catch (error) {
      console.error('🔴 Google Gemini API error:', error);
      throw new Error(`Google Gemini fout: ${error instanceof Error ? error.message : 'Onbekende fout'}`);
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
    console.log('🌱 Google Gemini seed generation...');

    try {
      const prompt = `Genereer een therapeutische seed voor emotie "${emotion}" in context "${context}".

Maak een empathische Nederlandse response van 50-80 woorden die:
- Valideert de emotie
- Biedt therapeutische ondersteuning
- Stimuleert zelfreflectie

Geef alleen de response tekst terug, geen JSON.`;

      const response = await fetch('/api/google-gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 200,
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Google API error: ${response.status}`);
      }

      const data = await response.json();
      const seedResponse = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      
      console.log('✅ Google Gemini seed generated:', seedResponse?.substring(0, 50) + '...');
      return seedResponse || null;

    } catch (error) {
      console.error('🔴 Google seed generation error:', error);
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
