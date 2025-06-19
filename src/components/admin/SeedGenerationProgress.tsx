
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Zap } from 'lucide-react';

interface SeedGenerationProgressProps {
  isActive: boolean;
  progress: number;
  currentEmotion: string;
}

const SeedGenerationProgress: React.FC<SeedGenerationProgressProps> = ({
  isActive,
  progress,
  currentEmotion
}) => {
  if (!isActive) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span>Genereren van diverse seed types...</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <Progress value={progress} className="w-full" />
      {currentEmotion && (
        <div className="text-sm text-gray-600 flex items-center gap-2">
          <Zap size={14} className="animate-pulse text-yellow-500" />
          Bezig met: <Badge variant="outline">{currentEmotion}</Badge>
          <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs">Enhanced</Badge>
        </div>
      )}
    </div>
  );
};

export default SeedGenerationProgress;
