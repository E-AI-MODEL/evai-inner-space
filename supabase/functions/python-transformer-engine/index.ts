import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const HUGGING_FACE_TOKEN = Deno.env.get("HUGGING_FACE_ACCESS_TOKEN");

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
        JSON.stringify({ 
          ok: true, 
          engine: "python-transformer-engine", 
          version: "1.0.0", 
          models: ["sentiment", "emotion", "text-classification", "ner"],
          now: new Date().toISOString() 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { 
      text, 
      task = "sentiment-analysis", 
      model = "nlptown/bert-base-multilingual-uncased-sentiment",
      language = "nl" 
    } = body;

    if (!text?.trim()) {
      return new Response(
        JSON.stringify({ ok: false, error: "text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!HUGGING_FACE_TOKEN) {
      console.error('🔴 HUGGING_FACE_ACCESS_TOKEN not set in Supabase secrets');
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: "Hugging Face token not configured", 
          details: "Set HUGGING_FACE_ACCESS_TOKEN in Supabase Edge Function secrets",
          recommendations: [
            "1. Go to Supabase Dashboard → Settings → Edge Functions",
            "2. Add HUGGING_FACE_ACCESS_TOKEN secret",
            "3. Get token from https://huggingface.co/settings/tokens"
          ],
          action: "https://supabase.com/dashboard/project/ngcyfbstajfcfdhlelbz/settings/functions"
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Select appropriate model based on task and language
    let selectedModel = model;
    switch (task) {
      case "emotion-detection":
        selectedModel = language === "nl" 
          ? "j-hartmann/emotion-english-distilroberta-base" 
          : "j-hartmann/emotion-english-distilroberta-base";
        break;
      case "sentiment-analysis":
        selectedModel = language === "nl" 
          ? "nlptown/bert-base-multilingual-uncased-sentiment"
          : "cardiffnlp/twitter-roberta-base-sentiment-latest";
        break;
      case "text-classification":
        selectedModel = "microsoft/DialoGPT-medium";
        break;
      case "ner":
        selectedModel = "dbmdz/bert-large-cased-finetuned-conll03-english";
        break;
    }

    console.log(`🤖 Python Transformer Engine: ${task} with ${selectedModel}`);

    // Call Hugging Face Inference API with retry logic
    let hfResponse;
    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
      try {
        hfResponse = await fetch(
          `https://api-inference.huggingface.co/models/${selectedModel}`,
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${HUGGING_FACE_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              inputs: text.substring(0, 500),
              options: {
                wait_for_model: true,
                use_cache: true,
              },
            }),
          }
        );

        if (hfResponse.ok) break;
        
        // Handle rate limiting
        if (hfResponse.status === 429) {
          const waitTime = Math.pow(2, retries) * 1000;
          console.log(`⏳ Rate limited, waiting ${waitTime}ms (attempt ${retries + 1}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          retries++;
          continue;
        }

        // Handle model loading (503)
        if (hfResponse.status === 503) {
          const errorData = await hfResponse.json().catch(() => ({}));
          if (errorData.error?.includes('loading')) {
            const waitTime = (errorData.estimated_time || 20) * 1000;
            console.log(`🔄 Model loading, waiting ${waitTime}ms (attempt ${retries + 1}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            retries++;
            continue;
          }
        }

        break;

      } catch (fetchError) {
        console.error(`❌ Fetch attempt ${retries + 1}/${maxRetries} failed:`, fetchError);
        retries++;
        if (retries >= maxRetries) throw fetchError;
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
      }
    }

    if (!hfResponse || !hfResponse.ok) {
      const errorData = await hfResponse?.json().catch(() => ({}));
      const errorMsg = `Hugging Face API error: ${hfResponse?.status || 'unknown'} - ${errorData?.error || hfResponse?.statusText || 'no response'}`;
      console.error('🔴', errorMsg, {
        model: selectedModel,
        task: task,
        status: hfResponse?.status,
        errorData: errorData
      });
      
      return new Response(
        JSON.stringify({
          ok: false,
          engine: "python-transformer-engine",
          error: errorMsg,
          details: errorData?.error || "Hugging Face API request failed",
          recommendations: [
            "Check if HUGGING_FACE_ACCESS_TOKEN is valid",
            "Verify model name is correct",
            "Try again in a few moments (model may be loading)",
            "Check Hugging Face API status at https://status.huggingface.co"
          ],
          meta: {
            processingTime: Date.now() - startedAt,
            model: selectedModel,
            task: task,
            retries: retries
          }
        }),
        { status: hfResponse?.status || 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const hfResult = await hfResponse.json();
    const processingTime = Date.now() - startedAt;

    // Transform result based on task
    let transformedResult;
    switch (task) {
      case "sentiment-analysis":
        transformedResult = {
          sentiment: hfResult[0]?.label?.toLowerCase(),
          confidence: hfResult[0]?.score || 0,
          scores: hfResult
        };
        break;
      
      case "emotion-detection":
        transformedResult = {
          emotion: hfResult[0]?.label?.toLowerCase(),
          confidence: hfResult[0]?.score || 0,
          all_emotions: hfResult.map((r: any) => ({
            emotion: r.label?.toLowerCase(),
            score: r.score
          }))
        };
        break;
      
      case "text-classification":
        transformedResult = {
          classification: hfResult[0]?.label,
          confidence: hfResult[0]?.score || 0,
          all_classes: hfResult
        };
        break;
      
      case "ner":
        transformedResult = {
          entities: hfResult.map((entity: any) => ({
            text: entity.word,
            label: entity.entity,
            confidence: entity.score,
            start: entity.start,
            end: entity.end
          }))
        };
        break;
      
      default:
        transformedResult = { raw_result: hfResult };
    }

    // Optional: Log to Supabase for analytics
    if (SUPABASE_URL && SERVICE_ROLE_KEY) {
      try {
        const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
        await supabase.rpc('log_evai_workflow', {
          p_conversation_id: `python-engine-${Date.now()}`,
          p_workflow_type: 'python_transformer_engine',
          p_api_collaboration: {
            api1Used: false,
            api2Used: false,
            vectorApiUsed: false,
            googleApiUsed: false,
            pythonEngineUsed: true,
            huggingFaceUsed: true,
            task: task,
            model: selectedModel
          },
          p_processing_time: processingTime,
          p_success: true,
          p_error_details: null
        });
      } catch (logError) {
        console.warn('Failed to log to Supabase:', logError);
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        engine: "python-transformer-engine",
        task: task,
        model: selectedModel,
        result: transformedResult,
        meta: {
          processingTime,
          language,
          inputLength: text.length,
          version: "1.0.0"
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Python Transformer Engine error:', error);
    const processingTime = Date.now() - startedAt;
    
    return new Response(
      JSON.stringify({
        ok: false,
        engine: "python-transformer-engine",
        error: error instanceof Error ? error.message : "Unknown error",
        meta: {
          processingTime,
          version: "1.0.0"
        }
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});