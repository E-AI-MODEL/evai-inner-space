
export interface AdvancedSeed {
  id: string;
  emotion: string;
  type: 'validation' | 'reflection' | 'suggestion' | 'error';
  label: 'Valideren' | 'Reflectievraag' | 'Suggestie' | 'Fout';
  triggers: string[];
  response: { nl: string };
  context: { severity: 'low' | 'medium' | 'high'; situation: string };
  meta: { 
    priority: number; 
    weight: number; 
    confidence: number; 
    usageCount: number;
    ttl: number;
  };
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: 'ai' | 'system' | 'admin' | 'ai-api2'; // Extended to include ai-api2
  isActive: boolean;
  version: string;
}
