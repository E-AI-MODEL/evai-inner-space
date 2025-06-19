
import React from 'react';
import { Message } from '../../types';
import SystemStatus from './SystemStatus';
import PerformanceMetrics from './PerformanceMetrics';
import SymbolicInferences from './SymbolicInferences';
import ActivityLog from './ActivityLog';
import ErrorAnalysis from './ErrorAnalysis';

interface AdminSystemMonitorProps {
  messages: Message[];
}

const AdminSystemMonitor: React.FC<AdminSystemMonitorProps> = ({ messages }) => {
  // System health calculations
  const recentMessages = messages.slice(-50);
  const aiResponses = recentMessages.filter(m => m.from === 'ai');
  const errors = aiResponses.filter(m => m.emotionSeed === 'error');
  const successfulDetections = aiResponses.filter(m => m.emotionSeed && m.emotionSeed !== 'error');
  
  const systemHealth = {
    status: errors.length === 0 ? 'healthy' : errors.length < 3 ? 'warning' : 'error',
    uptime: '99.8%',
    errorRate: recentMessages.length > 0 ? (errors.length / recentMessages.length * 100).toFixed(1) : '0',
    avgResponseTime: '350ms'
  };

  const performanceMetrics = [
    { name: 'API Calls', value: aiResponses.length, trend: 'up' as const, color: 'text-blue-600' },
    { name: 'Success Rate', value: `${((successfulDetections.length / Math.max(aiResponses.length, 1)) * 100).toFixed(1)}%`, trend: 'up' as const, color: 'text-green-600' },
    { name: 'Avg Confidence', value: `${(successfulDetections.reduce((acc, msg) => acc + (msg.meta?.includes('%') ? parseInt(msg.meta.split('%')[0].split('–')[1]?.trim() || '0') : 80), 0) / Math.max(successfulDetections.length, 1)).toFixed(0)}%`, trend: 'stable' as const, color: 'text-purple-600' },
    { name: 'Cache Hits', value: recentMessages.filter(m => m.meta?.includes('Lokaal')).length, trend: 'up' as const, color: 'text-orange-600' }
  ];

  const symbolicStats = messages.reduce(
    (acc, msg) => {
      if (msg.symbolicInferences && msg.symbolicInferences.length) {
        acc.messageCount++;
        acc.total += msg.symbolicInferences.length;
        msg.symbolicInferences.forEach(inf => {
          acc.inferences[inf] = (acc.inferences[inf] || 0) + 1;
          if (/openai|neurosymbol/i.test(inf)) {
            acc.secondary++;
          }
        });
      }
      return acc;
    },
    { messageCount: 0, total: 0, secondary: 0, inferences: {} as Record<string, number> }
  );

  const topInferences = Object.entries(symbolicStats.inferences)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const symbolicInferencesData = {
    messageCount: symbolicStats.messageCount,
    total: symbolicStats.total,
    secondary: symbolicStats.secondary,
    topInferences
  };

  const recentActivities = messages.slice(-10).reverse().map(msg => ({
    id: msg.id,
    type: msg.from === 'user' ? 'user_input' as const : 'ai_response' as const,
    timestamp: msg.timestamp,
    content: msg.content.substring(0, 50) + (msg.content.length > 50 ? '...' : ''),
    status: msg.emotionSeed === 'error' ? 'error' as const : 'success' as const,
    meta: msg.meta || ''
  }));

  return (
    <div className="space-y-6">
      <SystemStatus systemHealth={systemHealth} />
      <PerformanceMetrics metrics={performanceMetrics} />
      <SymbolicInferences stats={symbolicInferencesData} />
      <ActivityLog activities={recentActivities} />
      <ErrorAnalysis errors={errors} />
    </div>
  );
};

export default AdminSystemMonitor;
