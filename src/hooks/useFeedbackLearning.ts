import { Message } from '../types';

interface RuleStats {
  [rule: string]: { likes: number; dislikes: number };
}

const STORAGE_KEY = 'symbolic-rule-stats';

const loadStats = (): RuleStats => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveStats = (stats: RuleStats) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
};

export function useFeedbackLearning() {
  const recordFeedback = (message: Message, feedback: 'like' | 'dislike') => {
    if (!message.symbolicInferences || !message.symbolicInferences.length) return;
    const stats = loadStats();
    message.symbolicInferences.forEach(inf => {
      const rule = inf.split(':')[0];
      if (!stats[rule]) stats[rule] = { likes: 0, dislikes: 0 };
      if (feedback === 'like') stats[rule].likes++;
      else stats[rule].dislikes++;
    });
    saveStats(stats);
  };

  const getAdjustedThreshold = (rule: string, base: number): number => {
    const stats = loadStats();
    const r = stats[rule];
    if (!r) return base;
    const total = r.likes + r.dislikes;
    if (total === 0) return base;
    const ratio = r.dislikes / total;
    return base + ratio * 10; // shift threshold by dislike ratio
  };

  return { recordFeedback, getAdjustedThreshold };
}
