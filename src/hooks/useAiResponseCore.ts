import { useState } from "react";
import { Message, ChatHistoryItem } from "../types";
import { AdvancedSeed } from "../types/seed";
import { EmotionDetection } from "./useOpenAI";
import { getLabelVisuals } from "../lib/emotion-visuals";
import { toast } from "@/hooks/use-toast";
import { CollaborationStatus } from "./useApiStatusManager";

interface ExtendedContext {
  dislikedLabel?: "Valideren" | "Reflectievraag" | "Suggestie";
  secondaryInsights?: string[];
  collaborationStatus?: CollaborationStatus;
}

export function useAiResponseCore() {
  const createSuccessfulAiResponse = (
    matchedResult: AdvancedSeed | EmotionDetection,
    userMessage: Message,
    collaborationStatus: CollaborationStatus,
    availableApis: number,
    rubricInsights: string[],
    cotRubricGuidance: string[],
    secondaryInsights: string[],
    overallRisk: number
  ): Message => {
    // Get confidence from the correct property based on the type
    const confidence = 'id' in matchedResult && typeof matchedResult.id === 'string' 
      ? Math.round((matchedResult as AdvancedSeed).meta.confidence * 100)
      : Math.round((matchedResult as EmotionDetection).confidence * 100);
    
    // Use 'id' property check to determine if it's an AdvancedSeed or EmotionDetection
    // AdvancedSeed has required 'id' field, EmotionDetection does not
    let responseContent: string;
    let label: "Valideren" | "Reflectievraag" | "Suggestie";
    let emotionSeed: string | null;
    let explainText: string;
    
    if ('id' in matchedResult && typeof matchedResult.id === 'string') {
      // This is an AdvancedSeed object from database
      const seed = matchedResult as AdvancedSeed;
      responseContent = seed.response.nl;
      // Filter out "Interventie" label to match Message type
      label = seed.label === "Interventie" ? "Suggestie" : seed.label as "Valideren" | "Reflectievraag" | "Suggestie";
      emotionSeed = seed.emotion;
      explainText = `Gevonden match op basis van triggers: ${seed.triggers.join(', ')}. Context: ${seed.context.severity}. Enhanced API Collaboration: ${confidence}%`;
    } else {
      // This is an EmotionDetection object from OpenAI
      const detection = matchedResult as EmotionDetection;
      responseContent = detection.response;
      label = detection.label || "Valideren";
      emotionSeed = detection.emotion;
      explainText = `${detection.reasoning || 'Enhanced API Collaboration'} | Enhanced API Collaboration: ${confidence}%`;
    }
    
    return {
      id: `ai-enhanced-collab-${Date.now()}`,
      from: "ai",
      label: label,
      accentColor: getLabelVisuals(label).accentColor,
      content: responseContent,
      explainText: explainText,
      emotionSeed: emotionSeed,
      animate: true,
      meta: `Enhanced API Collaboration: ${confidence}% | ${availableApis}/3 APIs`,
      brilliant: true,
      timestamp: new Date(),
      replyTo: userMessage.id,
      feedback: null,
      symbolicInferences: [
        ...rubricInsights.map(insight => `📊 EvAI Rubric: ${insight}`),
        ...cotRubricGuidance.map(guidance => `🧠 EvAI Guidance: ${guidance}`),
        `🤝 API 1 (OpenAI): ${collaborationStatus.api1 ? '✅ Actief' : '❌ ONTBREEKT - Voeg toe voor betere responses'}`,
        `🤝 API 2 (Secondary): ${collaborationStatus.api2 ? '✅ Actief voor analyse' : '❌ ONTBREEKT - Voeg toe voor diepere analyse'}`,
        `🧬 Vector API: ${collaborationStatus.vector ? '✅ Actief voor embeddings' : '❌ ONTBREEKT - Voeg toe voor neural search functionaliteit'}`,
        `📊 Match Confidence: ${confidence}% (${
          ('id' in matchedResult && typeof matchedResult.id === 'string' 
            ? (matchedResult as AdvancedSeed).meta.confidence 
            : (matchedResult as EmotionDetection).confidence) > 0.8 
              ? 'Hoog' 
              : ('id' in matchedResult && typeof matchedResult.id === 'string' 
                  ? (matchedResult as AdvancedSeed).meta.confidence 
                  : (matchedResult as EmotionDetection).confidence) > 0.6 
                    ? 'Gemiddeld' 
                    : 'Laag'
        })`,
        secondaryInsights.length > 0 ? `💡 Secondary insights: ${secondaryInsights.slice(0, 2).join(', ')}` : '',
        `📈 Available APIs: ${availableApis}/3 | Risk Level: ${overallRisk.toFixed(1)}%`,
        `🤝 ${collaborationNote.replace(/^\n\n\*\[|\]\*$/g, '')}`
      ].filter(Boolean)
    };
  };

  const createLimitedFunctionalityResponse = (
    userMessage: Message,
    collaborationStatus: CollaborationStatus,
    availableApis: number,
    collaborationNote: string
  ): Message => {
    return {
      id: `ai-limited-enhanced-${Date.now()}`,
      from: "ai",
      label: "Valideren",
      accentColor: getLabelVisuals("Valideren").accentColor,
      content: `Ik begrijp je vraag en probeer je te helpen met de beschikbare APIs. Voor betere responses voeg je de ontbrekende API keys toe in de instellingen.`,
      explainText: `Limited enhanced API collaboration - ${availableApis}/3 APIs available`,
      emotionSeed: null,
      animate: true,
      meta: `Beperkte Enhanced API samenwerking: ${availableApis}/3`,
      brilliant: false,
      timestamp: new Date(),
      replyTo: userMessage.id,
      feedback: null,
      symbolicInferences: [
        `⚠️ API 1 (OpenAI): ${collaborationStatus.api1 ? '✅ Beschikbaar' : '❌ ONTBREEKT - Voeg toe voor betere neural responses'}`,
        `⚠️ API 2 (Secondary): ${collaborationStatus.api2 ? '✅ Beschikbaar' : '❌ ONTBREEKT - Voeg toe voor enhanced analyse'}`,
        `⚠️ Vector API: ${collaborationStatus.vector ? '✅ Beschikbaar' : '❌ ONTBREEKT - Voeg toe voor neural search functionaliteit'}`,
        `📊 Functionaliteit: ${Math.round((availableApis / 3) * 100)}% van volledige capaciteit beschikbaar`,
        `💡 Verbetering: Voeg ${3 - availableApis} ontbrekende API key${3 - availableApis > 1 ? 's' : ''} toe voor volledige functionaliteit`,
        `🎯 Current Performance: Basis response generation mogelijk`,
        `⚠️ ${collaborationNote.replace(/^\n\n\*\[|\]\*$/g, '')}`
      ]
    };
  };

  const createErrorResponse = (userMessage: Message, errorMessage: string): Message => {
    return {
      id: `ai-enhanced-error-${Date.now()}`,
      from: "ai",
      label: "Fout",
      content: errorMessage,
      emotionSeed: "error",
      animate: true,
      timestamp: new Date(),
      accentColor: getLabelVisuals("Fout").accentColor,
      brilliant: false,
      replyTo: userMessage.id,
      feedback: null,
      symbolicInferences: [
        `❌ Enhanced Error: ${errorMessage}`,
        `🔧 Troubleshooting: Check alle API keys in instellingen`,
        `🌐 Network: Controleer internetverbinding`,
        `🔄 Retry: Probeer opnieuw na het oplossen van de configuratie`,
        `❌ ENHANCED API COLLABORATION ERROR: Controleer je API keys en netwerkverbinding`
      ]
    };
  };

  return {
    createSuccessfulAiResponse,
    createLimitedFunctionalityResponse,
    createErrorResponse
  };
}
