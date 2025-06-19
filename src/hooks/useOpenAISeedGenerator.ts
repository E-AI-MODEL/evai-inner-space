
import { useOpenAISeedGeneration } from './useOpenAISeedGeneration';
import { useConversationAnalysis } from './useConversationAnalysis';
import { useSeedDatabaseInjection } from './useSeedDatabaseInjection';
import type { SeedGenerationRequest } from '../types/openAISeedGenerator';

export function useOpenAISeedGenerator() {
  const { generateSeed, isGenerating: isGeneratingSeed } = useOpenAISeedGeneration();
  const { analyzeConversationForSeeds, isAnalyzing } = useConversationAnalysis();
  const { injectSeedToDatabase, isInjecting } = useSeedDatabaseInjection();

  const isGenerating = isGeneratingSeed || isAnalyzing || isInjecting;

  return {
    generateSeed,
    analyzeConversationForSeeds,
    injectSeedToDatabase,
    isGenerating
  };
}

// Re-export types for backward compatibility
export type { SeedGenerationRequest } from '../types/openAISeedGenerator';
