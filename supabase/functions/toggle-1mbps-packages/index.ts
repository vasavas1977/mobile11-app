import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action } = await req.json();

    if (!action || !['hide', 'show'].includes(action)) {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use "hide" or "show"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const newActiveState = action === 'show';

    console.log(`[toggle-1mbps-packages] Action: ${action}, Setting is_active to ${newActiveState}`);

    // First count how many will be affected
    const { count: affectedCount, error: countError } = await supabase
      .from('esim_packages')
      .select('id', { count: 'exact', head: true })
      .eq('package_type', 'limitless')
      .eq('qos_speed', '1Mbps')
      .eq('is_active', !newActiveState);

    if (countError) {
      console.error('[toggle-1mbps-packages] Count error:', countError);
      throw countError;
    }

    console.log(`[toggle-1mbps-packages] Found ${affectedCount} packages to ${action}`);

    // Update all matching packages
    const { error: updateError } = await supabase
      .from('esim_packages')
      .update({ is_active: newActiveState, updated_at: new Date().toISOString() })
      .eq('package_type', 'limitless')
      .eq('qos_speed', '1Mbps');

    if (updateError) {
      console.error('[toggle-1mbps-packages] Update error:', updateError);
      throw updateError;
    }

    console.log(`[toggle-1mbps-packages] Successfully ${action === 'hide' ? 'hidden' : 'shown'} ${affectedCount} packages`);

    return new Response(
      JSON.stringify({
        success: true,
        action,
        affectedCount: affectedCount || 0,
        message: `Successfully ${action === 'hide' ? 'hidden' : 'restored'} ${affectedCount || 0} limitless 1Mbps packages`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[toggle-1mbps-packages] Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
