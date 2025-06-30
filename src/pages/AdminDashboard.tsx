import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Brain, Database, Activity, Settings, TrendingUp, AlertTriangle, CheckCircle, Users, BarChart3, Zap } from 'lucide-react';
import { useSeeds } from '../hooks/useSeeds';
import { testSupabaseConnection } from '../integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import AdvancedSeedManager from '../components/admin/AdvancedSeedManager';
import ConfigurationPanel from '../components/ConfigurationPanel';
import LiveEventLog from '../components/admin/LiveEventLog';
import SystemHealthCheck from '../components/admin/SystemHealthCheck';
import SystemStatusOverview from '../components/admin/SystemStatusOverview';
import SystemStatusDetails from '../components/admin/SystemStatusDetails';
import { ConnectionStatus } from '../types/connectionStatus';

const AdminDashboard = () => {
  const [supabaseStatus, setSupabaseStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const { toast } = useToast();
  const { data: seeds = [] } = useSeeds();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    supabase: 'checking',
    openaiApi1: 'checking',
    openaiApi2: 'checking',
    vectorApi: 'checking',
    seeds: 'loading'
  });

  // Test Supabase connection on component mount
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
      supabase: supabaseStatus === 'connected'
        ? 'connected'
        : supabaseStatus === 'connecting'
          ? 'checking'
          : 'error',
      openaiApi1: localStorage.getItem('openai-api-key') ? 'configured' : 'missing',
      openaiApi2: localStorage.getItem('openai-api-key-2') ? 'configured' : 'missing',
      vectorApi: localStorage.getItem('vector-api-key') ? 'configured' : 'missing',
      seeds: seeds.length > 0 ? 'loaded' : 'error'
    });
  }, [supabaseStatus, seeds]);

  // Query for admin analytics
  const { data: analytics } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      // Mock analytics data - in production this would fetch from Supabase
      return {
        totalSeeds: seeds.length,
        activeSeeds: seeds.filter(s => s.isActive).length,
        totalConversations: 150,
        avgConfidence: 0.82,
        weeklyGrowth: 12.5,
        systemHealth: 'excellent',
        apiUsage: {
          openai: 1240,
          vector: 890,
          supabase: 2150
        },
        recentActivity: [
          { action: 'Seed Generated', time: '2 min ago', status: 'success' },
          { action: 'User Login', time: '5 min ago', status: 'info' },
          { action: 'API Call', time: '8 min ago', status: 'success' },
          { action: 'Database Update', time: '12 min ago', status: 'success' }
        ],
        performanceMetrics: {
          avgResponseTime: 450,
          successRate: 98.5,
          errorRate: 1.5,
          userSatisfaction: 4.3
        }
      };
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-50';
      case 'disconnected': return 'text-red-600 bg-red-50';
      case 'connecting': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-4 w-4" />;
      case 'disconnected': return <AlertTriangle className="h-4 w-4" />;
      case 'connecting': return <Activity className="h-4 w-4 animate-spin" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-700 via-blue-700 to-indigo-700 bg-clip-text text-transparent">
            EvAI Admin Dashboard
          </h2>
          <p className="text-muted-foreground">
            Beheer je neurosymbolische AI systeem en monitor de prestaties
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className={`${getStatusColor(supabaseStatus)} border-current`}>
            {getStatusIcon(supabaseStatus)}
            <span className="ml-2 font-medium">
              Supabase {supabaseStatus === 'connected' ? 'Verbonden' : 
                      supabaseStatus === 'connecting' ? 'Verbinden...' : 'Offline'}
            </span>
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overzicht</TabsTrigger>
          <TabsTrigger value="seeds">Seeds Beheer</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Instellingen</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Totaal Seeds</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalSeeds || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics?.activeSeeds || 0} actief
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gesprekken</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalConversations || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Deze week +{analytics?.weeklyGrowth || 0}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Vertrouwen</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round((analytics?.avgConfidence || 0) * 100)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Zeer hoog niveau
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Systeem Status</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {analytics?.systemHealth === 'excellent' ? 'Uitstekend' : 'Goed'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Alle systemen operationeel
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Recente Activiteit</CardTitle>
                <CardDescription>
                  Laatste gebeurtenissen in het systeem
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.recentActivity?.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`h-2 w-2 rounded-full ${
                          activity.status === 'success' ? 'bg-green-500' :
                          activity.status === 'info' ? 'bg-blue-500' : 'bg-yellow-500'
                        }`} />
                        <span className="text-sm font-medium">{activity.action}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>API Gebruik</CardTitle>
                <CardDescription>
                  Deze maand
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">OpenAI</span>
                    <span className="font-bold">{analytics?.apiUsage?.openai || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Vector DB</span>
                    <span className="font-bold">{analytics?.apiUsage?.vector || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Supabase</span>
                    <span className="font-bold">{analytics?.apiUsage?.supabase || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="seeds" className="space-y-4">
          <AdvancedSeedManager />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Prestatie Metriek
                </CardTitle>
                <CardDescription>
                  Systeem prestaties en betrouwbaarheid
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Gem. Response Tijd</span>
                    <Badge variant="outline" className="text-green-600">
                      {analytics?.performanceMetrics?.avgResponseTime || 0}ms
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Slaagpercentage</span>
                    <Badge variant="outline" className="text-green-600">
                      {analytics?.performanceMetrics?.successRate || 0}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Foutpercentage</span>
                    <Badge variant="outline" className="text-yellow-600">
                      {analytics?.performanceMetrics?.errorRate || 0}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Gebruikerstevredenheid</span>
                    <Badge variant="outline" className="text-green-600">
                      {analytics?.performanceMetrics?.userSatisfaction || 0}/5
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Systeem Status</CardTitle>
                <CardDescription>
                  Overzicht van gekoppelde services
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <SystemStatusOverview
                  openAiActive={connectionStatus.openaiApi1 === 'configured'}
                  openAi2Active={connectionStatus.openaiApi2 === 'configured'}
                  vectorActive={connectionStatus.vectorApi === 'configured'}
                />
                <SystemStatusDetails
                  status={connectionStatus}
                  seedsCount={seeds.length}
                  activeSeedsCount={seeds.filter(s => s.isActive).length}
                />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <SystemHealthCheck />
            <LiveEventLog />
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <ConfigurationPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
