
import React, { useState } from 'react';
import { useChat } from '../hooks/useChat';
import { useNavigate } from 'react-router-dom';
import { useSystemBootstrap } from '../hooks/useSystemBootstrap';
import TopBar from '../components/TopBar';
import AdminSeedManager from '../components/admin/AdminSeedManager';
import AdvancedSeedManager from '../components/admin/AdvancedSeedManager';
import AdminAnalytics from '../components/admin/AdminAnalytics';
import AdminSystemMonitor from '../components/admin/AdminSystemMonitor';
import AdminAutoSeedGenerator from '../components/admin/AdminAutoSeedGenerator';
import AdminRubricsView from '../components/admin/AdminRubricsView';
import LiveMonitoringDashboard from '../components/admin/LiveMonitoringDashboard';
import SelfLearningControls from '../components/admin/SelfLearningControls';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Settings, Database, BarChart, Cpu, Zap, Brain, MessageSquare, Target, Activity, Sparkles, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

const AdminDashboard = () => {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("openai-api-key") || "");
  const { messages, clearHistory } = useChat(apiKey);
  const navigate = useNavigate();
  
  const { 
    isBootstrapping, 
    bootstrapStatus, 
    isSystemReady,
    runFullBootstrap 
  } = useSystemBootstrap();

  return (
    <div className="w-full min-h-screen bg-background">
      <TopBar onSettingsClick={() => {}} />
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-7xl">
        <div className="mb-4 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">EvAI Admin Dashboard</h1>
            <p className="text-sm sm:text-base text-gray-600">Beheer seeds, monitor prestaties en analyseer rubrieken met AI-powered learning</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
              variant="outline"
            >
              <MessageSquare size={16} />
              Terug naar Chat
            </Button>
          </div>
        </div>

        {/* System Status Alert */}
        {!isSystemReady && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <div>
                {isBootstrapping ? "System is bootstrapping advanced features..." : "Some advanced features may not be fully active."}
              </div>
              <Button 
                onClick={runFullBootstrap} 
                disabled={isBootstrapping}
                size="sm"
                variant="outline"
                className="flex items-center gap-2"
              >
                {isBootstrapping ? <RefreshCw size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                {isBootstrapping ? "Bootstrapping..." : "Reinitialize"}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* System Status Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Advanced Seeds</p>
                <div className="flex items-center gap-1 mt-1">
                  {bootstrapStatus.advancedSeeds ? <CheckCircle size={16} className="text-green-600" /> : <AlertCircle size={16} className="text-orange-500" />}
                  <Badge variant={bootstrapStatus.advancedSeeds ? "default" : "secondary"} className="text-xs">
                    {bootstrapStatus.advancedSeeds ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Live Monitoring</p>
                <div className="flex items-center gap-1 mt-1">
                  {bootstrapStatus.liveMonitoring ? <CheckCircle size={16} className="text-green-600" /> : <AlertCircle size={16} className="text-orange-500" />}
                  <Badge variant={bootstrapStatus.liveMonitoring ? "default" : "secondary"} className="text-xs">
                    {bootstrapStatus.liveMonitoring ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Learning Engine</p>
                <div className="flex items-center gap-1 mt-1">
                  {bootstrapStatus.learningEngine ? <CheckCircle size={16} className="text-green-600" /> : <AlertCircle size={16} className="text-orange-500" />}
                  <Badge variant={bootstrapStatus.learningEngine ? "default" : "secondary"} className="text-xs">
                    {bootstrapStatus.learningEngine ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Rubrics System</p>
                <div className="flex items-center gap-1 mt-1">
                  {bootstrapStatus.rubrics ? <CheckCircle size={16} className="text-green-600" /> : <AlertCircle size={16} className="text-orange-500" />}
                  <Badge variant={bootstrapStatus.rubrics ? "default" : "secondary"} className="text-xs">
                    {bootstrapStatus.rubrics ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Seed Injection</p>
                <div className="flex items-center gap-1 mt-1">
                  {bootstrapStatus.seedInjection ? <CheckCircle size={16} className="text-green-600" /> : <AlertCircle size={16} className="text-orange-500" />}
                  <Badge variant={bootstrapStatus.seedInjection ? "default" : "secondary"} className="text-xs">
                    {bootstrapStatus.seedInjection ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="live-monitoring" className="w-full">
          <div className="overflow-x-auto mb-6">
            <TabsList className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 w-full min-w-[600px] lg:min-w-0">
              <TabsTrigger value="live-monitoring" className="flex items-center gap-1 sm:gap-2 text-xs px-2 py-1">
                <Activity size={14} />
                <span className="hidden sm:inline text-xs">Live Monitor</span>
                <span className="sm:hidden text-xs">Live</span>
              </TabsTrigger>
              <TabsTrigger value="self-learning" className="flex items-center gap-1 sm:gap-2 text-xs px-2 py-1">
                <Sparkles size={14} />
                <span className="hidden sm:inline text-xs">Self-Learning</span>
                <span className="sm:hidden text-xs">Learn</span>
              </TabsTrigger>
              <TabsTrigger value="advanced-seeds" className="flex items-center gap-1 sm:gap-2 text-xs px-2 py-1">
                <Brain size={14} />
                <span className="hidden sm:inline text-xs">Advanced Seeds</span>
                <span className="sm:hidden text-xs">Seeds</span>
              </TabsTrigger>
              <TabsTrigger value="rubrics" className="flex items-center gap-1 sm:gap-2 text-xs px-2 py-1">
                <Target size={14} />
                <span className="hidden sm:inline text-xs">Rubrieken</span>
                <span className="sm:hidden text-xs">Rules</span>
              </TabsTrigger>
              <TabsTrigger value="seeds" className="flex items-center gap-1 sm:gap-2 text-xs px-2 py-1">
                <Database size={14} />
                <span className="hidden sm:inline text-xs">Legacy Seeds</span>
                <span className="sm:hidden text-xs">Legacy</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-1 sm:gap-2 text-xs px-2 py-1">
                <BarChart size={14} />
                <span className="hidden sm:inline text-xs">Analytics</span>
                <span className="sm:hidden text-xs">Stats</span>
              </TabsTrigger>
              <TabsTrigger value="monitor" className="flex items-center gap-1 sm:gap-2 text-xs px-2 py-1">
                <Cpu size={14} />
                <span className="hidden sm:inline text-xs">Monitor</span>
                <span className="sm:hidden text-xs">System</span>
              </TabsTrigger>
              <TabsTrigger value="generator" className="flex items-center gap-1 sm:gap-2 text-xs px-2 py-1">
                <Zap size={14} />
                <span className="hidden sm:inline text-xs">Auto-Generator</span>
                <span className="sm:hidden text-xs">Auto</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-1 sm:gap-2 text-xs px-2 py-1">
                <Settings size={14} />
                <span className="hidden sm:inline text-xs">Settings</span>
                <span className="sm:hidden text-xs">Config</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="min-h-[400px] sm:min-h-[600px]">
            <TabsContent value="live-monitoring" className="mt-0">
              <div className="bg-white rounded-lg border shadow-sm p-3 sm:p-6">
                <LiveMonitoringDashboard />
              </div>
            </TabsContent>

            <TabsContent value="self-learning" className="mt-0">
              <div className="bg-white rounded-lg border shadow-sm p-3 sm:p-6">
                <SelfLearningControls 
                  messages={messages}
                  onLearningUpdate={() => {
                    // Optionally refresh data or show notifications
                  }}
                />
              </div>
            </TabsContent>

            <TabsContent value="advanced-seeds" className="mt-0">
              <div className="bg-white rounded-lg border shadow-sm">
                <AdvancedSeedManager />
              </div>
            </TabsContent>

            <TabsContent value="rubrics" className="mt-0">
              <div className="bg-white rounded-lg border shadow-sm p-3 sm:p-6">
                <AdminRubricsView messages={messages} />
              </div>
            </TabsContent>

            <TabsContent value="seeds" className="mt-0">
              <div className="bg-white rounded-lg border shadow-sm">
                <AdminSeedManager />
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="mt-0">
              <div className="bg-white rounded-lg border shadow-sm">
                <AdminAnalytics messages={messages} />
              </div>
            </TabsContent>

            <TabsContent value="monitor" className="mt-0">
              <div className="bg-white rounded-lg border shadow-sm">
                <AdminSystemMonitor messages={messages} />
              </div>
            </TabsContent>

            <TabsContent value="generator" className="mt-0">
              <div className="bg-white rounded-lg border shadow-sm">
                <AdminAutoSeedGenerator apiKey={apiKey} />
              </div>
            </TabsContent>

            <TabsContent value="settings" className="mt-0">
              <div className="bg-white rounded-lg p-3 sm:p-6 border shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Systeem Instellingen</h3>
                <div className="space-y-4">
                  <button
                    onClick={clearHistory}
                    className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto"
                  >
                    Wis Alle Chat Geschiedenis
                  </button>
                  
                  <button
                    onClick={() => {
                      localStorage.removeItem('evai-bootstrapped');
                      window.location.reload();
                    }}
                    className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto ml-2"
                  >
                    Reset System Bootstrap
                  </button>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
