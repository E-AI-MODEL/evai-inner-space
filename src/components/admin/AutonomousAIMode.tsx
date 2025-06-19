
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, Zap, Database, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { useSelfReflection } from '../../hooks/useSelfReflection';
import { useChatHistory } from '../../hooks/useChatHistory';
import { useOpenAISeedGenerator } from '../../hooks/useOpenAISeedGenerator';

interface LearningActivity {
  id: string;
  timestamp: Date;
  type: 'analysis' | 'gap_detection' | 'seed_generation' | 'injection';
  description: string;
  status: 'running' | 'completed' | 'failed';
}

const AutonomousAIMode: React.FC = () => {
  const [isAutonomous, setIsAutonomous] = useState(false);
  const [learningProgress, setLearningProgress] = useState(0);
  const [activities, setActivities] = useState<LearningActivity[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { messages } = useChatHistory();
  const { executeReflection, isReflecting } = useSelfReflection();
  const { generateSeed, analyzeConversationForSeeds, injectSeedToDatabase, isGenerating } = useOpenAISeedGenerator();

  useEffect(() => {
    // Load saved autonomous mode state
    const savedState = localStorage.getItem('evai-autonomous-mode');
    if (savedState === 'true') {
      setIsAutonomous(true);
    }
  }, []);

  useEffect(() => {
    // Save autonomous mode state
    localStorage.setItem('evai-autonomous-mode', isAutonomous.toString());
  }, [isAutonomous]);

  const addActivity = (activity: Omit<LearningActivity, 'id' | 'timestamp'>) => {
    const newActivity: LearningActivity = {
      ...activity,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
    };
    setActivities(prev => [newActivity, ...prev.slice(0, 9)]); // Keep last 10 activities
    return newActivity.id;
  };

  const updateActivity = (id: string, updates: Partial<LearningActivity>) => {
    setActivities(prev => prev.map(activity => 
      activity.id === id ? { ...activity, ...updates } : activity
    ));
  };

  const executeAutonomousLearning = async () => {
    if (!isAutonomous || isProcessing) return;
    
    setIsProcessing(true);
    setLearningProgress(0);

    try {
      // Step 1: Analyze conversations
      const analysisId = addActivity({
        type: 'analysis',
        description: 'Gesprekken analyseren voor leerpatronen...',
        status: 'running'
      });
      setLearningProgress(25);

      const reflectionResult = await executeReflection(messages);
      updateActivity(analysisId, { 
        status: 'completed',
        description: `${reflectionResult.insights.length} inzichten gevonden uit ${messages.length} berichten`
      });

      // Step 2: Detect knowledge gaps
      setLearningProgress(50);
      const gapId = addActivity({
        type: 'gap_detection',
        description: 'Kennisgaten identificeren...',
        status: 'running'
      });

      const apiKey = localStorage.getItem('openai-api-key-2');
      if (!apiKey) {
        updateActivity(gapId, { 
          status: 'failed',
          description: 'OpenAI API Key 2 vereist voor gapdetectie'
        });
        return;
      }

      // Analyze conversation for missing seeds
      const missingEmotions = await analyzeConversationForSeeds(messages, apiKey);
      updateActivity(gapId, { 
        status: 'completed',
        description: `${missingEmotions.length} potentiële kennisgaten gedetecteerd`
      });

      // Step 3: Generate new seeds
      setLearningProgress(75);
      if (missingEmotions.length > 0) {
        const seedId = addActivity({
          type: 'seed_generation',
          description: 'Nieuwe emotionele seeds genereren...',
          status: 'running'
        });

        try {
          let generatedCount = 0;
          // Generate seeds for up to 3 missing emotions
          const emotionsToProcess = missingEmotions.slice(0, 3);
          
          for (const emotion of emotionsToProcess) {
            const newSeed = await generateSeed({
              emotion,
              context: 'Gedetecteerde kennisgap uit gesprekanalyse',
              conversationHistory: messages.slice(-5).map(m => m.content),
              severity: 'medium'
            }, apiKey);

            if (newSeed) {
              await injectSeedToDatabase(newSeed);
              generatedCount++;
            }
          }

          updateActivity(seedId, { 
            status: 'completed',
            description: `${generatedCount} nieuwe seeds succesvol gegenereerd en geïnjecteerd`
          });

          // Step 4: Injection status
          if (generatedCount > 0) {
            const injectId = addActivity({
              type: 'injection',
              description: 'Seeds succesvol geïntegreerd in kennisbank',
              status: 'completed'
            });
          }
        } catch (error) {
          updateActivity(seedId, { 
            status: 'failed',
            description: 'Seed generatie mislukt - controleer API key'
          });
        }
      }

      setLearningProgress(100);
    } catch (error) {
      console.error('Autonomous learning failed:', error);
      addActivity({
        type: 'analysis',
        description: 'Autonoom leren mislukt - systeemfout',
        status: 'failed'
      });
    } finally {
      setIsProcessing(false);
      setTimeout(() => setLearningProgress(0), 2000);
    }
  };

  const getActivityIcon = (type: LearningActivity['type']) => {
    switch (type) {
      case 'analysis': return <Brain className="w-4 h-4" />;
      case 'gap_detection': return <AlertCircle className="w-4 h-4" />;
      case 'seed_generation': return <Zap className="w-4 h-4" />;
      case 'injection': return <Database className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status: LearningActivity['status']) => {
    switch (status) {
      case 'running': return <Clock className="w-3 h-3 animate-spin text-blue-600" />;
      case 'completed': return <CheckCircle2 className="w-3 h-3 text-green-600" />;
      case 'failed': return <AlertCircle className="w-3 h-3 text-red-600" />;
    }
  };

  return (
    <Card className="bg-white/60 backdrop-blur-sm border-white/20 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            <span>Autonome AI Modus</span>
          </div>
          <Switch
            checked={isAutonomous}
            onCheckedChange={setIsAutonomous}
            className="data-[state=checked]:bg-purple-600"
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700">Status:</span>
          <Badge variant={isAutonomous ? "default" : "secondary"}>
            {isAutonomous ? "ACTIEF" : "UITGESCHAKELD"}
          </Badge>
        </div>

        {isAutonomous && (
          <>
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-xs text-purple-800 font-medium mb-2">
                🚀 AUTONOME MODUS ACTIEF
              </p>
              <p className="text-xs text-purple-700">
                • Gesprekken automatisch analyseren<br/>
                • Kennisgaten detecteren<br/>
                • Nieuwe seeds genereren<br/>
                • Kennisbank bijwerken
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Leerproces</span>
                <Button 
                  onClick={executeAutonomousLearning}
                  disabled={isProcessing || isReflecting || isGenerating}
                  size="sm"
                  className="h-7"
                >
                  {isProcessing ? 'Bezig...' : 'Start Leerproces'}
                </Button>
              </div>

              {learningProgress > 0 && (
                <div className="space-y-2">
                  <Progress value={learningProgress} className="h-2" />
                  <p className="text-xs text-gray-600 text-center">
                    {learningProgress}% voltooid
                  </p>
                </div>
              )}

              {activities.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Recente Activiteiten</h4>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {activities.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-2 p-2 bg-gray-50 rounded text-xs">
                        <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                          {getActivityIcon(activity.type)}
                          {getStatusIcon(activity.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-800 break-words">{activity.description}</p>
                          <p className="text-gray-500 text-xs">
                            {activity.timestamp.toLocaleTimeString('nl-NL', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {!isAutonomous && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-xs text-gray-600">
              Schakel de autonome modus in om de AI zelfstandig te laten leren van gesprekken en de kennisbank automatisch te verbeteren.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AutonomousAIMode;
