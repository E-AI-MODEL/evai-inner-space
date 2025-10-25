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

    // Generate multiple seeds from low confidence decisions
    let seedsGenerated = 0;
    try {
      if (lowConfidence.length > 0) {
        const seedsToGenerate = lowConfidence.slice(0, 5).map(decision => ({
          emotion: 'onzeker',
          label: 'Reflectievraag',
          response: { 
            nl: `Ik merk dat je het moeilijk vindt. Wat maakt dit zo lastig voor je? (Context: ${(decision.user_input || '').slice(0, 100)})` 
          },
          meta: {
            source: 'autolearn-scan',
            reason: 'low_confidence',
            confidence: decision.confidence_score || 0.5,
            triggers: ['onzeker', 'twijfel', 'moeilijk'],
            sampled_input: (decision.user_input || '').slice(0, 180),
            original_decision_id: decision.id
          },
          active: true
        }));

        const { data: inserted, error: seedErr } = await supabase
          .from('emotion_seeds')
          .insert(seedsToGenerate)
          .select();

        if (!seedErr && inserted) {
          seedsGenerated = inserted.length;
          console.log(`✅ Generated ${seedsGenerated} learning seeds from low-confidence decisions`);
        } else {
          console.warn('seed insert error', seedErr);
        }
      }
    } catch (e) {
      console.warn('seed generation skipped due to error', e);
    }

    // Log summary reflection event
    const { error: logErr } = await supabase.rpc('log_reflection_event', {
      p_trigger_type: 'manual_scan',
      p_context: {
        sinceMinutes,
        totalDecisions: decisions?.length || 0,
        lowConfidenceCount: lowConfidence.length,
        sampledInputs: lowConfidence.slice(0, 5).map(d => d.user_input?.slice(0, 120)),
      },
      p_new_seeds_generated: seedsGenerated,
      p_learning_impact: Math.min(1, lowConfidence.length / Math.max(1, (decisions?.length || 1)))
    });

    if (logErr) {
      console.error('log_reflection_event error', logErr);
    }

    return new Response(
      JSON.stringify({ 
        ok: true, 
        scanned: decisions?.length || 0, 
        lowConfidence: lowConfidence.length, 
        seedsGenerated,
        version: '2.0.0',
        diagnostics: {
          confidenceDistribution: {
            veryLow: decisions?.filter(d => (d.confidence_score ?? 1) < 0.4).length || 0,
            low: lowConfidence.length,
            medium: decisions?.filter(d => (d.confidence_score ?? 1) >= 0.6 && (d.confidence_score ?? 1) < 0.8).length || 0,
            high: decisions?.filter(d => (d.confidence_score ?? 1) >= 0.8).length || 0
          },
          timeRange: {
            from: sinceIso,
            to: new Date().toISOString()
          }
        }
      }),
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
