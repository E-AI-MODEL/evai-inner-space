
import { useState } from 'react';
import { AdvancedSeed } from '../types/seed';
import { addAdvancedSeed } from '../lib/advancedSeedStorage';
import { toast } from '@/hooks/use-toast';

interface InjectionRequest {
  emotion: string;
  context: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
}

export function useSeedInjection() {
  const [isInjecting, setIsInjecting] = useState(false);
  const [pendingInjections, setPendingInjections] = useState<InjectionRequest[]>([]);

  const injectSeed = async (request: InjectionRequest) => {
    setIsInjecting(true);
    
    try {
      const seed: AdvancedSeed = {
        id: `injected-${Date.now()}`,
        emotion: request.emotion,
        type: 'validation',
        label: 'Valideren',
        triggers: [request.emotion.toLowerCase(), request.context.toLowerCase()],
        response: {
          nl: `Ik merk ${request.emotion} in je woorden. Dat is een begrijpelijke reactie in deze situatie.`
        },
        context: {
          severity: request.urgency === 'critical' ? 'critical' : 
                   request.urgency === 'high' ? 'high' : 'medium',
          situation: 'therapy'
        },
        meta: {
          priority: request.urgency === 'critical' ? 100 : 
                   request.urgency === 'high' ? 75 : 50,
          weight: 2.0, // Higher weight for injected seeds
          confidence: 0.8,
          usageCount: 0
        },
        tags: ['injected', 'realtime', request.urgency],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'ai',
        isActive: true,
        version: '1.0'
      };
      
      addAdvancedSeed(seed);
      
      toast({
        title: "Real-time seed geïnjecteerd",
        description: `Nieuwe seed voor "${request.emotion}" is toegevoegd aan het systeem.`
      });
      
      // Remove from pending
      setPendingInjections(prev => 
        prev.filter(p => p.emotion !== request.emotion || p.context !== request.context)
      );
      
    } catch (error) {
      console.error('Seed injection failed:', error);
      toast({
        title: "Injectie gefaald",
        description: "Kon de seed niet toevoegen aan het systeem.",
        variant: "destructive"
      });
    } finally {
      setIsInjecting(false);
    }
  };

  const queueInjection = (request: InjectionRequest) => {
    setPendingInjections(prev => [...prev, request]);
    
    if (request.urgency === 'critical') {
      // Auto-inject critical seeds
      injectSeed(request);
    }
  };

  const analyzeForInjectionNeeds = (messages: any[]) => {
    // Analyze recent messages for patterns that might need new seeds
    const recentUserMessages = messages
      .filter(m => m.from === 'user')
      .slice(-5);
    
    const unhandledEmotions: string[] = [];
    
    recentUserMessages.forEach(msg => {
      if (!msg.emotionSeed || msg.emotionSeed === 'error') {
        // Extract potential emotions from content
        const emotionKeywords = extractEmotionKeywords(msg.content);
        unhandledEmotions.push(...emotionKeywords);
      }
    });
    
    // Create injection requests for unhandled emotions
    const uniqueEmotions = [...new Set(unhandledEmotions)];
    uniqueEmotions.forEach(emotion => {
      const existing = pendingInjections.find(p => p.emotion === emotion);
      if (!existing) {
        queueInjection({
          emotion,
          context: 'conversation',
          urgency: 'medium',
          reason: 'Unhandled emotion detected in conversation'
        });
      }
    });
  };

  const extractEmotionKeywords = (text: string): string[] => {
    const emotions = [
      'angst', 'vrees', 'onzekerheid', 'twijfel', 'verwarring',
      'boosheid', 'frustratie', 'irritatie', 'woede',
      'verdriet', 'somberheid', 'melancholie', 'rouw',
      'blijdschap', 'vreugde', 'geluk', 'tevredenheid',
      'stress', 'paniek', 'overweldiging', 'druk'
    ];
    
    const found: string[] = [];
    const lowerText = text.toLowerCase();
    
    emotions.forEach(emotion => {
      if (lowerText.includes(emotion)) {
        found.push(emotion);
      }
    });
    
    return found;
  };

  return {
    isInjecting,
    pendingInjections,
    injectSeed,
    queueInjection,
    analyzeForInjectionNeeds
  };
}
