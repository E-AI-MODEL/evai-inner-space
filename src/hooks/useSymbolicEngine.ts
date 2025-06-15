
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

