
export interface Message {
  id: string;
  from: "user" | "ai";
  label: "Valideren" | "Reflectievraag" | "Suggestie" | "Fout" | null;
  content: string;
  emotionSeed: string | null;
  animate: boolean;
  timestamp: Date;
  feedback?: "like" | "dislike" | null;
}

export type ChatHistoryItem = {
  role: "user" | "assistant";
  content: string;
};
