import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Try to get country from Cloudflare headers (if using Cloudflare)
    const cfCountry = req.headers.get('CF-IPCountry');
    
    if (cfCountry && cfCountry !== 'XX') {
      return new Response(
        JSON.stringify({
          countryCode: cfCountry,
          source: 'cloudflare',
          detectedAt: new Date().toISOString()
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // Fallback: Get IP address from request
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') || 'unknown';

    // For local development or if IP detection fails, return DEFAULT
    if (ip === 'unknown' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return new Response(
        JSON.stringify({
          countryCode: 'DEFAULT',
          source: 'fallback',
          detectedAt: new Date().toISOString(),
          reason: 'Local or private IP'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // Use ipinfo.io for IP geolocation (free tier: 50k requests/month)
    // You can also use ipapi.co, ip-api.com, or other services
    const ipinfoResponse = await fetch(`https://ipinfo.io/${ip}/json`);
    
    if (!ipinfoResponse.ok) {
      throw new Error('Failed to fetch location from ipinfo.io');
    }

    const ipinfoData = await ipinfoResponse.json();
    const countryCode = ipinfoData.country || 'DEFAULT';

    return new Response(
      JSON.stringify({
        countryCode,
        source: 'ipinfo',
        detectedAt: new Date().toISOString(),
        ip: ip
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Error detecting user location:', error);
    
    // Return DEFAULT on error
    return new Response(
      JSON.stringify({
        countryCode: 'DEFAULT',
        source: 'error',
        detectedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  }
});
