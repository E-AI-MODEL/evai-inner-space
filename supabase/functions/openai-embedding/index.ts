
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OPENAI_PRIMARY = Deno.env.get("OPENAI_API_KEY");
const VECTOR_API_KEY = Deno.env.get("VECTOR_API_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const keyToUse = VECTOR_API_KEY || OPENAI_PRIMARY;
    if (!keyToUse) {
      return new Response(
        JSON.stringify({ ok: false, error: "No embeddings-capable API key configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json().catch(() => ({}));
    const {
      input,
      model = "text-embedding-3-small",
    } = body || {};

    if (!input || (typeof input !== "string" && !Array.isArray(input))) {
      return new Response(
        JSON.stringify({ ok: false, error: "Invalid input for embeddings" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const normalizedInput = typeof input === "string" ? input : input;
    const resp = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${keyToUse}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        input: normalizedInput,
      }),
    });

    const status = resp.status;
    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      const errMsg = data?.error?.message || resp.statusText || "OpenAI error";
      return new Response(
        JSON.stringify({ ok: false, status, error: errMsg }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const embeddings = Array.isArray(data?.data)
      ? data.data.map((d: any) => d.embedding)
      : [];

    return new Response(
      JSON.stringify({
        ok: true,
        model: data?.model || model,
        embeddings,
        embedding: embeddings[0] || null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ ok: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
