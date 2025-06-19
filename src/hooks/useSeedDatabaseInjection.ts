
import { useState } from 'react';
import { AdvancedSeed } from '../types/seed';
import { addAdvancedSeed } from '../lib/advancedSeedStorage';

export function useSeedDatabaseInjection() {
  const [isInjecting, setIsInjecting] = useState(false);

  const injectSeedToDatabase = async (seed: AdvancedSeed): Promise<boolean> => {
    setIsInjecting(true);
    
    try {
      await addAdvancedSeed(seed);
      console.log('✅ Seed injected to database:', seed.emotion);
      return true;
    } catch (error) {
      console.error('🔴 Seed injection failed:', error);
      return false;
    } finally {
      setIsInjecting(false);
    }
  };

  return {
    injectSeedToDatabase,
    isInjecting
  };
}
