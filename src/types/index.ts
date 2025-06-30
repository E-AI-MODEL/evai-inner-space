
export interface ChatHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

export interface Message {
  id: string;
  from: 'user' | 'ai';
  content: string;
  timestamp: Date;
  emotionSeed?: string | null;
  confidence?: number;
  label?:
    | 'Valideren'
    | 'Reflectievraag'
    | 'Suggestie'
    | 'Interventie'
    | 'Fout'
    | null;
  explainText?: string;
  feedback?: 'like' | 'dislike' | null;
  animate?: boolean;
  meta?: any;
  symbolicInferences?: string[];
  secondaryInsights?: string[];
}
export type { StrategicBriefing } from './orchestration';
