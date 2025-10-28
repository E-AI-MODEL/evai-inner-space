import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { 
  MessageSquare, 
  Brain, 
  TrendingUp, 
  CheckCircle, 
  ArrowRight,
  Sparkles,
  Database,
  Clock
} from 'lucide-react';

interface LastConversation {
  userInput: string;
  emotion: string;
  confidence: number;
  response: string;
  timestamp: Date;
  usedBrowserML: boolean;
  usedKnowledge: boolean;
}

interface DashboardStats {
  totalKnowledge: number;
  conversationsToday: number;
  avgCertainty: number;
  topUsedEmotions: Array<{ emotion: string; count: number }>;
}

export function SimpleXAIDashboard() {
  const [lastConversation, setLastConversation] = useState<LastConversation | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalKnowledge: 0,
    conversationsToday: 0,
    avgCertainty: 0,
    topUsedEmotions: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load last conversation
      const { data: lastDecision } = await supabase
        .from('decision_logs')
        .select('user_input, final_response, confidence_score, symbolic_matches, neural_similarities, created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (lastDecision) {
        const emotion = (lastDecision.symbolic_matches as any)?.[0]?.emotion || 'onbekend';
        const neuralData = (lastDecision.neural_similarities as any[]) || [];
        const symbolicData = (lastDecision.symbolic_matches as any[]) || [];
        const hasNeuralData = Array.isArray(neuralData) && neuralData.length > 0;
        const hasSymbolicData = Array.isArray(symbolicData) && symbolicData.length > 0;
        
        setLastConversation({
          userInput: lastDecision.user_input || '',
          emotion,
          confidence: lastDecision.confidence_score || 0,
          response: lastDecision.final_response || '',
          timestamp: new Date(lastDecision.created_at),
          usedBrowserML: hasNeuralData,
          usedKnowledge: hasSymbolicData
        });
      }

      // Load stats
      const [knowledgeResult, conversationsResult, emotionsResult] = await Promise.all([
        supabase.from('unified_knowledge').select('id', { count: 'exact', head: true }).eq('active', true),
        supabase.from('decision_logs').select('confidence_score').gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('decision_logs').select('symbolic_matches').limit(50)
      ]);

      const avgConfidence = conversationsResult.data?.length 
        ? conversationsResult.data.reduce((sum, d) => sum + (d.confidence_score || 0), 0) / conversationsResult.data.length
        : 0;

      // Count emotion usage
      const emotionCounts = new Map<string, number>();
      emotionsResult.data?.forEach(d => {
        const matches = d.symbolic_matches as any[];
        const emotion = matches?.[0]?.emotion;
        if (emotion) {
          emotionCounts.set(emotion, (emotionCounts.get(emotion) || 0) + 1);
        }
      });

      const topEmotions = Array.from(emotionCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([emotion, count]) => ({ emotion, count }));

      setStats({
        totalKnowledge: knowledgeResult.count || 0,
        conversationsToday: conversationsResult.data?.length || 0,
        avgCertainty: Math.round(avgConfidence * 100),
        topUsedEmotions: topEmotions
      });

      setLoading(false);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setLoading(false);
    }
  };

  const getCertaintyColor = (certainty: number) => {
    if (certainty >= 80) return 'text-green-600';
    if (certainty >= 60) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getCertaintyBadge = (certainty: number) => {
    if (certainty >= 80) return 'default';
    if (certainty >= 60) return 'secondary';
    return 'outline';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Clock className="h-5 w-5 animate-spin" />
            <span>Dashboard laden...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Status Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="cursor-help hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Kennis in systeem</p>
                      <p className="text-3xl font-bold">{stats.totalKnowledge}</p>
                      <p className="text-xs text-muted-foreground mt-1">seeds & patronen</p>
                    </div>
                    <Database className="h-12 w-12 text-blue-500 opacity-20" />
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="font-semibold">Wat betekent dit?</p>
              <p className="text-sm">Dit is het aantal emotie-patronen dat het systeem heeft geleerd. Hoe meer kennis, hoe beter de AI kan reageren.</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="cursor-help hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Gesprekken vandaag</p>
                      <p className="text-3xl font-bold">{stats.conversationsToday}</p>
                      <p className="text-xs text-muted-foreground mt-1">laatste 24 uur</p>
                    </div>
                    <MessageSquare className="h-12 w-12 text-green-500 opacity-20" />
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="font-semibold">Wat betekent dit?</p>
              <p className="text-sm">Aantal keer dat iemand met de AI heeft gepraat in de laatste 24 uur. Elk gesprek helpt de AI beter worden.</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="cursor-help hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Gemiddelde zekerheid</p>
                      <p className={`text-3xl font-bold ${getCertaintyColor(stats.avgCertainty)}`}>
                        {stats.avgCertainty}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {stats.avgCertainty >= 80 ? 'Uitstekend 🟢' : stats.avgCertainty >= 60 ? 'Goed 🟡' : 'Kan beter 🟠'}
                      </p>
                    </div>
                    <TrendingUp className={`h-12 w-12 opacity-20 ${getCertaintyColor(stats.avgCertainty)}`} />
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="font-semibold">Wat betekent dit?</p>
              <p className="text-sm">Hoe zeker de AI is van haar antwoorden. Boven de 80% is uitstekend, tussen 60-80% is goed, onder 60% betekent dat de AI meer moet leren.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Last Conversation Flow */}
      {lastConversation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              Laatste gesprek: Hoe werkt het?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Visual Flow */}
              <div className="flex flex-col md:flex-row gap-4 items-center">
                {/* Step 1: User Input */}
                <div className="flex-1 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold text-blue-900">1. Wat je zei</span>
                  </div>
                  <p className="text-sm text-gray-700 italic">"{lastConversation.userInput.substring(0, 100)}..."</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(lastConversation.timestamp).toLocaleString('nl-NL')}
                  </p>
                </div>

                <ArrowRight className="hidden md:block h-8 w-8 text-gray-300" />

                {/* Step 2: AI Analysis */}
                <div className="flex-1 bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="h-5 w-5 text-purple-600" />
                    <span className="font-semibold text-purple-900">2. Wat de AI zag</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="bg-purple-600">
                        Emotie: {lastConversation.emotion}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getCertaintyBadge(Math.round(lastConversation.confidence * 100))}>
                        Zekerheid: {Math.round(lastConversation.confidence * 100)}%
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {lastConversation.usedBrowserML && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant="outline" className="text-xs">
                                🧠 Browser ML
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>AI draait in je browser (snel & privé)</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {lastConversation.usedKnowledge && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant="outline" className="text-xs">
                                📚 Kennis gebruikt
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>AI gebruikte geleerde patronen</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                </div>

                <ArrowRight className="hidden md:block h-8 w-8 text-gray-300" />

                {/* Step 3: AI Response */}
                <div className="flex-1 bg-green-50 border-2 border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-900">3. AI antwoord</span>
                  </div>
                  <p className="text-sm text-gray-700">"{lastConversation.response.substring(0, 100)}..."</p>
                </div>
              </div>

              {/* Explanation Text */}
              <div className="bg-gray-50 border-l-4 border-blue-500 p-4 rounded">
                <p className="text-sm font-semibold text-gray-900 mb-2">🔍 Wat gebeurde hier?</p>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                  <li>De AI detecteerde de emotie "<strong>{lastConversation.emotion}</strong>" in je bericht</li>
                  <li>Ze was <strong>{Math.round(lastConversation.confidence * 100)}%</strong> zeker van deze detectie</li>
                  <li>Ze gebruikte {lastConversation.usedKnowledge ? 'geleerde kennis' : 'algemene AI'} om te reageren</li>
                  <li>Het antwoord werd {lastConversation.usedBrowserML ? 'deels in je browser berekend (privé!)' : 'via de cloud verwerkt'}</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Emotions */}
      {stats.topUsedEmotions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Top 5 Meest Voorkomende Emoties
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topUsedEmotions.map((item, index) => (
                <div key={item.emotion} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-lg w-8 h-8 flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <span className="font-medium capitalize">{item.emotion}</span>
                  </div>
                  <Badge variant="secondary">
                    {item.count}x gedetecteerd
                  </Badge>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              💡 Deze emoties komen het meest voor in recente gesprekken
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
