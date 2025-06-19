
import { useOpenAISeedGenerator } from './useOpenAISeedGenerator';
import { useOpenAISecondary } from './useOpenAISecondary';
import { useSeeds } from './useSeeds';
import { AdvancedSeed } from '../types/seed';
import { Message } from '../types';

export interface ApiCollaborationConfig {
  api1Used: boolean;
  api2Used: boolean;
  seedGenerated?: boolean;
  secondaryAnalysis?: boolean;
}

export function useApiCollaboration() {
  const { generateSeed, injectSeedToDatabase } = useOpenAISeedGenerator();
  const { analyzeNeurosymbolic } = useOpenAISecondary();
  const { refetch: refetchSeeds } = useSeeds();

  const performSecondaryAnalysis = async (
    input: string,
    messages: Message[] | undefined,
    secondaryApiKey: string
  ): Promise<string[]> => {
    console.log('🔍 Running API Key 2 secondary analysis...');
    const conversationContext = messages 
      ? messages.map(m => `${m.from}: ${m.content}`).join('\n')
      : 'Nieuwe conversatie';
    
    const secondaryAnalysis = await analyzeNeurosymbolic(
      input, 
      conversationContext, 
      secondaryApiKey
    );
    
    if (secondaryAnalysis) {
      const insights = [
        ...secondaryAnalysis.patterns,
        ...secondaryAnalysis.insights
      ];
      console.log('✅ API Key 2 analysis completed:', insights);
      return insights;
    }
    
    return [];
  };

  const performSeedInjection = async (
    input: string,
    activeSeeds: AdvancedSeed[],
    similarities: any[],
    secondaryInsights: string[],
    messages: Message[] | undefined,
    apiKey: string
  ): Promise<AdvancedSeed | null> => {
    const shouldInjectSeed = activeSeeds.length < 5 || 
      similarities.length < 2 || 
      secondaryInsights.some(insight => insight.includes('nieuwe seed') || insight.includes('ontbrekende emotie'));

    if (!shouldInjectSeed) return null;

    console.log('🌱 SEED INJECTION ACTIVATED - Generating new seed...');
    
    // Extract dominant emotion from input for seed generation
    const emotionalKeywords = input.toLowerCase().match(/(angst|stress|verdriet|eenzaam|boos|blij|teleurgesteld|gefrustreerd|onzeker|moe|overweldigd)/g);
    const detectedEmotion = emotionalKeywords?.[0] || 'ondersteuning';
    
    const generationRequest = {
      emotion: detectedEmotion,
      context: `Neurosymbolic workflow detected: ${input.substring(0, 100)}`,
      severity: secondaryInsights.some(i => i.includes('hoog') || i.includes('kritiek')) ? 'high' as const : 'medium' as const,
      conversationHistory: messages?.slice(-3).map(m => m.content) || []
    };

    console.log('🎯 Generating seed for:', generationRequest);
    const newlyGeneratedSeed = await generateSeed(generationRequest, apiKey);
    
    if (newlyGeneratedSeed) {
      console.log('✅ New seed generated:', newlyGeneratedSeed.emotion);
      const injected = await injectSeedToDatabase(newlyGeneratedSeed);
      
      if (injected) {
        // Refresh seeds to include the new one
        await refetchSeeds();
        console.log('🚀 SEED SUCCESSFULLY INJECTED INTO DATABASE');
        return newlyGeneratedSeed;
      }
    }
    
    return null;
  };

  return {
    performSecondaryAnalysis,
    performSeedInjection
  };
}
