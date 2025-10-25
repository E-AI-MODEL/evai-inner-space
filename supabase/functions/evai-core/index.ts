
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OPENAI_PRIMARY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_SAFETY = Deno.env.get("OPENAI_API_KEY_SAFETY");
const VECTOR_API_KEY = Deno.env.get("VECTOR_API_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { operation } = body || {};

    console.log(`🧠 evai-core: operation=${operation}`);
    console.log(`🔑 Secrets status: OPENAI=${!!OPENAI_PRIMARY}, SAFETY=${!!OPENAI_SAFETY}, VECTOR=${!!VECTOR_API_KEY}`);

    // OPERATION: chat
    if (operation === "chat") {
      return await handleChat(body);
    }

    // OPERATION: embedding
    if (operation === "embedding") {
      return await handleEmbedding(body);
    }

    // OPERATION: safety
    if (operation === "safety") {
      return await handleSafety(body);
    }

    return new Response(
      JSON.stringify({ ok: false, error: "Unknown operation. Use: chat, embedding, or safety" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("🔴 evai-core error:", error);
    return new Response(
      JSON.stringify({ ok: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function handleChat(body: any) {
  console.log(`🔑 Chat: OPENAI_PRIMARY exists? ${!!OPENAI_PRIMARY}`);
  console.log(`🔑 Chat: OPENAI_PRIMARY length: ${OPENAI_PRIMARY?.length || 0}`);
  
  if (!OPENAI_PRIMARY || OPENAI_PRIMARY.trim() === '') {
    console.error("🔴 OPENAI_API_KEY not configured or empty");
    return new Response(
      JSON.stringify({ ok: false, error: "OPENAI_API_KEY not configured or empty" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const {
    messages,
    prompt,
    model = "gpt-4o-mini",
    temperature = 0.5,
    max_tokens = 400,
    response_format,
  } = body || {};

  console.log(`🔑 Chat: model=${model}`);

  const finalMessages = Array.isArray(messages) && messages.length
    ? messages
    : [{ role: "user", content: prompt || "Say OK" }];

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_PRIMARY}`,
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
    const errMsg = data?.error?.message || resp.statusText || "OpenAI chat error";
    return new Response(
      JSON.stringify({ ok: false, status, error: errMsg }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleEmbedding(body: any) {
  const keyToUse = VECTOR_API_KEY || OPENAI_PRIMARY;
  if (!keyToUse) {
    return new Response(
      JSON.stringify({ ok: false, error: "No embeddings API key configured" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const {
    input,
    model = "text-embedding-3-small",
  } = body || {};

  if (!input || (typeof input !== "string" && !Array.isArray(input))) {
    return new Response(
      JSON.stringify({ ok: false, error: "Invalid input for embeddings" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  console.log(`🔑 Embedding: model=${model}`);

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
    const errMsg = data?.error?.message || resp.statusText || "OpenAI embedding error";
    return new Response(
      JSON.stringify({ ok: false, status, error: errMsg }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleSafety(body: any) {
  const keyToUse = OPENAI_SAFETY || OPENAI_PRIMARY;
  if (!keyToUse) {
    return new Response(
      JSON.stringify({ ok: false, error: "No safety API key configured" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { text, model = "gpt-4o-mini" } = body || {};

  if (!text || typeof text !== "string") {
    return new Response(
      JSON.stringify({ ok: false, error: "Invalid text for safety check" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  console.log(`🔑 Safety: model=${model}`);

  const messages = [
    {
      role: "system",
      content: "You are a content safety analyzer. Respond with JSON only: {safe: boolean, reason: string, severity: 'low'|'medium'|'high'}",
    },
    { role: "user", content: `Analyze this text for safety concerns: "${text}"` },
  ];

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${keyToUse}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.3,
      max_tokens: 150,
      response_format: { type: "json_object" },
    }),
  });

  const status = resp.status;
  const data = await resp.json().catch(() => ({}));

  if (!resp.ok) {
    const errMsg = data?.error?.message || resp.statusText || "OpenAI safety error";
    return new Response(
      JSON.stringify({ ok: false, status, error: errMsg }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const content = data?.choices?.[0]?.message?.content ?? "{}";
  let safetyResult;
  try {
    safetyResult = JSON.parse(content);
  } catch {
    safetyResult = { safe: true, reason: "Parse error", severity: "low" };
  }

  return new Response(
    JSON.stringify({
      ok: true,
      safe: safetyResult.safe !== false,
      reason: safetyResult.reason || "No concerns detected",
      severity: safetyResult.severity || "low",
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
