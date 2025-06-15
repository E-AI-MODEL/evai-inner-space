
import React, { useState } from 'react';
import { useChat } from '../hooks/useChat';
import { useNavigate } from 'react-router-dom';
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
import { Settings, Database, BarChart, Cpu, Zap, Brain, MessageSquare, Target, Activity, Sparkles } from 'lucide-react';

const AdminDashboard = () => {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("openai-api-key") || "");
  const { messages, clearHistory } = useChat(apiKey);
  const navigate = useNavigate();

  return (
    <div className="w-full min-h-screen bg-background">
      <TopBar onSettingsClick={() => {}} />
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-7xl">
        <div className="mb-4 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">EvAI Admin Dashboard</h1>
            <p className="text-sm sm:text-base text-gray-600">Beheer seeds, monitor prestaties en analyseer rubrieken met AI-powered learning</p>
          </div>
          <Button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 w-full sm:w-auto"
            variant="outline"
          >
            <MessageSquare size={16} />
            Terug naar Chat
          </Button>
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
