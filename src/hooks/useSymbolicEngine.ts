
import { Message } from '../types';
import { useRubricSymbolicRules } from './useRubricSymbolicRules';
import { useEmotionalContextEngine } from './useEmotionalContextEngine';

export interface SymbolicRule {
  name: string;
  description: string;
  check: (messages: Message[], latestMessage: Message) => string | null;
}

export interface SymbolicProcessingResult {
  emotion: string;
  response: string;
  confidence: number;
  label: 'Valideren' | 'Reflectievraag' | 'Suggestie' | 'Interventie' | 'Fout';
  pattern: string;
  inferences: string[];
}

export function useSymbolicEngine() {
  const { rubricBasedRules } = useRubricSymbolicRules();
  const { analyzeContext } = useEmotionalContextEngine();

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

  const contextRules: SymbolicRule[] = [
    {
      name: 'LateNightPattern',
      description: 'Signaleert nachtelijke gesprekken',
      check: (messages, latest) => {
        if (latest.from !== 'user') return null;
        const ctx = analyzeContext(messages);
        if (ctx.timeOfDay === 'night') {
          return '🌙 Nachtelijke context - let op vermoeidheid of crisisgedrag';
        }
        return null;
      }
    },
    {
      name: 'LongConversation',
      description: 'Detecteert langdurige sessies',
      check: (messages, latest) => {
        if (latest.from !== 'user') return null;
        const ctx = analyzeContext(messages);
        if (ctx.durationMinutes > 45) {
          return `⏳ Gesprek duurt al ${Math.round(ctx.durationMinutes)} minuten - mogelijk mentale vermoeidheid`;
        }
        return null;
      }
    },
    {
      name: 'TherapeuticEscalation',
      description: 'Waarschuwt wanneer professionele hulp gewenst is',
      check: (messages, latest) => {
        if (latest.from !== 'user') return null;
        const ctx = analyzeContext(messages);
        const threshold = 70;
        if (ctx.riskScore > threshold || ctx.escalate) {
          return `🚨 Escalatie nodig - risicoscore ${Math.round(ctx.riskScore)}%, intensiteit ${ctx.intensityScore}`;
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

    const allRules = [...basicRules, ...rubricBasedRules, ...contextRules];
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

  const processSymbolic = async (
    userInput: string,
    conversationHistory: any[]
  ): Promise<SymbolicProcessingResult | null> => {
    try {
      // Convert to Message format for evaluation
      const messages: Message[] = conversationHistory.map((item, index) => ({
        id: `hist_${index}`,
        from: item.role === 'user' ? 'user' : 'ai',
        content: item.content,
        timestamp: item.timestamp || new Date()
      }));

      const latestMessage: Message = {
        id: 'latest',
        from: 'user',
        content: userInput,
        timestamp: new Date()
      };

      const insights = evaluate([...messages, latestMessage], latestMessage);
      
      if (insights.length === 0) {
        return null;
      }

      // Determine emotion and response based on symbolic patterns
      let emotion = 'neutral';
      let confidence = 0.6;
      let label: 'Valideren' | 'Reflectievraag' | 'Suggestie' | 'Interventie' | 'Fout' = 'Valideren';
      
      // Pattern matching for higher confidence symbolic responses
      if (userInput.toLowerCase().includes('angs')) {
        emotion = 'angst';
        confidence = 0.85;
        label = 'Valideren';
      } else if (userInput.toLowerCase().includes('boos') || userInput.toLowerCase().includes('gefrustreerd')) {
        emotion = 'boosheid';
        confidence = 0.85;
        label = 'Valideren';
      } else if (userInput.toLowerCase().includes('verdriet') || userInput.toLowerCase().includes('triest')) {
        emotion = 'verdriet';
        confidence = 0.85;
        label = 'Valideren';
      } else if (insights.some(i => i.includes('🚨'))) {
        emotion = 'crisis';
        confidence = 0.9;
        label = 'Interventie';
      }

      const response = generateSymbolicResponse(emotion, insights);
      
      return {
        emotion,
        response,
        confidence,
        label,
        pattern: insights[0] || 'Symbolic pattern detected',
        inferences: insights
      };
    } catch (error) {
      console.error('Symbolic processing failed:', error);
      return null;
    }
  };

  const generateSymbolicResponse = (emotion: string, insights: string[]): string => {
    const responses: Record<string, string> = {
      angst: "Ik begrijp dat je je angstig voelt. Het is natuurlijk om angst te ervaren, en je bent niet alleen hierin.",
      boosheid: "Je boosheid is begrijpelijk en geldig. Het is oké om deze emoties te voelen.",
      verdriet: "Verdriet is een natuurlijke reactie. Het is belangrijk om jezelf de ruimte te geven om dit te voelen.",
      crisis: "Ik merk dat je mogelijk door een moeilijke periode gaat. Het is belangrijk om professionele hulp te zoeken als je dit nodig hebt.",
      neutral: "Ik ben hier om naar je te luisteren en je te ondersteunen."
    };
    
    return responses[emotion] || responses.neutral;
  };

  return { 
    evaluate, 
    processSymbolic 
  };
}
