
import { useState } from 'react';

interface SeedMatchResult {
  emotion: string;
  response: string;
  confidence: number;
  label: 'Valideren' | 'Reflectievraag' | 'Suggestie';
}

export function useAdvancedSeedMatcher() {
  const [isMatching, setIsMatching] = useState(false);

  const matchAdvancedSeed = async (
    input: string,
    apiKey?: string
  ): Promise<SeedMatchResult | null> => {
    setIsMatching(true);
    
    try {
      console.log('🌱 Matching advanced seeds for:', input.substring(0, 50));
      
      // Mock advanced seed matching
      // In real implementation, this would query the emotion_seeds table
      const mockSeeds = [
        {
          emotion: 'stress',
          triggers: ['stress', 'onder druk', 'overweldigd'],
          response: 'Het klinkt alsof je veel op je bordje hebt. Laten we samen kijken hoe we dit kunnen aanpakken.',
          confidence: 0.9,
          label: 'Valideren' as const
        },
        {
          emotion: 'eenzaamheid',
          triggers: ['alleen', 'eenzaam', 'niemand'],
          response: 'Eenzaamheid kan heel pijnlijk zijn. Je bent niet de enige die dit voelt.',
          confidence: 0.85,
          label: 'Valideren' as const
        }
      ];

      const inputLower = input.toLowerCase();
      for (const seed of mockSeeds) {
        for (const trigger of seed.triggers) {
          if (inputLower.includes(trigger)) {
            console.log(`✅ Advanced seed match: ${seed.emotion}`);
            return {
              emotion: seed.emotion,
              response: seed.response,
              confidence: seed.confidence,
              label: seed.label
            };
          }
        }
      }

      console.log('❌ No advanced seed matches found');
      return null;
    } catch (error) {
      console.error('🔴 Advanced seed matching error:', error);
      return null;
    } finally {
      setIsMatching(false);
    }
  };

  return {
    matchAdvancedSeed,
    isMatching
  };
}
