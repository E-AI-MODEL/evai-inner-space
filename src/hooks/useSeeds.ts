
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdvancedSeed, SeedMeta, SeedResponse } from '@/types/seed';
import type { Database } from '@/integrations/supabase/types';

export function useSeeds() {
  return useQuery({
    queryKey: ['emotion-seeds'],
    queryFn: async (): Promise<AdvancedSeed[]> => {
      console.log('🔄 Fetching seeds from Supabase...');
      
      const { data, error } = await supabase
        .from('emotion_seeds')
        .select('*')
        .eq('active', true)
        .gt('expires_at', new Date().toISOString())
        .order('weight', { ascending: false });

      if (error) {
        console.error('🔴 Supabase seed fetch error:', error);
        throw error;
      }
      
      console.log(`✅ Fetched ${data?.length || 0} seeds from Supabase`);
      
      return (data ?? []).map((seed: Database['public']['Tables']['emotion_seeds']['Row']) => {
        try {
          // Parse meta as an object, with safe defaults
          const meta = (seed.meta as SeedMeta) || {};
          const response = (seed.response as unknown as SeedResponse) || { nl: '' };
          
          const advancedSeed: AdvancedSeed = {
            id: seed.id,
            emotion: seed.emotion,
            type: meta.type || 'validation',
            label: seed.label as AdvancedSeed['label'] || 'Valideren',
            triggers: meta.triggers || [],
            response: response,
            context: { 
              severity: meta.context?.severity || 'medium',
              userAge: meta.context?.userAge,
              timeOfDay: meta.context?.timeOfDay,
              situation: meta.context?.situation
            },
            meta: {
              priority: meta.priority || 1,
              ttl: meta.ttl,
              weight: seed.weight || 1.0,
              confidence: meta.confidence || 0.8,
              lastUsed: meta.lastUsed ? new Date(meta.lastUsed) : undefined,
              usageCount: meta.usageCount || 0
            },
            tags: meta.tags || [],
            createdAt: seed.created_at ? new Date(seed.created_at) : new Date(),
            updatedAt: seed.updated_at ? new Date(seed.updated_at) : new Date(),
            createdBy: meta.createdBy || 'system',
            isActive: seed.active ?? true,
            version: meta.version || '1.0.0'
          };
          
          console.log(`🌱 Processed seed: ${advancedSeed.emotion} (${advancedSeed.triggers.length} triggers)`);
          return advancedSeed;
        } catch (parseError) {
          console.error('🔴 Error parsing seed:', seed.id, parseError);
          // Return a fallback seed to prevent crashes
          return {
            id: seed.id,
            emotion: seed.emotion || 'unknown',
            type: 'validation',
            label: 'Valideren',
            triggers: [seed.emotion || 'unknown'],
            response: { nl: 'Ik begrijp hoe je je voelt.' },
            context: { severity: 'medium' },
            meta: {
              priority: 1,
              weight: seed.weight || 1.0,
              confidence: 0.5,
              usageCount: 0
            },
            tags: ['error-fallback'],
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: 'system',
            isActive: true,
            version: '1.0.0'
          } as AdvancedSeed;
        }
      });
    },
    staleTime: 60 * 1000,
    retry: 3,
    retryDelay: 1000,
  });
}
