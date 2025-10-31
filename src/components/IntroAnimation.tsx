
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';

const IntroAnimation = ({ onFinished }: { onFinished: () => void }) => {
  const [animationState, setAnimationState] = useState('in');
  const { authorizeChat } = useAuth();

  useEffect(() => {
    authorizeChat();
  }, [authorizeChat]);

  const handleNext = () => {
    setAnimationState('out');
    setTimeout(() => onFinished(), 500);
  };

  const renderStep = () => {
    return (
      <div className="text-center space-y-6 animate-fade-in">
        <Heart className="h-24 w-24 mx-auto mb-6 text-blue-500 fill-blue-500" />
        <h1 className="text-4xl font-semibold text-foreground mb-3">Welkom bij EvAI</h1>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          Je empathische AI-assistent
        </p>
      </div>
    );
  };

  return (
    <div
      className={`fixed inset-0 bg-background z-50 flex flex-col items-center justify-center p-4 transition-opacity duration-500 ${
        animationState === 'in' ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="w-full max-w-2xl">
        {renderStep()}
        
        <div className="flex justify-center items-center mt-10 gap-4">
          <Button onClick={handleNext} size="lg" className="min-w-32">
            Start
          </Button>
        </div>
      </div>
    </div>
  );
};

export default IntroAnimation;
