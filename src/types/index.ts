
export interface Message {
  id: string;
  from: "user" | "ai";
  label: "Valideren" | "Reflectievraag" | "Suggestie" | "Fout" | null;
  content: string;
  emotionSeed: string | null;
  animate?: boolean;
  timestamp?: Date;
  feedback?: "like" | "dislike" | null;
  symbolicInferences?: string[];
  explainText?: string;
  meta?:
    | string
    | {
        gapAnalysis?: string;
        autoSeed?: string;
        [key: string]: any;
      };
}

export interface ChatHistoryItem {
  role: "user" | "assistant";
  content: string;
  from: "user" | "ai";
}
