
export interface EvAI56Rubric {
  id: string;
  name: string;
  description: string;
  category: "emotional" | "cognitive" | "behavioral" | "interpersonal";
  riskFactors: string[];
  protectiveFactors: string[];
  interventions: string[];
  scoreWeights: {
    risk: number;
    protective: number;
  };
}

// EvAI 5.6 Rubrics based on emotional intelligence and therapeutic frameworks
export const evai56Rubrics: EvAI56Rubric[] = [
  {
    id: "emotional-regulation",
    name: "Emotionele Regulatie",
    description: "Vermogen om emoties te herkennen, begrijpen en reguleren",
    category: "emotional",
    riskFactors: [
      "overweldigende emoties", "paniek", "woede uitbarstingen", "emotionele labiliteit",
      "gevoel van verlies van controle", "extreme gevoelens"
    ],
    protectiveFactors: [
      "bewustzijn van emoties", "kunnen benoemen van gevoelens", "zelfregulatie",
      "mindfulness", "ademhalingstechnieken", "emotionele stabiliteit"
    ],
    interventions: [
      "Emotieregulatie technieken aanleren",
      "Mindfulness oefeningen",
      "Cognitieve herstructurering",
      "Grounding technieken"
    ],
    scoreWeights: { risk: 1.2, protective: 0.8 }
  },
  {
    id: "self-awareness",
    name: "Zelfbewustzijn",
    description: "Inzicht in eigen gedachten, gevoelens en gedragingen",
    category: "cognitive",
    riskFactors: [
      "gebrek aan inzicht", "ontkenning", "zelfverwijt", "negatief zelfbeeld",
      "perfectionalisme", "zelfkritiek"
    ],
    protectiveFactors: [
      "zelfkennis", "reflectie", "acceptatie", "realistische zelfperceptie",
      "groei mindset", "zelfcompassie"
    ],
    interventions: [
      "Zelfobservatie opdrachten",
      "Reflectieve gesprekken",
      "Journaling",
      "Metacognitieve training"
    ],
    scoreWeights: { risk: 1.0, protective: 1.0 }
  },
  {
    id: "coping-strategies",
    name: "Copingstrategieën",
    description: "Effectieve strategieën voor omgang met stress en uitdagingen",
    category: "behavioral",
    riskFactors: [
      "vermijding", "ontsnapping", "destructieve coping", "isolatie",
      "zelfmedicatie", "overmatig gebruik"
    ],
    protectiveFactors: [
      "probleemoplossend denken", "hulp zoeken", "sociale steun",
      "gezonde gewoontes", "actieve coping", "adaptabiliteit"
    ],
    interventions: [
      "Copingstrategieën ontwikkelen",
      "Probleemoplossing training",
      "Stressmanagement",
      "Sociale vaardigheden training"
    ],
    scoreWeights: { risk: 1.1, protective: 0.9 }
  },
  {
    id: "social-connection",
    name: "Sociale Verbinding",
    description: "Kwaliteit van relaties en sociale ondersteuning",
    category: "interpersonal",
    riskFactors: [
      "eenzaamheid", "sociale angst", "conflicten", "isolatie",
      "gebrek aan steun", "relationele problemen"
    ],
    protectiveFactors: [
      "ondersteunende relaties", "empathie", "communicatievaardigheden",
      "vertrouwen", "sociale betrokkenheid", "intimiteit"
    ],
    interventions: [
      "Sociale vaardigheden training",
      "Communicatie training",
      "Relatiewerk",
      "Groepstherapie"
    ],
    scoreWeights: { risk: 0.9, protective: 1.1 }
  },
  {
    id: "meaning-purpose",
    name: "Betekenis & Doel",
    description: "Gevoel van richting en betekenis in het leven",
    category: "cognitive",
    riskFactors: [
      "zinloosheid", "leegte", "doelloosheid", "existentiële crisis",
      "gebrek aan motivatie", "hopelessness"
    ],
    protectiveFactors: [
      "levensdoel", "waardenklarheid", "spiritualiteit", "hoop",
      "toekomstvisie", "betekenisvolle activiteiten"
    ],
    interventions: [
      "Waardenverheldering",
      "Doelgerichte planning",
      "Betekenistherapie",
      "Spirituele exploratie"
    ],
    scoreWeights: { risk: 1.0, protective: 1.2 }
  }
];

export interface RubricAssessment {
  rubricId: string;
  riskScore: number;
  protectiveScore: number;
  overallScore: number;
  triggers: string[];
  timestamp: Date;
}

export function useEvAI56Rubrics() {
  const assessMessage = (content: string): RubricAssessment[] => {
    const assessments: RubricAssessment[] = [];
    const lowerContent = content.toLowerCase();

    evai56Rubrics.forEach(rubric => {
      const riskTriggers = rubric.riskFactors.filter(factor => 
        lowerContent.includes(factor.toLowerCase())
      );
      const protectiveTriggers = rubric.protectiveFactors.filter(factor => 
        lowerContent.includes(factor.toLowerCase())
      );

      if (riskTriggers.length > 0 || protectiveTriggers.length > 0) {
        const riskScore = riskTriggers.length * rubric.scoreWeights.risk;
        const protectiveScore = protectiveTriggers.length * rubric.scoreWeights.protective;
        const overallScore = Math.max(0, riskScore - protectiveScore);

        assessments.push({
          rubricId: rubric.id,
          riskScore,
          protectiveScore,
          overallScore,
          triggers: [...riskTriggers, ...protectiveTriggers],
          timestamp: new Date()
        });
      }
    });

    return assessments;
  };

  const getRubricById = (id: string) => evai56Rubrics.find(r => r.id === id);

  const calculateOverallRisk = (assessments: RubricAssessment[]): number => {
    if (assessments.length === 0) return 0;
    const totalScore = assessments.reduce((sum, a) => sum + a.overallScore, 0);
    const maxPossibleScore = assessments.length * 5; // Assuming max 5 risk factors per rubric
    return Math.min(100, (totalScore / maxPossibleScore) * 100);
  };

  return {
    evai56Rubrics,
    assessMessage,
    getRubricById,
    calculateOverallRisk
  };
}
