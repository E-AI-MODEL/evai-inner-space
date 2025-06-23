
import { useOpenAISecondary } from "./useOpenAISecondary";
import { useOpenAISeedGenerator } from "./useOpenAISeedGenerator";
import { useSeeds } from "./useSeeds";
import { AdvancedSeed } from "../types/seed";
import { Message } from "../types";
import { v4 as uuidv4 } from "uuid";

export function useSecondaryAnalysisRunner() {
  const { analyzeNeurosymbolic } = useOpenAISecondary();
  const { injectSeedToDatabase } = useOpenAISeedGenerator();
  const { refetch: refetchSeeds } = useSeeds();

  const runSecondaryAnalysis = async (history: Message[], key: string) => {
    if (!key || !key.trim()) return;
    try {
      const contextString = history.map(h => `${h.from}: ${h.content}`).join('\n');
      const analysis = await analyzeNeurosymbolic(
        history[history.length - 1].content,
        contextString,
        key
      );
      if (analysis?.seedSuggestion) {
        const secondarySeed: AdvancedSeed = {
          id: uuidv4(),
          emotion: analysis.seedSuggestion,
          type: 'validation',
          label: 'Valideren',
          triggers: [analysis.seedSuggestion],
          response: { nl: analysis.insights.join(' ') },
          context: { severity: 'medium', situation: 'therapy' },
          meta: { 
            priority: 1, 
            weight: 1.0, 
            confidence: analysis.confidence || 0.7, 
            usageCount: 0,
            ttl: 30
          },
          tags: ['secondary-analysis', 'auto-generated'],
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'ai',
          isActive: true,
          version: '1.0.0'
        };
        
        const injected = await injectSeedToDatabase(secondarySeed);
        if (injected) {
          console.log('✅ Secondary analysis seed injected:', analysis.seedSuggestion);
          await refetchSeeds();
        }
      }
    } catch (err) {
      console.error('Secondary analysis failed', err);
    }
  };

  return { runSecondaryAnalysis };
}
