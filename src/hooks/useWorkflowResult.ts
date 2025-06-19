
import { AdvancedSeed } from '../types/seed';
import { HybridDecision } from './useDecisionMaking';
import type { ApiCollaborationConfig } from './useApiCollaboration';

export interface NeurosymbolicResult {
  response: string;
  confidence: number;
  responseType: 'symbolic' | 'neural' | 'hybrid' | 'generated' | 'ai_injected';
  reasoning: string;
  metadata: Record<string, any>;
  seed?: AdvancedSeed;
  processingTime: number;
  seedInjectionUsed?: boolean;
  apiCollaboration?: ApiCollaborationConfig;
}

export function useWorkflowResult() {
  const buildNeurosymbolicResult = (
    hybridDecision: HybridDecision,
    processingTime: number,
    seedInjectionUsed: boolean,
    newlyGeneratedSeed: AdvancedSeed | null,
    secondaryInsights: string[],
    apiCollaboration: ApiCollaborationConfig
  ): NeurosymbolicResult => {
    // If we injected a seed and it was selected, mark response type appropriately
    let finalResponseType: NeurosymbolicResult['responseType'] = hybridDecision.responseType;
    if (seedInjectionUsed && hybridDecision.seed?.id === newlyGeneratedSeed?.id) {
      finalResponseType = 'ai_injected';
      console.log('🎯 NEWLY INJECTED SEED WAS SELECTED FOR RESPONSE!');
    }

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
  };

  const buildFallbackResult = (
    error: Error,
    processingTime: number,
    apiCollaboration: ApiCollaborationConfig
  ): NeurosymbolicResult => {
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
      processingTime,
      seedInjectionUsed: false,
      apiCollaboration
    };
  };

  return {
    buildNeurosymbolicResult,
    buildFallbackResult
  };
}
