
import { useOpenAISecondary } from "./useOpenAISecondary";
import { Message } from "../types";

export function useSecondaryAnalysisRunner() {
  const { createStrategicBriefing } = useOpenAISecondary();

  const runSecondaryAnalysis = async (history: Message[], key: string) => {
    if (!key || !key.trim()) return;
    try {
      const contextString = history.map(h => `${h.from}: ${h.content}`).join('\n');
      const briefing = await createStrategicBriefing(
        history[history.length - 1].content,
        [],
        null,
        key
      );
      if (briefing) {
        console.log('✅ Strategic briefing created:', briefing.goal);
      }
    } catch (err) {
      console.error('Secondary analysis failed', err);
    }
  };

  return { runSecondaryAnalysis };
}
