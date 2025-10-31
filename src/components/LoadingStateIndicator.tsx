import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface ProcessingStep {
  id: string;
  label: string;
  estimatedMs: number;
}

const PROCESSING_STEPS: ProcessingStep[] = [
  { id: 'rubrics', label: 'Rubrics analyseren', estimatedMs: 500 },
  { id: 'eaa', label: 'EAA evalueren', estimatedMs: 300 },
  { id: 'seed', label: 'Emotie detecteren', estimatedMs: 800 },
  { id: 'llm', label: 'Response genereren', estimatedMs: 2000 }
];

interface LoadingStateIndicatorProps {
  className?: string;
}

export const LoadingStateIndicator: React.FC<LoadingStateIndicatorProps> = ({ className = '' }) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (currentStep >= PROCESSING_STEPS.length) return;

    const timer = setTimeout(() => {
      setCurrentStep(prev => Math.min(prev + 1, PROCESSING_STEPS.length));
    }, PROCESSING_STEPS[currentStep].estimatedMs);

    return () => clearTimeout(timer);
  }, [currentStep]);

  return (
    <Card className={`p-4 bg-muted/50 border-border animate-fade-slide-in ${className}`}>
      <div className="space-y-2">
        {PROCESSING_STEPS.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;
          
          return (
            <div 
              key={step.id}
              className="flex items-center gap-3 text-sm"
            >
              {isCompleted ? (
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
              ) : isActive ? (
                <Loader2 className="h-4 w-4 text-primary animate-spin flex-shrink-0" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
              )}
              <span className={isCompleted || isActive ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
