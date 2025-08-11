import { supabase } from "@/integrations/supabase/client";

export interface SupabaseOpenAIKeyTestResult {
  ok: boolean;
  status?: number;
  error?: string;
  model?: string;
  content?: string;
}

export async function testSupabaseOpenAIKey(): Promise<SupabaseOpenAIKeyTestResult> {
  try {
    const { data, error } = await supabase.functions.invoke('test-openai-key', { body: {} });
    if (error) return { ok: false, error: error.message };
    return data as SupabaseOpenAIKeyTestResult;
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
