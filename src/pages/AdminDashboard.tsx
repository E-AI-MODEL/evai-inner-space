
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
import { useChatHistory } from '../hooks/useChatHistory';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { messages } = useChatHistory();
  const navigate = useNavigate();

  // Check if rubrics are active (messages contain rubric-related content)
  const hasRubricActivity = messages.some(msg => 
    msg.content.toLowerCase().includes('emotionele regulatie') ||
    msg.content.toLowerCase().includes('coping') ||
    msg.content.toLowerCase().includes('zelfbewustzijn') ||
    msg.content.toLowerCase().includes('sociale verbinding') ||
    msg.content.toLowerCase().includes('betekenis')
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 font-inter">
      {/* Enhanced Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-blue-600/10 to-indigo-600/10" />
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
        
        <div className="relative container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                aria-label="Ga terug"
                className="flex items-center gap-2 hover:bg-white/60 backdrop-blur-sm border border-white/20 flex-shrink-0"
              >
                <ArrowLeft size={16} />
                <span className="hidden sm:inline">Terug</span>
              </Button>
              
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex-shrink-0">
                    <Brain className="h-6 w-6 text-white" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-700 via-blue-700 to-indigo-700 bg-clip-text text-transparent truncate">
                    EvAI Admin Hub
                  </h1>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200 flex-shrink-0">
                    v5.6 Pro
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 flex-wrap">
                  <div className="flex items-center gap-1">
                    <Sparkles size={14} className="text-yellow-500 flex-shrink-0" />
                    <span className="truncate">Geavanceerde AI Engine</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield size={14} className="text-green-500 flex-shrink-0" />
                    <span className="truncate">EvAI 5.6 Gevalideerd</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Activity size={14} className="text-blue-500 flex-shrink-0" />
                    <span className="truncate">{messages.length} Actieve Sessies</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats - Hidden on mobile, shown on large screens */}
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <SupabaseConnectionStatus />
              
              <div className="hidden lg:flex items-center gap-3">
                <Card className="bg-white/60 backdrop-blur-sm border-white/20 shadow-lg">
                  <CardContent className="p-3">
                    <div className="text-center">
                      <div className="text-xl font-bold text-purple-600">{messages.length}</div>
                      <div className="text-xs text-gray-600">Gesprekken</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-white/60 backdrop-blur-sm border-white/20 shadow-lg">
                  <CardContent className="p-3">
                    <div className="text-center">
                      <div className="text-xl font-bold text-blue-600">98%</div>
                      <div className="text-xs text-gray-600">AI Nauwkeurigheid</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Content Area */}
      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue={hasRubricActivity ? "rubrics" : "seeds"} className="w-full">
          <div className="mb-6">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-2">
              {hasRubricActivity && (
                <TabsTrigger 
                  value="rubrics" 
                  className="flex items-center gap-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white transition-all duration-200 text-xs sm:text-sm"
                >
                  <Brain size={16} className="flex-shrink-0" />
                  <span className="truncate">Analyse</span>
                </TabsTrigger>
              )}
              
              <TabsTrigger 
                value="seeds" 
                className="flex items-center gap-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white transition-all duration-200 text-xs sm:text-sm"
              >
                <Database size={16} className="flex-shrink-0" />
                <span className="truncate">AI Seeds</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="analytics" 
                className="flex items-center gap-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white transition-all duration-200 text-xs sm:text-sm"
              >
                <BarChart size={16} className="flex-shrink-0" />
                <span className="truncate">Analytics</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="system" 
                className="flex items-center gap-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white transition-all duration-200 text-xs sm:text-sm"
              >
                <Monitor size={16} className="flex-shrink-0" />
                <span className="truncate">Systeem</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="space-y-6">
            {hasRubricActivity && (
              <TabsContent value="rubrics" className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">EvAI 5.6 Analyse Dashboard</h2>
                  <p className="text-sm sm:text-base text-gray-600">Gedetailleerde inzichten en patronen</p>
                </div>
                <AdminRubricsOverview messages={messages} />
              </TabsContent>
            )}

            <TabsContent value="seeds" className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Geavanceerd Seed Management</h2>
                <p className="text-sm sm:text-base text-gray-600">AI-gestuurde emotionele intelligence en patroonherkenning</p>
              </div>
              <AdvancedSeedManager />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Geavanceerde Analytics</h2>
                <p className="text-sm sm:text-base text-gray-600">Deep learning insights en effectiviteit</p>
              </div>
              <AdminAnalytics messages={messages} />
            </TabsContent>

            <TabsContent value="system" className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Systeem Monitoring</h2>
                <p className="text-sm sm:text-base text-gray-600">Real-time prestaties en AI engine status</p>
              </div>
              <AdminSystemMonitor messages={messages} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
