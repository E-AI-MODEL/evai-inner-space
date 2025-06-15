
import React, { useState } from 'react';
import { useChat } from '../hooks/useChat';
import TopBar from '../components/TopBar';
import AdminSeedManager from '../components/admin/AdminSeedManager';
import AdvancedSeedManager from '../components/admin/AdvancedSeedManager';
import AdminAnalytics from '../components/admin/AdminAnalytics';
import AdminSystemMonitor from '../components/admin/AdminSystemMonitor';
import AdminAutoSeedGenerator from '../components/admin/AdminAutoSeedGenerator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Database, BarChart, Cpu, Zap, Brain } from 'lucide-react';

const AdminDashboard = () => {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("openai-api-key") || "");
  const { messages, clearHistory } = useChat(apiKey);

  return (
    <div className="w-full min-h-screen bg-background">
      <TopBar onSettingsClick={() => {}} />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">EvAI Admin Dashboard</h1>
          <p className="text-gray-600">Beheer seeds, monitor prestaties en genereer nieuwe content</p>
        </div>

        <Tabs defaultValue="advanced-seeds" className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-6">
            <TabsTrigger value="advanced-seeds" className="flex items-center gap-2 text-xs sm:text-sm">
              <Brain size={16} />
              <span className="hidden sm:inline">Advanced Seeds</span>
              <span className="sm:hidden">Advanced</span>
            </TabsTrigger>
            <TabsTrigger value="seeds" className="flex items-center gap-2 text-xs sm:text-sm">
              <Database size={16} />
              <span className="hidden sm:inline">Legacy Seeds</span>
              <span className="sm:hidden">Legacy</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2 text-xs sm:text-sm">
              <BarChart size={16} />
              <span className="hidden sm:inline">Analytics</span>
              <span className="sm:hidden">Stats</span>
            </TabsTrigger>
            <TabsTrigger value="monitor" className="flex items-center gap-2 text-xs sm:text-sm">
              <Cpu size={16} />
              <span className="hidden sm:inline">Monitor</span>
              <span className="sm:hidden">System</span>
            </TabsTrigger>
            <TabsTrigger value="generator" className="flex items-center gap-2 text-xs sm:text-sm">
              <Zap size={16} />
              <span className="hidden sm:inline">Auto-Generator</span>
              <span className="sm:hidden">Auto</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2 text-xs sm:text-sm">
              <Settings size={16} />
              <span className="hidden sm:inline">Settings</span>
              <span className="sm:hidden">Config</span>
            </TabsTrigger>
          </TabsList>

          <div className="min-h-[600px]">
            <TabsContent value="advanced-seeds" className="mt-0">
              <div className="bg-white rounded-lg border shadow-sm">
                <AdvancedSeedManager />
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
              <div className="bg-white rounded-lg p-6 border shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Systeem Instellingen</h3>
                <div className="space-y-4">
                  <button
                    onClick={clearHistory}
                    className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-sm font-medium transition-colors"
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
