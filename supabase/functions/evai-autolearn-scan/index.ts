import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing Supabase env vars in function environment");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const sinceMinutes = Math.max(1, Math.min(1440, Number(body?.sinceMinutes) || 60));
    const sinceIso = new Date(Date.now() - sinceMinutes * 60 * 1000).toISOString();

    const supabase = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!, {
      global: { headers: { Authorization: `Bearer ${SERVICE_ROLE_KEY}` } },
    });

    // Fetch recent decisions
    const { data: decisions, error: decErr } = await supabase
      .from('decision_logs')
      .select('id, created_at, confidence_score, user_input')
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false })
      .limit(200);

    if (decErr) {
      console.error('decisions error', decErr);
      return new Response(
        JSON.stringify({ ok: false, error: decErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const lowConfidence = (decisions || []).filter(d => (d.confidence_score ?? 1) < 0.6);

    // Log summary reflection event
    const { error: logErr } = await supabase.rpc('log_reflection_event', {
      p_trigger_type: 'manual_scan',
      p_context: {
        sinceMinutes,
        totalDecisions: decisions?.length || 0,
        lowConfidenceCount: lowConfidence.length,
        sampledInputs: lowConfidence.slice(0, 5).map(d => d.user_input?.slice(0, 120)),
      },
      p_new_seeds_generated: 0,
      p_learning_impact: Math.min(1, lowConfidence.length / Math.max(1, (decisions?.length || 1)))
    });

    if (logErr) {
      console.error('log_reflection_event error', logErr);
    }

    return new Response(
      JSON.stringify({ ok: true, scanned: decisions?.length || 0, lowConfidence: lowConfidence.length, version: '1.0.0' }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error('autolearn-scan error', error);
    return new Response(
      JSON.stringify({ ok: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
