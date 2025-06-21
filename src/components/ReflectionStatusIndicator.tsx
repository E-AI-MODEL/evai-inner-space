
import React from 'react';
import { PendingReflection } from '../hooks/useBackgroundReflectionTrigger';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface ReflectionStatusIndicatorProps {
  pendingReflections: PendingReflection[];
  isProcessing: boolean;
  className?: string;
}

const ReflectionStatusIndicator: React.FC<ReflectionStatusIndicatorProps> = ({
  pendingReflections,
  isProcessing,
  className = ""
}) => {
  if (pendingReflections.length === 0 && !isProcessing) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-2 ${className}`}>
            {isProcessing && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse mr-1"></div>
                Verwerkt reflecties...
              </Badge>
            )}
            
            {pendingReflections.length > 0 && (
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                🤔 {pendingReflections.length} reflectievra{pendingReflections.length === 1 ? 'ag' : 'gen'}
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-2 max-w-sm">
            {isProcessing && (
              <p className="text-sm">Verwerkt verlopende seeds voor automatische reflectievragen...</p>
            )}
            
            {pendingReflections.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Gereed voor reflectie:</p>
                <div className="space-y-1">
                  {pendingReflections.slice(0, 3).map(reflection => (
                    <div key={reflection.id} className="text-xs">
                      <span className="font-medium">{reflection.emotion}</span>
                      <span className="text-gray-600 ml-1">
                        ({reflection.batchInfo.seedCount} seeds)
                      </span>
                    </div>
                  ))}
                  {pendingReflections.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{pendingReflections.length - 3} meer...
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ReflectionStatusIndicator;
