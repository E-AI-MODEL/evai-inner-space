
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
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">EvAI Admin Dashboard</h1>
          <p className="text-gray-600">Beheer seeds, monitor prestaties en genereer nieuwe content</p>
        </div>

        <Tabs defaultValue="advanced-seeds" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="advanced-seeds" className="flex items-center gap-2">
              <Brain size={16} />
              Advanced Seeds
            </TabsTrigger>
            <TabsTrigger value="seeds" className="flex items-center gap-2">
              <Database size={16} />
              Legacy Seeds
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart size={16} />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="monitor" className="flex items-center gap-2">
              <Cpu size={16} />
              Monitor
            </TabsTrigger>
            <TabsTrigger value="generator" className="flex items-center gap-2">
              <Zap size={16} />
              Auto-Generator
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings size={16} />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="advanced-seeds" className="mt-6">
            <AdvancedSeedManager />
          </TabsContent>

          <TabsContent value="seeds" className="mt-6">
            <AdminSeedManager />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <AdminAnalytics messages={messages} />
          </TabsContent>

          <TabsContent value="monitor" className="mt-6">
            <AdminSystemMonitor messages={messages} />
          </TabsContent>

          <TabsContent value="generator" className="mt-6">
            <AdminAutoSeedGenerator apiKey={apiKey} />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <div className="bg-white rounded-lg p-6 border">
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
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
