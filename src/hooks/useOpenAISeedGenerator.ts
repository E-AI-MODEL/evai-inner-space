import { useState } from 'react';
import { AdvancedSeed } from '../types/seed';
import type { Message } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { addAdvancedSeed } from '../lib/advancedSeedStorage';

export interface SeedGenerationRequest {
  emotion: string;
  context: string;
  conversationHistory?: string[];
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export function useOpenAISeedGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateSeed = async (
    request: SeedGenerationRequest,
    apiKey: string
  ): Promise<AdvancedSeed | null> => {
    if (!apiKey || !apiKey.trim()) {
      console.log('🔴 OpenAI API key not available for seed generation');
      return null;
    }

    setIsGenerating(true);
    console.log('🌱 Starting OpenAI seed generation...', request);

    try {
      const prompt = `Je bent een expert in emotionele AI en therapeutische interventies. Genereer een geavanceerde seed voor de EvAI therapeutische chatbot.

Emotie: "${request.emotion}"
Context: "${request.context}"
Severity: "${request.severity || 'medium'}"
${request.conversationHistory ? `Gesprek geschiedenis: ${request.conversationHistory.join(' | ')}` : ''}

Maak een JSON object met deze structuur:
{
  "emotion": "exacte emotie naam",
  "type": "validation|reflection|suggestion|intervention",
  "label": "Valideren|Reflectievraag|Suggestie|Interventie", 
  "triggers": ["trigger1", "trigger2", "trigger3"],
  "response": {
    "nl": "empathische Nederlandse response (50-100 woorden)"
  },
  "context": {
    "severity": "low|medium|high|critical",
    "situation": "therapy"
  },
  "meta": {
    "priority": 1,
    "weight": 1.0,
    "confidence": 0.85
  },
  "tags": ["auto-generated", "openai", "therapeutisch"]
}

Focus op:
- Realistische Nederlandse triggers
- Empathische, validerende responses
- Therapeutisch verantwoorde inhoud
- Emotionele nuances`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1-2025-04-14',
          messages: [
            {
              role: 'system',
              content: 'Je bent een expert in emotionele AI en therapeutische seed generatie. Genereer alleen geldige JSON responses.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content received from OpenAI API');
      }

      console.log('🟢 OpenAI seed generation response:', content);

      // Parse JSON response
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const seedData = JSON.parse(jsonMatch[0]);
          
          const advancedSeed: AdvancedSeed = {
            id: uuidv4(),
            emotion: seedData.emotion,
            type: seedData.type || 'validation',
            label: seedData.label || 'Valideren',
            triggers: seedData.triggers || [request.emotion],
            response: seedData.response || { nl: seedData.response?.nl || 'Ik begrijp hoe je je voelt.' },
            context: {
              severity: seedData.context?.severity || request.severity || 'medium',
              situation: 'therapy'
            },
            meta: {
              priority: seedData.meta?.priority || 1,
              weight: seedData.meta?.weight || 1.0,
              confidence: seedData.meta?.confidence || 0.8,
              usageCount: 0
            },
            tags: [...(seedData.tags || []), 'openai-generated'],
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: 'ai',
            isActive: true,
            version: '1.0.0'
          };

          console.log('✅ OpenAI seed generated successfully:', advancedSeed);
          return advancedSeed;
        } else {
          throw new Error('Invalid JSON format in OpenAI response');
        }
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        // Fallback seed
        return {
          id: uuidv4(),
          emotion: request.emotion,
          type: 'validation',
          label: 'Valideren',
          triggers: [request.emotion],
          response: { nl: content.substring(0, 100) + '...' },
          context: {
            severity: request.severity || 'medium',
            situation: 'therapy'
          },
          meta: {
            priority: 1,
            weight: 1.0,
            confidence: 0.7,
            usageCount: 0
          },
          tags: ['openai-generated', 'fallback'],
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'ai',
          isActive: true,
          version: '1.0.0'
        };
      }

    } catch (error) {
      console.error('🔴 OpenAI seed generation error:', error);
      throw new Error(`OpenAI seed generatie fout: ${error instanceof Error ? error.message : 'Onbekende fout'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const analyzeConversationForSeeds = async (
    messages: Message[],
    apiKey: string
  ): Promise<string[]> => {
    if (!apiKey || !apiKey.trim()) return [];

    setIsGenerating(true);
    console.log('🔍 Analyzing conversation for missing seeds...');

    try {
      const conversationText = messages
        .filter(m => m.from === 'user')
        .map(m => m.content)
        .slice(-5) // Laatste 5 berichten
        .join('\n');

      const prompt = `Analyseer deze therapeutische conversatie en identificeer emoties waar nog geen seeds voor bestaan:

Conversatie:
${conversationText}

Geef een JSON array terug met emoties die vaak voorkomen maar mogelijk nog geen seeds hebben:
["emotie1", "emotie2", "emotie3"]

Focus op Nederlandse emoties die therapeutisch relevant zijn.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1-2025-04-14',
          messages: [
            {
              role: 'system',
              content: 'Je bent een expert in conversatie analyse voor therapeutische AI. Geef alleen JSON arrays terug.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.5,
          max_tokens: 200,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      try {
        const emotions = JSON.parse(content);
        console.log('✅ Found missing emotions:', emotions);
        return Array.isArray(emotions) ? emotions : [];
      } catch (parseError) {
        console.error('Failed to parse emotions analysis:', parseError);
        return [];
      }

    } catch (error) {
      console.error('🔴 Conversation analysis error:', error);
      return [];
    } finally {
      setIsGenerating(false);
    }
  };

  const injectSeedToDatabase = async (seed: AdvancedSeed): Promise<boolean> => {
    try {
      await addAdvancedSeed(seed);
      console.log('✅ Seed injected to database:', seed.emotion);
      return true;
    } catch (error) {
      console.error('🔴 Seed injection failed:', error);
      return false;
    }
  };

  return {
    generateSeed,
    analyzeConversationForSeeds,
    injectSeedToDatabase,
    isGenerating
  };
}
