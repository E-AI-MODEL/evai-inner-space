
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
  vectorApiUsed?: boolean;
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
    // Simplified validation - less noise
    if (!secondaryApiKey?.trim() || !secondaryApiKey.startsWith('sk-')) {
      return [];
    }

    try {
      const conversationContext = messages 
        ? messages.slice(-3).map(m => `${m.from}: ${m.content}`).join('\n')
        : 'Nieuwe conversatie';
      
      const secondaryAnalysis = await analyzeNeurosymbolic(
        input, 
        conversationContext, 
        secondaryApiKey
      );
      
      if (secondaryAnalysis) {
        const insights = [
          ...(secondaryAnalysis.patterns || []),
          ...(secondaryAnalysis.insights || [])
        ].filter(insight => insight && insight.trim().length > 0);
        
        return insights.length > 0 ? insights : ['Secundaire analyse uitgevoerd'];
      }
      
      return ['Secundaire analyse voltooid'];
      
    } catch (error) {
      // Return descriptive error without console spam
      return [`Secundaire analyse fout: ${error instanceof Error ? error.message : 'Onbekende fout'}`];
    }
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

    // Extract dominant emotion from input for seed generation
    const emotionalKeywords = input.toLowerCase().match(/(angst|stress|verdriet|eenzaam|boos|blij|teleurgesteld|gefrustreerd|onzeker|moe|overweldigd)/g);
    const detectedEmotion = emotionalKeywords?.[0] || 'ondersteuning';
    
    const generationRequest = {
      emotion: detectedEmotion,
      context: `Neurosymbolic workflow detected: ${input.substring(0, 100)}`,
      severity: secondaryInsights.some(i => i.includes('hoog') || i.includes('kritiek')) ? 'high' as const : 'medium' as const,
      conversationHistory: messages?.slice(-3).map(m => m.content) || []
    };

    try {
      const newlyGeneratedSeed = await generateSeed(generationRequest, apiKey);
      
      if (newlyGeneratedSeed) {
        const injected = await injectSeedToDatabase(newlyGeneratedSeed);
        
        if (injected) {
          await refetchSeeds();
          return newlyGeneratedSeed;
        }
      }
    } catch (error) {
      // Silent fail for seed generation - no console spam
    }
    
    return null;
  };

  return {
    performSecondaryAnalysis,
    performSeedInjection
  };
}
