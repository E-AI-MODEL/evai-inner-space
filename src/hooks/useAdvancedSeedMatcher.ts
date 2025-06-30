
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

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
      
      const { data, error } = await supabase
        .from("emotion_seeds")
        .select("emotion, label, response, meta")
        .eq("active", true);

      if (error) {
        console.error("❌ Supabase seed fetch error:", error);
        return null;
      }

const inputLower = input.toLowerCase();
      for (const row of (data as Database['public']['Tables']['emotion_seeds']['Row'][] | null) || []) {
        const meta = (row.meta as any) || {};
        const triggers: string[] = meta.triggers || [];
        for (const trigger of triggers) {
          if (inputLower.includes(trigger.toLowerCase())) {
            console.log(`✅ Advanced seed match: ${row.emotion}`);
            return {
              emotion: row.emotion,
              response: (row.response as any)?.nl || '',
              confidence: meta.confidence || 0.8,
              label: (row.label as SeedMatchResult['label']) || 'Valideren'
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
