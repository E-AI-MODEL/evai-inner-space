
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Heart, Brain, Sparkles } from 'lucide-react';

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
      <div className="text-center space-y-8 animate-fade-in">
        {/* Animated logo */}
        <div className="relative mx-auto w-32 h-32 mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-coral/30 to-primary-purple/30 blur-3xl animate-pulse" />
          <div className="relative w-32 h-32 rounded-3xl bg-gradient-to-br from-primary-coral to-primary-purple flex items-center justify-center shadow-glow spring">
            <Heart className="h-16 w-16 text-white" />
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-5xl font-display font-bold gradient-text">
            Welkom bij EvAI
          </h1>
          <p className="text-xl text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Je empathische AI-partner die je helpt met emoties, reflectie en persoonlijke groei
          </p>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mt-12">
          {[
            { icon: Heart, title: "Empathisch", desc: "Begrijpt je emoties" },
            { icon: Brain, title: "Intelligent", desc: "Neurosymbolische AI" },
            { icon: Sparkles, title: "Persoonlijk", desc: "Past zich aan jou aan" }
          ].map((feature, i) => (
            <div key={i} className="glass-strong p-6 rounded-2xl hover:scale-105 transition-all duration-300">
              <feature.icon className="h-8 w-8 mx-auto mb-3 text-primary-purple" />
              <h3 className="font-semibold mb-1">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
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
        
        <div className="flex justify-center items-center mt-12 gap-4">
          <Button 
            onClick={handleNext} 
            size="lg" 
            className="min-w-40 bg-gradient-to-r from-primary-coral to-primary-purple hover:shadow-glow transition-all duration-300 hover:scale-105"
          >
            Start gesprek
          </Button>
        </div>
      </div>
    </div>
  );
};

export default IntroAnimation;
