
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

      // Step 3: API Key 2 Secondary Analysis (IMPROVED VALIDATION)
      let secondaryInsights: string[] = [];
      if (context.secondaryApiKey && context.secondaryApiKey.trim().length > 0) {
        console.log('🔑 API Key 2 available, starting secondary analysis...');
        try {
          secondaryInsights = await performSecondaryAnalysis(
            input,
            context.messages,
            context.secondaryApiKey
          );
          
          if (secondaryInsights && secondaryInsights.length > 0) {
            apiCollaboration.api2Used = true;
            apiCollaboration.secondaryAnalysis = true;
            console.log('✅ API Key 2 secondary analysis SUCCESS:', secondaryInsights.length, 'insights generated');
          } else {
            console.warn('⚠️ API Key 2 returned empty insights');
          }
        } catch (secondaryError) {
          console.error('❌ API Key 2 analysis FAILED:', secondaryError);
          console.error('❌ API Key 2 error details:', {
            hasKey: !!context.secondaryApiKey,
            keyLength: context.secondaryApiKey?.length || 0,
            errorMessage: secondaryError instanceof Error ? secondaryError.message : 'Unknown error'
          });
        }
      } else {
        console.warn('⚠️ API Key 2 not available or empty - skipping secondary analysis');
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
            console.log('✅ API Key 1 seed injection SUCCESS:', newlyGeneratedSeed.emotion);
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

      // ENHANCED LOGGING FOR API 2 DEBUG
      console.log('🔍 API 2 DEBUG INFO:', {
        api2KeyProvided: !!context.secondaryApiKey,
        api2KeyLength: context.secondaryApiKey?.length || 0,
        api2Used: apiCollaboration.api2Used,
        secondaryAnalysisSuccess: apiCollaboration.secondaryAnalysis,
        insightsGenerated: secondaryInsights.length,
        insightsPreview: secondaryInsights.slice(0, 2)
      });

      return {
        hybridDecision,
        processingTime,
        seedInjectionUsed,
        newlyGeneratedSeed,
        secondaryInsights,
        apiCollaboration
      };

    } catch (error) {
      console.error('❌ Enhanced neurosymbolic workflow failed:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    orchestrateWorkflow,
    isProcessing
  };
}
