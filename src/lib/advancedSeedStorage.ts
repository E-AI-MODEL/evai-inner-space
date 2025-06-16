import { supabase } from '@/integrations/supabase/client';
import { AdvancedSeed } from '../types/seed';

export async function loadAdvancedSeeds(): Promise<AdvancedSeed[]> {
  try {
    const { data, error } = await supabase
      .from('emotion_seeds')
      .select('*')
      .eq('active', true)
      .order('weight', { ascending: false });

    if (error) throw error;

    return (data ?? []).map((seed: any) => ({
      ...seed,
      createdAt: seed.created_at ? new Date(seed.created_at) : new Date(),
      updatedAt: seed.updated_at ? new Date(seed.updated_at) : new Date(),
    }));
  } catch (error) {
    console.error('Error loading advanced seeds:', error);
    return [];
  }
}

export async function addAdvancedSeed(seed: AdvancedSeed): Promise<void> {
  const { error } = await supabase.from('emotion_seeds').insert({
    ...seed,
    created_at: seed.createdAt.toISOString(),
    updated_at: seed.updatedAt.toISOString(),
  });
  if (error) console.error('Error adding advanced seed:', error);
}

export async function updateAdvancedSeed(seed: AdvancedSeed): Promise<void> {
  const { error } = await supabase
    .from('emotion_seeds')
    .update({ ...seed, updated_at: new Date().toISOString() })
    .eq('id', seed.id);
  if (error) console.error('Error updating advanced seed:', error);
}

export async function deleteAdvancedSeed(seedId: string): Promise<void> {
  const { error } = await supabase.from('emotion_seeds').delete().eq('id', seedId);
  if (error) console.error('Error deleting advanced seed:', error);
}

export async function incrementSeedUsage(seedId: string): Promise<void> {
  const { error } = await supabase.rpc('increment_seed_usage', { seed_id: seedId });
  if (error) console.error('Error incrementing seed usage:', error);
}
