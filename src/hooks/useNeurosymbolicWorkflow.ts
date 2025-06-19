
import { useState } from 'react';
import { useVectorEmbeddings } from './useVectorEmbeddings';
import { useHybridDecisionEngine } from './useHybridDecisionEngine';
import { useSelfReflection } from './useSelfReflection';
import { useSeeds } from './useSeeds';
import { AdvancedSeed } from '../types/seed';
import { Message } from '../types';

export interface NeurosymbolicResult {
  response: string;
  confidence: number;
  responseType: 'symbolic' | 'neural' | 'hybrid' | 'generated';
  reasoning: string;
  metadata: Record<string, any>;
  seed?: AdvancedSeed;
  processingTime: number;
}

export function useNeurosymbolicWorkflow() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { searchSimilar, processAndStore } = useVectorEmbeddings();
  const { processHybridDecision } = useHybridDecisionEngine();
  const { executeReflection } = useSelfReflection();
  const { data: seeds } = useSeeds();

  const processInput = async (
    input: string,
    apiKey: string,
    vectorApiKey: string,
    context: {
      messages?: Message[];
      userId?: string;
      conversationId?: string;
    } = {}
  ): Promise<NeurosymbolicResult> => {
    setIsProcessing(true);
    const startTime = Date.now();
    
    console.log('🚀 NEUROSYMBOLIC WORKFLOW ACTIVATED');
    console.log('📝 Input:', input.substring(0, 100));

    try {
      // Step 1: Store input embedding for future learning (with better error handling)
      const inputId = crypto.randomUUID(); // Use proper UUID
      try {
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
        console.log('✅ Input embedding stored');
      } catch (embeddingError) {
        console.error('⚠️ Failed to store input embedding:', embeddingError);
        // Continue without vector storage
      }

      // Step 2: Neural similarity search (with better error handling)
      console.log('🧠 Performing neural similarity search...');
      let similarities = [];
      try {
        similarities = await searchSimilar(input, vectorApiKey, 0.6, 8);
        console.log(`🎯 Found ${similarities.length} neural similarities`);
      } catch (neuralError) {
        console.error('⚠️ Neural search failed:', neuralError);
        // Continue with symbolic-only approach
      }

      // Step 3: Hybrid decision making (with randomization to prevent loops)
      console.log('⚖️ Making hybrid decision...');
      const activeSeeds = seeds?.filter(s => s.isActive) || [];
      
      // Add timestamp and randomization to context to prevent identical responses
      const enhancedContext = {
        ...context,
        timestamp: Date.now(),
        randomSeed: Math.random(),
        sessionId: crypto.randomUUID(),
      };
      
      const hybridDecision = await processHybridDecision(
        input,
        activeSeeds,
        similarities,
        enhancedContext
      );

      console.log(`✅ Decision: ${hybridDecision.responseType} (${(hybridDecision.confidence * 100).toFixed(1)}%)`);

      // Step 4: Self-reflection trigger check (background with error handling)
      if (context.messages && context.messages.length > 0) {
        console.log('🤔 Checking for reflection triggers...');
        setTimeout(async () => {
          try {
            const reflection = await executeReflection(
              context.messages || [],
              [], // Would include recent decisions from logs
              apiKey
            );
            
            if (reflection.insights.length > 0) {
              console.log(`💡 Self-reflection generated ${reflection.insights.length} insights`);
            }
          } catch (reflectionError) {
            console.error('⚠️ Self-reflection failed:', reflectionError);
          }
        }, 1000); // Run in background
      }

      const processingTime = Date.now() - startTime;
      console.log(`⚡ Neurosymbolic processing completed in ${processingTime}ms`);

      return {
        response: hybridDecision.selectedResponse,
        confidence: hybridDecision.confidence,
        responseType: hybridDecision.responseType,
        reasoning: hybridDecision.reasoning,
        metadata: {
          ...hybridDecision.metadata,
          symbolicContribution: hybridDecision.symbolicContribution,
          neuralContribution: hybridDecision.neuralContribution,
          neuralSimilarities: similarities.length,
          symbolicsMatches: activeSeeds.length,
          processingTime,
          sessionTimestamp: startTime,
        },
        seed: hybridDecision.seed,
        processingTime,
      };

    } catch (error) {
      console.error('❌ Neurosymbolic workflow failed:', error);
      
      // Fallback to varied basic responses to prevent loops
      const timestamp = Date.now();
      const randomIndex = Math.floor(Math.random() * 5);
      const fallbackResponses = [
        'Ik begrijp dat je hulp zoekt. Kun je me meer vertellen over hoe je je voelt?',
        'Dank je voor het delen. Wat speelt er het meest voor je op dit moment?',
        'Ik hoor je. Kun je me wat meer context geven over je situatie?',
        'Het klinkt alsof er iets belangrijks speelt. Vertel me er meer over.',
        'Ik ben hier om te luisteren. Wat zou het meest helpend zijn om te bespreken?'
      ];
      
      return {
        response: fallbackResponses[randomIndex],
        confidence: 0.3,
        responseType: 'generated',
        reasoning: `Fallback due to workflow error (variant ${randomIndex})`,
        metadata: { 
          error: error.message, 
          fallback: true, 
          fallbackIndex: randomIndex,
          timestamp,
        },
        processingTime: Date.now() - startTime,
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
