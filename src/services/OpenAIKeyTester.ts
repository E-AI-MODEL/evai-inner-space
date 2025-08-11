export interface SupabaseOpenAIKeyTestResult {
  ok: boolean;
  status?: number;
  error?: string;
  model?: string;
  content?: string;
}

export async function testSupabaseOpenAIKey(): Promise<SupabaseOpenAIKeyTestResult> {
  try {
    const url = `${location.origin}/functions/v1/test-openai-key`;
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
    const data = (await res.json()) as SupabaseOpenAIKeyTestResult;
    return data;
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
