
import { Message } from "../types";
import { useSeedInjection } from "./useSeedInjection";
import { useEvAI56Rubrics } from "./useEvAI56Rubrics";
import { useLearningEngine } from "./useLearningEngine";
import { toast } from "@/hooks/use-toast";

export function useAiResponseAdvanced() {
  const { analyzeForInjectionNeeds } = useSeedInjection();
  const { assessMessage } = useEvAI56Rubrics();
  const { learnFromConversation } = useLearningEngine();

  const processAdvancedFeatures = (
    messages: Message[],
    userMessage: Message,
    isSystemReady: boolean
  ) => {
    if (!isSystemReady) return;

    // Analyze for seed injection needs
    analyzeForInjectionNeeds([...messages, userMessage]);

    // Assess message with rubrics
    const rubricAssessments = assessMessage(userMessage.content);
    console.log('Rubric assessments:', rubricAssessments);
    
    // Add rubric insights if any high-risk factors detected
    if (rubricAssessments.length > 0) {
      const highRiskAssessments = rubricAssessments.filter(a => a.overallScore > 1.5);
      if (highRiskAssessments.length > 0) {
        toast({
          title: "Rubric Alert",
          description: `${highRiskAssessments.length} risicofactor(en) gedetecteerd`,
          variant: "destructive"
        });
      }
    }
  };

  const triggerLearning = (
    messages: Message[],
    userMessage: Message,
    aiResponse: Message,
    isSystemReady: boolean
  ) => {
    if (isSystemReady) {
      setTimeout(() => {
        learnFromConversation([...messages, userMessage, aiResponse]);
      }, 1000);
    }
  };

  return {
    processAdvancedFeatures,
    triggerLearning
  };
}
