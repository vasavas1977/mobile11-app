import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Activating Global 109 Countries Limitless packages...');

    // Update all Global 109 Countries Limitless packages to active
    const { data, error } = await supabase
      .from('esim_packages')
      .update({ 
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .ilike('name', '%Global 109%')
      .eq('package_type', 'limitless')
      .select('package_id, name, validity_days, price, is_active');

    if (error) {
      console.error('Error activating packages:', error);
      throw error;
    }

    console.log(`Successfully activated ${data?.length || 0} packages:`, data);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Activated ${data?.length || 0} Global 109 Limitless packages`,
        packages: data
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error:', errorMessage);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
