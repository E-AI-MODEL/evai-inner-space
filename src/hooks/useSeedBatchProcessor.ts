
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdvancedSeed } from '../types/seed';
import { generateEmbedding } from '../lib/embeddingUtils';

export function useSeedBatchProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);

  const processSeedBatch = async (
    seeds: AdvancedSeed[],
    apiKey: string
  ): Promise<{ success: number; failed: number }> => {
    if (!apiKey) {
      console.error('API key is required for batch processing.');
      return { success: 0, failed: seeds.length };
    }

    setIsProcessing(true);
    let successCount = 0;
    let failedCount = 0;

    const { data: { user } } = await supabase.auth.getUser();

    for (const seed of seeds) {
      try {
        // Gebruik een combinatie van velden voor een rijkere embedding
        const textToEmbed = `Emotie: ${seed.emotion}. Triggers: ${seed.triggers.join(', ')}. Response: ${seed.response.nl}`;
        
        const embedding = await generateEmbedding(textToEmbed, apiKey);
        
        await supabase.from('vector_embeddings').insert({
          content_id: seed.id,
          content_type: 'seed',
          content_text: textToEmbed.substring(0, 2000),
          embedding: `[${embedding.join(',')}]`,
          metadata: { 
            emotion: seed.emotion,
            type: seed.type,
            severity: seed.context.severity,
          },
          user_id: user?.id, // Voeg de user_id toe!
        });
        
        successCount++;
        console.log(`✅ Processed seed embedding: ${seed.emotion} (${seed.id})`);
      } catch (error) {
        console.error(`Failed to process seed ${seed.id} (${seed.emotion}):`, error);
        failedCount++;
      }
    }

    setIsProcessing(false);
    console.log(`🎯 Batch processing complete: ${successCount} success, ${failedCount} failed`);
    return { success: successCount, failed: failedCount };
  };

  return {
    processSeedBatch,
    isProcessing,
  };
}
