
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Brain, Shield, Sparkles, ArrowRight } from 'lucide-react';

const IntroAnimation = ({ onFinished }: { onFinished: () => void }) => {
  const [step, setStep] = useState(0);
  const [animationState, setAnimationState] = useState('in');
  const { authorizeChat } = useAuth();

  useEffect(() => {
    authorizeChat();
  }, [authorizeChat]);

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      setAnimationState('out');
      setTimeout(() => onFinished(), 500);
    }
  };

  const handleSkip = () => {
    setAnimationState('out');
    setTimeout(() => onFinished(), 500);
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="text-center space-y-4 animate-fade-in">
            <div className="text-6xl mb-6">💙</div>
            <h1 className="text-3xl font-semibold text-foreground">Welkom bij EvAI</h1>
            <p className="text-muted-foreground max-w-md">
              Je empathische AI-assistent met neurosymbolische verwerking
            </p>
          </div>
        );
      
      case 1:
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-semibold text-center text-foreground">Kernfuncties</h2>
            <div className="grid gap-4 max-w-lg">
              <Card className="p-4 bg-card border-border">
                <div className="flex gap-3">
                  <Brain className="h-8 w-8 text-primary flex-shrink-0" />
                  <div>
                    <h3 className="font-medium mb-1">EAA Framework</h3>
                    <p className="text-sm text-muted-foreground">
                      Meet emotionele eigenaarschap, autonomie & agency voor gepersonaliseerde ondersteuning
                    </p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4 bg-card border-border">
                <div className="flex gap-3">
                  <Shield className="h-8 w-8 text-primary flex-shrink-0" />
                  <div>
                    <h3 className="font-medium mb-1">EvAI Rubrics</h3>
                    <p className="text-sm text-muted-foreground">
                      Analyseert gesprekskwaliteit op risico- en beschermende factoren
                    </p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4 bg-card border-border">
                <div className="flex gap-3">
                  <Sparkles className="h-8 w-8 text-primary flex-shrink-0" />
                  <div>
                    <h3 className="font-medium mb-1">Self-Learning</h3>
                    <p className="text-sm text-muted-foreground">
                      Leert automatisch uit gesprekken en past zich aan jouw situatie aan
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="text-center space-y-6 animate-fade-in">
            <div className="text-5xl mb-4">🚀</div>
            <h2 className="text-2xl font-semibold text-foreground">Klaar om te beginnen!</h2>
            <p className="text-muted-foreground max-w-md">
              Je kunt altijd je voorkeuren aanpassen via het instellingen-menu (⚙️) rechtsboven.
            </p>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div
      className={`fixed inset-0 bg-background z-50 flex flex-col items-center justify-center p-4 transition-opacity duration-500 ${
        animationState === 'in' ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="w-full max-w-2xl">
        {renderStep()}
        
        <div className="flex justify-between items-center mt-8">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="text-muted-foreground"
          >
            Overslaan
          </Button>
          
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full transition-colors ${
                  i === step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
          
          <Button onClick={handleNext}>
            {step < 2 ? (
              <>
                Volgende <ArrowRight className="ml-2 h-4 w-4" />
              </>
            ) : (
              'Start'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default IntroAnimation;
