import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdvancedSeed } from '@/types/seed';

export function useSeeds() {
  return useQuery({
    queryKey: ['emotion-seeds'],
    queryFn: async (): Promise<AdvancedSeed[]> => {
      const { data, error } = await supabase
        .from('emotion_seeds')
        .select('*')
        .eq('active', true)
        .order('weight', { ascending: false });

      if (error) throw error;
      return (data ?? []).map((seed: any) => {
        const meta = seed.meta || {};
        const {
          context = { severity: 'medium' },
          triggers = [],
          tags = [],
          type = 'validation',
          createdBy = 'system',
          version = '1.0.0',
          ...restMeta
        } = meta;

        return {
          id: seed.id,
          emotion: seed.emotion,
          type,
          label: seed.label,
          triggers,
          response: seed.response,
          context,
          meta: {
            ...restMeta,
            weight: restMeta.weight ?? seed.weight ?? 1,
            lastUsed: restMeta.lastUsed ? new Date(restMeta.lastUsed) : undefined,
          },
          tags,
          createdAt: seed.created_at ? new Date(seed.created_at) : new Date(),
          updatedAt: seed.updated_at ? new Date(seed.updated_at) : new Date(),
          createdBy,
          isActive: seed.active ?? true,
          version,
        } as AdvancedSeed;
      });
    },
    staleTime: 60 * 1000,
  });
}
