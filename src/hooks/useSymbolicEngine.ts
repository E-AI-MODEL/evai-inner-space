
import { Message } from '../types';
import { useRubricSymbolicRules } from './useRubricSymbolicRules';

// Define the interface for a symbolic rule
export interface SymbolicRule {
  name: string;
  description: string;
  check: (messages: Message[], latest: Message) => string | null;
}

// Enhanced rules with more sophisticated logic
const defaultSymbolicRules: SymbolicRule[] = [
  {
    name: "EscalationDetection",
    description: "Detects if emotional keywords escalate over the conversation.",
    check: (messages, latest) => {
      const emotionWords = ["paniek", "woede", "heftig", "crisis", "wanhoop", "uitgeput", "overweldigd"];
      const prevUserMessages = messages.filter(m => m.from === "user");
      const currentScore = emotionWords.filter(word => latest.content.toLowerCase().includes(word)).length;
      const prevScore = prevUserMessages
        .slice(0, -1)
        .map(m => emotionWords.filter(word => m.content.toLowerCase().includes(word)).length)
        .reduce((a, b) => a + b, 0);
      if (currentScore > prevScore && currentScore > 0) {
        return "⚠️ Emotionele escalatie gedetecteerd - mogelijk moment voor extra zorg en aandacht.";
      }
      return null;
    }
  },
  {
    name: "ContradictionDetector",
    description: "Detects if the user expresses a contradiction in short succession.",
    check: (messages, latest) => {
      if (latest.from !== "user") return null;
      const prevUser = messages.filter(m => m.from === "user").slice(-2, -1)[0];
      if (!prevUser) return null;
      const contradPairs = [
        ["ik kan het niet", "ik kan dit wel"],
        ["ik voel me goed", "ik voel me slecht"],
        ["het gaat prima", "het gaat niet goed"],
        ["ik ben sterk", "ik ben zwak"]
      ];
      for (const [a, b] of contradPairs) {
        if (
          (prevUser.content.toLowerCase().includes(a) && latest.content.toLowerCase().includes(b)) ||
          (prevUser.content.toLowerCase().includes(b) && latest.content.toLowerCase().includes(a))
        ) {
          return "💭 Innerlijke tegenstrijdigheid waargenomen - mogelijk teken van complexe gevoelens.";
        }
      }
      return null;
    }
  },
  {
    name: "RepeatedFeedback",
    description: "Detects repeated dislike feedback from the user on consecutive AI responses.",
    check: (messages, latest) => {
      if (latest.from !== "ai") return null;
      const aiMsgs = messages.filter((m) => m.from === "ai");
      if (aiMsgs.length < 2) return null;
      const dislikedTwice = aiMsgs.slice(-2).every((m) => m.feedback === "dislike");
      if (dislikedTwice) {
        return "📊 Herhaalde ontevreden feedback - aanpassing van communicatiestrategie aanbevolen.";
      }
      return null;
    },
  },
  {
    name: "AdviceOverload",
    description: "Detects if multiple suggestions are given in a row, which can overwhelm the user.",
    check: (messages, latest) => {
      if (latest.from !== "ai" || latest.label !== "Suggestie") return null;
      const aiMsgs = messages.filter(m => m.from === "ai");
      if (aiMsgs.length < 3) return null;
      const recent = aiMsgs.slice(-3);
      const suggestions = recent.filter(m => m.label === "Suggestie").length;
      if (suggestions === 3) {
        return "⚡ Veel suggesties achtereenvolgens - mogelijk tijd voor meer luisterruimte.";
      }
      return null;
    }
  },
  {
    name: "DependencyCycle",
    description: "Detects if the conversation repeatedly circles around the same stated emotion.",
    check: (messages, latest) => {
      if (latest.from !== "user") return null;
      const lastFour = messages.filter(m => m.emotionSeed).slice(-4);
      if (lastFour.length < 4) return null;
      const emotions = lastFour.map(m => m.emotionSeed);
      if (new Set(emotions).size === 1) {
        return `🔄 Cyclisch emotiepatroon rond '${emotions[0]}' - mogelijk dieper liggende thema's.`;
      }
      return null;
    }
  },
  {
    name: "EmergingHope",
    description: "Detects the first mention of hope/optimism after a long negative trend.",
    check: (messages, latest) => {
      if (latest.from !== "user" || !latest.content) return null;
      const hopeWords = ["hoop", "misschien", "toekomst", "beter", "verbetering", "vooruitgang", "kans"];
      const isHope = hopeWords.some(word => latest.content.toLowerCase().includes(word));
      if (!isHope) return null;
      const negatives = ["wanhoop", "paniek", "verdriet", "boos", "frustratie", "moedeloos"];
      const prevNeg = messages.filter(m => m.from === "user").slice(-5, -1);
      const negativeStreak = prevNeg.every(m =>
        negatives.some(neg => m.content?.toLowerCase().includes(neg))
      );
      if (negativeStreak && prevNeg.length >= 3) {
        return "🌅 Hoopvol signaal na moeilijke periode - belangrijke positieve verschuiving!";
      }
      return null;
    }
  },
  {
    name: "FeedbackIgnored",
    description: "Detects if the same type of disliked answer is repeated even after feedback.",
    check: (messages, latest) => {
      if (!(latest.from === "ai" && latest.label)) return null;
      const aiMsgs = messages.filter(m => m.from === "ai" && m.label === latest.label);
      if (aiMsgs.length < 2) return null;
      const prev = aiMsgs[aiMsgs.length - 2];
      if (prev && prev.feedback === "dislike") {
        return `🔄 Herhaling van ongewaardeerde aanpak '${latest.label}' - alternatieve strategie overwegen.`;
      }
      return null;
    }
  },
  {
    name: "SupportSeeker",
    description: "Detects when user explicitly asks for help or support multiple times.",
    check: (messages, latest) => {
      if (latest.from !== "user") return null;
      const helpWords = ["help", "steun", "raad", "wat moet ik", "hoe kan ik"];
      const isSeekingHelp = helpWords.some(word => latest.content.toLowerCase().includes(word));
      if (!isSeekingHelp) return null;
      
      const recentUserMsgs = messages.filter(m => m.from === "user").slice(-3);
      const helpRequests = recentUserMsgs.filter(m => 
        helpWords.some(word => m.content.toLowerCase().includes(word))
      ).length;
      
      if (helpRequests >= 2) {
        return "🤝 Herhaald verzoek om ondersteuning - mogelijke behoefte aan concrete hulp.";
      }
      return null;
    }
  },
  {
    name: "BreakthroughMoment",
    description: "Detects moments of insight or self-awareness.",
    check: (messages, latest) => {
      if (latest.from !== "user") return null;
      const insightWords = ["ik snap", "ik begrijp", "aha", "nu zie ik", "plotseling", "inzicht", "besef"];
      const hasInsight = insightWords.some(word => latest.content.toLowerCase().includes(word));
      if (hasInsight) {
        return "💡 Moment van inzicht gedetecteerd - belangrijke doorbraak in zelfbewustzijn!";
      }
      return null;
    }
  }
];

export function useSymbolicEngine(rules: SymbolicRule[] = defaultSymbolicRules) {
  const { rubricBasedRules } = useRubricSymbolicRules();
  
  // Combine default rules with rubric-based rules
  const allRules = [...rules, ...rubricBasedRules];
  
  /**
   * Annotate a message with all symbolic inferences that apply.
   * Returns an array of symbolic inference strings or empty array.
   */
  const evaluate = (messages: Message[], latest: Message): string[] => {
    const results: string[] = [];
    for (const rule of allRules) {
      const inference = rule.check(messages, latest);
      if (inference) results.push(inference);
    }
    return results;
  };

  return { evaluate, rules: allRules };
}
