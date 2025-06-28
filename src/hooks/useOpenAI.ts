
import { useState } from 'react';
import { ChatHistoryItem } from '../types';

export interface EmotionDetection {
  emotion: string;
  confidence: number;
  response: string;
  triggers: string[];
  meta: string;
  label?: 'Valideren' | 'Reflectievraag' | 'Suggestie' | 'Interventie' | 'Fout';
  reasoning?: string;
  symbolicInferences?: string[];
}

export function useOpenAI() {
  const [isLoading, setIsLoading] = useState(false);

  const detectEmotion = async (
    userInput: string,
    apiKey: string,
    secondaryApiKey?: string,
    history?: ChatHistoryItem[]
  ): Promise<EmotionDetection> => {
    if (!apiKey?.trim()) {
      throw new Error('OpenAI API key is required');
    }

    setIsLoading(true);
    console.log('🤖 OpenAI emotion detection starting...');

    try {
      const contextHistory = history?.slice(-5) || [];
      const conversationContext = contextHistory
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');

      const prompt = `Je bent een empathische Nederlandse therapeutische AI. Analyseer de emotie in deze boodschap en geef een passend therapeutisch antwoord.

Conversatie context:
${conversationContext}

Gebruiker input: "${userInput}"

Geef je antwoord als JSON met deze structuur:
{
  "emotion": "hoofdemotie (bijv. angst, verdriet, boosheid, vreugde)",
  "confidence": 0.85,
  "response": "Empathisch Nederlands antwoord van 50-100 woorden",
  "reasoning": "Korte uitleg van je analyse",
  "label": "Valideren" | "Reflectievraag" | "Suggestie",
  "triggers": ["emotie-gerelateerde", "woorden"]
}

Focus op Nederlandse therapeutische context met empathie en begrip.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1-2025-04-14',
          messages: [
            { role: 'system', content: 'Je bent een empathische therapeutische AI die helpt met emotionele ondersteuning in het Nederlands.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error: ${response.status} - ${errorData?.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          
          const result: EmotionDetection = {
            emotion: parsed.emotion || 'neutral',
            confidence: Math.max(0.1, Math.min(1, parsed.confidence || 0.7)),
            response: parsed.response || 'Ik begrijp je en ben hier om te helpen.',
            reasoning: parsed.reasoning || 'Neural processing',
            label: parsed.label || 'Valideren',
            triggers: Array.isArray(parsed.triggers) ? parsed.triggers : [parsed.emotion || 'neutral'],
            meta: 'OpenAI GPT-4.1',
            symbolicInferences: [`🧠 Neural: ${parsed.emotion}`, `📊 Confidence: ${Math.round((parsed.confidence || 0.7) * 100)}%`]
          };

          console.log('✅ OpenAI emotion detection complete:', result.emotion);
          return result;
        } else {
          throw new Error('Could not parse JSON from OpenAI response');
        }
      } catch (parseError) {
        console.warn('⚠️ JSON parsing failed, using fallback response');
        return {
          emotion: 'neutral',
          confidence: 0.6,
          response: content.length > 200 ? content.substring(0, 200) + '...' : content,
          reasoning: 'Fallback processing',
          label: 'Valideren',
          triggers: ['neutral'],
          meta: 'OpenAI GPT-4.1 (fallback)',
          symbolicInferences: ['🧠 Neural processing (fallback)']
        };
      }
    } catch (error) {
      console.error('🔴 OpenAI emotion detection failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    detectEmotion,
    isLoading
  };
}
