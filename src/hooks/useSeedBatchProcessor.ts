
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdvancedSeed } from '../types/seed';
import { generateEmbedding } from '../lib/embeddingUtils';

export function useSeedBatchProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);

  const processSeedBatch = async (
    seeds: AdvancedSeed[]
  ): Promise<{ success: number; failed: number }> => {

    setIsProcessing(true);
    let successCount = 0;
    let failedCount = 0;

    const { data: { user } } = await supabase.auth.getUser();

    for (const seed of seeds) {
      try {
        // Use server-side embedding generation via Edge Function
        const textToEmbed = `Emotie: ${seed.emotion}. Triggers: ${seed.triggers.join(', ')}. Response: ${seed.response.nl}`;
        
        // Call Edge Function for embedding generation (using evai-core)
        const { data: embData, error: embError } = await supabase.functions.invoke('evai-core', {
          body: { operation: 'embedding', input: textToEmbed, model: 'text-embedding-3-small' }
        });
        
        if (embError || !embData) {
          throw new Error(`Embedding generation failed: ${embError?.message || 'No data returned'}`);
        }
        
        const embedding = (embData as any)?.embedding;
        if (!embedding) {
          throw new Error('No embedding vector returned from Edge Function');
        }
        
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
