
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useChatHistory } from '../../hooks/useChatHistory';
import { useAutonomousLearning } from '../../hooks/useAutonomousLearning';
import AutonomousAIModeHeader from './AutonomousAIModeHeader';
import AutonomousAIModeStatus from './AutonomousAIModeStatus';
import AutonomousAIModeDescription from './AutonomousAIModeDescription';
import LearningControls from './LearningControls';

const AutonomousAIMode: React.FC = () => {
  const [isAutonomous, setIsAutonomous] = useState(false);
  
  const { messages } = useChatHistory();
  const {
    activities,
    learningProgress,
    isProcessing,
    isReflecting,
    isGenerating,
    executeAutonomousLearning,
  } = useAutonomousLearning();

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

  return (
    <Card className="bg-white/60 backdrop-blur-sm border-white/20 shadow-lg">
      <AutonomousAIModeHeader 
        isAutonomous={isAutonomous} 
        onToggle={setIsAutonomous} 
      />
      <CardContent className="space-y-4">
        <AutonomousAIModeStatus isAutonomous={isAutonomous} />

        {isAutonomous ? (
          <>
            <AutonomousAIModeDescription />
            <LearningControls
              activities={activities}
              learningProgress={learningProgress}
              isProcessing={isProcessing}
              isReflecting={isReflecting}
              isGenerating={isGenerating}
              messages={messages}
              onExecuteLearning={executeAutonomousLearning}
            />
          </>
        ) : (
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
