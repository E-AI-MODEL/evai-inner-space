
export interface ChatHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

export interface Message {
  id: string;
  from: 'user' | 'ai';
  content: string;
  timestamp: Date;
  emotionSeed?: string;
  confidence?: number;
  label?: "Valideren" | "Reflectievraag" | "Suggestie";
  explainText?: string;
  feedback?: 'like' | 'dislike';
  symbolicInferences?: string[];
  secondaryInsights?: string[];
}
