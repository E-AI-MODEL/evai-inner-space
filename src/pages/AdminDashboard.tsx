
import React from 'react';
import { ArrowLeft, Database, BarChart, Monitor, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdvancedSeedManager from '../components/admin/AdvancedSeedManager';
import AdminAnalytics from '../components/admin/AdminAnalytics';
import AdminSystemMonitor from '../components/admin/AdminSystemMonitor';
import AdminRubricsOverview from '../components/admin/AdminRubricsOverview';
import { useChatHistory } from '../hooks/useChatHistory';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { messages } = useChatHistory();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 font-inter">
      {/* Hero header */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-200 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                aria-label="Ga terug"
                className="flex items-center gap-2"
              >
                <ArrowLeft size={16} />
                Terug
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-700">Neurosymbolische AI Beheer & EvAI 5.6 Rubrics</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="rubrics" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-8 bg-white rounded-lg shadow p-1">
            <TabsTrigger value="rubrics" className="flex items-center gap-2">
              <Brain size={16} />
              EvAI Rubrics
            </TabsTrigger>
            <TabsTrigger value="seeds" className="flex items-center gap-2">
              <Database size={16} />
              Advanced Seeds
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart size={16} />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Monitor size={16} />
              Systeem
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rubrics">
            <AdminRubricsOverview messages={messages} />
          </TabsContent>

          <TabsContent value="seeds">
            <AdvancedSeedManager />
          </TabsContent>

          <TabsContent value="analytics">
            <AdminAnalytics messages={messages} />
          </TabsContent>

          <TabsContent value="system">
            <AdminSystemMonitor messages={messages} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
