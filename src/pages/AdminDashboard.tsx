
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
  BookOpen,
  HelpCircle
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

const AdminDashboard: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    openaiApi1: 'missing',
    openaiApi2: 'missing',
    vectorApi: 'missing',
    supabase: 'connected'
  });

  const { data: seeds, isLoading: seedsLoading, error: seedsError } = useSeeds();
  const { isRunning, progress, results, runHealthCheck } = useHealthCheck();

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = () => {
    const openaiKey1 = localStorage.getItem('openai-api-key');
    const openaiKey2 = localStorage.getItem('openai-api-key-2');
    const vectorKey = localStorage.getItem('vector-api-key');

    setConnectionStatus({
      openaiApi1: openaiKey1?.trim() ? 'configured' : 'missing',
      openaiApi2: openaiKey2?.trim() ? 'configured' : 'missing',
      vectorApi: vectorKey?.trim() ? 'configured' : 'missing',
      supabase: 'connected'
    });
  };

  const activeSeedsCount = seeds?.filter(s => s.isActive).length || 0;
  const totalSeedsCount = seeds?.length || 0;

  const systemHealthData = {
    status: 'operational',
    uptime: '99.9%',
    errorRate: '0.1',
    avgResponseTime: '245ms'
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
          <TabsList className="grid w-full grid-cols-5 bg-white/60 backdrop-blur-sm border border-purple-200">
            <TabsTrigger value="unified-knowledge" className="flex items-center gap-2">
              <Brain size={16} />
              <span className="hidden sm:inline">Unified Knowledge</span>
            </TabsTrigger>
            <TabsTrigger value="system-health" className="flex items-center gap-2">
              <Activity size={16} />
              <span className="hidden sm:inline">Health</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp size={16} />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="seeds" className="flex items-center gap-2">
              <Database size={16} />
              <span className="hidden sm:inline">Seeds</span>
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

          {/* Seeds Tab */}
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

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings size={20} />
                  System Configuration
                </CardTitle>
                <CardDescription>
                  Configure API keys and system settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="h-4 w-4 text-amber-600" />
                      <span className="font-medium text-amber-800">Configuration</span>
                    </div>
                    <p className="text-sm text-amber-700 mb-3">
                      API keys are configured in the main chat interface via the settings panel.
                    </p>
                    <Link to="/">
                      <Button variant="outline" size="sm">
                        Go to Settings
                      </Button>
                    </Link>
                  </div>
                  
                  <Button 
                    onClick={checkConnectionStatus}
                    variant="outline"
                    className="w-full"
                  >
                    Refresh Connection Status
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
