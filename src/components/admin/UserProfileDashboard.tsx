
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Brain, 
  TrendingUp, 
  Heart, 
  Shield, 
  Activity,
  BarChart3,
  Clock,
  Target
} from 'lucide-react';

interface UserProfileDashboardProps {
  analytics: any;
}

const UserProfileDashboard: React.FC<UserProfileDashboardProps> = ({ analytics }) => {
  const emotionColors = {
    'angst': 'bg-red-100 text-red-800',
    'verdriet': 'bg-blue-100 text-blue-800',
    'vreugde': 'bg-green-100 text-green-800',
    'boosheid': 'bg-orange-100 text-orange-800',
    'stress': 'bg-purple-100 text-purple-800',
    'onbekend': 'bg-gray-100 text-gray-800',
    'neutraal': 'bg-gray-100 text-gray-800'
  };

  const labelColors = {
    'Valideren': 'bg-green-100 text-green-800',
    'Reflectievraag': 'bg-blue-100 text-blue-800',
    'Suggestie': 'bg-purple-100 text-purple-800',
    'Interventie': 'bg-red-100 text-red-800'
  };

  const getEmotionInsight = () => {
    if (!analytics?.emotionTimeline?.length) return 'Nog geen emotiedata beschikbaar';
    
    const emotions = analytics.emotionTimeline.map((e: any) => e.emotion);
    const emotionCounts = emotions.reduce((acc: any, emotion: string) => {
      acc[emotion] = (acc[emotion] || 0) + 1;
      return acc;
    }, {});
    
    const topEmotion = Object.entries(emotionCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))[0];
    
    return `Meest voorkomende emotie: ${topEmotion?.[0] || 'onbekend'} (${topEmotion?.[1] || 0}x)`;
  };

  const getRubricRiskLevel = () => {
    if (!analytics?.rubricHeatmap) return 'Laag';
    
    const totalRisk = Object.values(analytics.rubricHeatmap).reduce((sum: number, score: any) => sum + score, 0);
    const avgRisk = totalRisk / Object.keys(analytics.rubricHeatmap).length;
    
    if (avgRisk > 3) return 'Hoog';
    if (avgRisk > 1.5) return 'Gemiddeld';
    return 'Laag';
  };

  const getEnginePreference = () => {
    // Mock data - in practice zou dit uit decision logs komen
    return {
      symbolic: 35,
      neural: 45,
      hybrid: 20
    };
  };

  const enginePreference = getEnginePreference();

  return (
    <div className="space-y-6">
      {/* Gebruiker Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Gebruikersprofiel - Single User
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{analytics?.totalConversations || 0}</div>
              <p className="text-sm text-muted-foreground">Totaal Gesprekken</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{Math.round((analytics?.avgConfidence || 0) * 100)}%</div>
              <p className="text-sm text-muted-foreground">Gemiddeld Vertrouwen</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{analytics?.performanceMetrics?.userSatisfaction || 0}/5</div>
              <p className="text-sm text-muted-foreground">Tevredenheid</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Emotionele Tijdlijn */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Emotionele Tijdlijn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{getEmotionInsight()}</p>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Recente Emoties</h4>
                <div className="flex flex-wrap gap-2">
                  {analytics?.emotionTimeline?.slice(0, 8).map((item: any, index: number) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className={emotionColors[item.emotion as keyof typeof emotionColors] || 'bg-gray-100 text-gray-800'}
                    >
                      {item.emotion} ({Math.round(item.confidence * 100)}%)
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rubric Heatmap */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Rubric Analyse
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Risico Niveau</span>
                <Badge variant={getRubricRiskLevel() === 'Hoog' ? 'destructive' : 'secondary'}>
                  {getRubricRiskLevel()}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Meest Getriggerde Rubrics</h4>
                {analytics?.rubricHeatmap && Object.entries(analytics.rubricHeatmap)
                  .sort(([,a], [,b]) => (b as number) - (a as number))
                  .slice(0, 5)
                  .map(([rubric, score]) => (
                    <div key={rubric} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{rubric.replace('-', ' ')}</span>
                      <div className="flex items-center gap-2">
                        <Progress value={(score as number) * 20} className="w-16" />
                        <span className="text-xs">{Math.round(score as number * 10)/10}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Engine Voorkeur */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Engine Gebruik
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Symbolisch</span>
                  <span className="text-sm">{enginePreference.symbolic}%</span>
                </div>
                <Progress value={enginePreference.symbolic} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Neuraal</span>
                  <span className="text-sm">{enginePreference.neural}%</span>
                </div>
                <Progress value={enginePreference.neural} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Hybride</span>
                  <span className="text-sm">{enginePreference.hybrid}%</span>
                </div>
                <Progress value={enginePreference.hybrid} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recente Beslissingen */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recente Beslissingen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics?.recentDecisions?.map((decision: any, index: number) => (
                <div key={index} className="border-l-2 border-blue-200 pl-3 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">{decision.time}</span>
                    <Badge variant="outline" className="text-xs">
                      {Math.round(decision.confidence * 100)}%
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{decision.input}</p>
                  <p className="text-sm">{decision.response}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Overzicht
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
              <div className="text-2xl font-bold">{analytics?.performanceMetrics?.avgResponseTime || 0}ms</div>
              <p className="text-sm text-muted-foreground">Gemiddelde Responstijd</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Target className="h-8 w-8 text-green-500" />
              </div>
              <div className="text-2xl font-bold">{Math.round(analytics?.performanceMetrics?.successRate || 0)}%</div>
              <p className="text-sm text-muted-foreground">Succespercentage</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
              <div className="text-2xl font-bold">{analytics?.weeklyGrowth || 0}</div>
              <p className="text-sm text-muted-foreground">Gesprekken Deze Week</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Heart className="h-8 w-8 text-red-500" />
              </div>
              <div className="text-2xl font-bold">{analytics?.performanceMetrics?.userSatisfaction || 0}/5</div>
              <p className="text-sm text-muted-foreground">Gebruikerstevredenheid</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfileDashboard;
