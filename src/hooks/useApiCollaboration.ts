
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
    console.log('🔍 API Key 2 Secondary Analysis - ENHANCED VERSION');
    console.log('🔑 API Key 2 validation:', {
      hasKey: !!secondaryApiKey,
      keyLength: secondaryApiKey?.length || 0,
      keyPrefix: secondaryApiKey?.substring(0, 7) || 'none'
    });

    if (!secondaryApiKey || secondaryApiKey.trim().length === 0) {
      console.error('❌ API Key 2 is empty or undefined');
      return [];
    }

    if (!secondaryApiKey.startsWith('sk-')) {
      console.error('❌ API Key 2 appears to be invalid (should start with sk-)');
      return [];
    }

    try {
      const conversationContext = messages 
        ? messages.map(m => `${m.from}: ${m.content}`).join('\n')
        : 'Nieuwe conversatie';
      
      console.log('📤 Sending request to API Key 2...');
      console.log('📝 Input length:', input.length);
      console.log('📝 Context length:', conversationContext.length);
      
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
        
        console.log('✅ API Key 2 analysis SUCCESS:', {
          totalInsights: insights.length,
          patterns: secondaryAnalysis.patterns?.length || 0,
          insights: secondaryAnalysis.insights?.length || 0,
          confidence: secondaryAnalysis.confidence || 0,
          seedSuggestion: secondaryAnalysis.seedSuggestion || 'none'
        });
        
        if (insights.length === 0) {
          console.warn('⚠️ API Key 2 returned no usable insights');
          return ['API Key 2 analyse uitgevoerd maar geen specifieke inzichten gegenereerd'];
        }
        
        return insights;
      } else {
        console.warn('⚠️ API Key 2 returned null/undefined analysis');
        return ['API Key 2 reactie ontvangen maar analyse was leeg'];
      }
      
    } catch (neuralError) {
      console.error('❌ API Key 2 Secondary Analysis FAILED:', neuralError);
      console.error('🔧 API Key 2 Error Details:', {
        errorType: neuralError.constructor.name,
        errorMessage: neuralError.message,
        hasApiKey: !!secondaryApiKey,
        inputLength: input.length,
        stack: neuralError.stack?.substring(0, 200)
      });
      
      // Return a descriptive error message instead of empty array
      return [`API Key 2 fout: ${neuralError.message || 'Onbekende fout bij secondary analysis'}`];
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
