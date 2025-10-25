import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { password } = await req.json();
    
    if (!password) {
      return new Response(
        JSON.stringify({ authenticated: false, error: 'Password required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get admin password from environment
    const ADMIN_PASSWORD = Deno.env.get('ADMIN_PASSWORD') || 'admin123';
    
    // Simple password comparison
    const authenticated = password === ADMIN_PASSWORD;
    
    console.log(`Admin auth attempt: ${authenticated ? 'SUCCESS' : 'FAILED'}`);
    
    return new Response(
      JSON.stringify({ authenticated }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: authenticated ? 200 : 401
      }
    );
  } catch (error) {
    console.error('Admin auth error:', error);
    return new Response(
      JSON.stringify({ 
        authenticated: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
