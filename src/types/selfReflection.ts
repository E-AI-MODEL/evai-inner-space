
import { Message } from './index';

export interface ReflectionTrigger {
  type: 'feedback' | 'pattern' | 'error' | 'improvement';
  context: Record<string, any>;
  priority: number;
}

export interface ReflectionInsight {
  category: string;
  description: string;
  confidence: number;
  actionable: boolean;
}

export interface ReflectionAction {
  type: 'generate_seed' | 'adjust_weights' | 'improve_response' | 'flag_issue';
  description: string;
  parameters: Record<string, any>;
}

export interface ReflectionResult {
  insights: ReflectionInsight[];
  actions: ReflectionAction[];
  newSeedsGenerated: number;
}
