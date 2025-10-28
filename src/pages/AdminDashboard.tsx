import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AutonomyConsole from '@/components/admin/AutonomyConsole';
import AdvancedSeedManager from '@/components/admin/AdvancedSeedManager';
import ConfigurationPanel from '@/components/admin/ConfigurationPanel';
import MLEngineMonitor from '@/components/admin/MLEngineMonitor';
import { useNavigate } from 'react-router-dom';
import { useSystemConnectivity } from '@/hooks/useSystemConnectivity';
import { getStatusIcon as getStatusIconGeneric, getStatusColor as getStatusColorGeneric } from '@/utils/statusUtils';
import { useSeeds } from '../hooks/useSeeds';
import { supabase } from '../integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { ANONYMOUS_SUPER_USER, useAuth } from '../hooks/useAuth';
import { testSupabaseOpenAIKey } from '@/services/OpenAIKeyTester';
import { ConnectionStatus } from '../types/connectionStatus';
import { useRetroactiveLearning } from '@/hooks/useRetroactiveLearning';
import { RetroactiveLearningStatus } from '@/components/admin/RetroactiveLearningStatus';
import AdminAuth from '@/components/admin/AdminAuth';
import { LogOut, Trash2 } from 'lucide-react';

const AdminDashboard = () => {
  const { isAdminAuthorized, authorizeAdmin, logoutAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'autonomy' | 'seeds' | 'settings' | 'python'>('autonomy');
  const [supabaseStatus, setSupabaseStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [isConsolidating, setIsConsolidating] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const { status: connectivity, refresh: refreshConnectivity, isChecking } = useSystemConnectivity();
  const { data: seeds = [] } = useSeeds();
  
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    supabase: 'checking',
    openaiApi1: 'checking',
    browserML: 'checking',
    vectorApi: 'checking',
    seeds: 'loading',
  });

  // Auto-activate AutoLearn on dashboard load
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        console.log('🚀 Auto-triggering AutoLearn scan...');
        await supabase.functions.invoke('evai-admin', {
          body: { operation: 'autolearn-scan', sinceMinutes: 60 }
        });
        console.log('✅ AutoLearn scan triggered');
      } catch (error) {
        console.warn('⚠️ AutoLearn auto-trigger failed:', error);
      }
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []); // Run once on mount

  // Essential autonomous system monitoring
  useEffect(() => {
    setSupabaseStatus(
      connectivity.supabase === 'connected'
        ? 'connected'
        : connectivity.supabase === 'checking'
        ? 'connecting'
        : 'disconnected'
    );
  }, [connectivity.supabase]);

  useEffect(() => {
    setConnectionStatus({
      supabase:
        connectivity.supabase === 'connected'
          ? 'connected'
          : connectivity.supabase === 'checking'
          ? 'checking'
          : 'error',
      openaiApi1: connectivity.openaiApi1,
      browserML: connectivity.browserML,
      vectorApi: connectivity.vectorApi,
      seeds: seeds.length > 0 ? 'loaded' : 'error',
    });
  }, [connectivity, seeds]);

  // Autonomous system health check
  useEffect(() => {
    if (supabaseStatus !== 'connected') return;
    (async () => {
      const res = await testSupabaseOpenAIKey();
      if (res.ok) {
        toast({ title: 'Autonomous system online', description: res.model ? `Model: ${res.model}` : undefined });
      } else {
        toast({ title: 'Autonomous system degraded', description: res.error || 'API key validation failed', variant: 'destructive' });
      }
    })();
  }, [supabaseStatus, toast]);

  // Essential analytics for autonomous decision making
  const { data: systemMetrics } = useQuery({
    queryKey: ['autonomous-metrics'],
    queryFn: async () => {
      const userId = ANONYMOUS_SUPER_USER.id;
      
      // Get recent decisions for autonomous learning
      const { data: decisions, error: decErr } = await supabase
        .from('decision_logs')
        .select('confidence_score, created_at, user_input, final_response')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (decErr) throw decErr;

      // Get API performance for autonomous optimization
      const { data: apiLogs, error: apiErr } = await supabase
        .from('api_collaboration_logs')
        .select('success, processing_time_ms, api1_used, api2_used, vector_api_used, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (apiErr) throw apiErr;

      // Get seed performance for autonomous seed management
      const { data: seedRows, error: seedErr } = await supabase
        .from('emotion_seeds')
        .select('id, active, emotion, meta, created_at')
        .eq('user_id', userId);
      if (seedErr) throw seedErr;

      // Calculate autonomous system health metrics
      const successes = apiLogs?.filter((l) => l.success).length || 0;
      const totalRequests = apiLogs?.length || 1;
      const successRate = (successes / totalRequests) * 100;
      const avgResponseTime = apiLogs && apiLogs.length > 0
        ? Math.round(apiLogs.reduce((sum, l) => sum + (l.processing_time_ms || 0), 0) / apiLogs.length)
        : 0;

      const avgConfidence = decisions && decisions.length > 0
        ? decisions.reduce((sum, d) => sum + (d.confidence_score || 0), 0) / decisions.length
        : 0;

      return {
        successRate,
        avgResponseTime,
        avgConfidence,
        totalDecisions: decisions?.length || 0,
        activeSeedCount: seedRows?.filter((s) => s.active).length || 0,
        systemHealth: successRate > 90 ? 'excellent' : successRate > 75 ? 'good' : 'warning'
      };
    },
    refetchInterval: 10000, // Update every 10 seconds for autonomous monitoring
  });

  // Database cleanup and consolidation
  const handleConsolidateKnowledge = async () => {
    setIsConsolidating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('evai-admin', {
        body: { operation: 'consolidate-knowledge' }
      });
      
      if (error) throw error;
      
      toast({
        title: '✅ Database Cleanup Successful',
        description: data?.cleanup 
          ? `Removed ${data.cleanup[0]} invalid seeds, ${data.cleanup[1]} invalid knowledge entries, normalized ${data.cleanup[2]} emotions`
          : 'Knowledge base consolidated and cleaned',
      });
      
      // Refresh data
      await refreshConnectivity();
      
    } catch (error) {
      console.error('Consolidation error:', error);
      toast({
        title: '❌ Consolidation Failed',
        description: error instanceof Error ? error.message : 'Failed to clean database',
        variant: 'destructive',
      });
    } finally {
      setIsConsolidating(false);
    }
  };

  // Auth guard: Render AdminAuth scherm als niet geauthoriseerd
  if (!isAdminAuthorized) {
    return <AdminAuth onAuthenticated={authorizeAdmin} />;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AdminSidebar active={activeTab} onChange={setActiveTab} />

        <main className="flex-1 p-4 md:p-8 pt-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-700 via-blue-700 to-indigo-700 bg-clip-text text-transparent">
                EvAI Autonomous System
              </h2>
              <p className="text-muted-foreground">
                Real-time autonomous AI operations center • Health: {systemMetrics?.systemHealth || 'initializing'} • Success Rate: {systemMetrics?.successRate.toFixed(1) || '0'}%
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={handleConsolidateKnowledge}
                disabled={isConsolidating}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                {isConsolidating ? 'Cleaning...' : 'Clean Database'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  logoutAdmin();
                  toast({ 
                    title: "Uitgelogd", 
                    description: "Admin sessie beëindigd. Refresh om opnieuw in te loggen." 
                  });
                }}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Uitloggen
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
            <TabsContent value="autonomy" className="space-y-4">
              <AutonomyConsole systemMetrics={systemMetrics} connectionStatus={connectionStatus} />
          <div className="mt-6">
            <RetroactiveLearningStatus />
          </div>
        </TabsContent>

            <TabsContent value="seeds" className="space-y-4">
              <AdvancedSeedManager />
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <ConfigurationPanel />
            </TabsContent>

            <TabsContent value="python" className="space-y-4">
              <MLEngineMonitor />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;
