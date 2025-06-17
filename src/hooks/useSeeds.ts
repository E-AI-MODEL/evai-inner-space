
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdvancedSeed } from '@/types/seed';
import type { Database } from '@/integrations/supabase/types';

export function useSeeds() {
  return useQuery({
    queryKey: ['emotion-seeds'],
    queryFn: async (): Promise<AdvancedSeed[]> => {
      const { data, error } = await supabase
        .from('emotion_seeds')
        .select('*')
        .eq('active', true)
        .gt('expires_at', new Date().toISOString())
        .order('weight', { ascending: false });

      if (error) throw error;
      
      return (data ?? []).map((seed: Database['public']['Tables']['emotion_seeds']['Row']) => {
        // Parse meta as an object, with safe defaults
        const meta = (seed.meta as any) || {};
        const response = (seed.response as any) || { nl: '' };
        
        return {
          id: seed.id,
          emotion: seed.emotion,
          type: meta.type || 'validation',
          label: seed.label as AdvancedSeed['label'] || 'Valideren',
          triggers: meta.triggers || [],
          response: response,
          context: meta.context || { severity: 'medium' },
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
        } as AdvancedSeed;
      });
    },
    staleTime: 60 * 1000,
  });
}
