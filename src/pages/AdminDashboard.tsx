import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

import { Database, TrendingUp, Users, Zap } from 'lucide-react';

import { useSeeds } from '../hooks/useSeeds';
import { testSupabaseConnection, supabase } from '../integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { ANONYMOUS_SUPER_USER } from '../hooks/useAuth';
import AdvancedSeedManager from '../components/admin/AdvancedSeedManager';
import ConfigurationPanel from '../components/ConfigurationPanel';
import LiveEventLog from '../components/admin/LiveEventLog';
import SystemHealthCheck from '../components/admin/SystemHealthCheck';
import SystemStatusOverview from '../components/admin/SystemStatusOverview';
import SystemStatusDetails from '../components/admin/SystemStatusDetails';
import UserProfileDashboard from '../components/admin/UserProfileDashboard';
import { ConnectionStatus } from '../types/connectionStatus';
import { getStatusIcon as getStatusIconGeneric, getStatusColor as getStatusColorGeneric } from '@/utils/statusUtils';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import AdminSidebar from '@/components/admin/AdminSidebar';

interface HybridDecisionData {
  emotion?: string;
  [key: string]: any;
}

const AdminDashboard = () => {
  const [supabaseStatus, setSupabaseStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [activeTab, setActiveTab] = useState<'profile' | 'overview' | 'seeds' | 'analytics' | 'settings'>('overview');
  
  const { data: seeds = [] } = useSeeds();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    supabase: 'checking',
    openaiApi1: 'checking',
    openaiApi2: 'checking',
    vectorApi: 'checking',
    seeds: 'loading',
  });

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const result = await testSupabaseConnection();
        setSupabaseStatus(result.success ? 'connected' : 'disconnected');
      } catch (error) {
        setSupabaseStatus('disconnected');
      }
    };

    checkConnection();
  }, []);

  useEffect(() => {
    setConnectionStatus({
      supabase:
        supabaseStatus === 'connected'
          ? 'connected'
          : supabaseStatus === 'connecting'
          ? 'checking'
          : 'error',
      openaiApi1: localStorage.getItem('openai-api-key') ? 'configured' : 'missing',
      openaiApi2: localStorage.getItem('openai-api-key-2') ? 'configured' : 'missing',
      vectorApi: localStorage.getItem('vector-api-key') ? 'configured' : 'missing',
      seeds: seeds.length > 0 ? 'loaded' : 'error',
    });
  }, [supabaseStatus, seeds]);

  const { data: analytics } = useQuery({
    queryKey: ['single-user-analytics'],
    queryFn: async () => {
      const userId = ANONYMOUS_SUPER_USER.id;

      const { data: seedRows, error: seedErr } = await supabase
        .from('emotion_seeds')
        .select('id, active, emotion, meta, created_at')
        .eq('user_id', userId);
      if (seedErr) throw seedErr;

      const { data: decisions, error: decErr } = await supabase
        .from('decision_logs')
        .select('confidence_score, created_at, hybrid_decision, user_input, final_response')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);
      if (decErr) throw decErr;

      const { data: feedbackRows, error: feedErr } = await supabase
        .from('seed_feedback')
        .select('rating, created_at, seed_id')
        .eq('user_id', userId);
      if (feedErr) throw feedErr;

      const { data: rubricRows, error: rubErr } = await supabase
        .from('rubrics_assessments')
        .select('rubric_id, overall_score, risk_score, protective_score, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (rubErr) throw rubErr;

      const { data: apiLogs, error: apiErr } = await supabase
        .from('api_collaboration_logs')
        .select('success, processing_time_ms, api1_used, api2_used, vector_api_used, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (apiErr) throw apiErr;

      const totalSeeds = seedRows?.length || 0;
      const activeSeeds = seedRows?.filter((s) => s.active).length || 0;
      const totalConversations = decisions?.length || 0;
      const avgConfidence = decisions && decisions.length > 0
        ? decisions.reduce((sum, d) => sum + (d.confidence_score || 0), 0) / decisions.length
        : 0;

      const now = new Date();
      const lastWeek = new Date(now);
      lastWeek.setDate(now.getDate() - 7);
      const lastWeekCount = decisions?.filter((d) => new Date(d.created_at) >= lastWeek).length || 0;
      const weeklyGrowth = lastWeekCount;

      const successes = apiLogs?.filter((l) => l.success).length || 0;
      const successRate = apiLogs && apiLogs.length > 0 ? (successes / apiLogs.length) * 100 : 100;
      const avgResponseTime = apiLogs && apiLogs.length > 0
        ? Math.round(apiLogs.reduce((sum, l) => sum + (l.processing_time_ms || 0), 0) / apiLogs.length)
        : 0;

      const positiveFeedback = feedbackRows?.filter((f) => f.rating === 'up').length || 0;
      const totalFeedback = feedbackRows?.length || 0;
      const userSatisfaction = totalFeedback > 0 ? +(positiveFeedback / totalFeedback * 5).toFixed(1) : 0;

      const emotionTimeline =
        decisions?.slice(0, 20).map((d) => {
          const hybridDecision = d.hybrid_decision as HybridDecisionData;
          return {
            date: new Date(d.created_at).toLocaleDateString('nl-NL'),
            emotion: hybridDecision?.emotion || 'onbekend',
            confidence: d.confidence_score || 0,
          };
        }) || [];

      const rubricHeatmap =
        rubricRows?.reduce((acc, r) => {
          acc[r.rubric_id] = (acc[r.rubric_id] || 0) + r.overall_score;
          return acc;
        }, {} as Record<string, number>) || {};

      return {
        totalSeeds,
        activeSeeds,
        totalConversations,
        avgConfidence,
        weeklyGrowth,
        systemHealth: successRate > 90 ? 'excellent' : 'warning',
        performanceMetrics: {
          avgResponseTime,
          successRate,
          errorRate: 100 - successRate,
          userSatisfaction,
        },
        emotionTimeline,
        rubricHeatmap,
        recentDecisions:
          decisions?.slice(0, 5).map((d) => ({
            input: d.user_input?.substring(0, 50) + '...',
            response: d.final_response?.substring(0, 50) + '...',
            confidence: d.confidence_score || 0,
            time: new Date(d.created_at).toLocaleTimeString('nl-NL'),
          })) || [],
      };
    },
    refetchInterval: 30000,
  });

  const mapToHealth = (status: string): 'healthy' | 'warning' | 'error' => {
    switch (status) {
      case 'connected':
        return 'healthy';
      case 'connecting':
        return 'warning';
      case 'disconnected':
        return 'error';
      default:
        return 'warning';
    }
  };

  return (
    <SidebarProvider>
      <header className="h-12 flex items-center justify-between border-b px-3">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="ml-1" />
        </div>
        <div className="flex items-center gap-2 pr-1">
          <Badge variant="outline" className={`${getStatusColorGeneric(mapToHealth(supabaseStatus))} border`}>
            {getStatusIconGeneric(mapToHealth(supabaseStatus))}
            <span className="ml-2 font-medium">
              Supabase {supabaseStatus === 'connected' ? 'Verbonden' : supabaseStatus === 'connecting' ? 'Verbinden...' : 'Offline'}
            </span>
          </Badge>
        </div>
      </header>

      <div className="flex min-h-screen w-full">
        <AdminSidebar active={activeTab} onChange={setActiveTab} />

        <main className="flex-1 p-4 md:p-8 pt-6">
          <div className="mb-4">
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-700 via-blue-700 to-indigo-700 bg-clip-text text-transparent">
              EvAI Neurosymbolische Dashboard
            </h2>
            <p className="text-muted-foreground">
              Single-user neurosymbolische AI systeem - monitor, configureer en profileer
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
            {/* Profiel */}
            <TabsContent value="profile" className="space-y-4">
              <UserProfileDashboard analytics={analytics} />
            </TabsContent>

            {/* Overzicht */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Totaal Seeds</CardTitle>
                    <Database className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics?.totalSeeds || 0}</div>
                    <p className="text-xs text-muted-foreground">{analytics?.activeSeeds || 0} actief</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Gesprekken</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics?.totalConversations || 0}</div>
                    <p className="text-xs text-muted-foreground">Deze week: {analytics?.weeklyGrowth || 0}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Vertrouwen</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{Math.round((analytics?.avgConfidence || 0) * 100)}%</div>
                    <p className="text-xs text-muted-foreground">{(analytics?.avgConfidence || 0) > 0.8 ? 'Zeer hoog' : 'Gemiddeld'} niveau</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Systeem Status</CardTitle>
                    <Zap className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{Math.round(analytics?.performanceMetrics?.successRate || 0)}%</div>
                    <p className="text-xs text-muted-foreground">{analytics?.systemHealth === 'excellent' ? 'Uitstekend' : 'Waarschuwing'}</p>
                  </CardContent>
                </Card>

                {/* LLM Rollen overzicht */}
                <Card className="lg:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">LLM Rollen</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="rounded-md border p-3">
                        <div className="font-medium mb-1">OpenAI Key 1</div>
                        <p className="text-muted-foreground">Taken: Emotiedetectie, empathische respons</p>
                        <p className="mt-1">Status: <span className="font-medium">{connectionStatus.openaiApi1 === 'configured' ? 'Geconfigureerd' : 'Ontbreekt'}</span></p>
                      </div>
                      <div className="rounded-md border p-3">
                        <div className="font-medium mb-1">OpenAI Key 2</div>
                        <p className="text-muted-foreground">Taken: Strategische briefing, secundaire analyse</p>
                        <p className="mt-1">Status: <span className="font-medium">{connectionStatus.openaiApi2 === 'configured' ? 'Geconfigureerd' : 'Ontbreekt'}</span></p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <SystemStatusOverview
                openAiActive={connectionStatus.openaiApi1 === 'configured'}
                openAi2Active={connectionStatus.openaiApi2 === 'configured'}
                vectorActive={connectionStatus.vectorApi === 'configured'}
              />
            </TabsContent>

            {/* Seeds beheer */}
            <TabsContent value="seeds" className="space-y-4">
              <AdvancedSeedManager />
            </TabsContent>

            {/* Analytics */}
            <TabsContent value="analytics" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <SystemHealthCheck />
                <LiveEventLog />
              </div>
              <SystemStatusDetails
                status={connectionStatus}
                seedsCount={analytics?.totalSeeds || 0}
                activeSeedsCount={analytics?.activeSeeds || 0}
              />
            </TabsContent>

            {/* Configuratie */}
            <TabsContent value="settings" className="space-y-4">
              <ConfigurationPanel />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;
