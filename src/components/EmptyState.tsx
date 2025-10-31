import React from 'react';
import { MessageCircle, Sparkles, Shield, Brain } from 'lucide-react';
import { Card } from '@/components/ui/card';

export const EmptyState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4 animate-fade-slide-in">
      <div className="text-6xl mb-6">💙</div>
      <h2 className="text-3xl font-semibold text-foreground mb-3">Welkom bij EvAI</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        Je empathische AI-assistent met neurosymbolische verwerking
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl w-full">
        <Card className="p-4 bg-card hover:bg-accent/50 transition-colors">
          <Brain className="h-8 w-8 text-primary mx-auto mb-2" />
          <h3 className="font-medium text-sm mb-1">EAA Framework</h3>
          <p className="text-xs text-muted-foreground">
            Emotie, Autonomie & Agency evaluatie
          </p>
        </Card>
        
        <Card className="p-4 bg-card hover:bg-accent/50 transition-colors">
          <Shield className="h-8 w-8 text-primary mx-auto mb-2" />
          <h3 className="font-medium text-sm mb-1">EvAI Rubrics</h3>
          <p className="text-xs text-muted-foreground">
            Gesprekskwaliteit monitoren
          </p>
        </Card>
        
        <Card className="p-4 bg-card hover:bg-accent/50 transition-colors">
          <Sparkles className="h-8 w-8 text-primary mx-auto mb-2" />
          <h3 className="font-medium text-sm mb-1">Self-Learning</h3>
          <p className="text-xs text-muted-foreground">
            Continue verbetering uit gesprekken
          </p>
        </Card>
      </div>
      
      <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
        <MessageCircle className="h-4 w-4" />
        <span>Start een gesprek om te beginnen</span>
      </div>
    </div>
  );
};
