
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { useLearningEngine } from '../../hooks/useLearningEngine';
import { useSeedInjection } from '../../hooks/useSeedInjection';
import { Message } from '../../types';
import { Brain, Zap, Target, Settings, Play, Pause, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface SelfLearningControlsProps {
  messages: Message[];
  onLearningUpdate?: () => void;
}

const SelfLearningControls: React.FC<SelfLearningControlsProps> = ({ 
  messages, 
  onLearningUpdate 
}) => {
  const { 
    isLearning, 
    patterns, 
    metrics, 
    learnFromConversation, 
    getPerformanceInsights 
  } = useLearningEngine();
  
  const { 
    isInjecting, 
    pendingInjections, 
    injectSeed, 
    analyzeForInjectionNeeds 
  } = useSeedInjection();

  const [autoLearning, setAutoLearning] = useState(true);
  const [autoInjection, setAutoInjection] = useState(false);
  const [learningProgress, setLearningProgress] = useState(0);

  useEffect(() => {
    if (autoLearning && messages.length > 0) {
      const timer = setTimeout(() => {
        triggerLearning();
      }, 5000); // Learn every 5 seconds when auto-learning is on
      
      return () => clearTimeout(timer);
    }
  }, [messages, autoLearning]);

  useEffect(() => {
    if (autoInjection) {
      analyzeForInjectionNeeds(messages);
    }
  }, [messages, autoInjection]);

  const triggerLearning = async () => {
    try {
      setLearningProgress(0);
      const progressInterval = setInterval(() => {
        setLearningProgress(prev => Math.min(prev + 20, 90));
      }, 200);
      
      await learnFromConversation(messages);
      
      clearInterval(progressInterval);
      setLearningProgress(100);
      
      setTimeout(() => setLearningProgress(0), 2000);
      
      if (onLearningUpdate) {
        onLearningUpdate();
      }
      
      toast({
        title: "Learning voltooid",
        description: `${patterns.length} patronen geanalyseerd, ${metrics.length} seeds geoptimaliseerd.`
      });
    } catch (error) {
      console.error('Learning failed:', error);
      setLearningProgress(0);
    }
  };

  const insights = getPerformanceInsights();

  return (
    <div className="space-y-6">
      {/* Learning Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain size={20} />
            Self-Learning Engine
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch 
                  checked={autoLearning} 
                  onCheckedChange={setAutoLearning}
                />
                <span className="text-sm">Automatisch leren</span>
              </div>
              <Button
                onClick={triggerLearning}
                disabled={isLearning}
                size="sm"
                className="flex items-center gap-2"
              >
                {isLearning ? <RefreshCw size={16} className="animate-spin" /> : <Play size={16} />}
                {isLearning ? 'Leert...' : 'Start Learning'}
              </Button>
            </div>
            
            {learningProgress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Learning Progress</span>
                  <span>{learningProgress}%</span>
                </div>
                <Progress value={learningProgress} className="h-2" />
              </div>
            )}
            
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{patterns.length}</p>
                <p className="text-xs text-gray-600">Patterns</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{metrics.length}</p>
                <p className="text-xs text-gray-600">Optimized Seeds</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {(insights.avgPerformance * 100).toFixed(0)}%
                </p>
                <p className="text-xs text-gray-600">Avg Performance</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Injection Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap size={20} />
            Real-time Seed Injection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch 
                  checked={autoInjection} 
                  onCheckedChange={setAutoInjection}
                />
                <span className="text-sm">Auto-injectie</span>
              </div>
              <Badge variant="secondary">
                {pendingInjections.length} pending
              </Badge>
            </div>
            
            {pendingInjections.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Pending Injections:</p>
                {pendingInjections.slice(0, 3).map((injection, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <div>
                      <span className="text-sm font-medium">{injection.emotion}</span>
                      <Badge 
                        variant={injection.urgency === 'critical' ? 'destructive' : 'secondary'}
                        className="ml-2 text-xs"
                      >
                        {injection.urgency}
                      </Badge>
                    </div>
                    <Button
                      onClick={() => injectSeed(injection)}
                      disabled={isInjecting}
                      size="sm"
                      variant="outline"
                    >
                      Inject
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target size={20} />
            Learning Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Learning Velocity</span>
              <Badge 
                variant={insights.learningVelocity > 0.3 ? "default" : "secondary"}
                className={insights.learningVelocity > 0.3 ? "bg-green-600" : ""}
              >
                {(insights.learningVelocity * 100).toFixed(1)}%
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Recent Activity (24h)</span>
              <Badge variant="secondary">{insights.recentPatterns} patterns</Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">System Health</span>
              <Badge 
                variant={insights.avgPerformance > 0.7 ? "default" : "secondary"}
                className={insights.avgPerformance > 0.7 ? "bg-green-600" : ""}
              >
                {insights.avgPerformance > 0.8 ? 'Excellent' : 
                 insights.avgPerformance > 0.6 ? 'Good' : 'Needs Improvement'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SelfLearningControls;
