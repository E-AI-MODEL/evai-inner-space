
import { useState, useCallback } from 'react';
import { NeurosymbolicDecision, ProcessingContext, UnifiedResponse } from '@/types/core';
import { useAdvancedSeedMatcher } from './useAdvancedSeedMatcher';
import type { StrategicBriefing } from '@/types';
import { useOpenAI } from './useOpenAI';
import { useOpenAISecondary } from './useOpenAISecondary';
import { useEvAI56Rubrics } from './useEvAI56Rubrics';
import { useUnifiedDecisionCore } from './useUnifiedDecisionCore';
import { useHybridDecisionEngine } from './useHybridDecisionEngine';
import { supabase } from '@/integrations/supabase/client';
import { ANONYMOUS_SUPER_USER } from './useAuth';

export function useUnifiedDecisionEngine() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastDecision, setLastDecision] = useState<NeurosymbolicDecision | null>(null);
  
  const { matchAdvancedSeed } = useAdvancedSeedMatcher();
  const { detectEmotion } = useOpenAI();
  const { createStrategicBriefing } = useOpenAISecondary();
  const { assessMessage } = useEvAI56Rubrics();
  const { searchUnifiedKnowledge } = useUnifiedDecisionCore();
  const { processHybridDecision } = useHybridDecisionEngine();

  const processInput = useCallback(async (
    context: ProcessingContext,
    apiKey?: string,
    apiKey2?: string
  ): Promise<UnifiedResponse> => {
    setIsProcessing(true);
    const startTime = Date.now();
    const componentsUsed: string[] = [];

    try {
      console.log('🧠 Starting unified neurosymbolic processing...');

      // FASE 1: Parallelle Input Analyse
      const [rubricAssessments, knowledgeItems, seedMatch] = await Promise.all([
        // Symbolische Analyse via Rubrics
        Promise.resolve(assessMessage(context.userInput)).then(assessments => {
          if (assessments.length) componentsUsed.push('EvAI56 Rubrics');
          return assessments;
        }),
        
        // Kennisbank Zoekopdracht (Unified Knowledge)
        searchUnifiedKnowledge(
          context.userInput,
          localStorage.getItem('vector-api-key') || apiKey,
          10
        ).then(items => {
          if (items.length) componentsUsed.push('Unified Knowledge Search');
          return items;
        }),
        
        // Advanced Seed Matcher (legacy fallback)
        matchAdvancedSeed?.(context.userInput, apiKey).catch(() => null).then(seed => {
          if (seed) componentsUsed.push('Advanced Seed Matcher');
          return seed;
        })
      ]);

      console.log('📊 Analysis Results:', {
        rubricAssessments: rubricAssessments.length,
        knowledgeItems: knowledgeItems.length,
        seedMatch: !!seedMatch
      });

      // FASE 2: Beslissingssynthese via Hybrid Engine
      let finalResponse: UnifiedResponse;
      
      if (knowledgeItems.length > 0 || rubricAssessments.length > 0) {
        // Gebruik Hybrid Decision Engine voor synthesis
        const hybridDecision = await processHybridDecision(
          context.userInput,
          seedMatch ? [seedMatch] : [],
          knowledgeItems.map(item => ({
            content_id: item.id,
            content_type: item.content_type,
            content_text: item.response_text || '',
            similarity_score: item.similarity_score || 0,
            contextualFit: item.confidence_score,
            metadata: item.metadata
          })),
          {
            rubricAssessments,
            primaryEmotion: knowledgeItems[0]?.emotion || 'neutraal',
            confidence: knowledgeItems[0]?.confidence_score || 0.7
          }
        );

        if (hybridDecision) {
          finalResponse = {
            content: hybridDecision.response,
            emotion: hybridDecision.emotion,
            confidence: hybridDecision.confidence,
            label: hybridDecision.label,
            reasoning: hybridDecision.reasoning,
            symbolicInferences: hybridDecision.symbolicInferences,
            metadata: {
              processingPath: 'hybrid',
              totalProcessingTime: Date.now() - startTime,
              componentsUsed: [...componentsUsed, 'Hybrid Decision Engine']
            }
          };
        } else {
          throw new Error('Hybrid decision failed');
        }
      } else {
        // Fallback naar Neural Engine
        componentsUsed.push('Neural Engine (OpenAI)');
        const neuralResult = await detectEmotion(
          context.userInput,
          apiKey || '',
          undefined,
          context.conversationHistory
        );

        finalResponse = {
          content: neuralResult.response,
          emotion: neuralResult.emotion,
          confidence: neuralResult.confidence,
          label: neuralResult.label || 'Valideren',
          reasoning: neuralResult.reasoning || 'Neurale analyse',
          symbolicInferences: neuralResult.symbolicInferences || [],
          metadata: {
            processingPath: 'neural_fallback',
            totalProcessingTime: Date.now() - startTime,
            componentsUsed
          }
        };
      }

      // FASE 3: Logging voor Transparantie
      await logDecisionContext(context.userInput, {
        rubricAssessments,
        knowledgeItems,
        finalResponse,
        processingTime: Date.now() - startTime,
        componentsUsed
      });

      const processingTime = Date.now() - startTime;
      const decision: NeurosymbolicDecision = {
        type: finalResponse.metadata.processingPath === 'hybrid' ? 'hybrid' : 'neural',
        confidence: finalResponse.confidence,
        reasoning: [finalResponse.reasoning],
        source: 'unified_decision_engine',
        processingTime,
        metadata: {
          processingTime,
          fallbackUsed: finalResponse.metadata.processingPath === 'neural_fallback',
          priority: finalResponse.confidence > 0.8 ? 'high' : 'medium',
          componentsUsed
        }
      };

      setLastDecision(decision);
      console.log(`✅ Unified neurosymbolic processing complete (${processingTime}ms)`);

      return finalResponse;

    } catch (error) {
      console.error('🔴 Unified decision engine failed:', error);
      
      const processingTime = Date.now() - startTime;
      const errorDecision: NeurosymbolicDecision = {
        type: 'neural',
        confidence: 0,
        reasoning: [`Error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        source: 'error_handler',
        processingTime,
        metadata: {
          processingTime,
          fallbackUsed: true,
          priority: 'low',
          componentsUsed: ['Error Handler']
        }
      };
      
      setLastDecision(errorDecision);
      
      return {
        content: 'Ik begrijp je vraag niet helemaal. Kun je het anders formuleren?',
        emotion: 'error',
        confidence: 0,
        label: 'Fout',
        reasoning: 'Processing error occurred',
        symbolicInferences: ['❌ Processing failed'],
        metadata: {
          processingPath: 'error',
          totalProcessingTime: processingTime,
          componentsUsed: ['Error Handler']
        }
      };
    } finally {
      setIsProcessing(false);
    }
  }, [matchAdvancedSeed, detectEmotion, createStrategicBriefing, assessMessage, searchUnifiedKnowledge, processHybridDecision]);

  // Log decision context voor transparantie
  const logDecisionContext = async (userInput: string, context: any) => {
    try {
      await supabase.rpc('log_hybrid_decision', {
        p_user_id: ANONYMOUS_SUPER_USER.id,
        p_user_input: userInput,
        p_symbolic_matches: context.rubricAssessments.map((r: any) => ({
          rubric_id: r.rubricId,
          risk_score: r.riskScore,
          protective_score: r.protectiveScore,
          overall_score: r.overallScore
        })),
        p_neural_similarities: context.knowledgeItems.map((k: any) => ({
          id: k.id,
          content_type: k.content_type,
          emotion: k.emotion,
          confidence: k.confidence_score,
          similarity: k.similarity_score || 0
        })),
        p_hybrid_decision: {
          method: context.finalResponse.metadata.processingPath,
          emotion: context.finalResponse.emotion,
          confidence: context.finalResponse.confidence,
          components_used: context.componentsUsed
        },
        p_final_response: context.finalResponse.content,
        p_confidence_score: context.finalResponse.confidence,
        p_processing_time_ms: context.processingTime
      });
      
      console.log('📝 Decision context logged successfully');
    } catch (error) {
      console.error('❌ Failed to log decision context:', error);
    }
  };

  const getDecisionAnalytics = useCallback(() => {
    return {
      lastDecision,
      isProcessing,
    };
  }, [lastDecision, isProcessing]);

  return {
    processInput,
    isProcessing,
    lastDecision,
    getDecisionAnalytics
  };
}
