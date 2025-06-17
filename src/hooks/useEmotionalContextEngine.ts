import { Message } from '../types';
import { useEvAI56Rubrics } from './useEvAI56Rubrics';

export interface EmotionalContext {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  durationMinutes: number;
  intensityScore: number;
  riskScore: number;
  escalate: boolean;
}

export function useEmotionalContextEngine() {
  const { assessMessage, calculateOverallRisk } = useEvAI56Rubrics();

  const getTimeOfDay = (date: Date): EmotionalContext['timeOfDay'] => {
    const hour = date.getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
  };

  const getIntensity = (text: string): number => {
    let score = 0;
    const lower = text.toLowerCase();
    if (/[!]{2,}/.test(text)) score += 1;
    if (/(heel|erg|extreem|vreselijk|ontzettend)/.test(lower)) score += 1;
    if (/[A-Z]{3,}/.test(text)) score += 1;
    return score;
  };

  const analyzeContext = (messages: Message[]): EmotionalContext => {
    if (!messages.length) {
      return {
        timeOfDay: 'morning',
        durationMinutes: 0,
        intensityScore: 0,
        riskScore: 0,
        escalate: false
      };
    }

    const first = messages[0].timestamp ? new Date(messages[0].timestamp) : new Date();
    const last = messages[messages.length - 1].timestamp ? new Date(messages[messages.length - 1].timestamp) : new Date();
    const duration = (last.getTime() - first.getTime()) / 60000;
    const timeOfDay = getTimeOfDay(last);

    const userMessages = messages.filter(m => m.from === 'user');
    const intensityValues = userMessages.map(m => getIntensity(m.content));
    const intensityScore = intensityValues.length
      ? intensityValues.reduce((a, b) => a + b, 0) / intensityValues.length
      : 0;

    const lastUser = userMessages[userMessages.length - 1];
    const assessments = lastUser ? assessMessage(lastUser.content) : [];
    const riskScore = calculateOverallRisk(assessments);

    const escalate = riskScore > 70 || (intensityScore >= 2 && riskScore > 50) || duration > 60;

    return { timeOfDay, durationMinutes: duration, intensityScore, riskScore, escalate };
  };

  return { analyzeContext };
}
