
import { useState } from 'react';
import { useHybridDecisionEngine } from './useHybridDecisionEngine';
import { useSelfReflection } from './useSelfReflection';
import { useSeeds } from './useSeeds';
import { useApiCollaboration, type ApiCollaborationConfig } from './useApiCollaboration';
import { useEmbeddingProcessor } from './useEmbeddingProcessor';
import { useWorkflowResult, type NeurosymbolicResult } from './useWorkflowResult';
import { Message } from '../types';

export type { NeurosymbolicResult };

export function useNeurosymbolicWorkflow() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { processHybridDecision } = useHybridDecisionEngine();
  const { executeReflection } = useSelfReflection();
  const { data: seeds } = useSeeds();
  const { performSecondaryAnalysis, performSeedInjection } = useApiCollaboration();
  const { storeInputEmbedding, performNeuralSearch, storeConversationEmbedding } = useEmbeddingProcessor();
  const { buildNeurosymbolicResult, buildFallbackResult } = useWorkflowResult();

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

    const apiCollaboration: ApiCollaborationConfig = {
      api1Used: false,
      api2Used: false,
      seedGenerated: false,
      secondaryAnalysis: false
    };

    try {
      // Step 1: Store input embedding
      await storeInputEmbedding(input, vectorApiKey, {
        userId: context.userId,
        conversationId: context.conversationId
      });

      // Step 2: Neural similarity search
      const similarities = await performNeuralSearch(input, vectorApiKey);

      // Step 3: API Key 2 Secondary Analysis (if available)
      let secondaryInsights: string[] = [];
      if (context.secondaryApiKey?.trim()) {
        try {
          secondaryInsights = await performSecondaryAnalysis(
            input,
            context.messages,
            context.secondaryApiKey
          );
          apiCollaboration.api2Used = true;
          apiCollaboration.secondaryAnalysis = true;
        } catch (secondaryError) {
          console.error('⚠️ API Key 2 analysis failed:', secondaryError);
        }
      }

      // Step 4: Check for seed injection opportunity
      const activeSeeds = seeds?.filter(s => s.isActive) || [];
      let newlyGeneratedSeed = null;
      let seedInjectionUsed = false;

      if (apiKey?.trim()) {
        try {
          newlyGeneratedSeed = await performSeedInjection(
            input,
            activeSeeds,
            similarities,
            secondaryInsights,
            context.messages,
            apiKey
          );
          
          if (newlyGeneratedSeed) {
            seedInjectionUsed = true;
            apiCollaboration.api1Used = true;
            apiCollaboration.seedGenerated = true;
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

      return buildNeurosymbolicResult(
        hybridDecision,
        processingTime,
        seedInjectionUsed,
        newlyGeneratedSeed,
        secondaryInsights,
        apiCollaboration
      );

    } catch (error) {
      console.error('❌ Enhanced neurosymbolic workflow failed:', error);
      
      return buildFallbackResult(
        error as Error,
        Date.now() - startTime,
        apiCollaboration
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processInput,
    storeConversationEmbedding,
    isProcessing,
  };
}
