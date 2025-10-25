
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ ok: false, error: "OPENAI_API_KEY not configured in Supabase secrets" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json().catch(() => ({}));
    const {
      messages,
      prompt,
      model = "gpt-4o-mini",
      temperature = 0.5,
      max_tokens = 400,
      response_format,
    } = body || {};

    console.log(`🔑 Using OpenAI API key for model: ${model}`);

    const finalMessages = Array.isArray(messages) && messages.length
      ? messages
      : [{ role: "user", content: prompt || "Say OK" }];

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: finalMessages,
        temperature,
        max_tokens,
        ...(response_format ? { response_format } : {}),
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

    const content = data?.choices?.[0]?.message?.content ?? "";
    return new Response(
      JSON.stringify({
        ok: true,
        model: data?.model || model,
        content,
        usage: data?.usage,
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
