
import { useState } from 'react';
import { useCleanWorkflowOrchestrator } from './useCleanWorkflowOrchestrator';
import { Message } from '../types';

export interface CleanAiResponseResult {
  response: string;
  emotionSeed?: string;
  confidence: number;
  processingTime: number;
  rubricsData?: any;
  success: boolean;
}

export function useCleanAiResponse() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { orchestrateCleanWorkflow } = useCleanWorkflowOrchestrator();

  const generateCleanResponse = async (
    input: string,
    apiKey: string,
    context: {
      messages?: Message[];
      conversationId?: string;
    } = {}
  ): Promise<CleanAiResponseResult> => {
    setIsProcessing(true);
    const startTime = Date.now();
    
    console.log('🎯 Clean AI Response Generation Started');

    try {
      // Step 1: Execute clean workflow
      const workflowResult = await orchestrateCleanWorkflow(input, {
        ...context,
        processingMode: 'balanced'
      });

      if (!workflowResult.success) {
        throw new Error('Workflow failed: ' + workflowResult.errors.join(', '));
      }

      // Step 2: Generate appropriate response
      let response = '';
      let emotionSeed = '';
      let confidence = 0.5;

      if (workflowResult.selectedSeed) {
        // Use seed response
        const seedResponse = workflowResult.selectedSeed.response;
        response = seedResponse?.nl || seedResponse?.default || 
                  'Ik begrijp hoe je je voelt en ben hier om te helpen.';
        emotionSeed = workflowResult.selectedSeed.emotion;
        confidence = workflowResult.selectedSeed.meta?.confidence || 0.8;
        
        console.log('✅ Using seed response:', emotionSeed);
      } else if (workflowResult.rubricsResult?.assessments?.length > 0) {
        // Generate response based on rubrics assessment
        const dominantAssessment = workflowResult.rubricsResult.assessments[0];
        const riskLevel = workflowResult.rubricsResult.overallRisk;
        
        if (riskLevel > 70) {
          response = 'Ik merk dat je door een moeilijke tijd gaat. Het is belangrijk dat je weet dat je niet alleen bent. Overweeg om professionele hulp te zoeken als deze gevoelens aanhouden.';
        } else if (riskLevel > 40) {
          response = 'Ik begrijp dat dit een uitdagende situatie voor je is. Je gevoelens zijn helemaal normaal. Wat helpt jou meestal om met dit soort momenten om te gaan?';
        } else {
          response = 'Dank je voor het delen van je gevoelens. Het is goed dat je hierover praat. Hoe kan ik je het beste ondersteunen?';
        }
        
        emotionSeed = dominantAssessment.rubricId;
        confidence = dominantAssessment.confidenceLevel === 'high' ? 0.9 : 
                    dominantAssessment.confidenceLevel === 'medium' ? 0.7 : 0.5;
                    
        console.log('✅ Using rubrics-based response:', emotionSeed, riskLevel);
      } else {
        // Fallback response
        response = 'Bedankt voor je bericht. Kun je me meer vertellen over hoe je je voelt, zodat ik je beter kan begrijpen en ondersteunen?';
        confidence = 0.3;
        
        console.log('⚠️ Using fallback response');
      }

      const result: CleanAiResponseResult = {
        response,
        emotionSeed,
        confidence,
        processingTime: Date.now() - startTime,
        rubricsData: workflowResult.rubricsResult,
        success: true
      };

      console.log('✅ Clean AI Response Generated:', {
        emotionSeed,
        confidence,
        processingTime: result.processingTime
      });

      return result;

    } catch (error) {
      console.error('❌ Clean AI response generation failed:', error);
      
      return {
        response: 'Ik ondervind momenteel een technisch probleem. Kun je je bericht opnieuw proberen?',
        confidence: 0.1,
        processingTime: Date.now() - startTime,
        success: false
      };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    generateCleanResponse,
    isProcessing
  };
}
