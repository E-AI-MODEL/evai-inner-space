
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
      id: seed.id,
      emotion: seed.emotion,
      type: 'validation', // Default type, adjust based on your data
      label: seed.label || 'Valideren',
      triggers: [], // You'll need to extract this from your data structure
      response: seed.response || { nl: '' },
      context: {
        severity: 'medium', // Default, adjust based on your data
        situation: 'therapy'
      },
      meta: {
        priority: 1,
        weight: seed.weight || 1.0,
        confidence: 0.8,
        usageCount: seed.meta?.usageCount || 0,
        lastUsed: seed.meta?.lastUsed ? new Date(seed.meta.lastUsed) : undefined
      },
      tags: [],
      createdAt: seed.created_at ? new Date(seed.created_at) : new Date(),
      updatedAt: seed.updated_at ? new Date(seed.updated_at) : new Date(),
      createdBy: 'system',
      isActive: seed.active ?? true,
      version: '1.0.0'
    }));
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
      meta: seed.meta ? {
        ...seed.meta,
        lastUsed: seed.meta.lastUsed?.toISOString()
      } : null,
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
      meta: seed.meta ? {
        ...seed.meta,
        lastUsed: seed.meta.lastUsed?.toISOString()
      } : null,
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
