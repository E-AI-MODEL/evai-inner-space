
import { useState } from 'react';
import { useEnhancedSeedGeneration } from './useEnhancedSeedGeneration';
import { SeedGenerationRequest, OpenAISeedGeneratorConfig } from '../types/openAISeedGenerator';

export function useOpenAISeedGeneration() {
  const { generateEnhancedSeed, isGenerating } = useEnhancedSeedGeneration();

  const generateSeed = async (
    request: SeedGenerationRequest,
    _apiKey: string, // Kept for backward compatibility but unused - all calls go through edge function
    config: Partial<OpenAISeedGeneratorConfig> = {}
  ) => {
    console.log('🚀 Using enhanced seed generation with improved type variety...');
    return generateEnhancedSeed(request, '', config);
  };

  return {
    generateSeed,
    isGenerating
  };
}
