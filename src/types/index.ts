
export interface Message {
  id: string;
  from: "user" | "ai";
  label: "Valideren" | "Reflectievraag" | "Suggestie" | "Fout" | "Configuratie" | "OpenAI" | null;
  content: string;
  emotionSeed: string | null;
  animate: boolean;
  timestamp: Date;
  accentColor?: string;
  explainText?: string;
  meta?: string;
  brilliant?: boolean;
  replyTo?: string;
  feedback?: "like" | "dislike" | null;
  // OPTIONAL: Symbolic inferences meta info, for neurosymbolic engine
  symbolicInferences?: string[];
}

export type ChatHistoryItem = {
  role: "user" | "assistant";
  content: string;
};
