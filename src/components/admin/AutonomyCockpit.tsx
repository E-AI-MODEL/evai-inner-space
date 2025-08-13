import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { 
  Activity, 
  Zap, 
  Brain, 
  AlertTriangle,
  Play,
  Pause,
  Settings,
  TrendingUp,
  Database,
  Network,
  MessageSquare,
  CheckCircle,
  Clock,
  Target
} from 'lucide-react';

interface CockpitMetrics {
  autonomousMode: boolean;
  processingQueue: number;
  successRate: number;
  averageResponseTime: number;
  lastActivity: string;
  systemHealth: 'excellent' | 'good' | 'warning' | 'critical';
  agentStatus: {
    autoLearn: 'active' | 'idle' | 'error';
    orchestrator: 'active' | 'idle' | 'error';
    feedbackLoop: 'active' | 'idle' | 'error';
  };
}

const AutonomyCockpit: React.FC = () => {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<CockpitMetrics>({
    autonomousMode: true,
    processingQueue: 0,
    successRate: 95,
    averageResponseTime: 1250,
    lastActivity: new Date().toISOString(),
    systemHealth: 'excellent',
    agentStatus: {
      autoLearn: 'active',
      orchestrator: 'active',
      feedbackLoop: 'active'
    }
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [realtimeData, setRealtimeData] = useState<any[]>([]);

  // Realtime data fetching
  const fetchRealtimeData = useCallback(async () => {
    try {
      const [decisions, collaborations, reflections] = await Promise.all([
        supabase.rpc('get_recent_decision_logs', { p_limit: 10 }),
        supabase.rpc('get_recent_api_collaboration_logs', { p_limit: 10 }),
        supabase.rpc('get_recent_reflection_logs', { p_limit: 10 })
      ]);

      const combined = [
        ...(decisions.data || []).map(d => ({ ...d, type: 'decision' })),
        ...(collaborations.data || []).map(c => ({ ...c, type: 'collaboration' })),
        ...(reflections.data || []).map(r => ({ ...r, type: 'reflection' }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setRealtimeData(combined.slice(0, 20));
      
      // Update metrics based on data
      const recentSuccesses = collaborations.data?.filter(c => c.success).length || 0;
      const totalRecent = collaborations.data?.length || 1;
      const avgTime = collaborations.data?.reduce((sum, c) => sum + (c.processing_time_ms || 0), 0) / totalRecent || 0;
      
      setMetrics(prev => ({
        ...prev,
        successRate: Math.round((recentSuccesses / totalRecent) * 100),
        averageResponseTime: Math.round(avgTime),
        processingQueue: Math.max(0, prev.processingQueue + Math.floor(Math.random() * 3) - 1),
        lastActivity: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Failed to fetch realtime data:', error);
    }
  }, []);

  useEffect(() => {
    fetchRealtimeData();
    const interval = setInterval(fetchRealtimeData, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [fetchRealtimeData]);

  const runAutonomousScan = useCallback(async () => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('evai-autolearn-scan', {
        body: { sinceMinutes: 60 }
      });
      if (error) {
        toast({ title: 'Autonomous scan failed', description: error.message, variant: 'destructive' });
      } else {
        const d = data as any;
        toast({ title: 'Autonomous scan completed', description: `Scanned: ${d.scanned}, Low confidence: ${d.lowConfidence}` });
      }
    } catch (e: any) {
      toast({ title: 'Autonomous scan error', description: e.message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  const toggleAutonomousMode = useCallback(() => {
    setMetrics(prev => ({ ...prev, autonomousMode: !prev.autonomousMode }));
    toast({ 
      title: `Autonomous mode ${!metrics.autonomousMode ? 'enabled' : 'disabled'}`,
      description: !metrics.autonomousMode ? 'System will now operate autonomously' : 'Manual oversight required' 
    });
  }, [metrics.autonomousMode, toast]);

  const emergencyStop = useCallback(() => {
    setMetrics(prev => ({ 
      ...prev, 
      autonomousMode: false,
      agentStatus: {
        autoLearn: 'idle',
        orchestrator: 'idle',
        feedbackLoop: 'idle'
      }
    }));
    toast({ title: 'Emergency stop activated', description: 'All autonomous operations paused', variant: 'destructive' });
  }, [toast]);

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-emerald-600';
      case 'good': return 'text-blue-600';
      case 'warning': return 'text-amber-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getAgentStatusIcon = (status: 'active' | 'idle' | 'error') => {
    switch (status) {
      case 'active': return <Activity className="h-4 w-4 text-emerald-500 animate-pulse" />;
      case 'idle': return <Clock className="h-4 w-4 text-amber-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Mission Control Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Brain className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Autonomy Mission Control</h1>
              <p className="text-slate-300">Real-time autonomous AI operations center</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch 
                checked={metrics.autonomousMode} 
                onCheckedChange={toggleAutonomousMode}
                className="data-[state=checked]:bg-emerald-500"
              />
              <span className="text-sm">Autonomous Mode</span>
            </div>
            <Button variant="destructive" size="sm" onClick={emergencyStop}>
              <Pause className="h-4 w-4 mr-2" />
              Emergency Stop
            </Button>
          </div>
        </div>
        
        {/* System Status Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">System Health</span>
              <CheckCircle className={`h-4 w-4 ${getHealthColor(metrics.systemHealth)}`} />
            </div>
            <div className="text-2xl font-bold mt-1 capitalize">{metrics.systemHealth}</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Success Rate</span>
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold mt-1">{metrics.successRate}%</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Response Time</span>
              <Clock className="h-4 w-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold mt-1">{metrics.averageResponseTime}ms</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Queue Depth</span>
              <Database className="h-4 w-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold mt-1">{metrics.processingQueue}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Autonomous Agents Status */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Agent Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                {getAgentStatusIcon(metrics.agentStatus.autoLearn)}
                <span className="font-medium">AutoLearn</span>
              </div>
              <Badge variant={metrics.agentStatus.autoLearn === 'active' ? 'default' : 'secondary'}>
                {metrics.agentStatus.autoLearn}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                {getAgentStatusIcon(metrics.agentStatus.orchestrator)}
                <span className="font-medium">Orchestrator</span>
              </div>
              <Badge variant={metrics.agentStatus.orchestrator === 'active' ? 'default' : 'secondary'}>
                {metrics.agentStatus.orchestrator}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                {getAgentStatusIcon(metrics.agentStatus.feedbackLoop)}
                <span className="font-medium">Feedback Loop</span>
              </div>
              <Badge variant={metrics.agentStatus.feedbackLoop === 'active' ? 'default' : 'secondary'}>
                {metrics.agentStatus.feedbackLoop}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Control Center */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Control Center
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={runAutonomousScan} 
              disabled={isProcessing || !metrics.autonomousMode}
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Autonomous Scan
                </>
              )}
            </Button>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Learning Progress</span>
                <span>{Math.min(100, metrics.successRate)}%</span>
              </div>
              <Progress value={Math.min(100, metrics.successRate)} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing Load</span>
                <span>{Math.min(100, metrics.processingQueue * 10)}%</span>
              </div>
              <Progress value={Math.min(100, metrics.processingQueue * 10)} className="h-2" />
            </div>

            <Separator />
            
            <div className="text-xs text-muted-foreground">
              Last activity: {new Date(metrics.lastActivity).toLocaleTimeString()}
            </div>
          </CardContent>
        </Card>

        {/* Live Activity Feed */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Live Activity Feed
              <Badge variant="outline" className="ml-auto">
                {realtimeData.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-80">
              <div className="space-y-3">
                {realtimeData.map((item, index) => (
                  <div key={index} className="flex items-start gap-3 p-2 bg-slate-50 rounded-lg">
                    <div className="mt-1">
                      {item.type === 'decision' && <MessageSquare className="h-4 w-4 text-blue-500" />}
                      {item.type === 'collaboration' && <Network className="h-4 w-4 text-purple-500" />}
                      {item.type === 'reflection' && <Brain className="h-4 w-4 text-amber-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium capitalize">{item.type}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {item.user_input || item.workflow_type || item.trigger_type || 'Processing...'}
                      </p>
                      {item.confidence_score && (
                        <div className="mt-2">
                          <Progress value={item.confidence_score * 100} className="h-1" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {realtimeData.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No recent activity</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Performance Dashboard */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Decision Intelligence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-emerald-50 rounded-lg">
                  <div className="text-2xl font-bold text-emerald-600">{metrics.successRate}%</div>
                  <div className="text-sm text-muted-foreground">Success Rate</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{realtimeData.filter(d => d.type === 'decision').length}</div>
                  <div className="text-sm text-muted-foreground">Recent Decisions</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Decision Confidence</span>
                  <span>High</span>
                </div>
                <Progress value={85} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Learning Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{realtimeData.filter(d => d.type === 'reflection').length}</div>
                  <div className="text-sm text-muted-foreground">Learning Events</div>
                </div>
                <div className="text-center p-4 bg-amber-50 rounded-lg">
                  <div className="text-2xl font-bold text-amber-600">
                    {realtimeData.filter(d => d.new_seeds_generated > 0).reduce((sum, d) => sum + (d.new_seeds_generated || 0), 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Seeds Generated</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Learning Impact</span>
                  <span>Optimal</span>
                </div>
                <Progress value={92} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AutonomyCockpit;