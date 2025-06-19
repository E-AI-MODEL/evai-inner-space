
import { useState } from 'react';
import { useSelfReflection } from './useSelfReflection';
import { useOpenAISeedGenerator } from './useOpenAISeedGenerator';
import { LearningActivity } from '../components/admin/ActivityItem';
import { Message } from '../types';
import { v4 as uuidv4 } from 'uuid';

export function useAutonomousLearning() {
  const [activities, setActivities] = useState<LearningActivity[]>([]);
  const [learningProgress, setLearningProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { executeReflection, isReflecting } = useSelfReflection();
  const { generateSeed, analyzeConversationForSeeds, injectSeedToDatabase, isGenerating } = useOpenAISeedGenerator();

  const addActivity = (activity: Omit<LearningActivity, 'id' | 'timestamp'>) => {
    const newActivity: LearningActivity = {
      ...activity,
      id: uuidv4(),
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

  const executeAutonomousLearning = async (messages: Message[]) => {
    if (isProcessing) return;
    
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
            addActivity({
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

  return {
    activities,
    learningProgress,
    isProcessing,
    isReflecting,
    isGenerating,
    executeAutonomousLearning,
  };
}
