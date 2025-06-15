import { useState, useEffect, useCallback } from 'react';
import { Message } from '../types';
import { AdvancedSeed } from '../types/seed';
import { loadAdvancedSeeds } from '../lib/advancedSeedStorage';

interface SystemMetrics {
  timestamp: Date;
  responseTime: number;
  memoryUsage: number;
  activeSeeds: number;
  errorRate: number;
  throughput: number;
}

interface AlertConfig {
  id: string;
  type: 'performance' | 'error' | 'usage';
  threshold: number;
  enabled: boolean;
}

export function useLiveMonitoring() {
  const [metrics, setMetrics] = useState<SystemMetrics[]>([]);
  const [alerts, setAlerts] = useState<AlertConfig[]>([
    { id: 'response-time', type: 'performance', threshold: 1000, enabled: true },
    { id: 'error-rate', type: 'error', threshold: 0.1, enabled: true },
    { id: 'memory-usage', type: 'performance', threshold: 80, enabled: true }
  ]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState<string[]>([]);

  const collectMetrics = useCallback(() => {
    const seeds = loadAdvancedSeeds();
    const now = new Date();
    
    // Simulate metrics collection (in real app this would come from actual monitoring)
    const newMetric: SystemMetrics = {
      timestamp: now,
      responseTime: 200 + Math.random() * 300,
      memoryUsage: 45 + Math.random() * 20,
      activeSeeds: seeds.filter(s => s.isActive).length,
      errorRate: Math.random() * 0.05,
      throughput: 5 + Math.random() * 10
    };
    
    setMetrics(prev => {
      const updated = [...prev, newMetric];
      // Keep only last 50 metrics for performance
      return updated.slice(-50);
    });
    
    // Check alerts
    checkAlerts(newMetric);
  }, []);

  const checkAlerts = (metric: SystemMetrics) => {
    const triggeredAlerts: string[] = [];
    
    alerts.forEach(alert => {
      if (!alert.enabled) return;
      
      let value = 0;
      switch (alert.id) {
        case 'response-time':
          value = metric.responseTime;
          break;
        case 'error-rate':
          value = metric.errorRate;
          break;
        case 'memory-usage':
          value = metric.memoryUsage;
          break;
      }
      
      if (value > alert.threshold) {
        triggeredAlerts.push(alert.id);
      }
    });
    
    setActiveAlerts(triggeredAlerts);
  };

  const startMonitoring = () => {
    setIsMonitoring(true);
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
  };

  useEffect(() => {
    if (!isMonitoring) return;
    
    const interval = setInterval(collectMetrics, 2000);
    return () => clearInterval(interval);
  }, [isMonitoring, collectMetrics]);

  const getRealtimeStats = () => {
    if (metrics.length === 0) return null;
    
    const latest = metrics[metrics.length - 1];
    const previous = metrics[metrics.length - 2];
    
    return {
      current: latest,
      trends: previous ? {
        responseTime: latest.responseTime - previous.responseTime,
        errorRate: latest.errorRate - previous.errorRate,
        throughput: latest.throughput - previous.throughput
      } : null
    };
  };

  const recordInteraction = (message: Message, responseTime: number) => {
    // This would be called after each AI interaction
    const metric: SystemMetrics = {
      timestamp: new Date(),
      responseTime,
      memoryUsage: 50 + Math.random() * 15,
      activeSeeds: loadAdvancedSeeds().filter(s => s.isActive).length,
      errorRate: message.emotionSeed === 'error' ? 1 : 0,
      throughput: 1
    };
    
    setMetrics(prev => [...prev.slice(-49), metric]);
  };

  return {
    metrics,
    alerts,
    activeAlerts,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    getRealtimeStats,
    recordInteraction,
    setAlerts
  };
}
