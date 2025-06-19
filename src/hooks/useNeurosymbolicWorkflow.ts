
import { useWorkflowOrchestrator } from './useWorkflowOrchestrator';
import { useEmbeddingProcessor } from './useEmbeddingProcessor';
import { useWorkflowResult, type NeurosymbolicResult } from './useWorkflowResult';
import { Message } from '../types';

export type { NeurosymbolicResult };

export function useNeurosymbolicWorkflow() {
  const { orchestrateWorkflow, isProcessing } = useWorkflowOrchestrator();
  const { storeConversationEmbedding } = useEmbeddingProcessor();
  const { buildNeurosymbolicResult, buildFallbackResult } = useWorkflowResult();

  const processInput = async (
    input: string,
    apiKey: string,
    vectorApiKey: string,
    context: {
      messages?: Message[];
      userId?: string;
      conversationId?: string;
      secondaryApiKey?: string;
    } = {}
  ): Promise<NeurosymbolicResult> => {
    try {
      const workflowResult = await orchestrateWorkflow(
        input,
        apiKey,
        vectorApiKey,
        context
      );

      return buildNeurosymbolicResult(
        workflowResult.hybridDecision,
        workflowResult.processingTime,
        workflowResult.seedInjectionUsed,
        workflowResult.newlyGeneratedSeed,
        workflowResult.secondaryInsights,
        workflowResult.apiCollaboration
      );

    } catch (error) {
      return buildFallbackResult(
        error as Error,
        0,
        {
          api1Used: false,
          api2Used: false,
          seedGenerated: false,
          secondaryAnalysis: false
        }
      );
    }
  };

  return {
    processInput,
    storeConversationEmbedding,
    isProcessing,
  };
}
