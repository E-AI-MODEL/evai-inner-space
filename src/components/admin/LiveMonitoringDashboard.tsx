
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLiveMonitoring } from '../../hooks/useLiveMonitoring';
import { useLearningEngine } from '../../hooks/useLearningEngine';
import { Activity, Play, Pause, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const LiveMonitoringDashboard = () => {
  const { 
    metrics, 
    isMonitoring, 
    startMonitoring, 
    stopMonitoring, 
    getRealtimeStats,
    activeAlerts 
  } = useLiveMonitoring();
  
  const { getPerformanceInsights } = useLearningEngine();
  const [insights, setInsights] = useState(getPerformanceInsights());

  useEffect(() => {
    const interval = setInterval(() => {
      setInsights(getPerformanceInsights());
    }, 5000);
    
    return () => clearInterval(interval);
  }, [getPerformanceInsights]);

  const realtimeStats = getRealtimeStats();
  
  const chartData = metrics.slice(-20).map((metric, index) => ({
    time: index,
    responseTime: metric.responseTime,
    errorRate: metric.errorRate * 100,
    throughput: metric.throughput
  }));

  const formatTrend = (value: number) => {
    if (value > 0) return { icon: TrendingUp, color: 'text-red-500', text: `+${value.toFixed(1)}` };
    if (value < 0) return { icon: TrendingDown, color: 'text-green-500', text: value.toFixed(1) };
    return { icon: Activity, color: 'text-gray-500', text: '0' };
  };

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity size={20} />
              Live Monitoring Dashboard
            </CardTitle>
            <div className="flex items-center gap-2">
              {activeAlerts.length > 0 && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle size={12} />
                  {activeAlerts.length} Alert{activeAlerts.length > 1 ? 's' : ''}
                </Badge>
              )}
              <Button
                onClick={isMonitoring ? stopMonitoring : startMonitoring}
                variant={isMonitoring ? "destructive" : "default"}
                size="sm"
                className="flex items-center gap-2"
              >
                {isMonitoring ? <Pause size={16} /> : <Play size={16} />}
                {isMonitoring ? 'Stop' : 'Start'} Monitoring
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600">Response Time</p>
                  <p className="text-2xl font-bold text-blue-800">
                    {realtimeStats?.current.responseTime.toFixed(0) || '-'}ms
                  </p>
                </div>
                {realtimeStats?.trends && (
                  <div className="flex items-center gap-1">
                    {React.createElement(formatTrend(realtimeStats.trends.responseTime).icon, {
                      size: 16,
                      className: formatTrend(realtimeStats.trends.responseTime).color
                    })}
                    <span className={`text-xs ${formatTrend(realtimeStats.trends.responseTime).color}`}>
                      {formatTrend(realtimeStats.trends.responseTime).text}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600">Success Rate</p>
                  <p className="text-2xl font-bold text-green-800">
                    {((1 - (realtimeStats?.current.errorRate || 0)) * 100).toFixed(1)}%
                  </p>
                </div>
                <CheckCircle className="text-green-500" size={20} />
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600">Active Seeds</p>
                  <p className="text-2xl font-bold text-purple-800">
                    {realtimeStats?.current.activeSeeds || '-'}
                  </p>
                </div>
                <Activity className="text-purple-500" size={20} />
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600">Learning Velocity</p>
                  <p className="text-2xl font-bold text-orange-800">
                    {(insights.learningVelocity * 100).toFixed(1)}%
                  </p>
                </div>
                <TrendingUp className="text-orange-500" size={20} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Response Time Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="responseTime" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Learning Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Patterns</span>
                <Badge variant="secondary">{insights.totalPatterns}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Recent Patterns (24h)</span>
                <Badge variant="secondary">{insights.recentPatterns}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Avg Performance</span>
                <Badge 
                  variant={insights.avgPerformance > 0.7 ? "default" : "secondary"}
                  className={insights.avgPerformance > 0.7 ? "bg-green-600" : ""}
                >
                  {(insights.avgPerformance * 100).toFixed(1)}%
                </Badge>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Top Performers</p>
                <div className="space-y-1">
                  {insights.topPerformers.slice(0, 3).map((performer, index) => (
                    <div key={performer.seedId} className="flex justify-between text-xs">
                      <span>#{index + 1}</span>
                      <span>{(performer.successRate * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertTriangle size={20} />
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activeAlerts.map(alertId => (
                <div key={alertId} className="bg-red-100 border border-red-200 rounded p-3">
                  <p className="text-sm font-medium text-red-800">
                    Alert: {alertId.replace('-', ' ').toUpperCase()}
                  </p>
                  <p className="text-xs text-red-600">
                    Threshold exceeded - check system performance
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LiveMonitoringDashboard;
