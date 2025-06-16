
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
      const existingSeeds = loadAdvancedSeeds();
      
      if (existingSeeds.length === 0) {
        // Migrate legacy seeds
        const legacySeeds = seeds as LegacySeed[];
        const migratedSeeds = migrateLegacySeeds(legacySeeds);
        saveAdvancedSeeds(migratedSeeds);
        
        toast({
          title: "Advanced Seeds Bootstrapped",
          description: `${migratedSeeds.length} seeds migrated and activated`
        });
      }
      
      setBootstrapStatus(prev => ({ ...prev, advancedSeeds: true }));
      return true;
    } catch (error) {
      console.error('Advanced seeds bootstrap failed:', error);
      return false;
    }
  };

  const bootstrapLiveMonitoring = async () => {
    try {
      // Auto-start monitoring
      startMonitoring();
      setBootstrapStatus(prev => ({ ...prev, liveMonitoring: true }));
      
      toast({
        title: "Live Monitoring Started",
        description: "Real-time system monitoring is now active"
      });
      
      return true;
    } catch (error) {
      console.error('Live monitoring bootstrap failed:', error);
      return false;
    }
  };

  const bootstrapLearningEngine = async () => {
    try {
      // Load existing learning data
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
      // Rubrics are stateless, just mark as ready
      setBootstrapStatus(prev => ({ ...prev, rubrics: true }));
      return true;
    } catch (error) {
      console.error('Rubrics bootstrap failed:', error);
      return false;
    }
  };

  const bootstrapSeedInjection = async () => {
    try {
      // Seed injection is ready when advanced seeds are ready
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
      console.log('Starting system bootstrap...');
      
      // Bootstrap in correct order
      await bootstrapAdvancedSeeds();
      await bootstrapRubrics();
      await bootstrapLearningEngine();
      await bootstrapSeedInjection();
      await bootstrapLiveMonitoring();
      
      console.log('System bootstrap completed successfully');
      
      toast({
        title: "EvAI System Ready",
        description: "All advanced features have been activated"
      });
      
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
    const hasBootstrapped = localStorage.getItem('evai-bootstrapped');
    if (!hasBootstrapped) {
      runFullBootstrap().then(() => {
        localStorage.setItem('evai-bootstrapped', 'true');
      });
    } else {
      // Quick bootstrap for existing systems
      setBootstrapStatus({
        advancedSeeds: true,
        liveMonitoring: true,
        learningEngine: true,
        rubrics: true,
        seedInjection: true
      });
      startMonitoring();
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
