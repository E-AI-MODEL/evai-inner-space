
import React from 'react';
import { Message } from '../types';
import { useEvAI56Rubrics, RubricAssessment } from '../hooks/useEvAI56Rubrics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from './ui/chart';
import { AlertTriangle, Shield, TrendingUp, Brain } from 'lucide-react';

interface RubricsAnalyticsDashboardProps {
  messages: Message[];
}

const RubricsAnalyticsDashboard: React.FC<RubricsAnalyticsDashboardProps> = ({ messages }) => {
  const { assessMessage, evai56Rubrics, calculateOverallRisk, getRubricById } = useEvAI56Rubrics();

  // Analyze all user messages
  const allAssessments = React.useMemo(() => {
    const assessments: RubricAssessment[] = [];
    messages
      .filter(msg => msg.from === 'user')
      .forEach(msg => {
        const msgAssessments = assessMessage(msg.content);
        assessments.push(...msgAssessments);
      });
    return assessments;
  }, [messages, assessMessage]);

  // Calculate aggregated scores per rubric
  const rubricScores = React.useMemo(() => {
    const scoreMap = new Map<string, { risk: number, protective: number, count: number }>();
    
    allAssessments.forEach(assessment => {
      const current = scoreMap.get(assessment.rubricId) || { risk: 0, protective: 0, count: 0 };
      scoreMap.set(assessment.rubricId, {
        risk: current.risk + assessment.riskScore,
        protective: current.protective + assessment.protectiveScore,
        count: current.count + 1
      });
    });

    return Array.from(scoreMap.entries()).map(([rubricId, scores]) => {
      const rubric = getRubricById(rubricId);
      return {
        name: rubric?.name || rubricId,
        category: rubric?.category || 'unknown',
        avgRisk: scores.count > 0 ? scores.risk / scores.count : 0,
        avgProtective: scores.count > 0 ? scores.protective / scores.count : 0,
        netScore: scores.count > 0 ? (scores.risk - scores.protective) / scores.count : 0,
        count: scores.count
      };
    }).sort((a, b) => b.netScore - a.netScore);
  }, [allAssessments, getRubricById]);

  const overallRisk = calculateOverallRisk(allAssessments);
  const totalProtectiveFactors = allAssessments.reduce((sum, a) => sum + a.protectiveScore, 0);
  const totalRiskFactors = allAssessments.reduce((sum, a) => sum + a.riskScore, 0);

  const getRiskColor = (score: number) => {
    if (score <= 1) return '#10b981'; // green
    if (score <= 2) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  const chartConfig = {
    risk: { label: "Risico", color: "#ef4444" },
    protective: { label: "Beschermend", color: "#10b981" }
  };

  if (allAssessments.length === 0) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="text-blue-600" size={24} />
          <h3 className="text-lg font-semibold text-blue-900">EvAI 5.6 Rubrieken Analyse</h3>
        </div>
        <p className="text-blue-700 text-sm">
          Nog geen rubriekdata beschikbaar. Gebruik rubriek-specifieke termen
          (bijv. "emotionele regulatie" of "copingstrategieën") om de analyse te
          activeren. Zie de factoren in
          <code>src/hooks/useEvAI56Rubrics.ts</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <Brain className="text-blue-600" size={24} />
        <h3 className="text-lg font-semibold text-blue-900">EvAI 5.6 Rubrieken Analyse</h3>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border border-blue-100">
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} className={overallRisk > 50 ? "text-red-500" : overallRisk > 25 ? "text-yellow-500" : "text-green-500"} />
            <span className="text-sm font-medium text-gray-700">Risico Score</span>
          </div>
          <div className={`text-2xl font-bold ${overallRisk > 50 ? "text-red-600" : overallRisk > 25 ? "text-yellow-600" : "text-green-600"}`}>
            {Math.round(overallRisk)}%
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-blue-100">
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-green-500" />
            <span className="text-sm font-medium text-gray-700">Beschermende Factoren</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{Math.round(totalProtectiveFactors)}</div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-blue-100">
          <div className="flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-500" />
            <span className="text-sm font-medium text-gray-700">Actieve Rubrieken</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">{rubricScores.length}</div>
        </div>
      </div>

      {/* Rubric Scores Chart */}
      {rubricScores.length > 0 && (
        <div className="bg-white rounded-lg p-4 border border-blue-100">
          <h4 className="text-md font-semibold text-gray-800 mb-4">Rubrieken Scores</h4>
          <ChartContainer config={chartConfig} className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rubricScores} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
        </div>
      )}

      {/* Top Risk Areas */}
      <div className="bg-white rounded-lg p-4 border border-blue-100">
        <h4 className="text-md font-semibold text-gray-800 mb-3">Aandachtsgebieden</h4>
        <div className="space-y-2">
          {rubricScores.slice(0, 3).map((rubric, index) => (
            <div key={rubric.name} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm font-medium text-gray-700">{rubric.name}</span>
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getRiskColor(rubric.netScore) }}
                />
                <span className="text-sm text-gray-600">
                  {rubric.netScore > 0 ? `+${rubric.netScore.toFixed(1)}` : rubric.netScore.toFixed(1)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RubricsAnalyticsDashboard;
