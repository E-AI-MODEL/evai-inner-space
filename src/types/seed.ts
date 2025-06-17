
export interface SeedResponse {
  nl: string;
  en?: string;
  fr?: string;
}

export interface SeedMeta {
  context?: {
    userAge?: 'child' | 'teen' | 'adult' | 'senior';
    severity?: 'low' | 'medium' | 'high' | 'critical';
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
    situation?: 'work' | 'home' | 'school' | 'social' | 'therapy';
  };
  triggers?: string[];
  tags?: string[];
  type?: 'validation' | 'reflection' | 'suggestion' | 'intervention';
  createdBy?: 'system' | 'admin' | 'ai';
  version?: string;
  priority?: number;
  ttl?: number; // Time to live in minutes
  weight?: number; // For selection probability
  confidence?: number; // Expected confidence level
  lastUsed?: Date | string;
  usageCount?: number;
}

export interface AdvancedSeed {
  id: string;
  emotion: string;
  type: 'validation' | 'reflection' | 'suggestion' | 'intervention';
  label: "Valideren" | "Reflectievraag" | "Suggestie" | "Interventie";
  triggers: string[];
  response: SeedResponse;
  context: {
    userAge?: 'child' | 'teen' | 'adult' | 'senior';
    severity: 'low' | 'medium' | 'high' | 'critical';
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
    situation?: 'work' | 'home' | 'school' | 'social' | 'therapy';
  };
  meta: SeedMeta & {
    priority: number;
    weight: number; // For selection probability
    confidence: number; // Expected confidence level
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
