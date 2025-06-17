
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Shield, AlertTriangle, Target, TrendingUp, Activity, CheckCircle } from 'lucide-react';
import { useEvAI56Rubrics } from '../../hooks/useEvAI56Rubrics';
import { Message } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface AdminRubricsOverviewProps {
  messages: Message[];
}

const AdminRubricsOverview: React.FC<AdminRubricsOverviewProps> = ({ messages }) => {
  const { assessMessage, evai56Rubrics, calculateOverallRisk, getRubricById } = useEvAI56Rubrics();
  const [selectedRubric, setSelectedRubric] = useState<string | null>(null);

  // Comprehensive analysis of all messages
  const analysisData = useMemo(() => {
    const userMessages = messages.filter(msg => msg.from === 'user');
    const aiMessages = messages.filter(msg => msg.from === 'ai');
    
    let allAssessments: any[] = [];
    let timelineData: any[] = [];
    let rubricUsage = new Map<string, number>();
    let interventionEffectiveness = new Map<string, { success: number, total: number }>();

    userMessages.forEach((msg, index) => {
      const assessments = assessMessage(msg.content);
      const timestamp = msg.timestamp || new Date();
      
      assessments.forEach(assessment => {
        allAssessments.push({
          ...assessment,
          messageIndex: index,
          timestamp
        });
        
        // Track rubric usage
        const currentCount = rubricUsage.get(assessment.rubricId) || 0;
        rubricUsage.set(assessment.rubricId, currentCount + 1);
      });

      // Track timeline
      if (assessments.length > 0) {
        const overallRisk = calculateOverallRisk(assessments);
        timelineData.push({
          messageIndex: index,
          riskScore: overallRisk,
          protectiveFactors: assessments.reduce((sum, a) => sum + a.protectiveScore, 0),
          timestamp: timestamp.toISOString().split('T')[0]
        });
      }
    });

    // Analyze intervention effectiveness
    aiMessages.forEach(msg => {
      if (msg.feedback === 'like' && msg.explainText) {
        const rubricMatch = msg.explainText.match(/emotional-regulation|self-awareness|coping-strategies|social-connection|meaning-purpose/);
        if (rubricMatch) {
          const rubricId = rubricMatch[0];
          const current = interventionEffectiveness.get(rubricId) || { success: 0, total: 0 };
          interventionEffectiveness.set(rubricId, { success: current.success + 1, total: current.total + 1 });
        }
      }
    });

    return {
      allAssessments,
      timelineData,
      rubricUsage: Array.from(rubricUsage.entries()).map(([id, count]) => ({
        rubricId: id,
        name: getRubricById(id)?.name || id,
        count,
        category: getRubricById(id)?.category || 'unknown'
      })).sort((a, b) => b.count - a.count),
      interventionEffectiveness: Array.from(interventionEffectiveness.entries()).map(([id, data]) => ({
        rubricId: id,
        name: getRubricById(id)?.name || id,
        successRate: data.total > 0 ? (data.success / data.total) * 100 : 0,
        total: data.total
      })).sort((a, b) => b.successRate - a.successRate)
    };
  }, [messages, assessMessage, calculateOverallRisk, getRubricById]);

  const overallStats = useMemo(() => {
    const totalRisk = analysisData.allAssessments.reduce((sum, a) => sum + a.riskScore, 0);
    const totalProtective = analysisData.allAssessments.reduce((sum, a) => sum + a.protectiveScore, 0);
    const avgRisk = analysisData.allAssessments.length > 0 ? totalRisk / analysisData.allAssessments.length : 0;
    const activeRubrics = new Set(analysisData.allAssessments.map(a => a.rubricId)).size;
    
    return {
      totalAssessments: analysisData.allAssessments.length,
      avgRiskScore: avgRisk,
      totalProtectiveFactors: totalProtective,
      activeRubrics,
      riskLevel: avgRisk > 2 ? 'high' : avgRisk > 1 ? 'medium' : 'low'
    };
  }, [analysisData]);

  const categoryColors = {
    emotional: '#ef4444',
    cognitive: '#3b82f6', 
    behavioral: '#10b981',
    interpersonal: '#f59e0b'
  };

  if (analysisData.allAssessments.length === 0) {
    return (
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain size={20} className="text-purple-600" />
            EvAI 5.6 Analyse Overzicht
          </CardTitle>
          <CardDescription>
            Nog geen analysedata beschikbaar. Start een gesprek om patronen en inzichten te genereren.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain size={20} className="text-purple-600" />
            EvAI 5.6 Analyse Overzicht & Effectiviteitsanalyse
          </CardTitle>
          <CardDescription>
            Uitgebreide analyse van patronen, interventie-effectiviteit en CoT-integratie
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Overall Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 border border-purple-100">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-purple-600" />
                <span className="text-sm font-medium text-gray-700">Totaal Assessments</span>
              </div>
              <div className="text-2xl font-bold text-purple-600">{overallStats.totalAssessments}</div>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-purple-100">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className={`${overallStats.riskLevel === 'high' ? 'text-red-500' : overallStats.riskLevel === 'medium' ? 'text-yellow-500' : 'text-green-500'}`} />
                <span className="text-sm font-medium text-gray-700">Gemiddeld Risico</span>
              </div>
              <div className={`text-2xl font-bold ${overallStats.riskLevel === 'high' ? 'text-red-600' : overallStats.riskLevel === 'medium' ? 'text-yellow-600' : 'text-green-600'}`}>
                {overallStats.avgRiskScore.toFixed(1)}
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-purple-100">
              <div className="flex items-center gap-2">
                <Shield size={18} className="text-green-500" />
                <span className="text-sm font-medium text-gray-700">Beschermende Factoren</span>
              </div>
              <div className="text-2xl font-bold text-green-600">{Math.round(overallStats.totalProtectiveFactors)}</div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-purple-100">
              <div className="flex items-center gap-2">
                <Target size={18} className="text-blue-500" />
                <span className="text-sm font-medium text-gray-700">Actieve Patronen</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">{overallStats.activeRubrics}/{evai56Rubrics.length}</div>
            </div>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overzicht</TabsTrigger>
              <TabsTrigger value="usage">Gebruik</TabsTrigger>
              <TabsTrigger value="effectiveness">Effectiviteit</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {evai56Rubrics.map(rubric => {
                  const rubricAssessments = analysisData.allAssessments.filter(a => a.rubricId === rubric.id);
                  const avgRisk = rubricAssessments.length > 0 ? rubricAssessments.reduce((sum, a) => sum + a.riskScore, 0) / rubricAssessments.length : 0;
                  const avgProtective = rubricAssessments.length > 0 ? rubricAssessments.reduce((sum, a) => sum + a.protectiveScore, 0) / rubricAssessments.length : 0;
                  
                  return (
                    <Card key={rubric.id} className="bg-white border border-gray-200 hover:border-purple-300 transition-colors">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-semibold">{rubric.name}</CardTitle>
                          <Badge 
                            variant="outline" 
                            style={{ 
                              borderColor: categoryColors[rubric.category],
                              color: categoryColors[rubric.category]
                            }}
                          >
                            {rubric.category}
                          </Badge>
                        </div>
                        <CardDescription className="text-xs">{rubric.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span>Risico Score:</span>
                            <span className="font-semibold">{avgRisk.toFixed(1)}</span>
                          </div>
                          <Progress value={(avgRisk / 3) * 100} className="h-2" />
                          
                          <div className="flex justify-between text-xs">
                            <span>Beschermend:</span>
                            <span className="font-semibold text-green-600">{avgProtective.toFixed(1)}</span>
                          </div>
                          <Progress value={(avgProtective / 3) * 100} className="h-2" />
                          
                          <div className="text-xs text-gray-600 mt-2">
                            {rubricAssessments.length} assessments
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="usage" className="space-y-4">
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="text-lg">Patroon Gebruik Frequentie</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analysisData.rubricUsage}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name"
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis />
                      <Tooltip />
                      <Bar 
                        dataKey="count" 
                        fill="#8b5cf6"
                        name="Aantal keer gebruikt"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="effectiveness" className="space-y-4">
              {analysisData.interventionEffectiveness.length > 0 ? (
                <Card className="bg-white">
                  <CardHeader>
                    <CardTitle className="text-lg">Interventie Effectiviteit</CardTitle>
                    <CardDescription>Gebaseerd op positieve feedback van gebruikers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analysisData.interventionEffectiveness.map(item => (
                        <div key={item.rubricId} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div>
                            <span className="font-medium text-sm">{item.name}</span>
                            <div className="text-xs text-gray-600">{item.total} interventies</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress value={item.successRate} className="w-20 h-2" />
                            <span className="text-sm font-semibold">{Math.round(item.successRate)}%</span>
                            {item.successRate > 70 && <CheckCircle size={16} className="text-green-500" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-white">
                  <CardContent className="pt-6">
                    <div className="text-center text-gray-500">
                      Nog geen effectiviteitsdata beschikbaar. Gebruik meer gesprekken voor betere metingen.
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4">
              {analysisData.timelineData.length > 0 ? (
                <Card className="bg-white">
                  <CardHeader>
                    <CardTitle className="text-lg">Risico Ontwikkeling</CardTitle>
                    <CardDescription>Tijdlijn van risicoscores en beschermende factoren</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={analysisData.timelineData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="messageIndex" />
                        <YAxis />
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="riskScore" 
                          stroke="#ef4444" 
                          strokeWidth={2}
                          name="Risico Score"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="protectiveFactors" 
                          stroke="#10b981" 
                          strokeWidth={2}
                          name="Beschermende Factoren"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-white">
                  <CardContent className="pt-6">
                    <div className="text-center text-gray-500">
                      Onvoldoende data voor timeline analyse. Gebruik meer gesprekken voor uitgebreide analyses.
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRubricsOverview;
