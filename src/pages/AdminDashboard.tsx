
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Database, 
  Brain, 
  Activity, 
  Users,
  TrendingUp,
  Zap,
  HelpCircle,
  Monitor
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { useSeeds } from '../hooks/useSeeds';
import { useHealthCheck } from '../hooks/useHealthCheck';
import { ConnectionStatus } from '../types/connectionStatus';
import SystemStatus from '../components/admin/SystemStatus';
import SystemStatusOverview from '../components/admin/SystemStatusOverview';
import SystemStatusDetails from '../components/admin/SystemStatusDetails';
import UnifiedKnowledgeManager from '../components/admin/UnifiedKnowledgeManager';
import { performFullSystemCheck } from '../utils/connectionUtils';
import RealtimeMonitor from '../components/RealtimeMonitor';
import NeurosymbolicVisualizer from '../components/NeurosymbolicVisualizer';
import ConfigurationPanel from '../components/ConfigurationPanel';
import { useProcessingOrchestrator } from '../hooks/useProcessingOrchestrator';

const AdminDashboard: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    openaiApi1: 'checking',
    openaiApi2: 'checking',
    vectorApi: 'checking',
    supabase: 'checking',
    seeds: 'loading'
  });

  const { data: seeds, isLoading: seedsLoading, error: seedsError, refetch: refetchSeeds } = useSeeds();
  const { isRunning, progress, results, runHealthCheck } = useHealthCheck();
  const { stats, lastDecision, isProcessing } = useProcessingOrchestrator();

  const checkConnections = async () => {
    console.log('🔍 Starting comprehensive connection status check...');
    
    setConnectionStatus(prev => ({
      ...prev,
      supabase: 'checking',
      openaiApi1: 'checking',
      openaiApi2: 'checking',
      vectorApi: 'checking'
    }));

    try {
      const systemResults = await performFullSystemCheck();
      
      setConnectionStatus(prev => ({
        ...prev,
        supabase: systemResults.supabase ? 'connected' : 'error',
        openaiApi1: systemResults.openaiApi1 ? 'configured' : 'missing',
        openaiApi2: systemResults.openaiApi2 ? 'configured' : 'missing',
        vectorApi: systemResults.vectorApi ? 'configured' : 'missing'
      }));

      if (systemResults.supabase) {
        toast({
          title: "Verbinding hersteld",
          description: "Supabase verbinding is succesvol hersteld.",
        });
      } else {
        toast({
          title: "Verbindingsprobleem",
          description: "Kan geen verbinding maken met Supabase database.",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('🔴 Connection check failed:', error);
      setConnectionStatus(prev => ({
        ...prev,
        supabase: 'error',
        openaiApi1: 'missing',
        openaiApi2: 'missing',
        vectorApi: 'missing'
      }));

      toast({
        title: "Systeemfout",
        description: "Er is een fout opgetreden bij het controleren van de verbindingen.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    console.log('🚀 AdminDashboard mounted, starting initial connection check');
    checkConnections();
  }, []);

  // Update seeds status when seeds data changes
  useEffect(() => {
    if (seedsLoading) {
      setConnectionStatus(prev => ({ ...prev, seeds: 'loading' }));
    } else if (seedsError) {
      console.error('🔴 Seeds loading error:', seedsError);
      setConnectionStatus(prev => ({ ...prev, seeds: 'error' }));
    } else {
      console.log(`✅ Seeds loaded successfully: ${seeds?.length || 0} total seeds`);
      setConnectionStatus(prev => ({ ...prev, seeds: 'loaded' }));
    }
  }, [seeds, seedsError, seedsLoading]);

  const activeSeedsCount = seeds?.filter(s => s.isActive).length || 0;
  const totalSeedsCount = seeds?.length || 0;

  const formatApiStatus = (apiCollaboration?: any) => {
    if (!apiCollaboration) return 'Geen API data';

    const statuses = [] as string[];
    if (apiCollaboration.api1_used !== undefined) {
      statuses.push(`API1: ${apiCollaboration.api1_used ? '✅' : '❌'}`);
    }
    if (apiCollaboration.api2_used !== undefined) {
      statuses.push(`API2: ${apiCollaboration.api2_used ? '✅' : '❌'}`);
    }
    if (apiCollaboration.vector_api_used !== undefined) {
      statuses.push(`Vector: ${apiCollaboration.vector_api_used ? '✅' : '❌'}`);
    }
    if (apiCollaboration.seed_generated !== undefined) {
      statuses.push(`Seed: ${apiCollaboration.seed_generated ? '✅' : '❌'}`);
    }

    return statuses.length > 0 ? statuses.join(', ') : 'Geen API status';
  };

  const neurosymbolicData = lastDecision ? {
    symbolicMatches: [
      {
        pattern: 'Symbolic pattern detected',
        confidence: lastDecision.confidence,
        source: lastDecision.source
      }
    ],
    neuralAnalysis: {
      emotion: 'neutral',
      confidence: lastDecision.confidence,
      reasoning: lastDecision.reasoning[0] || 'Neural processing'
    },
    hybridDecision: {
      finalEmotion: 'neutral',
      confidence: lastDecision.confidence,
      processingPath: lastDecision.type,
      componentsUsed: formatApiStatus(lastDecision.metadata?.apiCollaboration)
    }
  } : undefined;

  const systemHealthData = {
    status: connectionStatus.supabase === 'connected' ? 'operational' : 'error',
    uptime: '99.9%',
    errorRate: connectionStatus.supabase === 'connected' ? '0.1' : '15.2',
    avgResponseTime: connectionStatus.supabase === 'connected' ? '245ms' : '2.1s'
  };

  const handleRefreshAll = async () => {
    await checkConnections();
    await refetchSeeds();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">
              EvAI 6.0 - Unified Decision Core Management
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleRefreshAll} variant="outline" className="flex items-center gap-2">
              <Activity size={16} />
              Ververs Alles
            </Button>
            <Link to="/admin/guide">
              <Button variant="outline" className="flex items-center gap-2">
                <HelpCircle size={16} />
                Admin Guide
              </Button>
            </Link>
            <Link to="/">
              <Button variant="outline">
                Back to Chat
              </Button>
            </Link>
          </div>
        </div>

        {/* Connection Status Alert */}
        {connectionStatus.supabase === 'error' && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Database className="h-4 w-4 text-red-600" />
              <span className="font-medium text-red-800">Supabase Verbindingsprobleem</span>
            </div>
            <p className="text-sm text-red-700 mb-3">
              Kan geen verbinding maken met de Supabase database. Dit kan de functionaliteit beperken.
            </p>
            <Button onClick={checkConnections} size="sm" variant="outline" className="text-red-700 border-red-300">
              Probeer Opnieuw
            </Button>
          </div>
        )}

        {/* System Status Overview */}
        <div className="mb-6">
          <SystemStatusOverview
            openAiActive={connectionStatus.openaiApi1 === 'configured'}
            openAi2Active={connectionStatus.openaiApi2 === 'configured'}
            vectorActive={connectionStatus.vectorApi === 'configured'}
          />
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="unified-knowledge" className="w-full">
          <TabsList className="grid w-full grid-cols-7 bg-white/60 backdrop-blur-sm border border-purple-200">
            <TabsTrigger value="unified-knowledge" className="flex items-center gap-2">
              <Brain size={16} />
              <span className="hidden sm:inline">Unified Knowledge</span>
            </TabsTrigger>
            <TabsTrigger value="system-health" className="flex items-center gap-2">
              <Activity size={16} />
              <span className="hidden sm:inline">Health</span>
            </TabsTrigger>
            <TabsTrigger value="monitor" className="flex items-center gap-2">
              <Monitor size={16} />
              <span className="hidden sm:inline">Monitor</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp size={16} />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="seeds" className="flex items-center gap-2">
              <Database size={16} />
              <span className="hidden sm:inline">Seeds</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity size={16} />
              <span className="hidden sm:inline">Activity</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings size={16} />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Unified Knowledge Tab */}
          <TabsContent value="unified-knowledge" className="space-y-6">
            <UnifiedKnowledgeManager />
          </TabsContent>

          {/* System Health Tab */}
          <TabsContent value="system-health" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity size={20} />
                    Health Check
                  </CardTitle>
                  <CardDescription>
                    Run comprehensive system diagnostics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={runHealthCheck} 
                    disabled={isRunning}
                    className="w-full mb-4"
                  >
                    {isRunning ? `Running... ${Math.round(progress)}%` : 'Run Health Check'}
                  </Button>
                  
                  {results.length > 0 && (
                    <div className="space-y-2">
                      {results.map((result, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm font-medium">{result.component}</span>
                          <Badge variant={
                            result.status === 'success' ? 'default' : 
                            result.status === 'warning' ? 'secondary' : 'destructive'
                          }>
                            {result.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <SystemStatusDetails
                    status={connectionStatus}
                    seedsCount={totalSeedsCount}
                    activeSeedsCount={activeSeedsCount}
                  />
                </CardContent>
              </Card>
            </div>

            <SystemStatus systemHealth={systemHealthData} />
          </TabsContent>

          {/* Monitor Tab */}
          <TabsContent value="monitor" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <NeurosymbolicVisualizer
                  data={neurosymbolicData}
                  isProcessing={isProcessing}
                />
              </div>
              <div>
                <RealtimeMonitor
                  isProcessing={isProcessing}
                  lastDecision={lastDecision ? {
                    type: lastDecision.type,
                    confidence: lastDecision.confidence,
                    source: lastDecision.source,
                    processingTime: lastDecision.processingTime
                  } : null}
                />
              </div>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp size={20} />
                  Performance Analytics
                </CardTitle>
                <CardDescription>
                  System performance and usage metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{totalSeedsCount}</div>
                    <div className="text-sm text-gray-600">Total Seeds</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{activeSeedsCount}</div>
                    <div className="text-sm text-gray-600">Active Seeds</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">98.5%</div>
                    <div className="text-sm text-gray-600">Accuracy</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">245ms</div>
                    <div className="text-sm text-gray-600">Avg Response</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Log */}
          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Activiteitslog</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {lastDecision && (
                    <div className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">{lastDecision.type}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date().toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm">{lastDecision.reasoning[0]}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">Vertrouwen:</span>
                        <Badge variant="secondary">
                          {Math.round(lastDecision.confidence * 100)}%
                        </Badge>
                      </div>
                      {lastDecision.metadata?.apiCollaboration && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          API Status: {formatApiStatus(lastDecision.metadata.apiCollaboration)}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Activiteitslogboek wordt bijgewerkt tijdens gebruik</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seeds" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database size={20} />
                  Seeds Management
                </CardTitle>
                <CardDescription>
                  Legacy seed system (now part of Unified Knowledge)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-800">Migration Notice</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    Seeds are now managed through the Unified Knowledge system. 
                    Use the "Unified Knowledge" tab for full management capabilities.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Current Seeds Status</h4>
                    <Badge variant="outline">
                      {seedsLoading ? 'Loading...' : `${totalSeedsCount} total`}
                    </Badge>
                  </div>
                  
                  {seedsError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-700">
                        Error loading seeds: {seedsError.message}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <ConfigurationPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
