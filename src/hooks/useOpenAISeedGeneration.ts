
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AdvancedSeed } from '../types/seed';
import { SeedGenerationRequest, OpenAISeedGeneratorConfig } from '../types/openAISeedGenerator';

const DEFAULT_CONFIG: OpenAISeedGeneratorConfig = {
  model: 'gpt-4.1-2025-04-14',
  temperature: 0.7,
  maxTokens: 500,
  defaultTTL: 43200 // 30 days in minutes
};

export function useOpenAISeedGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateSeed = async (
    request: SeedGenerationRequest,
    apiKey: string,
    config: Partial<OpenAISeedGeneratorConfig> = {}
  ): Promise<AdvancedSeed | null> => {
    if (!apiKey || !apiKey.trim()) {
      console.log('🔴 OpenAI API key not available for seed generation');
      return null;
    }

    setIsGenerating(true);
    console.log('🌱 Starting OpenAI seed generation...', request);

    const finalConfig = { ...DEFAULT_CONFIG, ...config };

    try {
      const prompt = buildGenerationPrompt(request);
      const response = await callOpenAI(prompt, apiKey, finalConfig);
      
      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content received from OpenAI API');
      }

      console.log('🟢 OpenAI seed generation response:', content);
      return parseGeneratedSeed(content, request);

    } catch (error) {
      console.error('🔴 OpenAI seed generation error:', error);
      throw new Error(`OpenAI seed generatie fout: ${error instanceof Error ? error.message : 'Onbekende fout'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const buildGenerationPrompt = (request: SeedGenerationRequest): string => {
    return `Je bent een expert in emotionele AI en therapeutische interventies. Genereer een geavanceerde seed voor de EvAI therapeutische chatbot.

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
    "ttl": 43200,
    "confidence": 0.85
  },
  "tags": ["auto-generated", "openai", "therapeutisch"]
}

Focus op:
- Realistische Nederlandse triggers
- Empathische, validerende responses
- Therapeutisch verantwoorde inhoud
- Emotionele nuances`;
  };

  const callOpenAI = async (
    prompt: string, 
    apiKey: string, 
    config: OpenAISeedGeneratorConfig
  ): Promise<Response> => {
    return fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
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
        temperature: config.temperature,
        max_tokens: config.maxTokens,
      }),
    });
  };

  const parseGeneratedSeed = (content: string, request: SeedGenerationRequest): AdvancedSeed => {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const seedData = JSON.parse(jsonMatch[0]);
        
        return {
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
            ttl: seedData.meta?.ttl || DEFAULT_CONFIG.defaultTTL,
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
          ttl: DEFAULT_CONFIG.defaultTTL,
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
  };

  return {
    generateSeed,
    isGenerating
  };
}
