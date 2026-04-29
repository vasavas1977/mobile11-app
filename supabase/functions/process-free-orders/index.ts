import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const freeOrdersSchema = z.object({
  orderIds: z.array(z.string().uuid('Invalid order ID format')).min(1, 'At least one order ID required').max(50, 'Too many orders'),
  environment: z.enum(['test', 'production'], { errorMap: () => ({ message: 'Environment must be "test" or "production"' }) })
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // Validate input
    const body = await req.json();
    const validationResult = freeOrdersSchema.safeParse(body);
    
    if (!validationResult.success) {
      console.error('[PROCESS-FREE-ORDERS] Validation failed:', validationResult.error.errors);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request data', 
          details: validationResult.error.errors 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { orderIds, environment } = validationResult.data;
    console.log('[PROCESS-FREE-ORDERS] Processing orders:', orderIds);

    // Fetch all orders with their package_id
    const { data: orders, error: ordersError } = await supabaseClient
      .from('orders')
      .select('id, package_id, user_id')
      .in('id', orderIds);

    if (ordersError) {
      console.error('[PROCESS-FREE-ORDERS] Error fetching orders:', ordersError);
      throw ordersError;
    }

    const results = [];
    
    // Retry helper with exponential backoff
    const withRetry = async <T>(
      fn: () => Promise<{ data: T; error: Error | null }>,
      orderId: string,
      maxRetries: number = 3
    ): Promise<{ data: T | null; error: Error | null }> => {
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const result = await fn();
          if (!result.error && result.data && (result.data as any).success !== false) {
            return result;
          }
          if (result.error) {
            console.error(`[PROCESS-FREE-ORDERS] Attempt ${attempt + 1}/${maxRetries} failed for order ${orderId}:`, result.error);
          }
        } catch (e: any) {
          console.error(`[PROCESS-FREE-ORDERS] Exception on attempt ${attempt + 1}/${maxRetries} for order ${orderId}:`, e);
        }
        if (attempt < maxRetries - 1) {
          const delay = 1000 * Math.pow(2, attempt);
          console.log(`[PROCESS-FREE-ORDERS] Retrying order ${orderId} in ${delay}ms...`);
          await new Promise(r => setTimeout(r, delay));
        }
      }
      return { data: null, error: new Error('All retry attempts failed') };
    };

    // Process each order sequentially
    for (const order of orders || []) {
      console.log('[PROCESS-FREE-ORDERS] Processing order:', order.id);
      
      // Fetch user email separately
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('email')
        .eq('user_id', order.user_id)
        .single();
      
      // Route through provision-esim router (handles USIMSA and TUGE)
      const { data, error } = await withRetry(
        () => supabaseClient.functions.invoke('provision-esim', {
          body: {
            packageId: order.package_id,
            orderId: order.id,
            userEmail: profile?.email
          }
        }),
        order.id
      );

      if (error || !data || (data as any).success === false) {
        console.error('[PROCESS-FREE-ORDERS] Error for order', order.id, ':', error?.message || 'Provisioning failed');
        
        // Fetch existing webhook_data to preserve referral fields
        const { data: existingOrderData } = await supabaseClient
          .from('orders').select('webhook_data').eq('id', order.id).single();
        
        // Mark as needs_attention for admin review
        await supabaseClient
          .from('orders')
          .update({ 
            status: 'needs_attention',
            webhook_data: { 
              ...(existingOrderData?.webhook_data as Record<string, unknown> || {}),
              error: error?.message || 'Provisioning failed after retries', 
              timestamp: new Date().toISOString() 
            }
          })
          .eq('id', order.id);
        
        results.push({ orderId: order.id, success: false, error: error?.message || 'Provisioning failed' });
      } else {
        console.log('[PROCESS-FREE-ORDERS] Success for order', order.id);
        results.push({ orderId: order.id, success: true, data });
        
        // Attribute affiliate sale
        try {
          const { data: affiliateResult, error: affiliateError } = await supabaseClient.functions.invoke('attribute-affiliate-sale', {
            body: { order_id: order.id }
          });
          
          if (affiliateError) {
            console.error('[PROCESS-FREE-ORDERS] Failed to attribute affiliate sale:', affiliateError);
          } else if (affiliateResult?.attributed) {
            console.log('[PROCESS-FREE-ORDERS] Affiliate sale attributed for order:', order.id);
          }
        } catch (affiliateErr) {
          console.error('[PROCESS-FREE-ORDERS] Exception attributing affiliate:', affiliateErr);
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      results
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });

  } catch (error: any) {
    console.error('[PROCESS-FREE-ORDERS] Error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});
