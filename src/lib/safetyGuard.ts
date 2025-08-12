
import { supabase } from '@/integrations/supabase/client';
import { incrementApiUsage } from '@/utils/apiUsageTracker';

export type SafetyDecision = 'allow' | 'review' | 'block';

export interface SafetyResult {
  ok: boolean;
  decision: SafetyDecision;
  score: number;
  flags: string[];
  reasons?: string[];
  error?: string;
}

export async function checkPromptSafety(input: string): Promise<SafetyResult> {
  try {
    incrementApiUsage('safety');
    const { data, error } = await supabase.functions.invoke('openai-safety', {
      body: { input }
    });

    if (error) {
      console.error('❌ Safety edge error:', error);
      return { ok: false, decision: 'allow', score: 0, flags: [], error: error.message };
    }

    const result = data as any;
    return {
      ok: !!result?.ok,
      decision: (result?.decision as SafetyDecision) || 'allow',
      score: typeof result?.score === 'number' ? result.score : 0,
      flags: Array.isArray(result?.flags) ? result.flags : [],
      reasons: Array.isArray(result?.reasons) ? result.reasons : []
    };
  } catch (e) {
    console.error('🔴 Safety check failed:', e);
    return { ok: false, decision: 'allow', score: 0, flags: [], error: e instanceof Error ? e.message : String(e) };
  }
}
