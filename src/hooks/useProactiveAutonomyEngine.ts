import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProactiveSeedGenerator } from './useProactiveSeedGenerator';
import { useRiskPredictionEngine } from './useRiskPredictionEngine';
import { useTherapeuticWindowDetector } from './useTherapeuticWindowDetector';
import { useAutonomousQualityController } from './useAutonomousQualityController';
import { usePredictiveMaintenanceAgent } from './usePredictiveMaintenanceAgent';
import { useContextAwareAnticipation } from './useContextAwareAnticipation';

export interface AutonomyMetrics {
  activePredictions: number;
  proactiveInterventions: number;
  autonomousOptimizations: number;
  predictiveAccuracy: number;
  systemEvolution: number;
  lastProactiveAction: Date | null;
}

export interface ProactiveAction {
  id: string;
  type: 'prediction' | 'intervention' | 'optimization' | 'maintenance' | 'anticipation';
  action: string;
  confidence: number;
  executedAt: Date;
  result?: string;
  impact: number;
}

export function useProactiveAutonomyEngine() {
  const [isActive, setIsActive] = useState(false);
  const [metrics, setMetrics] = useState<AutonomyMetrics>({
    activePredictions: 0,
    proactiveInterventions: 0,
    autonomousOptimizations: 0,
    predictiveAccuracy: 0,
    systemEvolution: 0,
    lastProactiveAction: null
  });
  const [recentActions, setRecentActions] = useState<ProactiveAction[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize sub-engines
  const seedGenerator = useProactiveSeedGenerator();
  const riskEngine = useRiskPredictionEngine();
  const windowDetector = useTherapeuticWindowDetector();
  const qualityController = useAutonomousQualityController();
  const maintenanceAgent = usePredictiveMaintenanceAgent();
  const anticipationEngine = useContextAwareAnticipation();

  const executeProactiveAction = useCallback(async (action: Omit<ProactiveAction, 'id' | 'executedAt'>) => {
    const newAction: ProactiveAction = {
      ...action,
      id: crypto.randomUUID(),
      executedAt: new Date()
    };

    try {
      setIsProcessing(true);
      
      // Log proactive action
      await supabase.from('api_collaboration_logs').insert({
        workflow_type: 'proactive_autonomy',
        metadata: {
          actionType: newAction.type,
          actionDescription: newAction.action,
          confidence: newAction.confidence,
          autonomous: true,
          proactive: true
        },
        success: true
      });

      setRecentActions(prev => [newAction, ...prev.slice(0, 19)]);
      setMetrics(prev => ({
        ...prev,
        lastProactiveAction: new Date(),
        activePredictions: prev.activePredictions + (action.type === 'prediction' ? 1 : 0),
        proactiveInterventions: prev.proactiveInterventions + (action.type === 'intervention' ? 1 : 0),
        autonomousOptimizations: prev.autonomousOptimizations + (action.type === 'optimization' ? 1 : 0)
      }));

      console.log(`🤖 Proactive Action Executed: ${action.action} (confidence: ${action.confidence})`);
      
    } catch (error) {
      console.error('❌ Proactive action failed:', error);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const autonomousIntelligenceLoop = useCallback(async () => {
    if (!isActive) return;

    try {
      console.log('🧠 Running Autonomous Intelligence Loop...');

      // Check if we have recent data to work with
      const { data: recentLogs } = await supabase
        .from('decision_logs')
        .select('id')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(1);
      
      const hasRecentData = recentLogs && recentLogs.length > 0;
      
      if (!hasRecentData) {
        console.log('⚠️ No recent conversation data - running in predictive mode only');
        
        await executeProactiveAction({
          type: 'prediction',
          action: 'System running in predictive mode - time-based anticipations active',
          confidence: 0.7,
          impact: 0.1
        });
        
        // Still run maintenance (works without user data)
        const maintenanceActions = await maintenanceAgent.performPredictiveMaintenance();
        if (maintenanceActions.actionsPerformed > 0) {
          await executeProactiveAction({
            type: 'maintenance',
            action: `Executed ${maintenanceActions.actionsPerformed} predictive maintenance actions`,
            confidence: 0.95,
            impact: maintenanceActions.impactScore
          });
        }
        
        // Still run quality control
        const qualityOptimizations = await qualityController.performAutonomousOptimizations();
        if (qualityOptimizations.optimizationsApplied > 0) {
          await executeProactiveAction({
            type: 'optimization',
            action: `Applied ${qualityOptimizations.optimizationsApplied} autonomous quality optimizations`,
            confidence: qualityOptimizations.confidence,
            impact: qualityOptimizations.impactScore
          });
        }

        console.log(`🤖 Autonomy Status (Predictive Mode):
  - Recent Actions: ${recentActions.length}
  - Predictions: ${metrics.activePredictions}
  - Mode: Time-based only (no conversation data)`);
        
        return; // Skip data-dependent engines
      }

      console.log('✅ Recent data available - running full autonomous intelligence');

      // 1. Predictive Seed Generation
      const seedPredictions = await seedGenerator.generatePredictiveSeeds();
      if (seedPredictions.length > 0) {
        await executeProactiveAction({
          type: 'prediction',
          action: `Generated ${seedPredictions.length} predictive seeds for upcoming emotional patterns`,
          confidence: 0.85,
          impact: seedPredictions.length * 0.1
        });
      }

      // 2. Risk Prediction Analysis
      const riskPredictions = await riskEngine.predictEmotionalRisks();
      if (riskPredictions.highRisk.length > 0) {
        await executeProactiveAction({
          type: 'intervention',
          action: `Detected ${riskPredictions.highRisk.length} high-risk emotional patterns requiring intervention`,
          confidence: riskPredictions.confidence,
          impact: riskPredictions.highRisk.length * 0.2
        });
      }

      // 3. Therapeutic Window Detection
      const optimalWindows = await windowDetector.detectOptimalInterventionWindows();
      if (optimalWindows.length > 0) {
        await executeProactiveAction({
          type: 'intervention',
          action: `Identified ${optimalWindows.length} optimal therapeutic intervention windows`,
          confidence: 0.9,
          impact: optimalWindows.length * 0.15
        });
      }

      // 4. Autonomous Quality Control
      const qualityOptimizations = await qualityController.performAutonomousOptimizations();
      if (qualityOptimizations.optimizationsApplied > 0) {
        await executeProactiveAction({
          type: 'optimization',
          action: `Applied ${qualityOptimizations.optimizationsApplied} autonomous quality optimizations`,
          confidence: qualityOptimizations.confidence,
          impact: qualityOptimizations.impactScore
        });
      }

      // 5. Predictive Maintenance
      const maintenanceActions = await maintenanceAgent.performPredictiveMaintenance();
      if (maintenanceActions.actionsPerformed > 0) {
        await executeProactiveAction({
          type: 'maintenance',
          action: `Executed ${maintenanceActions.actionsPerformed} predictive maintenance actions`,
          confidence: 0.95,
          impact: maintenanceActions.impactScore
        });
      }

      // 6. Context-Aware Anticipation
      const anticipations = await anticipationEngine.anticipateUserNeeds();
      if (anticipations.length > 0) {
        await executeProactiveAction({
          type: 'anticipation',
          action: `Anticipated ${anticipations.length} user needs and prepared responses`,
          confidence: 0.8,
          impact: anticipations.length * 0.12
        });
      }

      // Update predictive accuracy and reset counters for next loop
      setMetrics(prev => ({
        ...prev,
        predictiveAccuracy: Math.min(prev.predictiveAccuracy + 0.01, 1.0),
        systemEvolution: Math.min(prev.systemEvolution + 0.005, 1.0),
        // Reset counters to show only active predictions in current loop
        activePredictions: 0,
        proactiveInterventions: 0,
        autonomousOptimizations: 0
      }));

      console.log(`🤖 Autonomy Status:
  - Active: ${isActive}
  - Recent Actions: ${recentActions.length}
  - Predictions: ${metrics.activePredictions}
  - Interventions: ${metrics.proactiveInterventions}
  - Optimizations: ${metrics.autonomousOptimizations}
  - Last Action: ${metrics.lastProactiveAction?.toLocaleTimeString() || 'Never'}`);

    } catch (error) {
      console.error('❌ Autonomous Intelligence Loop failed:', error);
    }
  }, [isActive, seedGenerator, riskEngine, windowDetector, qualityController, maintenanceAgent, anticipationEngine, executeProactiveAction, recentActions, metrics]);

  // Start autonomous background loop
  useEffect(() => {
    if (!isActive) return;

    // Run immediately
    autonomousIntelligenceLoop();

    // Run every 3 minutes for proactive intelligence
    const interval = setInterval(autonomousIntelligenceLoop, 3 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isActive, autonomousIntelligenceLoop]);

  const activateAutonomy = useCallback(async () => {
    setIsActive(true);
    await executeProactiveAction({
      type: 'optimization',
      action: 'Proactive Autonomy Engine activated - beginning continuous intelligence monitoring',
      confidence: 1.0,
      impact: 0.3
    });
    console.log('🚀 Proactive Autonomy Engine ACTIVATED');
  }, [executeProactiveAction]);

  const deactivateAutonomy = useCallback(() => {
    setIsActive(false);
    console.log('⏸️ Proactive Autonomy Engine DEACTIVATED');
  }, []);

  return {
    isActive,
    metrics,
    recentActions,
    isProcessing,
    activateAutonomy,
    deactivateAutonomy,
    executeProactiveAction
  };
}