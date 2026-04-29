import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProvisionRequest {
  packageId: string;
  orderId: string;
  userEmail: string;
}

serve(async (req) => {
  console.log('[Provision] eSIM router request received');
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { packageId, orderId, userEmail }: ProvisionRequest = await req.json();
    console.log('[Provision] Routing order:', { packageId, orderId, userEmail });

    // Get package with provider information
    const { data: packageData, error: packageError } = await supabaseClient
      .from('esim_packages')
      .select(`
        *,
        esim_providers (
          id,
          provider_code,
          provider_name,
          is_active
        )
      `)
      .eq('id', packageId)
      .single();

    if (packageError || !packageData) {
      console.error('[Provision] Package not found:', packageError);
      throw new Error('Package not found');
    }

    const provider = packageData.esim_providers;
    
    if (!provider) {
      console.error('[Provision] No provider assigned to package:', packageId);
      throw new Error('Package has no provider assigned. Please contact support.');
    }

    if (!provider.is_active) {
      console.error('[Provision] Provider is inactive:', provider.provider_code);
      throw new Error('Provider is currently unavailable. Please try again later.');
    }

    // Update order with provider information
    await supabaseClient
      .from('orders')
      .update({
        provider_id: provider.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    console.log('[Provision] Routing to provider:', provider.provider_code);

    // Route to the appropriate provider edge function
    let result;
    switch (provider.provider_code) {
      case 'usimsa':
        result = await supabaseClient.functions.invoke('usimsa-integration', {
          body: { packageId, orderId, userEmail },
        });
        break;
        
      case 'tuge':
        result = await supabaseClient.functions.invoke('tuge-integration', {
          body: { packageId, orderId, userEmail },
        });
        break;
        
      default:
        throw new Error(`Unknown provider: ${provider.provider_code}`);
    }

    console.log('[Provision] Provider response:', result);

    if (result.error) {
      throw new Error(result.error.message || 'Provider integration failed');
    }

    return new Response(JSON.stringify({
      success: true,
      provider: provider.provider_code,
      ...result.data,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error('[Provision] Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
