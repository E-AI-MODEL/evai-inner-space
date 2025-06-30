export interface StrategicBriefing {
  goal: string;
  context: string;
  keyPoints: string[];
  priority?: 'low' | 'medium' | 'high';
}
