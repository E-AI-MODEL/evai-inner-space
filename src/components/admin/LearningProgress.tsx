
import React from 'react';
import { Progress } from '@/components/ui/progress';

interface LearningProgressProps {
  progress: number;
}

const LearningProgress: React.FC<LearningProgressProps> = ({ progress }) => {
  if (progress <= 0) return null;

  return (
    <div className="space-y-2">
      <Progress value={progress} className="h-2" />
      <p className="text-xs text-gray-600 text-center">
        {progress}% voltooid
      </p>
    </div>
  );
};

export default LearningProgress;
