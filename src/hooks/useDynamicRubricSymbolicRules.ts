
import { Message } from '../types';
import { SymbolicRule } from './useSymbolicEngine';
import { useEvAI56Rubrics, RubricAssessment } from './useEvAI56Rubrics';
import { useRubricSettings, RubricStrictnessConfig } from './useRubricSettings';

export function useDynamicRubricSymbolicRules() {
  const { assessMessage, getRubricById, calculateOverallRisk } = useEvAI56Rubrics();
  const { config } = useRubricSettings();

  const createDynamicRubricRules = (settings: RubricStrictnessConfig): SymbolicRule[] => [
    {
      name: "DynamicEmotionalRegulationRisk",
      description: "Detecteert risicofactoren voor emotionele disregulatie met configureerbare drempelwaarden",
      check: (messages, latest) => {
        if (latest.from !== "user") return null;
        
        const assessments = assessMessage(latest.content);
        const emotionalAssessment = assessments.find(a => a.rubricId === "emotional-regulation");
        
        if (emotionalAssessment) {
          const adjustedScore = emotionalAssessment.overallScore * settings.weights.riskMultiplier;
          
          if (adjustedScore > settings.thresholds.interventionTrigger) {
            const rubric = getRubricById("emotional-regulation");
            const severity = adjustedScore > settings.thresholds.riskAlert ? "hoog" : "verhoogd";
            return `🌡️ ${severity.charAt(0).toUpperCase()}${severity.slice(1)} risico voor emotionele disregulatie (${adjustedScore.toFixed(1)}). Overweeg: ${rubric?.interventions[0]}`;
          }
        }
        return null;
      }
    },
    {
      name: "DynamicCopingDeficitAlert",
      description: "Waarschuwt voor inadequate copingstrategieën met aangepaste gevoeligheid",
      check: (messages, latest) => {
        if (latest.from !== "user") return null;
        
        const assessments = assessMessage(latest.content);
        const copingAssessment = assessments.find(a => a.rubricId === "coping-strategies");
        
        if (copingAssessment) {
          const adjustedRiskScore = copingAssessment.riskScore * settings.weights.riskMultiplier;
          const adjustedProtectiveScore = copingAssessment.protectiveScore * settings.weights.protectiveMultiplier;
          
          if (adjustedRiskScore > adjustedProtectiveScore && adjustedRiskScore >= settings.thresholds.interventionTrigger) {
            const severity = adjustedRiskScore > settings.thresholds.riskAlert ? "significante" : "mogelijke";
            return `⚠️ ${severity.charAt(0).toUpperCase()}${severity.slice(1)} inadequate coping gedetecteerd (${adjustedRiskScore.toFixed(1)}) - focus op alternatieve strategieën`;
          }
        }
        return null;
      }
    },
    {
      name: "DynamicSocialIsolationRisk",
      description: "Detecteert risico op sociale isolatie met configureerbare strictheid",
      check: (messages, latest) => {
        if (latest.from !== "user") return null;
        
        const assessments = assessMessage(latest.content);
        const socialAssessment = assessments.find(a => a.rubricId === "social-connection");
        
        if (socialAssessment) {
          const adjustedScore = socialAssessment.riskScore * settings.weights.riskMultiplier;
          
          if (adjustedScore >= settings.thresholds.interventionTrigger) {
            const severity = adjustedScore > settings.thresholds.riskAlert ? "hoog" : "verhoogd";
            return `🤝 ${severity.charAt(0).toUpperCase()}${severity.slice(1)} sociale isolatie risico (${adjustedScore.toFixed(1)}) - onderzoek beschikbare sociale ondersteuning`;
          }
        }
        return null;
      }
    },
    {
      name: "DynamicMeaningCrisisDetection",
      description: "Detecteert existentiële crisis met aangepaste gevoeligheid",
      check: (messages, latest) => {
        if (latest.from !== "user") return null;
        
        const assessments = assessMessage(latest.content);
        const meaningAssessment = assessments.find(a => a.rubricId === "meaning-purpose");
        
        if (meaningAssessment) {
          const adjustedScore = meaningAssessment.overallScore * settings.weights.riskMultiplier;
          
          if (adjustedScore > settings.thresholds.interventionTrigger) {
            const severity = adjustedScore > settings.thresholds.riskAlert ? "diepe" : "mogelijke";
            return `🎯 ${severity.charAt(0).toUpperCase()}${severity.slice(1)} betekeniscrisis (${adjustedScore.toFixed(1)}) - exploreer waarden en levensdoelen`;
          }
        }
        return null;
      }
    },
    {
      name: "DynamicOverallRiskAlert",
      description: "Berekent overall risicoscore met configureerbare drempelwaarden",
      check: (messages, latest) => {
        if (latest.from !== "user") return null;
        
        const assessments = assessMessage(latest.content);
        const overallRisk = calculateOverallRisk(assessments);
        
        if (overallRisk > settings.thresholds.overallRiskHigh) {
          return `🚨 Hoog risicoprofiel (${Math.round(overallRisk)}% | ${settings.level}) - overweeg intensievere ondersteuning`;
        } else if (overallRisk > settings.thresholds.overallRiskModerate) {
          return `⚡ Matig risicoprofiel (${Math.round(overallRisk)}% | ${settings.level}) - monitoren en preventieve maatregelen`;
        }
        return null;
      }
    },
    {
      name: "DynamicProtectiveFactorsRecognition",
      description: "Erkent beschermende factoren met configureerbare minimum waarden",
      check: (messages, latest) => {
        if (latest.from !== "user") return null;
        
        const assessments = assessMessage(latest.content);
        const totalProtective = assessments.reduce((sum, a) => 
          sum + (a.protectiveScore * settings.weights.protectiveMultiplier), 0
        );
        
        if (totalProtective >= settings.thresholds.protectiveFactorsMin) {
          const strength = totalProtective > (settings.thresholds.protectiveFactorsMin * 1.5) ? "uitstekende" : "sterke";
          return `✨ ${strength.charAt(0).toUpperCase()}${strength.slice(1)} beschermende factoren geïdentificeerd (${totalProtective.toFixed(1)}) - deze kunnen verder ontwikkeld worden`;
        }
        return null;
      }
    }
  ];

  return {
    dynamicRubricRules: createDynamicRubricRules(config),
    currentStrictness: config.level,
    currentConfig: config
  };
}
