
import { useState } from 'react';
import { useOpenAI } from './useOpenAI';
import { ExpiredSeedBatch } from './useExpiredSeedDetector';
import { Message } from '../types';

export interface ReflectionQuestion {
  id: string;
  emotion: string;
  question: string;
  context: string;
  confidence: number;
  generatedAt: Date;
  batchInfo: {
    seedCount: number;
    averageUsage: number;
  };
}

export function useReflectionQuestionGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { generateResponse } = useOpenAI();

  const generateReflectionQuestion = async (
    batch: ExpiredSeedBatch,
    conversationHistory: Message[],
    apiKey: string
  ): Promise<ReflectionQuestion | null> => {
    if (!apiKey || !apiKey.trim()) {
      console.log('🔴 No API key available for reflection question generation');
      return null;
    }

    setIsGenerating(true);
    console.log(`🤔 Generating reflection question for emotion: ${batch.emotion}`);

    try {
      // Build context from expired seeds
      const seedContexts = batch.expiredSeeds.map(seed => ({
        triggers: seed.triggers.join(', '),
        response: seed.response.nl,
        usage: seed.meta.usageCount || 0,
        severity: seed.context.severity
      }));

      // Build conversation context
      const recentConversation = conversationHistory
        .slice(-6)
        .map(msg => `${msg.from}: ${msg.content}`)
        .join('\n');

      const prompt = `Je bent een therapeutische AI die reflectievragen genereert op basis van verlopende emotionele seeds.

CONTEXT:
- Emotie: "${batch.emotion}"
- Aantal verlopende seeds: ${batch.totalCount}
- Gemiddeld gebruik: ${batch.averageUsage.toFixed(1)} keer
- Recente conversatie:
${recentConversation}

SEED PATRONEN:
${seedContexts.map(ctx => `- Triggers: ${ctx.triggers} | Gebruik: ${ctx.usage}x | Ernst: ${ctx.severity}`).join('\n')}

TAAK:
Genereer een diepgaande reflectievraag die:
1. De emotie "${batch.emotion}" verkent
2. Rekening houdt met de gebruikspatronen van de verlopende seeds
3. Aansluit bij de recente conversatie
4. Therapeutische zelfreflectie stimuleert
5. In het Nederlands is (50-80 woorden)

Geef het resultaat als JSON:
{
  "question": "Jouw reflectievraag hier...",
  "context": "Korte uitleg waarom deze vraag relevant is",
  "confidence": 0.85
}`;

      const response = await generateResponse(prompt, apiKey, {
        temperature: 0.8,
        maxTokens: 300
      });

      if (!response) {
        throw new Error('No response received from OpenAI');
      }

      try {
        // Try to parse JSON from the response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in response');
        }

        const parsed = JSON.parse(jsonMatch[0]);
        
        const reflectionQuestion: ReflectionQuestion = {
          id: `reflection-${batch.emotion}-${Date.now()}`,
          emotion: batch.emotion,
          question: parsed.question || response.substring(0, 200),
          context: parsed.context || `Gebaseerd op ${batch.totalCount} verlopende seeds voor ${batch.emotion}`,
          confidence: typeof parsed.confidence === 'number' ? Math.max(0.1, Math.min(1, parsed.confidence)) : 0.75,
          generatedAt: new Date(),
          batchInfo: {
            seedCount: batch.totalCount,
            averageUsage: batch.averageUsage
          }
        };

        console.log(`✅ Generated reflection question for ${batch.emotion}:`, reflectionQuestion.question.substring(0, 50) + '...');
        return reflectionQuestion;

      } catch (parseError) {
        // Fallback: create question from raw response
        console.log('⚠️ JSON parsing failed, using raw response');
        
        return {
          id: `reflection-${batch.emotion}-${Date.now()}`,
          emotion: batch.emotion,
          question: response.substring(0, 200).trim(),
          context: `Automatisch gegenereerd op basis van ${batch.totalCount} verlopende seeds`,
          confidence: 0.70,
          generatedAt: new Date(),
          batchInfo: {
            seedCount: batch.totalCount,
            averageUsage: batch.averageUsage
          }
        };
      }

    } catch (error) {
      console.error('🔴 Error generating reflection question:', error);
      
      // Emergency fallback question
      const fallbackQuestions = {
        'angst': 'Wat heb je geleerd over je angstgevoelens in onze gesprekken? Welke patronen zie je?',
        'verdriet': 'Hoe is je omgang met verdriet veranderd door onze gesprekken? Wat heeft je het meest geholpen?',
        'stress': 'Welke stresspatronen herken je nu beter in jezelf? Wat zou je anders willen aanpakken?',
        'eenzaamheid': 'Hoe denk je nu over verbinding maken met anderen? Wat heb je over jezelf ontdekt?',
        'woede': 'Wat heb je geleerd over je woede en hoe je ermee omgaat? Welke inzichten zijn belangrijk voor je?'
      };

      const fallbackQuestion = fallbackQuestions[batch.emotion as keyof typeof fallbackQuestions] || 
        `Wat heb je geleerd over je ${batch.emotion} in onze gesprekken? Welke inzichten neem je mee?`;

      return {
        id: `reflection-fallback-${batch.emotion}-${Date.now()}`,
        emotion: batch.emotion,
        question: fallbackQuestion,
        context: `Fallback reflectievraag na ${batch.totalCount} verlopende seeds`,
        confidence: 0.60,
        generatedAt: new Date(),
        batchInfo: {
          seedCount: batch.totalCount,
          averageUsage: batch.averageUsage
        }
      };
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateReflectionQuestion,
    isGenerating
  };
}
