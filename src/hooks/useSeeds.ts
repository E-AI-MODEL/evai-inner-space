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
      return (data ?? []).map((seed: Database['public']['Tables']['emotion_seeds']['Row']) => ({
        ...seed,
        createdAt: seed.created_at ? new Date(seed.created_at) : new Date(),
        updatedAt: seed.updated_at ? new Date(seed.updated_at) : new Date(),
      }));
    },
    staleTime: 60 * 1000,
  });
}
