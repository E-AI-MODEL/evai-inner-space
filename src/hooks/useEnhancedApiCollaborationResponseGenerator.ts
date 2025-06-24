import { useState } from 'react';
import { Message } from '../types';
import { AdvancedSeed } from '../types/seed';
import { EmotionDetection } from './useOpenAI';
import { getLabelVisuals } from '../lib/emotion-visuals';

interface PendingReflection {
  id: string;
  emotion: string;
  question: string;
  context: string;
  confidence: number;
  triggeredAt: Date;
  batchInfo: {
    seedCount: number;
    averageUsage: number;
  };
}

export function useEnhancedApiCollaborationResponseGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReflectionResponse = (
    reflection: PendingReflection,
    userMessage: Message,
    collaborationStatus: { api1: boolean; api2: boolean; vector: boolean },
    availableApis: number
  ): Message => {
    setIsGenerating(true);
    
    try {
      const confidence = Math.round(reflection.confidence * 100);
      const apiStatusText = `API-1:${collaborationStatus.api1 ? '✅' : '❌'} | API-2:${collaborationStatus.api2 ? '✅' : '❌'} | Vector:${collaborationStatus.vector ? '✅' : '❌'}`;
      
      const collaborationNote = `\n\n*[🤔 REFLECTIE VIA API SAMENWERKING: ${apiStatusText} | ${availableApis}/3 APIs | ${reflection.batchInfo.seedCount} verlopende seeds]*`;
      
      const reflectionMessage: Message = {
        id: `ai-reflection-${Date.now()}`,
        from: "ai",
        label: "Reflectievraag",
        content: `${reflection.question}${collaborationNote}`,
        explainText: `${reflection.context} | Automatische reflectie via Enhanced API Collaboration (${confidence}% confidence)`,
        emotionSeed: reflection.emotion,
        animate: true,
        meta: `Reflectie: ${reflection.emotion} | ${confidence}% confidence`,
        timestamp: new Date(),
        feedback: null,
        symbolicInferences: [
          `🤔 Automatische Reflectievraag: Gebaseerd op ${reflection.batchInfo.seedCount} verlopende seeds`,
          `🎯 Emotie Focus: ${reflection.emotion} (gemiddeld ${reflection.batchInfo.averageUsage.toFixed(1)}x gebruikt)`,
          `🤝 API 1 (OpenAI): ${collaborationStatus.api1 ? '✅ Gebruikt voor vraag generatie' : '❌ Niet beschikbaar'}`,
          `🤝 API 2 (Secondary): ${collaborationStatus.api2 ? '✅ Beschikbaar voor analyse' : '❌ Ontbreekt'}`,
          `🧬 Vector API: ${collaborationStatus.vector ? '✅ Beschikbaar voor embeddings' : '❌ Ontbreekt'}`,
          `📊 Reflectie Confidence: ${confidence}% (${reflection.confidence > 0.8 ? 'Hoog' : reflection.confidence > 0.6 ? 'Gemiddeld' : 'Laag'})`,
          `⏰ Gegenereerd: ${reflection.triggeredAt.toLocaleTimeString()}`,
          `🔄 Seed Lifecycle: Automatische reflectie na TTL expiry`,
          `💡 Context: ${reflection.context}`
        ]
      };

      console.log(`✅ Generated reflection response for emotion: ${reflection.emotion}`);
      return reflectionMessage;
      
    } finally {
      setIsGenerating(false);
    }
  };

  const enhanceRegularResponse = (
    originalResponse: Message,
    hasPendingReflections: boolean,
    pendingCount: number
  ): Message => {
    if (!hasPendingReflections) return originalResponse;

    // Add subtle indication of pending reflections to regular responses
    const enhancedInferences = [
      ...(originalResponse.symbolicInferences || []),
      `🔔 Achtergrond: ${pendingCount} reflectievra${pendingCount === 1 ? 'ag' : 'gen'} beschikbaar op basis van verlopende seeds`
    ];

    return {
      ...originalResponse,
      symbolicInferences: enhancedInferences
    };
  };

  const shouldTriggerReflection = (
    pendingReflections: PendingReflection[],
    conversationLength: number,
    lastReflectionMessageIndex: number
  ): boolean => {
    if (pendingReflections.length === 0) return false;
    
    // Trigger reflection if:
    // 1. There are pending reflections
    // 2. At least 3 messages have passed since last reflection
    // 3. Conversation has at least 5 messages total
    const messagesSinceLastReflection = conversationLength - lastReflectionMessageIndex;
    
    return conversationLength >= 5 && messagesSinceLastReflection >= 3;
  };

  return {
    generateReflectionResponse,
    enhanceRegularResponse,
    shouldTriggerReflection,
    isGenerating
  };
}
