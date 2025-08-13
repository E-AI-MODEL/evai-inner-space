import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing Supabase env vars in function environment");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startedAt = Date.now();

  try {
    const body = await req.json().catch(() => ({}));
    const ping = !!body?.ping;

    if (ping) {
      return new Response(
        JSON.stringify({ ok: true, version: "1.0.0", now: new Date().toISOString() }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userInput: string = String(body?.userInput || "").slice(0, 4000);
    const history: Array<{ role: string; content: string }> = Array.isArray(body?.history)
      ? body.history.map((m: any) => ({ role: String(m.role || 'user'), content: String(m.content || '') }))
      : [];

    if (!userInput.trim()) {
      return new Response(
        JSON.stringify({ ok: false, error: "userInput is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!, {
      global: { headers: { Authorization: `Bearer ${SERVICE_ROLE_KEY}` } },
    });

    // Optional: prompt safety (best-effort, non-blocking)
    let safetyDecision = 'allow';
    try {
      const safety = await supabase.functions.invoke('openai-safety', { body: { input: userInput } });
      if ((safety.data as any)?.decision) safetyDecision = (safety.data as any).decision;
    } catch (e) {
      console.warn('safety check failed, continuing', e);
    }

    // Optional: embedding (best-effort)
    let embedding: number[] | null = null;
    try {
      const emb = await supabase.functions.invoke('openai-embedding', {
        body: { input: userInput.substring(0, 8000), model: 'text-embedding-3-small' }
      });
      embedding = (emb.data as any)?.embedding || null;
    } catch (e) {
      console.warn('embedding generation failed, continuing', e);
    }

    // Generate response using OpenAI
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Je bent een empathische therapeutische AI (Nederlands). Antwoord als JSON met velden: emotion, confidence, response, reasoning, label, symbolicInferences (array).' },
          ...history.slice(-6),
          { role: 'user', content: userInput }
        ],
        temperature: 0.7,
        max_tokens: 400,
        response_format: { type: 'json_object' }
      })
    });

    const openaiJson = await openaiRes.json();
    const content: string = openaiJson?.choices?.[0]?.message?.content || '';

    let parsed: any = null;
    try {
      const match = typeof content === 'string' ? content.match(/\{[\s\S]*\}/) : null;
      parsed = match ? JSON.parse(match[0]) : JSON.parse(content);
    } catch {
      parsed = {};
    }

    const responseText = parsed?.response || (typeof content === 'string' ? content : '');
    const emotion = parsed?.emotion || 'neutral';
    const confidence = Math.max(0.1, Math.min(1, parsed?.confidence ?? 0.6));
    const label = parsed?.label || 'Valideren';
    const reasoning = parsed?.reasoning || 'Neural orchestration';
    const symbolicInferences: string[] = Array.isArray(parsed?.symbolicInferences) ? parsed.symbolicInferences : [];

    const processingTime = Date.now() - startedAt;

    // Log workflow (best-effort)
    try {
      await supabase.rpc('log_evai_workflow', {
        p_conversation_id: `orchestrate-${Date.now()}`,
        p_workflow_type: 'orchestrate_v1',
        p_api_collaboration: {
          api1Used: true,
          api2Used: false,
          vectorApiUsed: !!embedding,
          googleApiUsed: false,
          seedGenerated: false,
          secondaryAnalysis: false
        },
        p_rubrics_data: { safetyDecision },
        p_processing_time: processingTime,
        p_success: true,
        p_error_details: null
      });
    } catch (e) {
      console.warn('log_evai_workflow failed', e);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        response: {
          content: responseText,
          emotion,
          confidence,
          label,
          reasoning,
          symbolicInferences
        },
        meta: { processingTime, componentsUsed: ['orchestrate', 'openai', embedding ? 'embedding' : 'no-embedding'], version: '1.0.0' }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error('evai-orchestrate error', error);
    return new Response(
      JSON.stringify({ ok: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
