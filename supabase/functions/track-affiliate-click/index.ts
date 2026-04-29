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

    const { ref, link_code, destination } = await req.json();
    
    // Get affiliate code - either from ref (affiliate_code) or link_code
    const affiliateCode = ref || null;
    const linkCode = link_code || null;

    if (!affiliateCode && !linkCode) {
      console.log('No affiliate code or link code provided');
      return new Response(
        JSON.stringify({ error: 'No affiliate code or link code provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let affiliateId: string | null = null;
    let linkId: string | null = null;

    // If link_code provided, look up the link first
    if (linkCode) {
      console.log('Looking up link by code:', linkCode);
      const { data: linkData, error: linkError } = await supabase
        .from('affiliate_links')
        .select('id, affiliate_id, is_active')
        .eq('link_code', linkCode)
        .eq('is_active', true)
        .maybeSingle();

      if (linkError) {
        console.error('Error looking up link:', linkError);
      }

      if (linkData) {
        linkId = linkData.id;
        affiliateId = linkData.affiliate_id;
        console.log('Found link:', linkId, 'for affiliate:', affiliateId);
      }
    }

    // If no link found but affiliate code provided, look up affiliate directly
    if (!affiliateId && affiliateCode) {
      console.log('Looking up affiliate by code:', affiliateCode);
      const { data: affiliateData, error: affiliateError } = await supabase
        .from('affiliates')
        .select('id, status')
        .eq('affiliate_code', affiliateCode.toUpperCase())
        .eq('status', 'active')
        .maybeSingle();

      if (affiliateError) {
        console.error('Error looking up affiliate:', affiliateError);
      }

      if (affiliateData) {
        affiliateId = affiliateData.id;
        console.log('Found affiliate:', affiliateId);
      } else {
        // Fallback: Check if ref is actually a link_code (not an affiliate_code)
        console.log('Affiliate not found, checking if ref is a link_code:', affiliateCode);
        const { data: linkByRef, error: linkByRefError } = await supabase
          .from('affiliate_links')
          .select('id, affiliate_id, is_active')
          .eq('link_code', affiliateCode.toLowerCase())
          .eq('is_active', true)
          .maybeSingle();

        if (linkByRefError) {
          console.error('Error looking up link by ref:', linkByRefError);
        }

        if (linkByRef) {
          linkId = linkByRef.id;
          affiliateId = linkByRef.affiliate_id;
          console.log('Found link via ref parameter:', linkId, 'for affiliate:', affiliateId);
        }
      }
    }

    if (!affiliateId) {
      console.log('No valid affiliate found for code:', affiliateCode, 'or link:', linkCode);
      return new Response(
        JSON.stringify({ error: 'Invalid affiliate code or link' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate a session ID for tracking
    const sessionId = crypto.randomUUID();
    
    // Get request metadata
    const userAgent = req.headers.get('user-agent') || '';
    const referrer = req.headers.get('referer') || '';
    const forwardedFor = req.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';
    
    // Detect device type from user agent
    const deviceType = /mobile|android|iphone|ipad/i.test(userAgent) ? 'mobile' : 'desktop';

    // Get country from IP (simple approach - could be enhanced with IP geolocation service)
    const country = req.headers.get('cf-ipcountry') || 'unknown';

    // Rate limiting: max 10 clicks per IP per minute
    if (ipAddress !== 'unknown') {
      const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
      const { count, error: countError } = await supabase
        .from('affiliate_clicks')
        .select('*', { count: 'exact', head: true })
        .eq('ip_address', ipAddress)
        .gte('clicked_at', oneMinuteAgo);

      if (!countError && count !== null && count >= 10) {
        console.log('Rate limit exceeded for IP:', ipAddress);
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Session deduplication: max 1 click per affiliate+link per session per hour
    if (link_code) {
      const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
      const dedupQuery = supabase
        .from('affiliate_clicks')
        .select('*', { count: 'exact', head: true })
        .eq('affiliate_id', affiliateId)
        .eq('ip_address', ipAddress)
        .gte('clicked_at', oneHourAgo);
      
      if (linkId) {
        dedupQuery.eq('link_id', linkId);
      }

      const { count: dedupCount } = await dedupQuery;
      if (dedupCount !== null && dedupCount >= 1) {
        console.log('Duplicate click detected, skipping');
        return new Response(
          JSON.stringify({ success: true, deduplicated: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('Recording click for affiliate:', affiliateId, 'session:', sessionId);

    // Record the click
    const { data: clickData, error: clickError } = await supabase
      .from('affiliate_clicks')
      .insert({
        affiliate_id: affiliateId,
        link_id: linkId,
        session_id: sessionId,
        ip_address: ipAddress,
        user_agent: userAgent,
        referrer: referrer,
        country: country,
        device_type: deviceType,
      })
      .select()
      .single();

    if (clickError) {
      console.error('Error recording click:', clickError);
      return new Response(
        JSON.stringify({ error: 'Failed to record click' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Click recorded:', clickData.id);

    // Update affiliate click count using RPC
    const { error: clickUpdateError } = await supabase.rpc('update_affiliate_clicks', {
      p_affiliate_id: affiliateId
    });
    
    if (clickUpdateError) {
      console.error('Error updating affiliate clicks:', clickUpdateError);
    }

    // Update link click count if applicable
    if (linkId) {
      await supabase.rpc('increment_affiliate_link_clicks', { link_id: linkId });
    }

    // Calculate expiry (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    return new Response(
      JSON.stringify({
        success: true,
        session_id: sessionId,
        affiliate_id: affiliateId,
        expires_at: expiresAt.toISOString(),
        destination: destination || '/',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in track-affiliate-click:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
