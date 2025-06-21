
import { useState } from 'react';
import { useSeeds } from './useSeeds';
import { useApiCollaboration, type ApiCollaborationConfig } from './useApiCollaboration';
import { useEmbeddingProcessor } from './useEmbeddingProcessor';
import { useHybridDecisionEngine } from './useHybridDecisionEngine';
import { useSelfReflection } from './useSelfReflection';
import { Message } from '../types';

export function useWorkflowOrchestrator() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { processHybridDecision } = useHybridDecisionEngine();
  const { executeReflection } = useSelfReflection();
  const { data: seeds } = useSeeds();
  const { performSecondaryAnalysis, performSeedInjection } = useApiCollaboration();
  const { storeInputEmbedding, performNeuralSearch } = useEmbeddingProcessor();

  const orchestrateWorkflow = async (
    input: string,
    apiKey: string,
    vectorApiKey: string,
    context: {
      messages?: Message[];
      userId?: string;
      conversationId?: string;
      secondaryApiKey?: string;
    } = {}
  ) => {
    setIsProcessing(true);
    const startTime = Date.now();

    const apiCollaboration: ApiCollaborationConfig = {
      api1Used: false,
      api2Used: false,
      seedGenerated: false,
      secondaryAnalysis: false
    };

    try {
      // Step 1: Store input embedding (silent)
      if (vectorApiKey?.trim()) {
        try {
          await storeInputEmbedding(input, vectorApiKey, {
            userId: context.userId,
            conversationId: context.conversationId
          });
        } catch (error) {
          // Silent fail - no console spam
        }
      }

      // Step 2: Neural similarity search (silent)
      let similarities: any[] = [];
      if (vectorApiKey?.trim()) {
        try {
          similarities = await performNeuralSearch(input, vectorApiKey);
        } catch (error) {
          // Silent fail
        }
      }

      // Step 3: API Key 2 Secondary Analysis (clean validation)
      let secondaryInsights: string[] = [];
      if (context.secondaryApiKey?.trim() && context.secondaryApiKey.startsWith('sk-')) {
        try {
          secondaryInsights = await performSecondaryAnalysis(
            input,
            context.messages,
            context.secondaryApiKey
          );
          
          if (secondaryInsights.length > 0) {
            apiCollaboration.api2Used = true;
            apiCollaboration.secondaryAnalysis = true;
          }
        } catch (error) {
          // Silent secondary analysis failure
        }
      }

      // Step 4: Seed injection (clean)
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
        } catch (error) {
          // Silent seed injection failure
        }
      }

      // Step 5: Enhanced hybrid decision with clean inputs
      const updatedSeeds = newlyGeneratedSeed 
        ? [...activeSeeds, newlyGeneratedSeed]
        : activeSeeds;
      
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

      // Step 6: Background self-reflection (silent)
      if (context.messages && context.messages.length > 0) {
        setTimeout(async () => {
          try {
            await executeReflection(
              context.messages || [],
              [],
              apiKey
            );
          } catch (error) {
            // Silent reflection failure
          }
        }, 1000);
      }

      const processingTime = Date.now() - startTime;

      return {
        hybridDecision,
        processingTime,
        seedInjectionUsed,
        newlyGeneratedSeed,
        secondaryInsights,
        apiCollaboration
      };

    } catch (error) {
      // Clean error handling
      throw new Error('Workflow processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    orchestrateWorkflow,
    isProcessing
  };
}
