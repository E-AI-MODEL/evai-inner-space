
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OPENAI_PRIMARY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_SAFETY = Deno.env.get("OPENAI_API_KEY_SAFETY");
const VECTOR_API_KEY = Deno.env.get("VECTOR_API_KEY");

// Rate limiting: 60 requests per minute per IP
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60 * 1000; // 1 minute

function checkRateLimit(clientId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(clientId);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(clientId, { count: 1, resetTime: now + RATE_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }

  if (record.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: RATE_LIMIT - record.count };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting check
  const clientId = req.headers.get("x-forwarded-for") || "unknown";
  const rateLimit = checkRateLimit(clientId);

  if (!rateLimit.allowed) {
    console.warn(`⚠️ Rate limit exceeded for client: ${clientId}`);
    return new Response(
      JSON.stringify({ 
        ok: false, 
        error: "Rate limit exceeded. Please try again later.",
        retryAfter: 60 
      }),
      { 
        status: 429, 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "X-RateLimit-Limit": RATE_LIMIT.toString(),
          "X-RateLimit-Remaining": "0",
          "Retry-After": "60"
        } 
      }
    );
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

    // OPERATION: batch-embed (NEW - FASE 2)
    if (operation === "batch-embed") {
      return await handleBatchEmbed(body);
    }

    // OPERATION: safety
    if (operation === "safety") {
      return await handleSafety(body);
    }

    return new Response(
      JSON.stringify({ ok: false, error: "Unknown operation. Use: chat, embedding, batch-embed, or safety" }),
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
    console.error('🔴 OpenAI embedding error:', errMsg, 'status:', status);
    return new Response(
      JSON.stringify({ ok: false, status, error: errMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

async function handleBatchEmbed(body: any) {
  const keyToUse = VECTOR_API_KEY || OPENAI_PRIMARY;
  if (!keyToUse) {
    return new Response(
      JSON.stringify({ ok: false, error: "No embeddings API key configured" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { items = [], batchSize = 10 } = body || {};

  if (!Array.isArray(items) || items.length === 0) {
    return new Response(
      JSON.stringify({ ok: false, error: "Invalid items array for batch embedding" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  console.log(`🔄 Batch embed: Processing ${items.length} items in batches of ${batchSize}`);

  const results: any[] = [];
  const errors: any[] = [];
  
  // Process in batches to avoid rate limits
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(items.length / batchSize)}`);
    
    for (const item of batch) {
      const { id, text } = item;
      
      if (!id || !text) {
        errors.push({ id: id || 'unknown', error: 'Missing id or text' });
        continue;
      }

      try {
        const resp = await fetch("https://api.openai.com/v1/embeddings", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${keyToUse}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "text-embedding-3-small",
            input: text.substring(0, 8000),
          }),
        });

        const data = await resp.json().catch(() => ({}));

        if (!resp.ok) {
          const errMsg = data?.error?.message || resp.statusText || "OpenAI embedding error";
          console.error(`❌ Batch embed error for item ${id}:`, errMsg);
          errors.push({ id, error: errMsg, status: resp.status });
          continue;
        }

        const embedding = data?.data?.[0]?.embedding;
        if (!embedding) {
          errors.push({ id, error: 'No embedding returned' });
          continue;
        }

        results.push({ id, embedding, success: true });
        
      } catch (error) {
        console.error(`❌ Batch embed exception for item ${id}:`, error);
        errors.push({ id, error: (error as Error).message });
      }
    }
    
    // Rate limiting: small delay between batches
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  const successCount = results.length;
  const errorCount = errors.length;
  const totalProcessed = successCount + errorCount;

  console.log(`✅ Batch embed complete: ${successCount}/${totalProcessed} successful, ${errorCount} errors`);

  return new Response(
    JSON.stringify({
      ok: true,
      results,
      errors,
      summary: {
        total: items.length,
        processed: totalProcessed,
        successful: successCount,
        failed: errorCount,
        successRate: (successCount / totalProcessed * 100).toFixed(2) + '%'
      }
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
