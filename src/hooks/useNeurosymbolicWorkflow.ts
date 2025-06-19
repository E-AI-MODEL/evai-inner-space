import { useState } from 'react';
import { useVectorEmbeddings } from './useVectorEmbeddings';
import { useHybridDecisionEngine } from './useHybridDecisionEngine';
import { useSelfReflection } from './useSelfReflection';
import { useOpenAISeedGenerator } from './useOpenAISeedGenerator';
import { useOpenAISecondary } from './useOpenAISecondary';
import { useSeeds } from './useSeeds';
import { AdvancedSeed } from '../types/seed';
import { Message } from '../types';

export interface NeurosymbolicResult {
  response: string;
  confidence: number;
  responseType: 'symbolic' | 'neural' | 'hybrid' | 'generated' | 'ai_injected';
  reasoning: string;
  metadata: Record<string, any>;
  seed?: AdvancedSeed;
  processingTime: number;
  seedInjectionUsed?: boolean;
  apiCollaboration?: {
    api1Used: boolean;
    api2Used: boolean;
    seedGenerated?: boolean;
    secondaryAnalysis?: boolean;
  };
}

export function useNeurosymbolicWorkflow() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { searchSimilar, processAndStore } = useVectorEmbeddings();
  const { processHybridDecision } = useHybridDecisionEngine();
  const { executeReflection } = useSelfReflection();
  const { generateSeed, analyzeConversationForSeeds, injectSeedToDatabase } = useOpenAISeedGenerator();
  const { analyzeNeurosymbolic, generateSeed: generateSecondarySeeds } = useOpenAISecondary();
  const { data: seeds, refetch: refetchSeeds } = useSeeds();

  const processInput = async (
    input: string,
    apiKey: string,
    vectorApiKey: string,
    context: {
      messages?: Message[];
      userId?: string;
      conversationId?: string;
      secondaryApiKey?: string; // API Key 2
    } = {}
  ): Promise<NeurosymbolicResult> => {
    setIsProcessing(true);
    const startTime = Date.now();
    
    console.log('🚀 ENHANCED NEUROSYMBOLIC WORKFLOW ACTIVATED');
    console.log('📝 Input:', input.substring(0, 100));
    console.log('🔑 API Keys collaboration:', { 
      hasApiKey1: !!apiKey, 
      hasApiKey2: !!context.secondaryApiKey,
      hasVectorKey: !!vectorApiKey 
    });

    const apiCollaboration = {
      api1Used: false,
      api2Used: false,
      seedGenerated: false,
      secondaryAnalysis: false
    };

    try {
      // Step 1: Store input embedding
      const inputId = crypto.randomUUID();
      try {
        console.log('💾 Storing input embedding...');
        await processAndStore(
          inputId,
          'message',
          input,
          vectorApiKey,
          {
            type: 'user_input',
            userId: context.userId,
            conversationId: context.conversationId || crypto.randomUUID(),
            timestamp: new Date().toISOString(),
          }
        );
        console.log('✅ Input embedding stored successfully');
      } catch (embeddingError) {
        console.error('⚠️ Failed to store input embedding:', embeddingError);
      }

      // Step 2: Neural similarity search
      console.log('🧠 Performing neural similarity search...');
      let similarities = [];
      try {
        if (vectorApiKey?.trim()) {
          similarities = await searchSimilar(input, vectorApiKey, 0.6, 8);
          console.log(`🎯 Found ${similarities.length} neural similarities`);
        }
      } catch (neuralError) {
        console.error('⚠️ Neural search failed:', neuralError);
      }

      // Step 3: API Key 2 Secondary Analysis (if available)
      let secondaryInsights: string[] = [];
      if (context.secondaryApiKey?.trim()) {
        try {
          console.log('🔍 Running API Key 2 secondary analysis...');
          const conversationContext = context.messages 
            ? context.messages.map(m => `${m.from}: ${m.content}`).join('\n')
            : 'Nieuwe conversatie';
          
          const secondaryAnalysis = await analyzeNeurosymbolic(
            input, 
            conversationContext, 
            context.secondaryApiKey
          );
          
          if (secondaryAnalysis) {
            secondaryInsights = [
              ...secondaryAnalysis.patterns,
              ...secondaryAnalysis.insights
            ];
            apiCollaboration.api2Used = true;
            apiCollaboration.secondaryAnalysis = true;
            console.log('✅ API Key 2 analysis completed:', secondaryInsights);
          }
        } catch (secondaryError) {
          console.error('⚠️ API Key 2 analysis failed:', secondaryError);
        }
      }

      // Step 4: Check for seed injection opportunity
      const activeSeeds = seeds?.filter(s => s.isActive) || [];
      let seedInjectionUsed = false;
      let newlyGeneratedSeed: AdvancedSeed | null = null;

      // Detect if we need new seeds based on low matches or API 2 suggestions
      const shouldInjectSeed = activeSeeds.length < 5 || 
        similarities.length < 2 || 
        secondaryInsights.some(insight => insight.includes('nieuwe seed') || insight.includes('ontbrekende emotie'));

      if (shouldInjectSeed && apiKey?.trim()) {
        try {
          console.log('🌱 SEED INJECTION ACTIVATED - Generating new seed...');
          
          // Extract dominant emotion from input for seed generation
          const emotionalKeywords = input.toLowerCase().match(/(angst|stress|verdriet|eenzaam|boos|blij|teleurgesteld|gefrustreerd|onzeker|moe|overweldigd)/g);
          const detectedEmotion = emotionalKeywords?.[0] || 'ondersteuning';
          
          const generationRequest = {
            emotion: detectedEmotion,
            context: `Neurosymbolic workflow detected: ${input.substring(0, 100)}`,
            severity: secondaryInsights.some(i => i.includes('hoog') || i.includes('kritiek')) ? 'high' as const : 'medium' as const,
            conversationHistory: context.messages?.slice(-3).map(m => m.content) || []
          };

          console.log('🎯 Generating seed for:', generationRequest);
          newlyGeneratedSeed = await generateSeed(generationRequest, apiKey);
          
          if (newlyGeneratedSeed) {
            console.log('✅ New seed generated:', newlyGeneratedSeed.emotion);
            const injected = await injectSeedToDatabase(newlyGeneratedSeed);
            
            if (injected) {
              seedInjectionUsed = true;
              apiCollaboration.api1Used = true;
              apiCollaboration.seedGenerated = true;
              
              // Refresh seeds to include the new one
              await refetchSeeds();
              console.log('🚀 SEED SUCCESSFULLY INJECTED INTO DATABASE');
            }
          }
        } catch (seedError) {
          console.error('🔴 Seed injection failed:', seedError);
        }
      }

      // Step 5: Enhanced hybrid decision with injected seed and secondary insights
      console.log('⚖️ Making enhanced hybrid decision...');
      const updatedSeeds = newlyGeneratedSeed 
        ? [...activeSeeds, newlyGeneratedSeed]
        : activeSeeds;
      
      console.log(`🌱 Seeds available for decision: ${updatedSeeds.length} (${newlyGeneratedSeed ? 'including newly injected' : 'existing only'})`);
      
      const enhancedContext = {
        ...context,
        timestamp: Date.now(),
        randomSeed: Math.random(),
        sessionId: crypto.randomUUID(),
        secondaryInsights,
        seedInjectionUsed,
        newSeedEmotion: newlyGeneratedSeed?.emotion
      };
      
      const hybridDecision = await processHybridDecision(
        input,
        updatedSeeds,
        similarities,
        enhancedContext
      );

      console.log(`✅ Enhanced Decision: ${hybridDecision.responseType} (${(hybridDecision.confidence * 100).toFixed(1)}%)`);
      
      // If we injected a seed and it was selected, mark response type appropriately
      let finalResponseType: NeurosymbolicResult['responseType'] = hybridDecision.responseType;
      if (seedInjectionUsed && hybridDecision.seed?.id === newlyGeneratedSeed?.id) {
        finalResponseType = 'ai_injected';
        console.log('🎯 NEWLY INJECTED SEED WAS SELECTED FOR RESPONSE!');
      }

      // Step 6: Background self-reflection
      if (context.messages && context.messages.length > 0) {
        console.log('🤔 Triggering background self-reflection...');
        setTimeout(async () => {
          try {
            await executeReflection(
              context.messages || [],
              [],
              apiKey
            );
          } catch (reflectionError) {
            console.error('⚠️ Self-reflection failed:', reflectionError);
          }
        }, 1000);
      }

      const processingTime = Date.now() - startTime;
      console.log(`⚡ Enhanced neurosymbolic processing completed in ${processingTime}ms`);
      console.log('🤝 API Collaboration Summary:', apiCollaboration);

      return {
        response: hybridDecision.selectedResponse,
        confidence: hybridDecision.confidence,
        responseType: finalResponseType,
        reasoning: `${hybridDecision.reasoning}${seedInjectionUsed ? ' [NEW SEED INJECTED]' : ''}${apiCollaboration.api2Used ? ' [API-2 ENHANCED]' : ''}`,
        metadata: {
          ...hybridDecision.metadata,
          secondaryInsights,
          seedInjectionUsed,
          newlyGeneratedSeedId: newlyGeneratedSeed?.id,
          processingTime,
          apiCollaboration,
          enhancedWorkflow: true
        },
        seed: hybridDecision.seed,
        processingTime,
        seedInjectionUsed,
        apiCollaboration
      };

    } catch (error) {
      console.error('❌ Enhanced neurosymbolic workflow failed:', error);
      
      const timestamp = Date.now();
      const randomIndex = Math.floor(Math.random() * 3);
      const fallbackResponses = [
        'Ik begrijp dat je hulp zoekt. Laat me proberen je beter te ondersteunen.',
        'Dank je voor het delen. Ik werk aan het verbeteren van mijn response.',
        'Ik luister naar je. Kun je me wat meer vertellen over je situatie?'
      ];
      
      return {
        response: fallbackResponses[randomIndex],
        confidence: 0.3,
        responseType: 'generated',
        reasoning: `Enhanced workflow error: ${error.message} (fallback ${randomIndex})`,
        metadata: { 
          error: error.message, 
          fallback: true, 
          timestamp,
          apiCollaboration
        },
        processingTime: Date.now() - startTime,
        seedInjectionUsed: false,
        apiCollaboration
      };
    } finally {
      setIsProcessing(false);
    }
  };

  const storeConversationEmbedding = async (
    messages: Message[],
    vectorApiKey: string,
    conversationId: string
  ): Promise<void> => {
    try {
      const conversationText = messages
        .slice(-6) // Last 6 messages for context
        .map(m => `${m.from}: ${m.content}`)
        .join('\n');

      // Use proper UUID for conversation ID
      const properConversationId = conversationId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) 
        ? conversationId 
        : crypto.randomUUID();

      await processAndStore(
        properConversationId,
        'conversation',
        conversationText,
        vectorApiKey,
        {
          messageCount: messages.length,
          lastTimestamp: messages[messages.length - 1]?.timestamp,
          dominantEmotions: messages
            .filter(m => m.emotionSeed)
            .map(m => m.emotionSeed)
            .slice(-3),
        }
      );
      
      console.log('✅ Conversation embedding stored');
    } catch (error) {
      console.error('⚠️ Failed to store conversation embedding:', error);
    }
  };

  return {
    processInput,
    storeConversationEmbedding,
    isProcessing,
  };
}
