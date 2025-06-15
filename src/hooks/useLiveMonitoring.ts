
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

interface InteractionRecord {
  timestamp: Date;
  responseTime: number;
  success: boolean;
  emotionDetected: boolean;
}

export function useLiveMonitoring() {
  const [metrics, setMetrics] = useState<SystemMetrics[]>([]);
  const [interactions, setInteractions] = useState<InteractionRecord[]>([]);
  const [alerts, setAlerts] = useState<AlertConfig[]>([
    { id: 'response-time', type: 'performance', threshold: 2000, enabled: true },
    { id: 'error-rate', type: 'error', threshold: 0.15, enabled: true },
    { id: 'memory-usage', type: 'performance', threshold: 85, enabled: true }
  ]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState<string[]>([]);

  const collectRealMetrics = useCallback(() => {
    const seeds = loadAdvancedSeeds();
    const now = new Date();
    
    // Calculate real metrics from recent interactions
    const recentInteractions = interactions.slice(-10);
    const avgResponseTime = recentInteractions.length > 0
      ? recentInteractions.reduce((sum, i) => sum + i.responseTime, 0) / recentInteractions.length
      : 500;
    
    const errorRate = recentInteractions.length > 0
      ? recentInteractions.filter(i => !i.success).length / recentInteractions.length
      : 0;
    
    const throughput = recentInteractions.filter(i => 
      now.getTime() - i.timestamp.getTime() < 60000
    ).length; // Interactions per minute
    
    // Estimate memory usage based on seeds and interaction history
    const memoryUsage = Math.min(90, 40 + (seeds.length * 0.1) + (interactions.length * 0.01));
    
    const newMetric: SystemMetrics = {
      timestamp: now,
      responseTime: avgResponseTime,
      memoryUsage,
      activeSeeds: seeds.filter(s => s.isActive).length,
      errorRate,
      throughput
    };
    
    setMetrics(prev => {
      const updated = [...prev, newMetric];
      // Keep only last 50 metrics for performance
      return updated.slice(-50);
    });
    
    // Check alerts
    checkAlerts(newMetric);
  }, [interactions]);

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
    
    const interval = setInterval(collectRealMetrics, 5000);
    return () => clearInterval(interval);
  }, [isMonitoring, collectRealMetrics]);

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
    const interaction: InteractionRecord = {
      timestamp: new Date(),
      responseTime,
      success: message.emotionSeed !== 'error',
      emotionDetected: !!message.emotionSeed && message.emotionSeed !== 'error'
    };
    
    setInteractions(prev => [...prev.slice(-99), interaction]); // Keep last 100 interactions
    
    // If monitoring is active, update metrics immediately
    if (isMonitoring) {
      setTimeout(collectRealMetrics, 100);
    }
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
    setAlerts,
    interactions
  };
}
