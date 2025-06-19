
import React from 'react';
import { Button } from '@/components/ui/button';
import LearningProgress from './LearningProgress';
import ActivityList from './ActivityList';
import { LearningActivity } from './ActivityItem';
import { Message } from '../../types';

interface LearningControlsProps {
  activities: LearningActivity[];
  learningProgress: number;
  isProcessing: boolean;
  isReflecting: boolean;
  isGenerating: boolean;
  messages: Message[];
  onExecuteLearning: (messages: Message[]) => Promise<void>;
}

const LearningControls: React.FC<LearningControlsProps> = ({
  activities,
  learningProgress,
  isProcessing,
  isReflecting,
  isGenerating,
  messages,
  onExecuteLearning
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Leerproces</span>
        <Button 
          onClick={() => onExecuteLearning(messages)}
          disabled={isProcessing || isReflecting || isGenerating}
          size="sm"
          className="h-7"
        >
          {isProcessing ? 'Bezig...' : 'Start Leerproces'}
        </Button>
      </div>

      <LearningProgress progress={learningProgress} />
      <ActivityList activities={activities} />
    </div>
  );
};

export default LearningControls;
