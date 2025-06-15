
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, AlertTriangle, Shield, TrendingUp, Download } from 'lucide-react';
import { Message } from '../../types';
import { useEvAI56Rubrics, RubricAssessment } from '../../hooks/useEvAI56Rubrics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';
import { toast } from '@/hooks/use-toast';

interface AdminRubricsViewProps {
  messages: Message[];
}

const AdminRubricsView: React.FC<AdminRubricsViewProps> = ({ messages }) => {
  const { assessMessage, evai56Rubrics, calculateOverallRisk, getRubricById } = useEvAI56Rubrics();
  const [selectedTimeframe, setSelectedTimeframe] = useState<'all' | 'week' | 'month'>('all');

  const filteredMessages = React.useMemo(() => {
    const now = new Date();
    const cutoff = new Date();
    
    if (selectedTimeframe === 'week') {
      cutoff.setDate(now.getDate() - 7);
    } else if (selectedTimeframe === 'month') {
      cutoff.setMonth(now.getMonth() - 1);
    }
    
    return messages.filter(msg => 
      msg.from === 'user' && 
      (selectedTimeframe === 'all' || new Date(msg.timestamp) >= cutoff)
    );
  }, [messages, selectedTimeframe]);

  const allAssessments = React.useMemo(() => {
    const assessments: RubricAssessment[] = [];
    filteredMessages.forEach(msg => {
      const msgAssessments = assessMessage(msg.content);
      assessments.push(...msgAssessments);
    });
    return assessments;
  }, [filteredMessages, assessMessage]);

  const rubricSummary = React.useMemo(() => {
    const summary = new Map<string, { 
      totalRisk: number, 
      totalProtective: number, 
      count: number,
      triggers: string[]
    }>();
    
    allAssessments.forEach(assessment => {
      const current = summary.get(assessment.rubricId) || { 
        totalRisk: 0, 
        totalProtective: 0, 
        count: 0,
        triggers: []
      };
      
      summary.set(assessment.rubricId, {
        totalRisk: current.totalRisk + assessment.riskScore,
        totalProtective: current.totalProtective + assessment.protectiveScore,
        count: current.count + 1,
        triggers: [...current.triggers, ...assessment.triggers]
      });
    });

    return Array.from(summary.entries()).map(([rubricId, data]) => {
      const rubric = getRubricById(rubricId);
      return {
        rubricId,
        name: rubric?.name || rubricId,
        category: rubric?.category || 'unknown',
        avgRisk: data.count > 0 ? data.totalRisk / data.count : 0,
        avgProtective: data.count > 0 ? data.totalProtective / data.count : 0,
        netScore: data.count > 0 ? (data.totalRisk - data.totalProtective) / data.count : 0,
        count: data.count,
        uniqueTriggers: [...new Set(data.triggers)]
      };
    }).sort((a, b) => b.netScore - a.netScore);
  }, [allAssessments, getRubricById]);

  const overallRisk = calculateOverallRisk(allAssessments);
  const totalInteractions = filteredMessages.length;
  const riskySessions = allAssessments.filter(a => a.overallScore > 2).length;

  const exportRubricsData = () => {
    const exportData = {
      timeframe: selectedTimeframe,
      totalInteractions,
      overallRisk,
      assessments: allAssessments,
      rubricSummary,
      generatedAt: new Date().toISOString()
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `evai-rubrics-analysis-${selectedTimeframe}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({ 
      title: "Export voltooid", 
      description: "Rubrieken analyse is geëxporteerd naar JSON bestand." 
    });
  };

  const chartConfig = {
    risk: { label: "Risico", color: "#ef4444" },
    protective: { label: "Beschermend", color: "#10b981" }
  };

  if (totalInteractions === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain size={20} />
            EvAI 5.6 Rubrieken Analyse
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Nog geen gesprekken data beschikbaar voor de geselecteerde periode.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain size={20} />
            EvAI 5.6 Rubrieken Analyse
          </CardTitle>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex gap-2">
              {(['all', 'week', 'month'] as const).map((timeframe) => (
                <Button
                  key={timeframe}
                  variant={selectedTimeframe === timeframe ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTimeframe(timeframe)}
                >
                  {timeframe === 'all' ? 'Alles' : 
                   timeframe === 'week' ? 'Deze week' : 
                   'Deze maand'}
                </Button>
              ))}
            </div>
            <Button 
              onClick={exportRubricsData}
              variant="outline"
              size="sm"
              className="ml-auto flex items-center gap-2"
            >
              <Download size={16} />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overzicht</TabsTrigger>
              <TabsTrigger value="rubrics">Rubrieken</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="interventions">Interventies</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={20} className={
                        overallRisk > 50 ? "text-red-500" : 
                        overallRisk > 25 ? "text-yellow-500" : "text-green-500"
                      } />
                      <span className="text-sm font-medium text-gray-700">Risico Score</span>
                    </div>
                    <div className={`text-2xl font-bold ${
                      overallRisk > 50 ? "text-red-600" : 
                      overallRisk > 25 ? "text-yellow-600" : "text-green-600"
                    }`}>
                      {Math.round(overallRisk)}%
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={20} className="text-blue-500" />
                      <span className="text-sm font-medium text-gray-700">Sessies</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">{totalInteractions}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Shield size={20} className="text-green-500" />
                      <span className="text-sm font-medium text-gray-700">Actieve Rubrieken</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600">{rubricSummary.length}</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="rubrics" className="space-y-4">
              {rubricSummary.length > 0 && (
                <ChartContainer config={chartConfig} className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={rubricSummary} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 12 }}
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="avgRisk" name="Gemiddeld Risico" fill={chartConfig.risk.color} />
                      <Bar dataKey="avgProtective" name="Gemiddeld Beschermend" fill={chartConfig.protective.color} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}

              <div className="space-y-2">
                {rubricSummary.map((rubric) => (
                  <Card key={rubric.rubricId}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{rubric.name}</h4>
                        <Badge variant={rubric.netScore > 1 ? "destructive" : "secondary"}>
                          Score: {rubric.netScore.toFixed(1)}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        Triggers: {rubric.uniqueTriggers.slice(0, 3).join(', ')}
                        {rubric.uniqueTriggers.length > 3 && ` +${rubric.uniqueTriggers.length - 3} meer`}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="trends" className="space-y-4">
              <p className="text-gray-600">Trend analyse wordt ontwikkeld in een toekomstige versie.</p>
            </TabsContent>

            <TabsContent value="interventions" className="space-y-4">
              <div className="space-y-3">
                {rubricSummary
                  .filter(r => r.netScore > 1)
                  .map((rubric) => {
                    const rubricData = getRubricById(rubric.rubricId);
                    return (
                      <Card key={rubric.rubricId}>
                        <CardContent className="p-4">
                          <h4 className="font-medium mb-2">{rubric.name}</h4>
                          <div className="space-y-1">
                            {rubricData?.interventions.map((intervention, idx) => (
                              <div key={idx} className="text-sm text-gray-700">
                                • {intervention}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                {rubricSummary.filter(r => r.netScore > 1).length === 0 && (
                  <p className="text-gray-600">Geen specifieke interventies nodig op dit moment.</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRubricsView;
