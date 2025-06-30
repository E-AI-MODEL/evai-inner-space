
export interface ProcessingContext {
  userInput: string;
  conversationHistory?: ChatHistoryItem[];
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface UnifiedResponse {
  content: string;
  emotion: string;
  confidence: number;
  label: 'Valideren' | 'Reflectievraag' | 'Suggestie' | 'Interventie' | 'Fout';
  reasoning: string;
  symbolicInferences: string[];
  secondaryInsights?: string[];
  metadata?: {
    processingPath: 'symbolic' | 'hybrid' | 'neural' | 'error';
    totalProcessingTime: number;
    componentsUsed: string[];
  };
}

export interface NeurosymbolicDecision {
  type: 'symbolic' | 'neural' | 'hybrid';
  confidence: number;
  reasoning: string[];
  source: string;
  processingTime: number;
  metadata: {
    processingTime: number;
    fallbackUsed: boolean;
    priority: 'high' | 'medium' | 'low';
    componentsUsed: string[];
  };
}

export interface ChatHistoryItem {
  role: 'user' | 'assistant';
  content: string;
  from?: string;
}
