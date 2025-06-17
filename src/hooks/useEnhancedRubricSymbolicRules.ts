
import { Message } from '../types';
import { SymbolicRule } from './useSymbolicEngine';
import { useEvAI56Rubrics, RubricAssessment } from './useEvAI56Rubrics';
import { useInsightGenerator } from './useInsightGenerator';

export function useEnhancedRubricSymbolicRules() {
  const { assessMessage, getRubricById, calculateOverallRisk } = useEvAI56Rubrics();

  const enhancedRubricBasedRules: SymbolicRule[] = [
    {
      name: "PersonalizedEmotionalInsight",
      description: "Genereert gepersonaliseerde emotionele inzichten op basis van gebruikerspatronen",
      check: (messages, latest) => {
        if (latest.from !== "user") return null;
        const assessments = assessMessage(latest.content);
        
        // Find dominant patterns in this message
        const dominantAssessment = assessments.reduce((prev, current) => 
          current.overallScore > prev.overallScore ? current : prev, assessments[0]);
        
        if (!dominantAssessment) return null;
        
        const rubric = getRubricById(dominantAssessment.rubricId);
        if (!rubric) return null;

        // Generate personalized insights based on the context
        if (dominantAssessment.riskScore > dominantAssessment.protectiveScore) {
          return `💡 Je ervaart uitdagingen in ${rubric.name.toLowerCase()}. ${rubric.interventions[0] || 'Overweeg professionele ondersteuning.'} Wat zou voor jou het meest helpende eerste stapje zijn?`;
        } else if (dominantAssessment.protectiveScore >= 2) {
          return `✨ Je toont sterke ${rubric.name.toLowerCase()}! Dit is een waardevolle beschermende factor. Hoe zou je deze kracht kunnen inzetten bij andere uitdagingen?`;
        }
        
        return null;
      }
    },
    {
      name: "ContextualGrowthSuggestion",
      description: "Biedt contextgevoelige groeivoorstellen gebaseerd op gebruikershistorie",
      check: (messages, latest) => {
        if (latest.from !== "user" || messages.length < 3) return null;
        
        const recentUserMessages = messages
          .filter(msg => msg.from === "user")
          .slice(-3);
        
        const allRecentAssessments = recentUserMessages.flatMap(msg => assessMessage(msg.content));
        const rubricPatterns = new Map<string, number>();
        
        allRecentAssessments.forEach(assessment => {
          const current = rubricPatterns.get(assessment.rubricId) || 0;
          rubricPatterns.set(assessment.rubricId, current + assessment.riskScore);
        });
        
        // Find recurring challenging pattern
        const recurringChallenge = Array.from(rubricPatterns.entries())
          .filter(([_, score]) => score >= 4) // High cumulative risk
          .sort((a, b) => b[1] - a[1])[0];
        
        if (recurringChallenge) {
          const rubric = getRubricById(recurringChallenge[0]);
          if (rubric) {
            return `🎯 Ik zie dat ${rubric.name.toLowerCase()} een terugkerend thema is voor je. Zou je willen verkennen wat voor jou de meest effectieve aanpak zou zijn om hiermee om te gaan?`;
          }
        }
        
        return null;
      }
    },
    {
      name: "ProgressRecognition",
      description: "Erkent vooruitgang en moedigt de gebruiker aan",
      check: (messages, latest) => {
        if (latest.from !== "user" || messages.length < 6) return null;
        
        const userMessages = messages.filter(msg => msg.from === "user");
        const recentMessages = userMessages.slice(-3);
        const earlierMessages = userMessages.slice(-6, -3);
        
        const recentAssessments = recentMessages.flatMap(msg => assessMessage(msg.content));
        const earlierAssessments = earlierMessages.flatMap(msg => assessMessage(msg.content));
        
        if (recentAssessments.length === 0 || earlierAssessments.length === 0) return null;
        
        const recentRisk = calculateOverallRisk(recentAssessments);
        const earlierRisk = calculateOverallRisk(earlierAssessments);
        
        const improvement = earlierRisk - recentRisk;
        
        if (improvement > 15) {
          return `🌟 Wat mooi om te zien hoe je groeit! Je recente berichten tonen een duidelijke verbetering in je emotionele toestand. Wat heeft je geholpen om deze vooruitgang te maken?`;
        }
        
        return null;
      }
    },
    {
      name: "StrengthBasedIntervention",
      description: "Gebruikt geïdentificeerde sterke punten voor interventievoorstellen",
      check: (messages, latest) => {
        if (latest.from !== "user") return null;
        
        const allUserMessages = messages.filter(msg => msg.from === "user");
        const allAssessments = allUserMessages.flatMap(msg => assessMessage(msg.content));
        
        // Find top strength
        const rubricStrengths = new Map<string, number>();
        allAssessments.forEach(assessment => {
          const current = rubricStrengths.get(assessment.rubricId) || 0;
          rubricStrengths.set(assessment.rubricId, current + assessment.protectiveScore);
        });
        
        const topStrength = Array.from(rubricStrengths.entries())
          .filter(([_, score]) => score >= 4) // Significant protective factors
          .sort((a, b) => b[1] - a[1])[0];
        
        // Find current challenges
        const currentAssessments = assessMessage(latest.content);
        const currentChallenge = currentAssessments.find(a => a.riskScore > a.protectiveScore);
        
        if (topStrength && currentChallenge && topStrength[0] !== currentChallenge.rubricId) {
          const strengthRubric = getRubricById(topStrength[0]);
          const challengeRubric = getRubricById(currentChallenge.rubricId);
          
          if (strengthRubric && challengeRubric) {
            return `💪 Je sterke ${strengthRubric.name.toLowerCase()} zou je kunnen helpen bij ${challengeRubric.name.toLowerCase()}. Hoe zou je je vaardigheden in ${strengthRubric.name.toLowerCase()} kunnen inzetten voor deze uitdaging?`;
          }
        }
        
        return null;
      }
    },
    {
      name: "HolisticWellbeingCheck",
      description: "Voert een holistische check uit en biedt gebalanceerde ondersteuning",
      check: (messages, latest) => {
        if (latest.from !== "user" || messages.length < 4) return null;
        
        const assessments = assessMessage(latest.content);
        const overallRisk = calculateOverallRisk(assessments);
        
        if (overallRisk > 70) {
          return `🤗 Ik zie dat je veel ervaart op dit moment. Onthoud dat het oké is om ondersteuning te zoeken. Wat zou je nu het meeste helpen: praten over wat je voelt, praktische stappen, of gewoon even ademen?`;
        } else if (overallRisk < 20 && assessments.some(a => a.protectiveScore >= 2)) {
          return `🌈 Het lijkt alsof je in een goede emotionele ruimte bent. Wat helpt je om dit gevoel van welzijn te behouden?`;
        }
        
        return null;
      }
    }
  ];

  return { enhancedRubricBasedRules };
}
