
import { useState } from 'react';
import { useEnhancedSeedGeneration } from './useEnhancedSeedGeneration';
import { SeedGenerationRequest, OpenAISeedGeneratorConfig } from '../types/openAISeedGenerator';

export function useOpenAISeedGeneration() {
  const { generateEnhancedSeed, isGenerating } = useEnhancedSeedGeneration();

  const generateSeed = async (
    request: SeedGenerationRequest,
    apiKey: string,
    config: Partial<OpenAISeedGeneratorConfig> = {}
  ) => {
    console.log('🚀 Using enhanced seed generation with improved type variety...');
    return generateEnhancedSeed(request, apiKey, config);
  };

  return {
    generateSeed,
    isGenerating
  };
}
