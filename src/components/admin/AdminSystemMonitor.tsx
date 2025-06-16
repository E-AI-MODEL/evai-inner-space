
import React from 'react';
import { Message } from '../../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, CheckCircle, Clock, Zap, Server, Activity, Brain } from 'lucide-react';

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
    avgResponseTime: '350ms',
    lastError: errors.length > 0 ? errors[errors.length - 1].timestamp : null
  };

  // Performance metrics
  const performanceMetrics = [
    { name: 'API Calls', value: aiResponses.length, trend: 'up', color: 'text-blue-600' },
    { name: 'Success Rate', value: `${((successfulDetections.length / Math.max(aiResponses.length, 1)) * 100).toFixed(1)}%`, trend: 'up', color: 'text-green-600' },
    { name: 'Avg Confidence', value: `${(successfulDetections.reduce((acc, msg) => acc + (msg.meta?.includes('%') ? parseInt(msg.meta.split('%')[0].split('–')[1]?.trim() || '0') : 80), 0) / Math.max(successfulDetections.length, 1)).toFixed(0)}%`, trend: 'stable', color: 'text-purple-600' },
    { name: 'Cache Hits', value: recentMessages.filter(m => m.meta?.includes('Lokaal')).length, trend: 'up', color: 'text-orange-600' }
  ];

  // Symbolic inferences stats
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

  // Recent activities
  const recentActivities = messages.slice(-10).reverse().map(msg => ({
    id: msg.id,
    type: msg.from === 'user' ? 'user_input' : 'ai_response',
    timestamp: msg.timestamp,
    content: msg.content.substring(0, 50) + (msg.content.length > 50 ? '...' : ''),
    status: msg.emotionSeed === 'error' ? 'error' : 'success',
    meta: msg.meta || ''
  }));

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="text-green-500" size={20} />;
      case 'warning': return <AlertTriangle className="text-yellow-500" size={20} />;
      case 'error': return <AlertTriangle className="text-red-500" size={20} />;
      default: return <Server className="text-gray-500" size={20} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* System Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server size={20} />
            Systeem Status
          </CardTitle>
          <CardDescription>Real-time systeem gezondheid en prestaties</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              {getStatusIcon(systemHealth.status)}
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <Badge className={getStatusColor(systemHealth.status)}>
                  {systemHealth.status === 'healthy' ? 'Gezond' : 
                   systemHealth.status === 'warning' ? 'Waarschuwing' : 'Fout'}
                </Badge>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Uptime</p>
              <p className="text-lg font-semibold text-green-600">{systemHealth.uptime}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Error Rate</p>
              <p className="text-lg font-semibold text-red-600">{systemHealth.errorRate}%</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Avg Response</p>
              <p className="text-lg font-semibold text-blue-600">{systemHealth.avgResponseTime}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity size={20} />
            Prestatie Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {performanceMetrics.map((metric) => (
              <div key={metric.name} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">{metric.name}</span>
                  <Zap size={16} className="text-gray-400" />
                </div>
                <div className={`text-2xl font-bold ${metric.color}`}>
                  {metric.value}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Symbolic Inferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain size={20} />
            Symbolic Inferences
          </CardTitle>
          <CardDescription>Samenvatting van gedetecteerde patronen</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>
              {symbolicStats.messageCount} berichten bevatten {symbolicStats.total} observaties.
            </p>
            <p>{symbolicStats.secondary} afkomstig van de tweede API.</p>
            <ul className="list-disc pl-5 space-y-1">
              {topInferences.map(([inf, count]) => (
                <li key={inf}>
                  {inf} ({count}x)
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock size={20} />
            Recente Activiteit
          </CardTitle>
          <CardDescription>Laatste systeem activiteiten en logs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tijd</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Meta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentActivities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className="text-xs text-gray-500">
                      {activity.timestamp.toLocaleTimeString('nl-NL')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={activity.type === 'user_input' ? 'default' : 'secondary'}>
                        {activity.type === 'user_input' ? 'User' : 'AI'}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {activity.content}
                    </TableCell>
                    <TableCell>
                      <Badge className={activity.status === 'error' ? getStatusColor('error') : getStatusColor('healthy')}>
                        {activity.status === 'error' ? 'Error' : 'Success'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {activity.meta}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Error Analysis */}
      {errors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle size={20} />
              Error Analysis
            </CardTitle>
            <CardDescription>Recente fouten en problemen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {errors.slice(-5).map((error, index) => (
                <div key={error.timestamp.getTime()} className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-red-800">Error #{errors.length - index}</p>
                      <p className="text-sm text-red-600 mt-1">{error.content}</p>
                    </div>
                    <span className="text-xs text-red-500">
                      {error.timestamp.toLocaleString('nl-NL')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminSystemMonitor;
