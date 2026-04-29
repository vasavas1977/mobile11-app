import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TugeAuthResponse {
  code: string | number;
  msg?: string;
  message?: string;
  data: {
    token?: string;       // Some responses use this
    accessToken?: string; // Others use this
    expires: number;      // seconds (e.g., 86400 = 24 hours)
  };
}

interface TugeProductResponse {
  code: string | number;
  msg?: string;
  message?: string;
  data: {
    list?: Array<{
      productCode: string;
      productName: string;
      country: string;
      countryCode: string;
      carrier: string;
      duration: number;
      dataVolume: string;
      price: number;
      currency: string;
      productType: string;
    }>;
    productList?: Array<{
      productCode: string;
      productName: string;
      country: string;
      countryCode: string;
      carrier: string;
      duration: number;
      dataVolume: string;
      price: number;
      currency: string;
      productType: string;
    }>;
    total?: number;
    pageNum?: number;
    pageSize?: number;
  };
}

interface TugeOrderResponse {
  code: string | number;
  msg?: string;
  message?: string;
  data: {
    channelOrderNo: string;
    orderNo: string;
    orderState: string;
  };
}

// Helper to check success code (handles both string "0000" and number 0)
function isSuccessCode(code: string | number): boolean {
  return code === '0000' || code === 0 || code === '0';
}

async function getToken(baseUrl: string, accountId: string, secret: string): Promise<{ token: string; expires: number }> {
  console.log('[TUGE-TEST] Requesting auth token...');
  console.log('[TUGE-TEST] Auth payload:', { accountId, secretLength: secret?.length, baseUrl });
  
  const requestBody = JSON.stringify({ accountId, secret });
  console.log('[TUGE-TEST] Request body:', requestBody);
  
  // FIXED: Use /oauth/token per official PHP reference
  const response = await fetch(`${baseUrl}/oauth/token`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json; charset=utf-8',
      'Accept': 'application/json'
    },
    body: requestBody,
  });

  const responseText = await response.text();
  console.log('[TUGE-TEST] Auth raw response:', responseText);
  console.log('[TUGE-TEST] Response status:', response.status);
  
  const result: TugeAuthResponse = JSON.parse(responseText);
  console.log('[TUGE-TEST] Auth parsed response:', result);

  if (!isSuccessCode(result.code)) {
    throw new Error(`Authentication failed: code=${result.code}, message=${result.msg || result.message || 'Unknown error'}`);
  }

  // Handle both token field names per PHP reference
  const token = result.data.token || result.data.accessToken;
  if (!token) {
    throw new Error('No token received in auth response');
  }

  return { token, expires: result.data.expires };
}

async function listProducts(baseUrl: string, token: string, countryCode?: string): Promise<TugeProductResponse['data']['productList']> {
  console.log('[TUGE-TEST] Listing products...');
  
  // pageSize and pageNum are required per PHP reference
  const payload: Record<string, unknown> = {
    pageNum: 1,
    pageSize: 100,
    lang: "en"
  };
  if (countryCode) {
    payload.countryCode = countryCode;
  }

  console.log('[TUGE-TEST] Product list payload:', JSON.stringify(payload));

  const response = await fetch(`${baseUrl}/eSIMApi/v2/products/list`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const result: TugeProductResponse = await response.json();
  console.log('[TUGE-TEST] Product list raw response:', JSON.stringify(result).substring(0, 500));
  
  // Handle both possible response formats (list or productList)
  const products = result.data?.list || result.data?.productList || [];
  console.log('[TUGE-TEST] Products found:', products.length);

  if (!isSuccessCode(result.code)) {
    throw new Error(`Product list failed: ${result.msg || result.message}`);
  }

  return products;
}

async function createTestOrder(
  baseUrl: string, 
  token: string, 
  productCode: string, 
  testOrderId: string,
  activateDate?: string
): Promise<TugeOrderResponse['data']> {
  console.log('[TUGE-TEST] Creating test order...');
  
  const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/tuge-webhook`;
  
  const payload: Record<string, unknown> = {
    productCode,
    channelOrderNo: testOrderId,
    idempotencyKey: crypto.randomUUID(),
    callbackUrl: webhookUrl,
  };

  if (activateDate) {
    payload.activateDate = activateDate;
    console.log('[TUGE-TEST] Designated date activation:', activateDate);
  }

  console.log('[TUGE-TEST] Order payload:', payload);

  const response = await fetch(`${baseUrl}/eSIMApi/v2/order/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const result: TugeOrderResponse = await response.json();
  console.log('[TUGE-TEST] Order response:', result);

  if (!isSuccessCode(result.code)) {
    throw new Error(`Order creation failed: ${result.msg || result.message} (code: ${result.code})`);
  }

  return result.data;
}

serve(async (req) => {
  console.log('[TUGE-TEST] Request received');
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'auth';
    const countryCode = url.searchParams.get('country') || 'JP';
    const productCode = url.searchParams.get('productCode');

    // Get credentials from environment
    const baseUrl = Deno.env.get("TUGE_BASE_URL") || "https://enterpriseapisandbox.tugegroup.com:8070/openapi";
    const accountId = Deno.env.get("TUGE_ACCOUNT_ID");
    const secret = Deno.env.get("TUGE_SECRET");

    if (!accountId || !secret) {
      return new Response(JSON.stringify({
        success: false,
        error: 'TUGE credentials not configured. Please set TUGE_ACCOUNT_ID and TUGE_SECRET.',
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    console.log('[TUGE-TEST] Config:', { baseUrl, accountId: accountId.substring(0, 4) + '***', action });

    // Always authenticate first
    const authData = await getToken(baseUrl, accountId, secret);
    
    let responseData: Record<string, unknown> = {
      action,
      auth: {
        success: true,
        tokenReceived: !!authData.token,
        tokenLength: authData.token.length,
        expiresInSeconds: authData.expires,
      },
    };

    // Handle different actions
    if (action === 'products' || action === 'all') {
      const products = await listProducts(baseUrl, authData.token, countryCode);
      responseData.products = {
        success: true,
        countryCode,
        count: products?.length || 0,
        items: (products || []).map(p => ({
          productCode: p.productCode,
          productName: p.productName,
          country: p.country,
          carrier: p.carrier,
          duration: p.duration,
          dataVolume: p.dataVolume,
          price: p.price,
          currency: p.currency,
          productType: p.productType,
        })),
      };
    }

    if (action === 'order') {
      if (!productCode) {
        return new Response(JSON.stringify({
          success: false,
          error: 'productCode query parameter is required for order action',
          hint: 'Use ?action=order&productCode=YOUR_PRODUCT_CODE&activateDate=YYYY-MM-DD',
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      const activateDate = url.searchParams.get('activateDate');
      const testOrderId = `TEST-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const orderData = await createTestOrder(baseUrl, authData.token, productCode, testOrderId, activateDate || undefined);
      
      responseData.order = {
        success: true,
        testOrderId,
        activateDate: activateDate || 'not set (immediate activation)',
        tugeOrderNo: orderData.orderNo,
        orderState: orderData.orderState,
        channelOrderNo: orderData.channelOrderNo,
      };
    }

    return new Response(JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      environment: baseUrl.includes('sandbox') ? 'sandbox' : 'production',
      ...responseData,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error('[TUGE-TEST] Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
