
export interface NeurosymbolicDecision {
  type: 'neural' | 'symbolic' | 'hybrid';
  confidence: number;
  reasoning: string[];
  source: string;
  processingTime: number;
  metadata?: {
    processingTime: number;
    fallbackUsed: boolean;
    priority: 'high' | 'medium' | 'low';
    apiCollaboration?: {
      api1_used?: boolean;
      api2_used?: boolean;
      vector_api_used?: boolean;
      seed_generated?: boolean;
      secondary_analysis?: boolean;
    };
    componentsUsed?: string[];
  };
}

export interface ProcessingContext {
  userInput: string;
  conversationHistory: ChatHistoryItem[];
  userProfile?: UserProfile;
  sessionMetadata: SessionMetadata;
  timestamp: Date;
}

export interface UserProfile {
  userId: string;
  preferences: Record<string, any>;
  conversationPatterns: string[];
  emotionalState?: string;
}

export interface SessionMetadata {
  sessionId: string;
  totalMessages: number;
  averageResponseTime: number;
  lastActivity: Date;
}

export interface ChatHistoryItem {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
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
  metadata: {
    processingPath: string;
    totalProcessingTime: number;
    componentsUsed: string[];
  };
}
