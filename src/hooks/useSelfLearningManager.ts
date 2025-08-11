
import { useCallback, useState } from 'react';
import { UnifiedResponse, ChatHistoryItem } from '../types';
import { useUnifiedDecisionCore } from './useUnifiedDecisionCore';
import { useEnhancedSeedGeneration } from './useEnhancedSeedGeneration';
import { addAdvancedSeed } from '@/lib/advancedSeedStorage';
import { useVectorEmbeddings } from './useVectorEmbeddings';
import { supabase } from '@/integrations/supabase/client';

interface SelfLearningOutcome {
  triggered: boolean;
  reason?: 'low_confidence' | 'novel_topic';
  seedId?: string;
}

export function useSelfLearningManager() {
  const [isLearning, setIsLearning] = useState(false);
  const { searchUnifiedKnowledge } = useUnifiedDecisionCore();
  const { generateEnhancedSeed } = useEnhancedSeedGeneration();
  const { processSeedBatch } = useVectorEmbeddings();

  const analyzeTurn = useCallback(async (
    userInput: string,
    result: UnifiedResponse,
    history?: ChatHistoryItem[]
  ): Promise<SelfLearningOutcome> => {
    // Proactief, impliciet leren op basis van onzekerheid/novelty
    try {
      const apiKey = localStorage.getItem('openai-api-key') || '';
      const vectorKey = localStorage.getItem('vector-api-key') || apiKey;

      // 1) Detectiecriteria
      const lowConfidence = (result.confidence ?? 0) < 0.6;
      let novelTopic = false;

      try {
        const unified = await searchUnifiedKnowledge(userInput, vectorKey || undefined, 5);
        novelTopic = !unified || unified.length === 0;
      } catch (e) {
        // Als search faalt, beschouw dit niet als blocking voor de chat
        console.warn('⚠️ Self-learning: unified search failed, skipping novelty check');
      }

      if (!lowConfidence && !novelTopic) {
        return { triggered: false };
      }

      setIsLearning(true);

      // 2) Kies severiteit op basis van label
      const severityMap: Record<UnifiedResponse['label'], 'low' | 'medium' | 'high' | 'critical'> = {
        Valideren: 'low',
        Reflectievraag: 'medium',
        Suggestie: 'high',
        Interventie: 'critical',
        Fout: 'medium'
      };

      const severity = severityMap[result.label] || 'medium';

      // 3) Genereer verbeterde/nieuwe seed (diversificatie)
      const conversationHistory = (history || []).slice(-6).map(h => h.content);
      const seedRequest = {
        emotion: result.emotion || 'neutral',
        context: userInput.slice(0, 240),
        severity,
        conversationHistory
      } as any; // Gebruik het exacte type uit useEnhancedSeedGeneration

      const newSeed = await generateEnhancedSeed(seedRequest, apiKey);
      if (!newSeed) {
        return { triggered: false };
      }

      // 4) Opslaan als AdvancedSeed in emotion_seeds
      await addAdvancedSeed(newSeed);

      // 5) Embedden voor vector search en consolideren naar unified_knowledge
      try {
        if (vectorKey) {
          await processSeedBatch([newSeed], vectorKey);
        }
        await supabase.rpc('consolidate_knowledge');
      } catch (embedErr) {
        console.warn('⚠️ Self-learning: embedding/consolidation failed', embedErr);
      }

      console.log('🌱 Self-learning added seed:', newSeed.id, newSeed.emotion, newSeed.label);
      return { triggered: true, reason: lowConfidence ? 'low_confidence' : 'novel_topic', seedId: newSeed.id };
    } catch (err) {
      console.error('🔴 Self-learning pipeline error:', err);
      return { triggered: false };
    } finally {
      setIsLearning(false);
    }
  }, [generateEnhancedSeed, processSeedBatch, searchUnifiedKnowledge]);

  return { analyzeTurn, isLearning };
}
