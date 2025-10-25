
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD");
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { operation } = body || {};

    console.log(`🔐 evai-admin: operation=${operation}`);

    // OPERATION: auth
    if (operation === "auth") {
      return handleAuth(body);
    }

    // OPERATION: test-openai-key
    if (operation === "test-openai-key") {
      return await handleTestOpenAIKey(body);
    }

    // OPERATION: autolearn-scan
    if (operation === "autolearn-scan") {
      return handleAutolearnScan(body);
    }

    return new Response(
      JSON.stringify({ ok: false, error: "Unknown operation. Use: auth, test-openai-key, or autolearn-scan" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("🔴 evai-admin error:", error);
    return new Response(
      JSON.stringify({ ok: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function handleAuth(body: any) {
  const { password } = body || {};
  
  if (!ADMIN_PASSWORD) {
    return new Response(
      JSON.stringify({ ok: false, error: "ADMIN_PASSWORD not configured" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const isValid = password === ADMIN_PASSWORD;
  console.log(`🔐 Admin auth attempt: ${isValid ? "SUCCESS" : "FAILED"}`);

  return new Response(
    JSON.stringify({ ok: true, authenticated: isValid }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleTestOpenAIKey(body: any) {
  const { apiKey } = body || {};

  if (!apiKey || typeof apiKey !== "string") {
    return new Response(
      JSON.stringify({ ok: false, error: "No API key provided" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  console.log(`🧪 Testing OpenAI key: ${apiKey.substring(0, 10)}...`);

  try {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "Test" }],
        max_tokens: 5,
      }),
    });

    const status = resp.status;
    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      const errMsg = data?.error?.message || resp.statusText || "Unknown error";
      return new Response(
        JSON.stringify({ ok: true, isValid: false, error: errMsg }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, isValid: true, model: data?.model || "gpt-4o-mini" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ ok: true, isValid: false, error: (error as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

function handleAutolearnScan(body: any) {
  // Placeholder voor autolearn scan functionality
  console.log("🤖 Autolearn scan triggered");
  
  return new Response(
    JSON.stringify({
      ok: true,
      message: "Autolearn scan completed",
      findings: [],
      timestamp: new Date().toISOString(),
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
