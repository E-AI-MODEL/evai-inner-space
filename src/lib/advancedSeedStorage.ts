
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
  } catch (error) {
    console.error('Error loading advanced seeds:', error);
    return [];
  }
}

export async function addAdvancedSeed(seed: AdvancedSeed): Promise<void> {
  try {
    // Convert the AdvancedSeed to the database format
    const dbSeed = {
      id: seed.id,
      emotion: seed.emotion,
      label: seed.label,
      weight: seed.meta.weight,
      active: seed.isActive,
      expires_at: null, // AdvancedSeed doesn't have expiresAt property
      meta: {
        ...seed.meta,
        context: seed.context,
        triggers: seed.triggers,
        tags: seed.tags,
        type: seed.type,
        createdBy: seed.createdBy,
        version: seed.version,
        lastUsed: seed.meta.lastUsed?.toISOString(),
      },
      response: seed.response,
      created_at: seed.createdAt.toISOString(),
      updated_at: seed.updatedAt.toISOString(),
    };

    const { error } = await supabase.from('emotion_seeds').insert(dbSeed);
    if (error) {
      console.error('Error adding advanced seed:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error adding advanced seed:', error);
    throw error;
  }
}

export async function updateAdvancedSeed(seed: AdvancedSeed): Promise<void> {
  try {
    // Convert the AdvancedSeed to the database format
    const dbSeed = {
      emotion: seed.emotion,
      label: seed.label,
      weight: seed.meta.weight,
      active: seed.isActive,
      expires_at: null, // AdvancedSeed doesn't have expiresAt property
      meta: {
        ...seed.meta,
        context: seed.context,
        triggers: seed.triggers,
        tags: seed.tags,
        type: seed.type,
        createdBy: seed.createdBy,
        version: seed.version,
        lastUsed: seed.meta.lastUsed?.toISOString(),
      },
      response: seed.response,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('emotion_seeds')
      .update(dbSeed)
      .eq('id', seed.id);
      
    if (error) {
      console.error('Error updating advanced seed:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error updating advanced seed:', error);
    throw error;
  }
}

export async function deleteAdvancedSeed(seedId: string): Promise<void> {
  try {
    const { error } = await supabase.from('emotion_seeds').delete().eq('id', seedId);
    if (error) {
      console.error('Error deleting advanced seed:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error deleting advanced seed:', error);
    throw error;
  }
}

export async function incrementSeedUsage(seedId: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('increment_seed_usage', { seed_id: seedId });
    if (error) {
      console.error('Error incrementing seed usage:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error incrementing seed usage:', error);
    throw error;
  }
}
