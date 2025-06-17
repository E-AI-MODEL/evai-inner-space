
import { supabase } from '@/integrations/supabase/client';
import { AdvancedSeed, SeedMeta, SeedResponse } from '../types/seed';
import type { Database } from '@/integrations/supabase/types';

export async function loadAdvancedSeeds(): Promise<AdvancedSeed[]> {
  try {
    const { data, error } = await supabase
      .from('emotion_seeds')
      .select('*')
      .eq('active', true)
      .order('weight', { ascending: false });

    if (error) throw error;

    return (data ?? []).map((seed: Database['public']['Tables']['emotion_seeds']['Row']) => {
      // Parse meta as an object with safe defaults
      const meta = (seed.meta as SeedMeta) || {};
      const response = (seed.response as SeedResponse) || { nl: '' };
      
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
        context: seed.context,
        triggers: seed.triggers,
        tags: seed.tags,
        type: seed.type,
        createdBy: seed.createdBy,
        version: seed.version,
        priority: seed.meta.priority,
        ttl: seed.meta.ttl,
        confidence: seed.meta.confidence,
        usageCount: seed.meta.usageCount,
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
        context: seed.context,
        triggers: seed.triggers,
        tags: seed.tags,
        type: seed.type,
        createdBy: seed.createdBy,
        version: seed.version,
        priority: seed.meta.priority,
        ttl: seed.meta.ttl,
        confidence: seed.meta.confidence,
        usageCount: seed.meta.usageCount,
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
