
export interface Message {
  id: string;
  from: "user" | "ai";
  label: "Valideren" | "Reflectievraag" | "Suggestie" | "Fout" | null;
  content: string;
  emotionSeed: string | null;
  animate: boolean;
  timestamp: Date;
  feedback?: "like" | "dislike" | null;
  // Keep these for admin components
  meta?: string;
  symbolicInferences?: string[];
  explainText?: string;
  accentColor?: string;
  brilliant?: boolean;
  replyTo?: string;
}

export type ChatHistoryItem = {
  role: "user" | "assistant";
  content: string;
  from?: "user" | "ai"; // Add from property for compatibility
};

export interface EmotionDetection {
  emotion: string;
  response: string;
  label: "Valideren" | "Reflectievraag" | "Suggestie" | "Fout";
  symbolicInferences?: string[]; // Add symbolicInferences property
}
