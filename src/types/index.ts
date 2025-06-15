
export interface Message {
  id: string;
  from: "user" | "ai";
  label: "Valideren" | "Reflectievraag" | "Suggestie" | "Fout" | null;
  content: string;
  emotionSeed: string | null;
  animate: boolean;
  timestamp: Date;
  accentColor?: string;
  showExplain?: boolean;
  explainText?: string;
  meta?: string;
  brilliant?: boolean;
}
