
import { AdvancedSeed } from '../types/seed';

const ADVANCED_SEEDS_KEY = 'evai-advanced-seeds';

export function loadAdvancedSeeds(): AdvancedSeed[] {
  try {
    const stored = localStorage.getItem(ADVANCED_SEEDS_KEY);
    if (!stored) return [];
    
    const seeds = JSON.parse(stored);
    return seeds.map((seed: any) => ({
      ...seed,
      createdAt: new Date(seed.createdAt),
      updatedAt: new Date(seed.updatedAt),
      meta: {
        ...seed.meta,
        lastUsed: seed.meta.lastUsed ? new Date(seed.meta.lastUsed) : undefined
      }
    }));
  } catch (error) {
    console.error('Error loading advanced seeds:', error);
    return [];
  }
}

export function saveAdvancedSeeds(seeds: AdvancedSeed[]): void {
  try {
    localStorage.setItem(ADVANCED_SEEDS_KEY, JSON.stringify(seeds));
  } catch (error) {
    console.error('Error saving advanced seeds:', error);
  }
}

export function addAdvancedSeed(seed: AdvancedSeed): void {
  const seeds = loadAdvancedSeeds();
  seeds.push(seed);
  saveAdvancedSeeds(seeds);
}

export function updateAdvancedSeed(updatedSeed: AdvancedSeed): void {
  const seeds = loadAdvancedSeeds();
  const index = seeds.findIndex(s => s.id === updatedSeed.id);
  if (index !== -1) {
    seeds[index] = { ...updatedSeed, updatedAt: new Date() };
    saveAdvancedSeeds(seeds);
  }
}

export function deleteAdvancedSeed(seedId: string): void {
  const seeds = loadAdvancedSeeds();
  const filtered = seeds.filter(s => s.id !== seedId);
  saveAdvancedSeeds(filtered);
}

export function incrementSeedUsage(seedId: string): void {
  const seeds = loadAdvancedSeeds();
  const seed = seeds.find(s => s.id === seedId);
  if (seed) {
    seed.meta.usageCount += 1;
    seed.meta.lastUsed = new Date();
    saveAdvancedSeeds(seeds);
  }
}
