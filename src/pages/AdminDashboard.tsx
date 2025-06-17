
import React from 'react';
import { ArrowLeft, Database, BarChart, Monitor, Brain, Sparkles, Shield, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import AdvancedSeedManager from '../components/admin/AdvancedSeedManager';
import AdminAnalytics from '../components/admin/AdminAnalytics';
import AdminSystemMonitor from '../components/admin/AdminSystemMonitor';
import AdminRubricsOverview from '../components/admin/AdminRubricsOverview';
import SupabaseConnectionStatus from '../components/admin/SupabaseConnectionStatus';
import SupabaseDataTest from '../components/admin/SupabaseDataTest';
import { useChatHistory } from '../hooks/useChatHistory';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '../hooks/use-mobile';

const AdminDashboard = () => {
  const { messages } = useChatHistory();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Check if rubrics are active (messages contain rubric-related content)
  const hasRubricActivity = messages.some(msg => 
    msg.content.toLowerCase().includes('emotionele regulatie') ||
    msg.content.toLowerCase().includes('coping') ||
    msg.content.toLowerCase().includes('zelfbewustzijn') ||
    msg.content.toLowerCase().includes('sociale verbinding') ||
    msg.content.toLowerCase().includes('betekenis')
  );

  const handleBackClick = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 font-inter">
      {/* Mobile-Optimized Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-blue-600/10 to-indigo-600/10" />
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
        
        <div className="relative container mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <div className="space-y-4">
            {/* Top Row - Back Button and Title */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size={isMobile ? "sm" : "default"}
                onClick={handleBackClick}
                aria-label="Terug naar chat"
                className="flex items-center gap-2 hover:bg-white/60 backdrop-blur-sm border border-white/20 flex-shrink-0 min-w-[80px] bg-white/50"
              >
                <ArrowLeft size={isMobile ? 14 : 16} />
                <span>Terug</span>
              </Button>
              
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="p-1.5 sm:p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg sm:rounded-xl flex-shrink-0">
                  <Brain className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-700 via-blue-700 to-indigo-700 bg-clip-text text-transparent truncate">
                    EvAI Admin
                  </h1>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200 text-xs">
                    v5.6 Pro
                  </Badge>
                </div>
              </div>
            </div>

            {/* Mobile Stats Row */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto">
              <div className="flex items-center gap-2 text-xs text-gray-600 flex-shrink-0">
                <div className="flex items-center gap-1">
                  <Sparkles size={12} className="text-yellow-500" />
                  <span className="whitespace-nowrap">AI Engine</span>
                </div>
                <div className="flex items-center gap-1">
                  <Activity size={12} className="text-blue-500" />
                  <span className="whitespace-nowrap">{messages.length} Sessies</span>
                </div>
              </div>
              
              <SupabaseConnectionStatus />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-Optimized Content */}
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <Tabs defaultValue={hasRubricActivity ? "rubrics" : "seeds"} className="w-full" orientation="horizontal">
          <div className="mb-4 sm:mb-6">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-white/20 p-1.5 sm:p-2 gap-1">
              {hasRubricActivity && (
                <TabsTrigger 
                  value="rubrics" 
                  className="flex items-center justify-center gap-1 sm:gap-2 rounded-lg sm:rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white transition-all duration-200 text-xs sm:text-sm px-2 py-2"
                >
                  <Brain size={14} className="flex-shrink-0" />
                  <span className="truncate">Analyse</span>
                </TabsTrigger>
              )}
              
              <TabsTrigger 
                value="seeds" 
                className="flex items-center justify-center gap-1 sm:gap-2 rounded-lg sm:rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white transition-all duration-200 text-xs sm:text-sm px-2 py-2"
              >
                <Database size={14} className="flex-shrink-0" />
                <span className="truncate">Seeds</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="analytics" 
                className="flex items-center justify-center gap-1 sm:gap-2 rounded-lg sm:rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white transition-all duration-200 text-xs sm:text-sm px-2 py-2"
              >
                <BarChart size={14} className="flex-shrink-0" />
                <span className="truncate">Analytics</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="system" 
                className="flex items-center justify-center gap-1 sm:gap-2 rounded-lg sm:rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white transition-all duration-200 text-xs sm:text-sm px-2 py-2"
              >
                <Monitor size={14} className="flex-shrink-0" />
                <span className="truncate">Systeem</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {hasRubricActivity && (
              <TabsContent value="rubrics" className="space-y-4 sm:space-y-6 mt-0">
                <div className="text-center mb-4 sm:mb-6 px-2">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Analyse Dashboard</h2>
                  <p className="text-sm text-gray-600 break-words">Gedetailleerde inzichten en patronen</p>
                </div>
                <div className="overflow-hidden">
                  <AdminRubricsOverview messages={messages} />
                </div>
              </TabsContent>
            )}

            <TabsContent value="seeds" className="space-y-4 sm:space-y-6 mt-0">
              <div className="text-center mb-4 sm:mb-6 px-2">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Seed Management</h2>
                <p className="text-sm text-gray-600 break-words">AI-gestuurde emotionele intelligence</p>
              </div>
              <div className="overflow-hidden">
                <AdvancedSeedManager />
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4 sm:space-y-6 mt-0">
              <div className="text-center mb-4 sm:mb-6 px-2">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Analytics</h2>
                <p className="text-sm text-gray-600 break-words">Deep learning insights en effectiviteit</p>
              </div>
              <div className="overflow-hidden">
                <AdminAnalytics messages={messages} />
              </div>
            </TabsContent>

            <TabsContent value="system" className="space-y-4 sm:space-y-6 mt-0">
              <div className="text-center mb-4 sm:mb-6 px-2">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Systeem Monitoring</h2>
                <p className="text-sm text-gray-600 break-words">Real-time prestaties en AI status</p>
              </div>
              <div className="overflow-hidden space-y-4">
                <AdminSystemMonitor messages={messages} />
                <SupabaseDataTest />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
