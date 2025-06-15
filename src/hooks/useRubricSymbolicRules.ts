
import { Message } from '../types';
import { SymbolicRule } from './useSymbolicEngine';
import { useEvAI56Rubrics, RubricAssessment } from './useEvAI56Rubrics';

export function useRubricSymbolicRules() {
  const { assessMessage, getRubricById, calculateOverallRisk } = useEvAI56Rubrics();

  const rubricBasedRules: SymbolicRule[] = [
    {
      name: "EmotionalRegulationRisk",
      description: "Detecteert risicofactoren voor emotionele disregulatie",
      check: (messages, latest) => {
        if (latest.from !== "user") return null;
        const assessments = assessMessage(latest.content);
        const emotionalAssessment = assessments.find(a => a.rubricId === "emotional-regulation");
        
        if (emotionalAssessment && emotionalAssessment.overallScore > 2) {
          const rubric = getRubricById("emotional-regulation");
          return `🌡️ Verhoogd risico voor emotionele disregulatie gedetecteerd. Overweeg: ${rubric?.interventions[0]}`;
        }
        return null;
      }
    },
    {
      name: "CopingDeficitAlert",
      description: "Waarschuwt voor inadequate copingstrategieën",
      check: (messages, latest) => {
        if (latest.from !== "user") return null;
        const assessments = assessMessage(latest.content);
        const copingAssessment = assessments.find(a => a.rubricId === "coping-strategies");
        
        if (copingAssessment && copingAssessment.riskScore > copingAssessment.protectiveScore) {
          return `⚠️ Mogelijke inadequate coping gedetecteerd - focus op alternatieve strategieën`;
        }
        return null;
      }
    },
    {
      name: "SocialIsolationRisk",
      description: "Detecteert risico op sociale isolatie",
      check: (messages, latest) => {
        if (latest.from !== "user") return null;
        const assessments = assessMessage(latest.content);
        const socialAssessment = assessments.find(a => a.rubricId === "social-connection");
        
        if (socialAssessment && socialAssessment.riskScore >= 2) {
          return `🤝 Sociale isolatie risico - onderzoek beschikbare sociale ondersteuning`;
        }
        return null;
      }
    },
    {
      name: "MeaningCrisisDetection",
      description: "Detecteert existentiële of betekeniscrisis",
      check: (messages, latest) => {
        if (latest.from !== "user") return null;
        const assessments = assessMessage(latest.content);
        const meaningAssessment = assessments.find(a => a.rubricId === "meaning-purpose");
        
        if (meaningAssessment && meaningAssessment.overallScore > 1.5) {
          return `🎯 Mogelijke betekeniscrisis - exploreer waarden en levensdoelen`;
        }
        return null;
      }
    },
    {
      name: "OverallRiskAlert",
      description: "Berekent overall risicoscore op basis van alle rubrieken",
      check: (messages, latest) => {
        if (latest.from !== "user") return null;
        const assessments = assessMessage(latest.content);
        const overallRisk = calculateOverallRisk(assessments);
        
        if (overallRisk > 60) {
          return `🚨 Hoog risicoprofiel (${Math.round(overallRisk)}%) - overweeg intensievere ondersteuning`;
        } else if (overallRisk > 30) {
          return `⚡ Matig risicoprofiel (${Math.round(overallRisk)}%) - monitoren en preventieve maatregelen`;
        }
        return null;
      }
    },
    {
      name: "ProtectiveFactorsRecognition",
      description: "Erkent en versterkt beschermende factoren",
      check: (messages, latest) => {
        if (latest.from !== "user") return null;
        const assessments = assessMessage(latest.content);
        const totalProtective = assessments.reduce((sum, a) => sum + a.protectiveScore, 0);
        
        if (totalProtective >= 3) {
          return `✨ Sterke beschermende factoren geïdentificeerd - deze kunnen verder ontwikkeld worden`;
        }
        return null;
      }
    }
  ];

  return { rubricBasedRules };
}
