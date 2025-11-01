
import { supabase } from '@/integrations/supabase/client';
import { incrementApiUsage } from '@/utils/apiUsageTracker';

export type SafetyDecision = 'allow' | 'review' | 'block';

export interface SafetyResult {
  ok: boolean;
  decision: SafetyDecision;
  score: number;
  flags: string[];
  reasons?: string[];
  severity: 'low' | 'medium' | 'high';
  details?: string;
  error?: string;
}

export async function checkPromptSafety(input: string): Promise<SafetyResult> {
  try {
    incrementApiUsage('safety');
    const { data, error } = await supabase.functions.invoke('evai-core', {
      body: { operation: 'safety', text: input }
    });

    if (error) {
      console.error('❌ Safety edge error:', error);
      return {
        ok: false,
        decision: 'allow',
        score: 0,
        flags: [],
        reasons: [],
        severity: 'low',
        error: error.message
      };
    }

    const result = data as {
      ok?: boolean;
      decision?: SafetyDecision;
      score?: number;
      flags?: string[];
      reasons?: string[];
      severity?: string;
      details?: string;
      error?: string;
    };
    const severity = ['low', 'medium', 'high'].includes(String(result?.severity))
      ? (result?.severity as 'low' | 'medium' | 'high')
      : 'low';
    return {
      ok: !!result?.ok,
      decision: result?.decision || 'allow',
      score: typeof result?.score === 'number' ? Math.min(Math.max(result.score, 0), 1) : 0,
      flags: Array.isArray(result?.flags) ? result.flags : [],
      reasons: Array.isArray(result?.reasons) ? result.reasons : [],
      severity,
      details: typeof result?.details === 'string' ? result.details : undefined,
      error: result?.error
    };
  } catch (e) {
    console.error('🔴 Safety check failed:', e);
    return {
      ok: false,
      decision: 'allow',
      score: 0,
      flags: [],
      reasons: [],
      severity: 'low',
      error: e instanceof Error ? e.message : String(e)
    };
  }
}
