import { useEffect, useState } from 'react';
import { loadRecentMessages } from '../lib/chatHistoryStorage';
import { useSelfLearningManager } from './useSelfLearningManager';
import { UnifiedResponse } from '../types';

export function useRetroactiveLearning(enabled: boolean = true) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null);
  const [newSeedsCount, setNewSeedsCount] = useState(0);
  const { analyzeTurn } = useSelfLearningManager();

  useEffect(() => {
    if (!enabled) return;

    const analyzeOldConversations = async () => {
      setIsAnalyzing(true);
      try {
        console.log('🔄 Starting retroactive learning analysis...');
        
        // Load last 100 messages
        const recentMessages = await loadRecentMessages(100);
        
        // Group messages into conversation pairs (user + ai response)
        const conversationPairs: Array<{ user: string; ai: string; aiLabel?: string; confidence?: number }> = [];
        for (let i = 0; i < recentMessages.length - 1; i++) {
          if (recentMessages[i].from === 'user' && recentMessages[i + 1].from === 'ai') {
            conversationPairs.push({
              user: recentMessages[i].content,
              ai: recentMessages[i + 1].content,
              aiLabel: recentMessages[i + 1].label || undefined,
              confidence: recentMessages[i + 1].confidence
            });
          }
        }

        console.log(`📊 Found ${conversationPairs.length} conversation pairs to analyze`);

        // Analyze each pair for learning opportunities
        let newSeedsGenerated = 0;
        for (const pair of conversationPairs) {
          // Simulate a unified response for analysis
          const mockResult: UnifiedResponse = {
            content: pair.ai,
            confidence: pair.confidence ?? 0.6,
            label: (pair.aiLabel as any) || 'Reflectievraag',
            emotion: 'neutral',
            reasoning: 'Retroactive analysis',
            symbolicInferences: []
          };

          const outcome = await analyzeTurn(pair.user, mockResult, []);
          if (outcome.triggered) {
            newSeedsGenerated++;
          }
        }

        console.log(`✅ Retroactive learning complete: ${newSeedsGenerated} new seeds generated`);
        setNewSeedsCount(newSeedsGenerated);
        setLastAnalysis(new Date());
      } catch (error) {
        console.error('❌ Retroactive learning failed:', error);
      } finally {
        setIsAnalyzing(false);
      }
    };

    // Run once on mount, then every 24 hours
    analyzeOldConversations();
    const interval = setInterval(analyzeOldConversations, 24 * 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [enabled, analyzeTurn]);

  return { isAnalyzing, lastAnalysis, newSeedsCount };
}
