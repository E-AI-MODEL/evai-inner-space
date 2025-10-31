import { supabase } from '@/integrations/supabase/client';
import type { BiasReport, BlindspotSeverity } from '@/types/ngbse';

/**
 * Checks AI response for various types of bias using LLM
 */
export async function checkForBias(
  userInput: string,
  aiResponse: string
): Promise<BiasReport> {
  try {
    const { data, error } = await supabase.functions.invoke('evai-core', {
      body: {
        operation: 'bias-check',
        text: aiResponse,
        context: userInput,
      },
    });

    if (error) {
      console.error('❌ Bias check failed:', error);
      return {
        detected: false,
        types: [],
        severity: 'low',
        description: 'Bias check kon niet worden uitgevoerd',
        confidence: 0,
      };
    }

    return data as BiasReport;
  } catch (error) {
    console.error('❌ Bias checker error:', error);
    return {
      detected: false,
      types: [],
      severity: 'low',
      description: 'Error tijdens bias check',
      confidence: 0,
    };
  }
}

/**
 * Heuristic-based bias detection (fallback when LLM unavailable)
 */
export function detectBiasHeuristic(aiResponse: string): BiasReport {
  const biasTypes: string[] = [];
  let maxSeverity: BlindspotSeverity = 'low';
  const descriptions: string[] = [];

  // Gender bias patterns
  const genderPatterns = [
    { pattern: /(mannen|vrouwen) (zijn|doen meestal)/i, type: 'gender' },
    { pattern: /typisch (mannelijk|vrouwelijk)/i, type: 'gender' },
  ];

  for (const { pattern, type } of genderPatterns) {
    if (pattern.test(aiResponse)) {
      biasTypes.push(type);
      descriptions.push('Gender stereotypering gedetecteerd');
      maxSeverity = 'medium';
    }
  }

  // Age bias patterns
  const agePatterns = [
    { pattern: /(jong|oud)e mensen (zijn|doen)/i, type: 'age' },
    { pattern: /op jouw leeftijd/i, type: 'age' },
  ];

  for (const { pattern, type } of agePatterns) {
    if (pattern.test(aiResponse)) {
      biasTypes.push(type);
      descriptions.push('Leeftijdsassumptie gedetecteerd');
      maxSeverity = 'low';
    }
  }

  // Cultural bias patterns
  const culturalPatterns = [
    { pattern: /in onze cultuur/i, type: 'cultural' },
    { pattern: /(normaal|gebruikelijk) is om/i, type: 'cultural' },
  ];

  for (const { pattern, type } of culturalPatterns) {
    if (pattern.test(aiResponse)) {
      biasTypes.push(type);
      descriptions.push('Culturele assumptie gedetecteerd');
      maxSeverity = Math.max(maxSeverity === 'medium' ? 1 : 0, 1) === 1 ? 'medium' : maxSeverity as BlindspotSeverity;
    }
  }

  const detected = biasTypes.length > 0;

  return {
    detected,
    types: [...new Set(biasTypes)], // Remove duplicates
    severity: detected ? maxSeverity : 'low',
    description: descriptions.join('; ') || 'Geen bias gedetecteerd',
    confidence: detected ? 0.65 : 0.90,
  };
}
