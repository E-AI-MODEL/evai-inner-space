
import { useState, useEffect } from 'react';
import { useLiveMonitoring } from './useLiveMonitoring';
import { useLearningEngine } from './useLearningEngine';
import { loadAdvancedSeeds, saveAdvancedSeeds } from '../lib/advancedSeedStorage';
import { migrateLegacySeeds } from '../utils/seedMigration';
import seeds from '../seeds.json';
import { LegacySeed } from '../types/seed';
import { toast } from '@/hooks/use-toast';

interface BootstrapStatus {
  advancedSeeds: boolean;
  liveMonitoring: boolean;
  learningEngine: boolean;
  rubrics: boolean;
  seedInjection: boolean;
}

export function useSystemBootstrap() {
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [bootstrapStatus, setBootstrapStatus] = useState<BootstrapStatus>({
    advancedSeeds: false,
    liveMonitoring: false,
    learningEngine: false,
    rubrics: false,
    seedInjection: false
  });
  
  const { startMonitoring } = useLiveMonitoring();
  const { loadLearningData } = useLearningEngine();

  const bootstrapAdvancedSeeds = async () => {
    try {
      console.log('Bootstrap: Starting advanced seeds bootstrap');
      let existingSeeds = loadAdvancedSeeds();
      console.log('Bootstrap: Existing seeds count:', existingSeeds.length);
      
      if (existingSeeds.length === 0) {
        console.log('Bootstrap: No existing seeds, migrating legacy seeds');
        const legacySeeds = seeds as LegacySeed[];
        const migratedSeeds = migrateLegacySeeds(legacySeeds);
        saveAdvancedSeeds(migratedSeeds);
        existingSeeds = migratedSeeds;
        
        console.log('Bootstrap: Migrated seeds:', migratedSeeds.length);
        toast({
          title: "Advanced Seeds Bootstrapped",
          description: `${migratedSeeds.length} seeds migrated and activated`
        });
      }
      
      console.log('Bootstrap: Advanced seeds ready, count:', existingSeeds.length);
      setBootstrapStatus(prev => ({ ...prev, advancedSeeds: true }));
      return true;
    } catch (error) {
      console.error('Advanced seeds bootstrap failed:', error);
      return false;
    }
  };

  const bootstrapLiveMonitoring = async () => {
    try {
      console.log('Bootstrap: Starting live monitoring');
      startMonitoring();
      setBootstrapStatus(prev => ({ ...prev, liveMonitoring: true }));
      return true;
    } catch (error) {
      console.error('Live monitoring bootstrap failed:', error);
      return false;
    }
  };

  const bootstrapLearningEngine = async () => {
    try {
      console.log('Bootstrap: Starting learning engine');
      loadLearningData();
      setBootstrapStatus(prev => ({ ...prev, learningEngine: true }));
      return true;
    } catch (error) {
      console.error('Learning engine bootstrap failed:', error);
      return false;
    }
  };

  const bootstrapRubrics = async () => {
    try {
      setBootstrapStatus(prev => ({ ...prev, rubrics: true }));
      return true;
    } catch (error) {
      console.error('Rubrics bootstrap failed:', error);
      return false;
    }
  };

  const bootstrapSeedInjection = async () => {
    try {
      setBootstrapStatus(prev => ({ ...prev, seedInjection: true }));
      return true;
    } catch (error) {
      console.error('Seed injection bootstrap failed:', error);
      return false;
    }
  };

  const runFullBootstrap = async () => {
    setIsBootstrapping(true);
    
    try {
      console.log('Bootstrap: Starting full system bootstrap...');
      
      // Bootstrap in correct order
      await bootstrapAdvancedSeeds();
      await bootstrapRubrics();
      await bootstrapLearningEngine();
      await bootstrapSeedInjection();
      await bootstrapLiveMonitoring();
      
      console.log('Bootstrap: System bootstrap completed successfully');
      
    } catch (error) {
      console.error('Bootstrap failed:', error);
      toast({
        title: "Bootstrap Failed",
        description: "Some features may not work properly",
        variant: "destructive"
      });
    } finally {
      setIsBootstrapping(false);
    }
  };

  // Auto-bootstrap on mount
  useEffect(() => {
    console.log('Bootstrap: useEffect triggered');
    const hasBootstrapped = localStorage.getItem('evai-bootstrapped');
    
    if (!hasBootstrapped) {
      console.log('Bootstrap: First time bootstrap');
      runFullBootstrap().then(() => {
        localStorage.setItem('evai-bootstrapped', 'true');
        console.log('Bootstrap: Bootstrap completed and marked');
      });
    } else {
      console.log('Bootstrap: Quick bootstrap (already done before)');
      // Quick bootstrap for existing systems
      bootstrapAdvancedSeeds().then(() => {
        setBootstrapStatus({
          advancedSeeds: true,
          liveMonitoring: true,
          learningEngine: true,
          rubrics: true,
          seedInjection: true
        });
        startMonitoring();
      });
    }
  }, []);

  const isSystemReady = Object.values(bootstrapStatus).every(status => status);

  return {
    isBootstrapping,
    bootstrapStatus,
    isSystemReady,
    runFullBootstrap
  };
}
