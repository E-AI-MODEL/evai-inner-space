
import { useState } from 'react';
import { useSeeds } from './useSeeds';
import { useEnhancedEvAI56Rubrics } from './useEnhancedEvAI56Rubrics';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Message } from '../types';

export interface CleanWorkflowResult {
  selectedSeed: any;
  rubricsResult: any;
  apiCollaboration: {
    api1Used: boolean;
    api2Used: boolean;
    vectorApiUsed: boolean;
    seedGenerated: boolean;
    secondaryAnalysis: boolean;
  };
  processingTime: number;
  success: boolean;
  errors: string[];
}

export function useCleanWorkflowOrchestrator() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { data: seeds } = useSeeds();
  const { performEnhancedAssessment } = useEnhancedEvAI56Rubrics();
  const { user } = useAuth();

  const orchestrateCleanWorkflow = async (
    input: string,
    context: {
      messages?: Message[];
      conversationId?: string;
      processingMode?: 'strict' | 'balanced' | 'flexible';
    } = {}
  ): Promise<CleanWorkflowResult> => {
    setIsProcessing(true);
    const startTime = Date.now();
    const conversationId = context.conversationId || crypto.randomUUID();
    const errors: string[] = [];
    
    console.log('🔄 Clean Workflow Starting:', { input: input.substring(0, 100), conversationId });

    const apiCollaboration = {
      api1Used: false,
      api2Used: false,
      vectorApiUsed: false,
      seedGenerated: false,
      secondaryAnalysis: false
    };

    try {
      // Step 1: Enhanced Rubrics Assessment
      console.log('📊 Step 1: Enhanced Rubrics Assessment');
      const rubricsResult = await performEnhancedAssessment(
        input, 
        conversationId,
        context.processingMode || 'balanced'
      );

      // Step 2: Clean Seed Selection (based on rubrics)
      console.log('🌱 Step 2: Clean Seed Selection');
      let selectedSeed = null;
      
      if (seeds && seeds.length > 0 && rubricsResult.assessments.length > 0) {
        // Match seeds to dominant rubric pattern
        const dominantRubric = rubricsResult.dominantPattern;
        
        // Find seeds that match the dominant pattern
        const matchingSeeds = seeds.filter(seed => {
          const seedEmotion = seed.emotion.toLowerCase();
          const seedTriggers = seed.triggers || [];
          
          // Check if seed emotion or triggers relate to the dominant pattern
          const isEmotionMatch = dominantRubric.includes(seedEmotion) || 
                                seedEmotion.includes(dominantRubric);
          const isTriggerMatch = seedTriggers.some(trigger => 
            input.toLowerCase().includes(trigger.toLowerCase())
          );
          
          return isEmotionMatch || isTriggerMatch;
        });

        if (matchingSeeds.length > 0) {
          // Select the highest weighted matching seed
          selectedSeed = matchingSeeds.reduce((prev, current) => 
            (current.meta?.weight || 0) > (prev.meta?.weight || 0) ? current : prev
          );
          
          console.log('✅ Clean seed selected:', selectedSeed.emotion);
        } else {
          // Fallback to highest confidence seed
          selectedSeed = seeds.reduce((prev, current) => 
            (current.meta?.confidence || 0) > (prev.meta?.confidence || 0) ? current : prev
          );
          
          console.log('⚠️ Fallback seed selected:', selectedSeed?.emotion);
        }
      }

      // Step 3: Log the clean workflow
      const processingTime = Date.now() - startTime;
      
      if (user) {
        try {
          await supabase.rpc('log_evai_workflow', {
            p_user_id: user.id,
            p_conversation_id: conversationId,
            p_workflow_type: 'clean_enhanced',
            p_api_collaboration: apiCollaboration,
            p_rubrics_data: {
              overallRisk: rubricsResult.overallRisk,
              overallProtective: rubricsResult.overallProtective,
              dominantPattern: rubricsResult.dominantPattern,
              assessmentCount: rubricsResult.assessments.length
            },
            p_processing_time: processingTime,
            p_success: true
          });
          
          console.log('📝 Workflow logged successfully');
        } catch (logError) {
          console.error('❌ Failed to log workflow:', logError);
          errors.push('Logging failed');
        }
      }

      const result: CleanWorkflowResult = {
        selectedSeed,
        rubricsResult,
        apiCollaboration,
        processingTime,
        success: errors.length === 0,
        errors
      };

      console.log('✅ Clean Workflow Complete:', {
        selectedSeed: selectedSeed?.emotion,
        riskScore: rubricsResult.overallRisk,
        processingTime
      });

      return result;

    } catch (error) {
      console.error('❌ Clean workflow failed:', error);
      errors.push(error.message || 'Unknown error');

      return {
        selectedSeed: null,
        rubricsResult: null,
        apiCollaboration,
        processingTime: Date.now() - startTime,
        success: false,
        errors
      };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    orchestrateCleanWorkflow,
    isProcessing
  };
}
