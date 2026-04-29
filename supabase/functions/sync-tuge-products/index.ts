import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TugeAuthResponse {
  code: string | number;
  msg?: string;
  message?: string;
  data: {
    token?: string;
    accessToken?: string;
    expires: number;
  };
}

interface TugeProduct {
  productCode: string;
  productName: string;
  productType: string;
  countryCodeList: string[];
  netPrice: number;
  usagePeriod: number;
  validityPeriod: number;
  dataTotal: number;
  dataUnit: string;
  dataLimited: string;
  highSpeed?: string;
  limitSpeed?: string;
  cardType?: string;
  topupInfoList?: Array<{
    productCode: string;
    productName: string;
    netPrice: number;
    dataTotal: number;
    dataUnit: string;
    usagePeriod: number;
  }>;
}

interface TugeProductListResponse {
  code: string | number;
  msg?: string;
  message?: string;
  data: {
    list: TugeProduct[];
    total?: number;
    pageNum?: number;
    pageSize?: number;
  };
}

function isSuccessCode(code: string | number): boolean {
  return code === '0000' || code === 0 || code === '0';
}

function isTokenInvalidError(code: string | number, msg?: string): boolean {
  return code === '1002' || code === 1002 || 
         (msg?.toLowerCase().includes('token invalid') ?? false) ||
         (msg?.toLowerCase().includes('token expired') ?? false);
}

async function getTugeToken(accountId: string, secret: string, baseUrl: string): Promise<string> {
  console.log('[SYNC-TUGE] Requesting auth token...');
  
  const response = await fetch(`${baseUrl}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ accountId, secret }),
  });

  const result: TugeAuthResponse = await response.json();
  
  if (!isSuccessCode(result.code)) {
    throw new Error(`TUGE authentication failed: ${result.msg || result.message}`);
  }

  const token = result.data.token || result.data.accessToken;
  if (!token) {
    throw new Error('No token received in TUGE auth response');
  }

  console.log('[SYNC-TUGE] Token obtained successfully');
  return token;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchAllProducts(
  baseUrl: string, 
  accountId: string,
  secret: string,
  productType?: string
): Promise<TugeProduct[]> {
  const allProducts: TugeProduct[] = [];
  let page = 1;
  let hasMore = true;
  const pageSize = 100;
  let tokenRefreshCount = 0;
  const maxTokenRefreshes = 10; // Increased limit

  let token = await getTugeToken(accountId, secret, baseUrl);

  console.log('[SYNC-TUGE] Fetching all products with pagination...');

  while (hasMore) {
    const payload: Record<string, unknown> = {
      pageNum: page,
      pageSize,
      lang: "en"
    };
    
    if (productType) {
      payload.productType = productType;
    }

    console.log(`[SYNC-TUGE] Fetching page ${page}...`);

    const response = await fetch(`${baseUrl}/eSIMApi/v2/products/list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const result: TugeProductListResponse = await response.json();
    
    if (isTokenInvalidError(result.code, result.msg || result.message)) {
      if (tokenRefreshCount >= maxTokenRefreshes) {
        throw new Error(`Token refresh limit (${maxTokenRefreshes}) exceeded. Aborting.`);
      }
      
      console.log(`[SYNC-TUGE] Token expired on page ${page}, refreshing... (attempt ${tokenRefreshCount + 1})`);
      tokenRefreshCount++;
      token = await getTugeToken(accountId, secret, baseUrl);
      await delay(100);
      continue;
    }
    
    if (!isSuccessCode(result.code)) {
      throw new Error(`Failed to fetch products: ${result.msg || result.message}`);
    }

    const products = result.data?.list || [];
    allProducts.push(...products);
    
    console.log(`[SYNC-TUGE] Page ${page}: got ${products.length} products (total so far: ${allProducts.length})`);

    hasMore = products.length === pageSize;
    page++;

    if (page > 100) {
      console.warn('[SYNC-TUGE] Reached page limit (100), stopping pagination');
      break;
    }

    if (hasMore) {
      await delay(50);
    }
  }

  console.log(`[SYNC-TUGE] Total products fetched: ${allProducts.length} (token refreshed ${tokenRefreshCount} times)`);
  return allProducts;
}

// Transform raw API product to cache format
function transformForCache(product: TugeProduct) {
  return {
    product_code: product.productCode,
    product_name: product.productName,
    product_type: product.productType,
    countries: product.countryCodeList || [],
    net_price: product.netPrice,
    usage_period: product.usagePeriod,
    validity_period: product.validityPeriod,
    data_total: product.dataTotal,
    data_unit: product.dataUnit,
    data_limited: product.dataLimited === 'Y',
    high_speed: product.highSpeed || null,
    limit_speed: product.limitSpeed || null,
    card_type: product.cardType || null,
    has_topup: (product.topupInfoList?.length || 0) > 0,
    topup_count: product.topupInfoList?.length || 0,
    raw_data: product,
    last_synced_at: new Date().toISOString(),
  };
}

// Transform cache record to frontend format
function transformForFrontend(cached: Record<string, unknown>) {
  return {
    productCode: cached.product_code,
    productName: cached.product_name,
    productType: cached.product_type,
    countries: cached.countries || [],
    netPrice: cached.net_price,
    usagePeriod: cached.usage_period,
    validityPeriod: cached.validity_period,
    dataTotal: cached.data_total,
    dataUnit: cached.data_unit,
    dataLimited: cached.data_limited,
    highSpeed: cached.high_speed,
    limitSpeed: cached.limit_speed,
    cardType: cached.card_type,
    hasTopup: cached.has_topup,
    topupCount: cached.topup_count,
  };
}

serve(async (req) => {
  console.log('[SYNC-TUGE] Request received');
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    let forceRefresh = false;
    let productType: string | undefined;
    
    if (req.method === "POST") {
      try {
        const body = await req.json();
        forceRefresh = body.forceRefresh === true;
        productType = body.productType;
      } catch {
        // No body or invalid JSON
      }
    }

    // Initialize Supabase client with service role for cache operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // If not forcing refresh, try to return cached products
    if (!forceRefresh) {
      console.log('[SYNC-TUGE] Checking cache...');
      const { data: cached, error: cacheError } = await supabase
        .from('tuge_product_cache')
        .select('*')
        .order('product_code');

      if (!cacheError && cached && cached.length > 0) {
        console.log(`[SYNC-TUGE] Returning ${cached.length} products from cache`);
        
        // Get the most recent sync time
        const lastSynced = cached.reduce((latest, p) => {
          const syncTime = new Date(p.last_synced_at).getTime();
          return syncTime > latest ? syncTime : latest;
        }, 0);

        return new Response(JSON.stringify({
          success: true,
          total: cached.length,
          products: cached.map(transformForFrontend),
          fromCache: true,
          lastSyncedAt: new Date(lastSynced).toISOString(),
          timestamp: new Date().toISOString(),
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      
      console.log('[SYNC-TUGE] Cache empty, will fetch from API');
    }

    // Get TUGE credentials
    const accountId = Deno.env.get("TUGE_PROD_ACCOUNT_ID") || Deno.env.get("TUGE_ACCOUNT_ID");
    const secret = Deno.env.get("TUGE_PROD_SECRET") || Deno.env.get("TUGE_SECRET");
    const baseUrl = Deno.env.get("TUGE_PROD_BASE_URL") || Deno.env.get("TUGE_BASE_URL") || "https://enterpriseapi.tugegroup.com:8070/openapi";

    if (!accountId || !secret) {
      return new Response(JSON.stringify({
        success: false,
        error: 'TUGE credentials not configured. Please set TUGE_PROD_ACCOUNT_ID and TUGE_PROD_SECRET.',
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    console.log('[SYNC-TUGE] Fetching from API (forceRefresh:', forceRefresh, ')');

    // Fetch all products from TUGE API
    const products = await fetchAllProducts(baseUrl, accountId, secret, productType);

    // Transform and upsert into cache in batches
    const batchSize = 500;
    let upsertedCount = 0;
    
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize).map(transformForCache);
      
      const { error: upsertError } = await supabase
        .from('tuge_product_cache')
        .upsert(batch, { 
          onConflict: 'product_code',
          ignoreDuplicates: false 
        });

      if (upsertError) {
        console.error(`[SYNC-TUGE] Upsert error for batch ${i / batchSize + 1}:`, upsertError);
      } else {
        upsertedCount += batch.length;
        console.log(`[SYNC-TUGE] Upserted batch ${i / batchSize + 1}: ${batch.length} products`);
      }
    }

    console.log(`[SYNC-TUGE] Cache updated with ${upsertedCount} products`);

    // Return products for frontend
    const transformedProducts = products.map(product => ({
      productCode: product.productCode,
      productName: product.productName,
      productType: product.productType,
      countries: product.countryCodeList || [],
      netPrice: product.netPrice,
      usagePeriod: product.usagePeriod,
      validityPeriod: product.validityPeriod,
      dataTotal: product.dataTotal,
      dataUnit: product.dataUnit,
      dataLimited: product.dataLimited === 'Y',
      highSpeed: product.highSpeed,
      limitSpeed: product.limitSpeed,
      cardType: product.cardType,
      hasTopup: (product.topupInfoList?.length || 0) > 0,
      topupCount: product.topupInfoList?.length || 0,
    }));

    return new Response(JSON.stringify({
      success: true,
      total: transformedProducts.length,
      products: transformedProducts,
      fromCache: false,
      lastSyncedAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error('[SYNC-TUGE] Error:', error);
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
