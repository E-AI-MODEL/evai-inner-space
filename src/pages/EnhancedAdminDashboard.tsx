
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AdminAuth from '@/components/admin/AdminAuth';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import RealtimeMonitor from '@/components/RealtimeMonitor';
import NeurosymbolicVisualizer from '@/components/NeurosymbolicVisualizer';
import ConfigurationPanel from '@/components/ConfigurationPanel';
import { useProcessingOrchestrator } from '@/hooks/useProcessingOrchestrator';
import { Brain, Settings, Activity, BarChart, Monitor, GitBranch, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EnhancedAdminDashboard: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { stats, lastDecision, isProcessing } = useProcessingOrchestrator();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return <AdminAuth onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  const analyticsData = {
    totalRequests: stats.totalRequests,
    averageProcessingTime: stats.averageProcessingTime,
    successRate: stats.successRate,
    lastProcessingTime: stats.lastProcessingTime,
    processingPath: lastDecision?.type || 'none',
    componentsUsed: lastDecision?.metadata?.componentsUsed || []
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
      componentsUsed: lastDecision.metadata?.componentsUsed || []
    }
  } : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="border-b border-white/20 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Terug
              </Button>
              <div className="flex items-center gap-2">
                <Brain className="h-6 w-6 text-blue-600" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 via-purple-700 to-indigo-700 bg-clip-text text-transparent">
                  EvAI Neurosymbolic Dashboard
                </h1>
              </div>
            </div>
            <Badge variant="outline" className="bg-white/50">
              v5.6 Enhanced
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {/* Quick Stats Overview */}
        <AnalyticsDashboard data={analyticsData} />

        <Tabs defaultValue="monitor" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="monitor" className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Monitor
            </TabsTrigger>
            <TabsTrigger value="neurosymbolic" className="flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              Neurosymbolisch
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuratie
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Activiteit
            </TabsTrigger>
          </TabsList>

          {/* Real-time Monitor */}
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
                  lastDecision={lastDecision}
                />
              </div>
            </div>
          </TabsContent>

          {/* Neurosymbolic Analysis */}
          <TabsContent value="neurosymbolic" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Neurosymbolische Verwerking</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Symbolische Engine</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-blue-600">Actief</div>
                          <p className="text-xs text-muted-foreground">
                            Patroonherkenning en regelgebaseerde logica
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Neurale Engine</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-green-600">Actief</div>
                          <p className="text-xs text-muted-foreground">
                            AI-gebaseerde emotiedetectie
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Hybride Besluitvorming</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-purple-600">Actief</div>
                          <p className="text-xs text-muted-foreground">
                            Geïntegreerde besluitvorming
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <NeurosymbolicVisualizer 
                data={neurosymbolicData}
                isProcessing={isProcessing}
              />
            </div>
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Verwerkingsstatistieken</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Totaal verzoeken:</span>
                      <Badge variant="outline">{stats.totalRequests}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Gemiddelde tijd:</span>
                      <Badge variant="outline">{Math.round(stats.averageProcessingTime)}ms</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Succespercentage:</span>
                      <Badge variant="outline">{Math.round(stats.successRate)}%</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Laatste verwerking:</span>
                      <Badge variant="outline">{stats.lastProcessingTime}ms</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Systeem Prestaties</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <Badge variant={isProcessing ? "default" : "secondary"}>
                        {isProcessing ? "Verwerking" : "Klaar"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Laatste beslissing:</span>
                      <Badge variant="outline">
                        {lastDecision?.type || 'Geen'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Vertrouwen:</span>
                      <Badge variant="outline">
                        {lastDecision ? Math.round(lastDecision.confidence * 100) + '%' : 'N/A'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Configuration */}
          <TabsContent value="config">
            <ConfigurationPanel />
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
        </Tabs>
      </div>
    </div>
  );
};

export default EnhancedAdminDashboard;
