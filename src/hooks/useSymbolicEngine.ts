import { Message } from '../types';

// Define the interface for a symbolic rule
export interface SymbolicRule {
  name: string;
  description: string;
  check: (messages: Message[], latest: Message) => string | null;
}

// Example rules: extend/add more for richer logic!
const defaultSymbolicRules: SymbolicRule[] = [
  {
    name: "EscalationDetection",
    description: "Detects if emotional keywords escalate over the conversation.",
    check: (messages, latest) => {
      // Naive example: count emotionally strong words, compare to previous
      const emotionWords = ["paniek", "woede", "heftig", "crisis", "wanhoop"];
      const prevUserMessages = messages.filter(m => m.from === "user");
      const currentScore = emotionWords.filter(word => latest.content.includes(word)).length;
      const prevScore = prevUserMessages
        .slice(0, -1)
        .map(m => emotionWords.filter(word => m.content.includes(word)).length)
        .reduce((a, b) => a + b, 0);
      if (currentScore > prevScore && currentScore > 0) {
        return "Let op: mogelijk emotionele escalatie in dit gesprek.";
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
      ];
      for (const [a, b] of contradPairs) {
        if (
          (prevUser.content.includes(a) && latest.content.includes(b)) ||
          (prevUser.content.includes(b) && latest.content.includes(a))
        ) {
          return "Symbolische observatie: Mogelijke interne tegenstrijdigheid in je gevoelens.";
        }
      }
      return null;
    }
  },
  {
    name: "RepeatedFeedback",
    description:
      "Detects repeated dislike feedback from the user on consecutive AI responses.",
    check: (messages, latest) => {
      if (latest.from !== "ai") return null;
      const aiMsgs = messages.filter((m) => m.from === "ai");
      if (aiMsgs.length < 2) return null;
      // If the past two AI messages both have feedback === 'dislike'
      const dislikedTwice =
        aiMsgs.slice(-2).every((m) => m.feedback === "dislike");
      if (dislikedTwice) {
        return
          "Opmerking: Gebruiker heeft tweemaal achtereen 'ontevreden' feedback gegeven. Overweeg drastisch te veranderen van aanpak.";
      }
      return null;
    },
  },
  // --- Advanced Symbolic rules ---
  {
    name: "AdviceOverload",
    description: "Detects if multiple suggestions (advice) are given in a row, which can overwhelm the user.",
    check: (messages, latest) => {
      if (latest.from !== "ai" || latest.label !== "Suggestie") return null;
      const aiMsgs = messages.filter(m => m.from === "ai");
      if (aiMsgs.length < 3) return null;
      const recent = aiMsgs.slice(-3);
      const suggestions = recent.filter(m => m.label === "Suggestie").length;
      if (suggestions === 3) {
        return "Let op: meerdere suggesties achter elkaar kunnen overweldigend zijn. Overweeg meer ruimte voor reflectie.";
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
        return `Symbolische observatie: emoties lijken te blijven terugkeren rond '${emotions[0]}'. Dit kan wijzen op een cyclisch patroon.`;
      }
      return null;
    }
  },
  {
    name: "EmergingHope",
    description: "Detects the first mention of hope/optimism after a long negative trend.",
    check: (messages, latest) => {
      if (latest.from !== "user" || !latest.content) return null;
      const hopeWords = ["hoop", "misschien", "toekomst", "beter", "verbetering"];
      const isHope = hopeWords.some(word => latest.content.toLowerCase().includes(word));
      if (!isHope) return null;
      // Has there been a streak of 'negative' emotion?
      const negatives = ["wanhoop", "paniek", "verdriet", "boos", "frustratie"];
      const prevNeg = messages.filter(m => m.from === "user").slice(-5, -1);
      const negativeStreak = prevNeg.every(m =>
        negatives.some(neg => m.content?.toLowerCase().includes(neg))
      );
      if (negativeStreak && prevNeg.length >= 3) {
        return "Opmerking: Na een periode van negatieve emoties klinkt er nu een teken van hoop. Markeer deze positieve verschuiving!";
      }
      return null;
    }
  },
  {
    name: "FeedbackIgnored",
    description: "Detects if the same type of disliked answer is repeated even after feedback.",
    check: (messages, latest) => {
      if (!(latest.from === "ai" && latest.label)) return null;
      // Check if the previous AI message with this label got a 'dislike'
      const aiMsgs = messages.filter(m => m.from === "ai" && m.label === latest.label);
      if (aiMsgs.length < 2) return null;
      const prev = aiMsgs[aiMsgs.length - 2];
      if (prev && prev.feedback === "dislike") {
        return `Let op: Antwoord van type '${latest.label}' gegeven ondanks eerdere ontevreden feedback. Overweeg een andere aanpak.`;
      }
      return null;
    }
  }
];

export function useSymbolicEngine(rules: SymbolicRule[] = defaultSymbolicRules) {
  /**
   * Annotate a message with all symbolic inferences that apply.
   * Returns an array of symbolic inference strings or empty array.
   */
  const evaluate = (messages: Message[], latest: Message): string[] => {
    const results: string[] = [];
    for (const rule of rules) {
      const inference = rule.check(messages, latest);
      if (inference) results.push(inference);
    }
    return results;
  };

  return { evaluate, rules };
}
