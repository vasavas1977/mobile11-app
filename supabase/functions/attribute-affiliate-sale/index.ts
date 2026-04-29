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

    const { order_id, session_id, affiliate_id } = await req.json();

    if (!order_id) {
      console.log('No order_id provided');
      return new Response(
        JSON.stringify({ error: 'order_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Attributing sale for order:', order_id);

    // Get order details including discount info
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, total_amount, original_amount, discount_amount, affiliate_id, affiliate_session_id, status')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', orderError);
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const orderAmount = parseFloat(order.total_amount);
    const originalAmount = parseFloat(order.original_amount || order.total_amount);
    const isFreeOrder = orderAmount <= 0;

    if (isFreeOrder) {
      console.log(`[FREE ORDER] Order ${order_id}: $${orderAmount} total (original: $${originalAmount})`);
      console.log('[FREE ORDER] Conversion will be recorded but excluded from KPI metrics');
    }

    // Determine affiliate ID - priority: direct affiliate_id > order's affiliate_id > session lookup
    let resolvedAffiliateId = affiliate_id || order.affiliate_id;
    let resolvedSessionId = session_id || order.affiliate_session_id;
    let linkId: string | null = null;

    // If no affiliate ID but have session, look up from clicks
    if (!resolvedAffiliateId && resolvedSessionId) {
      console.log('Looking up affiliate from session:', resolvedSessionId);
      const { data: clickData } = await supabase
        .from('affiliate_clicks')
        .select('affiliate_id, link_id, clicked_at')
        .eq('session_id', resolvedSessionId)
        .order('clicked_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (clickData) {
        // Check if click is within 30-day attribution window
        const clickDate = new Date(clickData.clicked_at);
        const now = new Date();
        const daysDiff = (now.getTime() - clickDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysDiff <= 30) {
          resolvedAffiliateId = clickData.affiliate_id;
          linkId = clickData.link_id;
          console.log('Found affiliate from session:', resolvedAffiliateId);
        } else {
          console.log('Click is outside 30-day attribution window');
        }
      }
    }

    if (!resolvedAffiliateId) {
      console.log('No affiliate to attribute for order:', order_id);
      return new Response(
        JSON.stringify({ success: true, attributed: false, reason: 'No affiliate found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if conversion already exists for this order
    const { data: existingConversion } = await supabase
      .from('affiliate_conversions')
      .select('id')
      .eq('order_id', order_id)
      .maybeSingle();

    if (existingConversion) {
      console.log('Conversion already exists for order:', order_id);
      return new Response(
        JSON.stringify({ success: true, attributed: false, reason: 'Conversion already exists' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get affiliate details
    const { data: affiliate, error: affiliateError } = await supabase
      .from('affiliates')
      .select('id, user_id, parent_affiliate_id, commission_type, commission_rate, status')
      .eq('id', resolvedAffiliateId)
      .single();

    if (affiliateError || !affiliate) {
      console.error('Affiliate not found:', affiliateError);
      return new Response(
        JSON.stringify({ error: 'Affiliate not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (affiliate.status !== 'active') {
      console.log('Affiliate is not active:', affiliate.status);
      return new Response(
        JSON.stringify({ success: true, attributed: false, reason: 'Affiliate not active' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate commission - $0 for free orders
    let commissionAmount: number = 0;
    let effectiveRate: number = affiliate.commission_rate;

    if (!isFreeOrder) {
      // Get dynamic commission rate based on tier
      const { data: commissionRate } = await supabase.rpc('get_affiliate_commission_rate', {
        p_affiliate_id: resolvedAffiliateId
      });

      // Use dynamic rate from tier system, fallback to affiliate's stored rate
      effectiveRate = commissionRate || affiliate.commission_rate;
      
      if (affiliate.commission_type === 'percentage') {
        commissionAmount = (orderAmount * effectiveRate) / 100;
      } else {
        commissionAmount = affiliate.commission_rate; // Fixed amount uses stored rate
      }

      // Round to 2 decimal places
      commissionAmount = Math.round(commissionAmount * 100) / 100;
      console.log('Commission calculated:', commissionAmount, 'at rate:', effectiveRate, '%');
    } else {
      console.log('[FREE ORDER] Commission set to $0 - excluded from earnings');
    }

    // Check for parent affiliate (for override commission using dynamic rate)
    // Only calculate override for paid orders
    let overrideAffiliateId: string | null = null;
    let overrideRate: number | null = null;
    let overrideAmount: number = 0;

    if (affiliate.parent_affiliate_id && !isFreeOrder) {
      const { data: parentAffiliate } = await supabase
        .from('affiliates')
        .select('id, status')
        .eq('id', affiliate.parent_affiliate_id)
        .eq('status', 'active')
        .maybeSingle();

      if (parentAffiliate) {
        // Get dynamic override rate
        const { data: dynamicOverrideRate } = await supabase.rpc('get_affiliate_override_rate', {
          p_affiliate_id: parentAffiliate.id
        });
        
        overrideAffiliateId = parentAffiliate.id;
        overrideRate = dynamicOverrideRate || 2;
        overrideAmount = Math.round((orderAmount * (overrideRate || 2) / 100) * 100) / 100;
        console.log('Override commission:', overrideAmount, 'at rate:', overrideRate, '%');
      }
    } else if (affiliate.parent_affiliate_id && isFreeOrder) {
      console.log('[FREE ORDER] Override commission skipped for parent affiliate');
    }

    // Create conversion record with appropriate status
    const { data: conversion, error: conversionError } = await supabase
      .from('affiliate_conversions')
      .insert({
        affiliate_id: resolvedAffiliateId,
        order_id: order_id,
        link_id: linkId,
        customer_user_id: order.user_id,
        order_amount: orderAmount,
        commission_type: affiliate.commission_type,
        commission_rate: affiliate.commission_rate,
        commission_amount: commissionAmount,
        override_affiliate_id: overrideAffiliateId,
        override_rate: overrideRate,
        override_amount: overrideAmount,
        status: isFreeOrder ? 'free_order' : 'pending',
      })
      .select()
      .single();

    if (conversionError) {
      console.error('Error creating conversion:', conversionError);
      return new Response(
        JSON.stringify({ error: 'Failed to create conversion' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Conversion created:', conversion.id, isFreeOrder ? '(free_order status)' : '(pending status)');

    // Update affiliate stats - exclude free orders from conversion count and earnings
    const { error: statsError } = await supabase.rpc('update_affiliate_stats', {
      p_affiliate_id: resolvedAffiliateId,
      p_add_conversions: isFreeOrder ? 0 : 1,  // Don't count free orders toward KPI
      p_add_earnings: commissionAmount,         // Will be 0 for free orders
      p_add_pending_earnings: commissionAmount, // Will be 0 for free orders
    });

    if (statsError) {
      console.error('Error updating affiliate stats:', statsError);
    } else {
      if (isFreeOrder) {
        console.log('[FREE ORDER] Affiliate stats NOT incremented for:', resolvedAffiliateId);
      } else {
        console.log('Updated affiliate stats for:', resolvedAffiliateId);
      }
    }

    // Update parent affiliate stats if applicable (only for paid orders)
    if (overrideAffiliateId && overrideAmount > 0) {
      const { error: overrideStatsError } = await supabase.rpc('update_affiliate_stats', {
        p_affiliate_id: overrideAffiliateId,
        p_add_conversions: 0,
        p_add_earnings: overrideAmount,
        p_add_pending_earnings: overrideAmount,
      });

      if (overrideStatsError) {
        console.error('Error updating parent affiliate stats:', overrideStatsError);
      } else {
        console.log('Updated parent affiliate stats for:', overrideAffiliateId);
      }
    }

    // Update link conversion count only for paid orders
    if (linkId && !isFreeOrder) {
      await supabase.rpc('increment_affiliate_link_conversions', { link_id: linkId });
    }

    // Update order with affiliate_id if not already set
    if (!order.affiliate_id) {
      await supabase
        .from('orders')
        .update({ affiliate_id: resolvedAffiliateId })
        .eq('id', order_id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        attributed: true,
        conversion_id: conversion.id,
        affiliate_id: resolvedAffiliateId,
        commission_amount: commissionAmount,
        override_affiliate_id: overrideAffiliateId,
        override_amount: overrideAmount,
        is_free_order: isFreeOrder,
        excluded_from_kpi: isFreeOrder,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in attribute-affiliate-sale:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
