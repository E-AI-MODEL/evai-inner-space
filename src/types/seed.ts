
export interface AdvancedSeed {
  id: string;
  emotion: string;
  type: 'validation' | 'reflection' | 'suggestion' | 'intervention';
  label: "Valideren" | "Reflectievraag" | "Suggestie" | "Interventie";
  triggers: string[];
  response: {
    nl: string;
    en?: string;
    fr?: string;
  };
  context: {
    userAge?: 'child' | 'teen' | 'adult' | 'senior';
    severity: 'low' | 'medium' | 'high' | 'critical';
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
    situation?: 'work' | 'home' | 'school' | 'social' | 'therapy';
  };
  meta: {
    priority: number;
    ttl?: number; // Time to live in minutes
    weight: number; // For selection probability
    confidence: number; // Expected confidence level
    lastUsed?: Date;
    usageCount: number;
  };
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: 'system' | 'admin' | 'ai';
  isActive: boolean;
  version: string;
}

export interface LegacySeed {
  emotion: string;
  label: "Valideren" | "Reflectievraag" | "Suggestie";
  triggers: string[];
  response: string;
  meta: string;
}
