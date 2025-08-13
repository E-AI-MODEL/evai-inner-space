import { useState } from 'react';
import { incrementApiUsage } from '@/utils/apiUsageTracker';
import { v4 as uuidv4 } from 'uuid';
import { AdvancedSeed } from '../types/seed';
import { SeedGenerationRequest, OpenAISeedGeneratorConfig } from '../types/openAISeedGenerator';
import { OPENAI_MODEL } from '../openaiConfig';
import { supabase } from '@/integrations/supabase/client';

const DEFAULT_CONFIG: OpenAISeedGeneratorConfig = {
  model: OPENAI_MODEL,
  temperature: 0.8, // Increased for more variety
  maxTokens: 600,
  defaultTTL: 43200
};

// Enhanced type weights for better distribution
const SEED_TYPE_WEIGHTS = {
  validation: 0.25,    // 25% - Basic emotional validation
  reflection: 0.35,    // 35% - Therapeutic questioning 
  suggestion: 0.25,    // 25% - Actionable advice
  intervention: 0.15   // 15% - Crisis/urgent situations
};

// Severity-based type preferences
const SEVERITY_TYPE_MAPPING = {
  low: ['validation', 'reflection'],
  medium: ['validation', 'reflection', 'suggestion'],
  high: ['reflection', 'suggestion', 'intervention'],
  critical: ['intervention', 'suggestion']
};

export function useEnhancedSeedGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);

  const selectOptimalSeedType = (
    emotion: string, 
    severity: 'low' | 'medium' | 'high' | 'critical',
    context?: string
  ): { type: AdvancedSeed['type']; label: AdvancedSeed['label'] } => {
    // Get preferred types for severity level
    const preferredTypes = SEVERITY_TYPE_MAPPING[severity];
    
    // Context-based type hints
    const contextHints = {
      crisis: 'intervention',
      question: 'reflection', 
      advice: 'suggestion',
      support: 'validation'
    };
    
    // Check for context hints
    let selectedType: AdvancedSeed['type'] = 'validation';
    
    if (context) {
      const contextLower = context.toLowerCase();
      for (const [hint, type] of Object.entries(contextHints)) {
        if (contextLower.includes(hint) && preferredTypes.includes(type as any)) {
          selectedType = type as AdvancedSeed['type'];
          break;
        }
      }
    }
    
    // If no context hint, use weighted random selection from preferred types
    if (selectedType === 'validation' && preferredTypes.length > 1) {
      const weights = preferredTypes.map(type => SEED_TYPE_WEIGHTS[type as keyof typeof SEED_TYPE_WEIGHTS]);
      const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
      const random = Math.random() * totalWeight;
      
      let accumulatedWeight = 0;
      for (let i = 0; i < preferredTypes.length; i++) {
        accumulatedWeight += weights[i];
        if (random <= accumulatedWeight) {
          selectedType = preferredTypes[i] as AdvancedSeed['type'];
          break;
        }
      }
    }

    // Map type to Dutch label
    const typeToLabel: Record<AdvancedSeed['type'], AdvancedSeed['label']> = {
      validation: 'Valideren',
      reflection: 'Reflectievraag', 
      suggestion: 'Suggestie',
      intervention: 'Interventie',
      error: 'Fout'
    };
    
    return {
      type: selectedType,
      label: typeToLabel[selectedType]
    };
  };

  const buildEnhancedPrompt = (
    request: SeedGenerationRequest,
    targetType: AdvancedSeed['type'],
    targetLabel: AdvancedSeed['label']
  ): string => {
    const typeSpecificInstructions = {
      validation: `
        - Erken en valideer de emotie zonder oordeel
        - Gebruik empathische bevestiging ("Het is begrijpelijk dat...")
        - Normaliseer de ervaring ("Veel mensen voelen...")
        - Bied emotionele steun en begrip`,
      
      reflection: `
        - Stel open, nieuwsgierige vragen die tot inzicht leiden
        - Gebruik "Wat zou er gebeuren als..." of "Hoe zou het zijn om..."
        - Help de persoon dieper na te denken over hun situatie
        - Stimuleer zelf-ontdekking en bewustwording`,
      
      suggestion: `
        - Bied concrete, haalbare actiestappen
        - Geef praktische coping strategieën
        - Stel gezonde alternatieven voor
        - Focus op oplossingsgerichte aanpak`,
      
      intervention: `
        - Bied directe, ondersteunende begeleiding
        - Focus op stabilisatie en veiligheid
        - Geef duidelijke, geruststellende instructies
        - Moedig professionele hulp aan indien nodig`
    };

    return `Je bent een expert therapeut die gespecialiseerde emotionele ondersteuning biedt. Genereer een ${targetType} seed (${targetLabel}) voor therapeutische AI.

CONTEXT:
- Emotie: "${request.emotion}"
- Situatie: "${request.context}"
- Severity: "${request.severity || 'medium'}"
- Type: ${targetType} (${targetLabel})
${request.conversationHistory ? `- Gespreksgeschiedenis: ${request.conversationHistory.join(' | ')}` : ''}

SPECIFIEKE INSTRUCTIES VOOR ${targetType.toUpperCase()}:
${typeSpecificInstructions[targetType]}

Genereer een JSON object met deze exacte structuur:
{
  "emotion": "${request.emotion}",
  "type": "${targetType}",
  "label": "${targetLabel}",
  "triggers": [3-5 realistische Nederlandse triggers],
  "response": {
    "nl": "Therapeutische ${targetType} response in het Nederlands (60-120 woorden)"
  },
  "context": {
    "severity": "${request.severity || 'medium'}",
    "situation": "therapy"
  },
  "meta": {
    "priority": ${request.severity === 'critical' ? 3 : request.severity === 'high' ? 2 : 1},
    "weight": ${SEED_TYPE_WEIGHTS[targetType]},
    "confidence": ${0.75 + Math.random() * 0.2},
    "ttl": 43200
  },
  "tags": ["enhanced-generation", "${targetType}", "${request.severity || 'medium'}-severity"]
}

BELANGRIJKE VEREISTEN:
- Response moet authentiek ${targetType} zijn, niet alleen validatie
- Gebruik natuurlijke, empathische Nederlandse taal
- Triggers moeten specifiek zijn voor de emotie
- Geen therapeutische jargon, wel professioneel
- Response moet direct toepasbaar zijn in gesprek`;
  };

  const generateEnhancedSeed = async (
    request: SeedGenerationRequest,
    apiKey: string,
    config: Partial<OpenAISeedGeneratorConfig> = {}
  ): Promise<AdvancedSeed | null> => {
    setIsGenerating(true);
    console.log('🌱 Starting enhanced seed generation...', request);

    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    
    // Determine optimal seed type and label
    const { type: targetType, label: targetLabel } = selectOptimalSeedType(
      request.emotion,
      request.severity || 'medium',
      request.context
    );

    console.log(`🎯 Target type: ${targetType} (${targetLabel}) for ${request.emotion}`);

    try {
      const prompt = buildEnhancedPrompt(request, targetType, targetLabel);

      const { data, error } = await supabase.functions.invoke('openai-chat', {
        body: {
          model: finalConfig.model,
          messages: [
            {
              role: 'system',
              content:
                'Je bent een expert therapeut gespecialiseerd in het genereren van diverse, therapeutisch verantwoorde emotionele ondersteuning. Genereer alleen geldige JSON responses met gevarieerde seed types.'
            },
            { role: 'user', content: prompt }
          ],
          temperature: finalConfig.temperature,
          max_tokens: finalConfig.maxTokens,
          response_format: { type: 'json_object' },
          use_secondary: false
        }
      });

      if (error) {
        throw new Error(error.message || 'OpenAI edge function error');
      }
      const payload: any = data;
      if (!payload?.ok) {
        const status = payload?.status;
        const err = payload?.error || 'Unknown error';
        throw new Error(`OpenAI edge error: ${err}${status ? ` (status ${status})` : ''}`);
      }

      const content: string = payload.content as string;
      if (!content) {
        throw new Error('No content received from Edge Function');
      }

      console.log('🟢 Enhanced seed generation response (edge):', content);
      return parseEnhancedSeed(content, request, targetType, targetLabel);

    } catch (error) {
      console.error('🔴 Enhanced seed generation error:', error);
      
      // Fallback with proper type distribution
      return createFallbackSeed(request, targetType, targetLabel);
    } finally {
      setIsGenerating(false);
    }
  };

  const callOpenAI = async (
    prompt: string,
    apiKey: string,
    config: OpenAISeedGeneratorConfig
  ): Promise<Response> => {
    incrementApiUsage('openai1');
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
            content: 'Je bent een expert therapeut gespecialiseerd in het genereren van diverse, therapeutisch verantwoorde emotionele ondersteuning. Genereer alleen geldige JSON responses met gevarieerde seed types.'
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

  const parseEnhancedSeed = (
    content: string, 
    request: SeedGenerationRequest,
    targetType: AdvancedSeed['type'],
    targetLabel: AdvancedSeed['label']
  ): AdvancedSeed => {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const seedData = JSON.parse(jsonMatch[0]);
        
        // Ensure type consistency
        const finalType = seedData.type || targetType;
        const finalLabel = seedData.label || targetLabel;
        
        return {
          id: uuidv4(),
          emotion: seedData.emotion || request.emotion,
          type: finalType,
          label: finalLabel,
          triggers: Array.isArray(seedData.triggers) ? seedData.triggers : [request.emotion],
          response: seedData.response || { nl: seedData.response?.nl || generateTypeSpecificFallback(finalType, request.emotion) },
          context: {
            severity: seedData.context?.severity || request.severity || 'medium',
            situation: 'therapy'
          },
          meta: {
            priority: seedData.meta?.priority || (request.severity === 'critical' ? 3 : request.severity === 'high' ? 2 : 1),
            weight: seedData.meta?.weight || SEED_TYPE_WEIGHTS[finalType],
            confidence: seedData.meta?.confidence || (0.75 + Math.random() * 0.2),
            ttl: seedData.meta?.ttl || DEFAULT_CONFIG.defaultTTL,
            usageCount: 0
          },
          tags: [...(seedData.tags || []), 'enhanced-generation', finalType],
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'ai',
          isActive: true,
          version: '2.0.0'
        };
      } else {
        throw new Error('Invalid JSON format in OpenAI response');
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return createFallbackSeed(request, targetType, targetLabel);
    }
  };

  const createFallbackSeed = (
    request: SeedGenerationRequest,
    targetType: AdvancedSeed['type'],
    targetLabel: AdvancedSeed['label']
  ): AdvancedSeed => {
    return {
      id: uuidv4(),
      emotion: request.emotion,
      type: targetType,
      label: targetLabel,
      triggers: [request.emotion],
      response: { nl: generateTypeSpecificFallback(targetType, request.emotion) },
      context: {
        severity: request.severity || 'medium',
        situation: 'therapy'
      },
      meta: {
        priority: 1,
        weight: SEED_TYPE_WEIGHTS[targetType],
        confidence: 0.7,
        ttl: DEFAULT_CONFIG.defaultTTL,
        usageCount: 0
      },
      tags: ['enhanced-fallback', targetType],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'ai',
      isActive: true,
      version: '2.0.0'
    };
  };

  const generateTypeSpecificFallback = (type: AdvancedSeed['type'], emotion: string): string => {
    const fallbacks = {
      validation: `Ik kan begrijpen dat je je ${emotion} voelt. Het is helemaal oké om deze emotie te ervaren.`,
      reflection: `Wat denk je dat je zou helpen om met dit gevoel van ${emotion} om te gaan?`,
      suggestion: `Probeer eens een paar diepe ademhalingen te nemen wanneer je je ${emotion} voelt.`,
      intervention: `Het lijkt erop dat je nu extra ondersteuning nodig hebt. Laten we samen kijken naar wat je kan helpen.`,
      error: `Er lijkt een fout opgetreden te zijn. Laten we proberen dit op te lossen.`
    };
    
    return fallbacks[type];
  };

  return {
    generateEnhancedSeed,
    selectOptimalSeedType,
    isGenerating,
    SEED_TYPE_WEIGHTS
  };
}
