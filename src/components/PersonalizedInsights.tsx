
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Lightbulb, TrendingUp, Target, Star, ChevronRight, Sparkles } from 'lucide-react';
import { useInsightGenerator } from '../hooks/useInsightGenerator';
import { Message } from '../types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';

interface PersonalizedInsightsProps {
  messages: Message[];
  className?: string;
  compact?: boolean;
}

const PersonalizedInsights: React.FC<PersonalizedInsightsProps> = ({ 
  messages, 
  className = '',
  compact = false 
}) => {
  const { insights, getInsightsByType, getPriorityInsights, hasInsights } = useInsightGenerator(messages);
  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(new Set());

  if (!hasInsights) {
    return (
      <Card className={`bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 ${className}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="text-blue-600" size={20} />
            <CardTitle className="text-lg">Persoonlijke Inzichten</CardTitle>
          </div>
          <CardDescription>
            Je persoonlijke analyse wordt opgebouwd naarmate je meer deelt.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const toggleInsight = (insightId: string) => {
    const newExpanded = new Set(expandedInsights);
    if (newExpanded.has(insightId)) {
      newExpanded.delete(insightId);
    } else {
      newExpanded.add(insightId);
    }
    setExpandedInsights(newExpanded);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'strength': return <Star className="text-green-600" size={16} />;
      case 'growth': return <TrendingUp className="text-blue-600" size={16} />;
      case 'pattern': return <Target className="text-purple-600" size={16} />;
      case 'recommendation': return <Lightbulb className="text-yellow-600" size={16} />;
      default: return <Sparkles className="text-gray-600" size={16} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (compact) {
    const priorityInsights = getPriorityInsights();
    const topInsights = priorityInsights.length > 0 ? priorityInsights.slice(0, 2) : insights.slice(0, 2);

    return (
      <div className={`space-y-3 ${className}`}>
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Sparkles className="text-blue-600" size={16} />
          <span>Persoonlijke Inzichten</span>
        </div>
        {topInsights.map(insight => (
          <div key={insight.id} className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-lg flex-shrink-0">{insight.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {getTypeIcon(insight.type)}
                  <span className="text-sm font-medium text-gray-900 truncate">{insight.title}</span>
                  <Badge variant="outline" className={`text-xs ${getPriorityColor(insight.priority)}`}>
                    {insight.priority}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 mb-2">{insight.description}</p>
                <p className="text-xs text-blue-700 font-medium">{insight.actionable}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const strengthInsights = getInsightsByType('strength');
  const growthInsights = getInsightsByType('growth');
  const patternInsights = getInsightsByType('pattern');
  const recommendationInsights = getInsightsByType('recommendation');

  return (
    <Card className={`bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 ${className}`}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="text-blue-600" size={20} />
          <CardTitle className="text-lg">Persoonlijke Inzichten</CardTitle>
        </div>
        <CardDescription>
          Op maat gemaakte interpretatie van je emotionele patronen en vooruitgang
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overzicht</TabsTrigger>
            <TabsTrigger value="strengths">Sterke Punten</TabsTrigger>
            <TabsTrigger value="growth">Groei</TabsTrigger>
            <TabsTrigger value="patterns">Patronen</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-3">
              {insights.slice(0, 4).map(insight => (
                <Collapsible key={insight.id}>
                  <CollapsibleTrigger asChild>
                    <div className="bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{insight.icon}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              {getTypeIcon(insight.type)}
                              <span className="font-medium text-gray-900">{insight.title}</span>
                              <Badge variant="outline" className={`text-xs ${getPriorityColor(insight.priority)}`}>
                                {insight.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                          </div>
                        </div>
                        <ChevronRight className="text-gray-400" size={16} />
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                      <div className="flex items-start gap-2">
                        <Lightbulb className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
                        <div>
                          <span className="text-sm font-medium text-blue-900">Actie:</span>
                          <p className="text-sm text-blue-800">{insight.actionable}</p>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="strengths" className="space-y-3">
            {strengthInsights.length > 0 ? (
              strengthInsights.map(insight => (
                <div key={insight.id} className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{insight.icon}</span>
                    <div className="flex-1">
                      <h4 className="font-medium text-green-900 mb-1">{insight.title}</h4>
                      <p className="text-sm text-green-800 mb-2">{insight.description}</p>
                      <p className="text-sm text-green-700 font-medium">{insight.actionable}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-600 text-center py-4">Sterke punten worden geïdentificeerd naarmate je meer deelt.</p>
            )}
          </TabsContent>

          <TabsContent value="growth" className="space-y-3">
            {growthInsights.length > 0 ? (
              growthInsights.map(insight => (
                <div key={insight.id} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{insight.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-blue-900">{insight.title}</h4>
                        <Badge variant="outline" className={`text-xs ${getPriorityColor(insight.priority)}`}>
                          {insight.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-blue-800 mb-2">{insight.description}</p>
                      <p className="text-sm text-blue-700 font-medium">{insight.actionable}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-600 text-center py-4">Groeimogelijkheden worden geïdentificeerd tijdens je reis.</p>
            )}
          </TabsContent>

          <TabsContent value="patterns" className="space-y-3">
            {patternInsights.length > 0 ? (
              patternInsights.map(insight => (
                <div key={insight.id} className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{insight.icon}</span>
                    <div className="flex-1">
                      <h4 className="font-medium text-purple-900 mb-1">{insight.title}</h4>
                      <p className="text-sm text-purple-800 mb-2">{insight.description}</p>
                      <p className="text-sm text-purple-700 font-medium">{insight.actionable}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-600 text-center py-4">Patronen worden zichtbaar over tijd.</p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PersonalizedInsights;
