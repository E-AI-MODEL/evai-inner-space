
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type RubricStrictnessLevel = 'flexible' | 'moderate' | 'strict';

export interface RubricStrictnessConfig {
  level: RubricStrictnessLevel;
  thresholds: {
    riskAlert: number;
    overallRiskHigh: number;
    overallRiskModerate: number;
    protectiveFactorsMin: number;
    interventionTrigger: number;
  };
  weights: {
    riskMultiplier: number;
    protectiveMultiplier: number;
  };
}

const STRICTNESS_CONFIGS: Record<RubricStrictnessLevel, RubricStrictnessConfig> = {
  flexible: {
    level: 'flexible',
    thresholds: {
      riskAlert: 3.0,
      overallRiskHigh: 70,
      overallRiskModerate: 40,
      protectiveFactorsMin: 2,
      interventionTrigger: 2.5
    },
    weights: {
      riskMultiplier: 0.8,
      protectiveMultiplier: 1.2
    }
  },
  moderate: {
    level: 'moderate',
    thresholds: {
      riskAlert: 2.0,
      overallRiskHigh: 60,
      overallRiskModerate: 30,
      protectiveFactorsMin: 3,
      interventionTrigger: 2.0
    },
    weights: {
      riskMultiplier: 1.0,
      protectiveMultiplier: 1.0
    }
  },
  strict: {
    level: 'strict',
    thresholds: {
      riskAlert: 1.5,
      overallRiskHigh: 50,
      overallRiskModerate: 20,
      protectiveFactorsMin: 4,
      interventionTrigger: 1.5
    },
    weights: {
      riskMultiplier: 1.3,
      protectiveMultiplier: 0.8
    }
  }
};

export function useRubricSettings() {
  const [config, setConfig] = useState<RubricStrictnessConfig>(STRICTNESS_CONFIGS.flexible);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase.rpc('get_setting', {
        setting_key: 'rubric_strictness',
        default_value: 'flexible'
      });

      if (error) {
        console.error('Error loading rubric settings:', error);
        return;
      }

      const level = (data as RubricStrictnessLevel) || 'flexible';
      setConfig(STRICTNESS_CONFIGS[level] || STRICTNESS_CONFIGS.flexible);
    } catch (error) {
      console.error('Failed to load rubric settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStrictness = async (level: RubricStrictnessLevel) => {
    try {
      const { error } = await supabase.rpc('update_setting', {
        setting_key: 'rubric_strictness',
        setting_value: level
      });

      if (error) {
        console.error('Error updating rubric settings:', error);
        return false;
      }

      setConfig(STRICTNESS_CONFIGS[level]);
      return true;
    } catch (error) {
      console.error('Failed to update rubric settings:', error);
      return false;
    }
  };

  return {
    config,
    isLoading,
    updateStrictness,
    availableLevels: Object.keys(STRICTNESS_CONFIGS) as RubricStrictnessLevel[]
  };
}
