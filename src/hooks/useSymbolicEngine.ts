
import { Message } from '../types';
import { useRubricSymbolicRules } from './useRubricSymbolicRules';

export interface SymbolicRule {
  name: string;
  description: string;
  check: (messages: Message[], latestMessage: Message) => string | null;
}

export function useSymbolicEngine() {
  const { rubricBasedRules } = useRubricSymbolicRules();

  const basicRules: SymbolicRule[] = [
    {
      name: "ConsecutiveQuestions",
      description: "Detecteert opeenvolgende vragen van gebruiker",
      check: (messages, latest) => {
        if (latest.from !== "user") return null;
        
        // Safely filter messages with proper null check
        const recentUserMessages = messages
          .filter(m => m && m.from === "user")
          .slice(-3);
          
        if (recentUserMessages.length >= 2) {
          const hasQuestions = recentUserMessages.every(m => 
            m && m.content && m.content.includes('?')
          );
          if (hasQuestions) {
            return "🤔 Meerdere vragen gedetecteerd - gebruiker zoekt duidelijkheid";
          }
        }
        return null;
      }
    },
    {
      name: "EmotionalEscalation", 
      description: "Detecteert toenemende emotionele intensiteit",
      check: (messages, latest) => {
        if (latest.from !== "user" || !latest.content) return null;
        
        const intensityWords = ['heel', 'erg', 'extreem', 'ontzettend', 'vreselijk'];
        const hasIntensity = intensityWords.some(word => 
          latest.content.toLowerCase().includes(word)
        );
        
        if (hasIntensity) {
          return "📈 Verhoogde emotionele intensiteit gedetecteerd";
        }
        return null;
      }
    },
    {
      name: "TimePatterns",
      description: "Detecteert tijd-gerelateerde patronen",
      check: (messages, latest) => {
        if (latest.from !== "user" || !latest.content) return null;
        
        const timeWords = ['altijd', 'nooit', 'constant', 'steeds', 'elke dag'];
        const hasTimePattern = timeWords.some(word => 
          latest.content.toLowerCase().includes(word)
        );
        
        if (hasTimePattern) {
          return "⏰ Tijd-gerelateerde patronen gedetecteerd - mogelijk chronische ervaring";
        }
        return null;
      }
    }
  ];

  const evaluate = (messages: Message[], latestMessage: Message): string[] => {
    // Safety check for messages array and latest message
    if (!messages || !Array.isArray(messages) || !latestMessage) {
      console.warn('⚠️ Invalid messages or latestMessage in symbolic engine');
      return [];
    }

    const allRules = [...basicRules, ...rubricBasedRules];
    const insights: string[] = [];

    for (const rule of allRules) {
      try {
        const result = rule.check(messages, latestMessage);
        if (result) {
          insights.push(result);
        }
      } catch (error) {
        console.error(`❌ Symbolic rule "${rule.name}" failed:`, error);
      }
    }

    return insights;
  };

  return { evaluate };
}
