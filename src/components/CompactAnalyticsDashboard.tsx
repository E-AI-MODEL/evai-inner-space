
import React, { useState } from 'react';
import { Message } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Brain, AlertTriangle, Shield, TrendingUp, BarChart, Eye, EyeOff } from 'lucide-react';
import { useEvAI56Rubrics } from '../hooks/useEvAI56Rubrics';
import PersonalizedInsights from './PersonalizedInsights';

interface CompactAnalyticsDashboardProps {
  messages: Message[];
  onClose?: () => void;
}

const CompactAnalyticsDashboard: React.FC<CompactAnalyticsDashboardProps> = ({ 
  messages, 
  onClose 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showInsights, setShowInsights] = useState(true);
  const { assessMessage, calculateOverallRisk } = useEvAI56Rubrics();

  // Simplified analysis for compact view
  const analysisData = React.useMemo(() => {
    const userMessages = messages.filter(msg => msg.from === 'user');
    const allAssessments = userMessages.flatMap(msg => assessMessage(msg.content));
    
    if (allAssessments.length === 0) {
      return { overallRisk: 0, totalProtective: 0, activePatterns: 0, isEmpty: true };
    }

    const overallRisk = calculateOverallRisk(allAssessments);
    const totalProtective = allAssessments.reduce((sum, a) => sum + a.protectiveScore, 0);
    const activePatterns = new Set(allAssessments.map(a => a.rubricId)).size;

    return { overallRisk, totalProtective, activePatterns, isEmpty: false };
  }, [messages, assessMessage, calculateOverallRisk]);

  const getRiskColor = (score: number) => {
    if (score <= 25) return 'text-green-600';
    if (score <= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskBgColor = (score: number) => {
    if (score <= 25) return 'bg-green-50 border-green-200';
    if (score <= 50) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  if (analysisData.isEmpty) {
    return (
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="text-blue-600" size={20} />
              <span className="text-sm font-medium text-blue-900">EvAI 5.6 Analyse</span>
              <Badge variant="outline" className="text-xs">Gereed</Badge>
            </div>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <EyeOff size={16} />
              </Button>
            )}
          </div>
          <p className="text-blue-700 text-xs mt-2">
            Nog geen data - start een gesprek voor inzichten
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Compact Summary Card */}
      <Card className={`${getRiskBgColor(analysisData.overallRisk)} transition-all duration-200`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Brain className="text-blue-600" size={20} />
              <span className="text-sm font-medium text-gray-900">EvAI 5.6 Analyse</span>
              <Badge variant="outline" className="text-xs">Live</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInsights(!showInsights)}
                className="p-1"
              >
                {showInsights ? <Eye size={14} /> : <EyeOff size={14} />}
              </Button>
              {onClose && (
                <Button variant="ghost" size="sm" onClick={onClose} className="p-1">
                  <EyeOff size={16} />
                </Button>
              )}
              <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-1">
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </Button>
                </CollapsibleTrigger>
              </Collapsible>
            </div>
          </div>

          {/* Key Metrics Row */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1">
                <AlertTriangle size={14} className={getRiskColor(analysisData.overallRisk)} />
                <span className="text-xs text-gray-600">Risico</span>
              </div>
              <div className={`text-lg font-bold ${getRiskColor(analysisData.overallRisk)}`}>
                {Math.round(analysisData.overallRisk)}%
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1">
                <Shield size={14} className="text-green-600" />
                <span className="text-xs text-gray-600">Beschermend</span>
              </div>
              <div className="text-lg font-bold text-green-600">
                {Math.round(analysisData.totalProtective)}
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1">
                <TrendingUp size={14} className="text-blue-600" />
                <span className="text-xs text-gray-600">Patronen</span>
              </div>
              <div className="text-lg font-bold text-blue-600">
                {analysisData.activePatterns}
              </div>
            </div>
          </div>

          {/* Expandable Details */}
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleContent className="mt-3 pt-3 border-t border-gray-200">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <BarChart size={12} />
                  <span>Gedetailleerde analyse beschikbaar</span>
                </div>
                <div className="text-xs text-gray-500">
                  {messages.length} berichten geanalyseerd • {messages.filter(m => m.from === 'user').length} gebruiker inputs
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Compact Insights */}
      {showInsights && (
        <div className="bg-white border border-gray-200 rounded-lg">
          <PersonalizedInsights 
            messages={messages} 
            compact={true}
            className="p-3"
          />
        </div>
      )}
    </div>
  );
};

export default CompactAnalyticsDashboard;
