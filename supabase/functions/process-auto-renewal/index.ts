import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Cache TTL for cron job - use cached data if less than 5 minutes old
const CRON_CACHE_TTL_MS = 5 * 60 * 1000;

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[AUTO-RENEWAL] ${step}${detailsStr}`);
};

// Helper to generate HMAC signature for USIMSA API
async function generateSignature(method: string, path: string, accessKey: string, secretKey: string): Promise<{ timestamp: string; signature: string }> {
  const timestamp = Date.now().toString();
  const stringToSign = `${method} ${path}\n${timestamp}\n${accessKey}`;
  const encoder = new TextEncoder();
  const base64Decoded = Uint8Array.from(atob(secretKey), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    "raw",
    base64Decoded,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(stringToSign));
  const base64Signature = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return { timestamp, signature: base64Signature };
}

// Check usage from USIMSA API
async function checkUsageFromUSIMSA(topupId: string, environment: string): Promise<any> {
  const isProd = (environment || '').toLowerCase() !== 'sandbox';
  
  const accessKey = isProd 
    ? Deno.env.get('USIMSA_PROD_ACCESS_KEY') || Deno.env.get('USIMSA_ACCESS_KEY') || ''
    : Deno.env.get('USIMSA_ACCESS_KEY') || '';
  const secretKey = isProd 
    ? Deno.env.get('USIMSA_PROD_SECRET_KEY') || Deno.env.get('USIMSA_SECRET_KEY') || ''
    : Deno.env.get('USIMSA_SECRET_KEY') || '';
  const baseUrl = isProd 
    ? Deno.env.get('USIMSA_PROD_BASE_URL') || 'https://open-api.usimsa.com/api'
    : Deno.env.get('USIMSA_BASE_URL') || 'https://open-api-sandbox.usimsa.com/api';

  const path = `/api/v2/topup/${encodeURIComponent(topupId)}`;
  const url = `${baseUrl.replace(/\/api$/, '')}${path}`;
  
  const { timestamp, signature } = await generateSignature('GET', path, accessKey, secretKey);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'x-gat-access-key': accessKey,
      'x-gat-timestamp': timestamp,
      'x-gat-signature': signature,
    },
  });

  const data = await response.json();
  return data;
}

// Parse data amount to MB
function parseDataToMB(dataStr: string | null): number | null {
  if (!dataStr) return null;
  const match = dataStr.match(/^([\d.]+)\s*(GB|MB|TB)/i);
  if (!match) return null;
  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  switch (unit) {
    case 'TB': return value * 1024 * 1024;
    case 'GB': return value * 1024;
    case 'MB': return value;
    default: return null;
  }
}

// Format data amount for display
function formatDataAmount(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
  return `${mb.toFixed(0)} MB`;
}

// Calculate usage from USIMSA response - returns full data for UI caching
// Now includes usage rate tracking for predictive renewal
function calculateUsageFromResponse(
  providerJson: any, 
  packageDataAmount: string | null,
  previousUsage?: { usageMb: number; checkedAt: string } | null
): {
  percentageUsed: number;
  validUntil: string | null;
  validFrom: string | null;
  usageMb: number;
  dataUsed: string;
  remainingData: string | null;
  remainingDataMb: number | null;
  totalData: string | null;
  // NEW rate tracking fields
  usageRateMbPerHour: number | null;
  predictedExhaustionMinutes: number | null;
} {
  const topupData = providerJson.topup || providerJson.data?.topup || null;
  
  if (!topupData) {
    const totalMb = parseDataToMB(packageDataAmount);
    return {
      percentageUsed: 0,
      validUntil: null,
      validFrom: null,
      usageMb: 0,
      dataUsed: '0 MB',
      remainingData: packageDataAmount,
      remainingDataMb: totalMb,
      totalData: packageDataAmount,
      usageRateMbPerHour: null,
      predictedExhaustionMinutes: null
    };
  }

  let usageMb = 0;
  const totalDataMb = parseDataToMB(packageDataAmount);

  // Parse usage from various response formats
  if (topupData.usage != null) {
    usageMb = Number(topupData.usage) || 0;
  } else if (providerJson.data?.usage?.usedData != null) {
    const usage = providerJson.data.usage;
    const unit = (usage.unit || 'MB').toUpperCase();
    const usedData = Number(usage.usedData) || 0;
    usageMb = unit === 'GB' ? usedData * 1024 : usedData;
  }

  // Calculate remaining
  let remainingDataMb: number | null = null;
  if (topupData.leftData != null) {
    remainingDataMb = Number(topupData.leftData) || 0;
  } else if (totalDataMb) {
    remainingDataMb = Math.max(0, totalDataMb - usageMb);
  }

  // Calculate percentage
  let percentageUsed = 0;
  if (totalDataMb && totalDataMb > 0) {
    const usedMb = remainingDataMb !== null ? (totalDataMb - remainingDataMb) : usageMb;
    percentageUsed = Math.round((usedMb / totalDataMb) * 100);
  }

  // Normalize timestamps
  const validUntil = topupData.expireTime || topupData.validUntil || null;
  const validFrom = topupData.activeTime || null;

  // Calculate usage rate if we have previous data
  let usageRateMbPerHour: number | null = null;
  let predictedExhaustionMinutes: number | null = null;

  if (previousUsage?.checkedAt && previousUsage?.usageMb !== undefined) {
    const timeDeltaMs = Date.now() - new Date(previousUsage.checkedAt).getTime();
    const timeDeltaHours = timeDeltaMs / (1000 * 60 * 60);
    
    // Only calculate if we have at least 1 minute of data
    if (timeDeltaHours >= 0.0167) { // ~1 minute
      const usageDeltaMb = usageMb - previousUsage.usageMb;
      
      // Only positive delta (user is consuming, not a reset after renewal)
      if (usageDeltaMb > 0) {
        usageRateMbPerHour = usageDeltaMb / timeDeltaHours;
        
        // Predict exhaustion time
        if (remainingDataMb !== null && usageRateMbPerHour > 0) {
          predictedExhaustionMinutes = Math.round((remainingDataMb / usageRateMbPerHour) * 60);
        }
      }
    }
  }

  return {
    percentageUsed,
    validUntil,
    validFrom,
    usageMb,
    dataUsed: formatDataAmount(usageMb),
    remainingData: remainingDataMb !== null ? formatDataAmount(remainingDataMb) : null,
    remainingDataMb,
    totalData: packageDataAmount,
    usageRateMbPerHour,
    predictedExhaustionMinutes
  };
}

// Helper function removed - no longer needed since Day Pass/Limitless now trigger upon expiry

// Call USIMSA extend API to extend the eSIM
async function callUsimSAExtendAPI(topupId: string, optionId: string): Promise<{
  success: boolean;
  error?: string;
  expiredDate?: string;
  [key: string]: any;
}> {
  const usimSAAccessKey = Deno.env.get('USIMSA_PROD_ACCESS_KEY');
  const usimSASecretKey = Deno.env.get('USIMSA_PROD_SECRET_KEY');
  const usimSABaseUrl = Deno.env.get('USIMSA_PROD_BASE_URL') || 'https://open-api.usimsa.com/api';

  if (!usimSAAccessKey || !usimSASecretKey) {
    return { success: false, error: 'USIMSA credentials not configured' };
  }

  const path = '/api/v2/extend';
  const { timestamp, signature } = await generateSignature('POST', path, usimSAAccessKey, usimSASecretKey);
  const baseRoot = usimSABaseUrl.replace(/\/api\/?$/, '');
  
  logStep(`Calling USIMSA extend API`, { topupId: topupId.substring(0, 8) + '...', optionId });

  const response = await fetch(`${baseRoot}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'x-gat-access-key': usimSAAccessKey,
      'x-gat-timestamp': timestamp,
      'x-gat-signature': signature,
    },
    body: JSON.stringify({ topupId, optionId })
  });

  const result = await response.json();
  const code = result?.code;
  const isSuccess = response.ok && (code === undefined || code === null || code === '0' || code === '0000');
  
  logStep(`USIMSA extend API response`, { success: isSuccess, code, message: result?.message });

  return {
    success: isSuccess,
    error: isSuccess ? undefined : (result?.message || 'USIMSA API error'),
    expiredDate: result?.expiredDate || result?.data?.expiredDate,
    ...result
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Cron job started");

    // Get all auto-renewal enabled orders that are active
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        order_id,
        user_id,
        package_id,
        total_amount,
        original_amount,
        currency,
        environment,
        webhook_data,
        iccid,
        auto_renewal_enabled,
        renewal_payment_method_id,
        renewal_failure_count,
        last_renewal_attempt_at,
        expiry_date,
        cached_usage,
        created_at,
        esim_packages:package_id (
          id,
          name,
          package_id,
          data_amount,
          validity_days,
          package_type,
          daily_data_reset,
          price,
          currency,
          supports_extension,
          esim_providers:provider_id (
            provider_code
          )
        )
      `)
      .eq('auto_renewal_enabled', true)
      .eq('status', 'completed')
      .gte('expiry_date', new Date().toISOString())
      .lt('renewal_failure_count', 3); // Skip orders that have failed 3+ times

    if (ordersError) {
      logStep("Error fetching orders", { error: ordersError.message });
      throw ordersError;
    }

    logStep(`Found ${orders?.length || 0} auto-renewal orders to check`);

    if (!orders || orders.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "No auto-renewal orders to process",
        processed: 0 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Sort orders by urgency - highest usage first to prioritize fast consumers
    orders.sort((a, b) => {
      const aUsage = (a.cached_usage as any)?.percentageUsed ?? 0;
      const bUsage = (b.cached_usage as any)?.percentageUsed ?? 0;
      return bUsage - aUsage; // Higher usage processed first
    });
    logStep(`Sorted ${orders.length} orders by usage urgency`);

    // DEDUPLICATION: Group by ICCID and keep only the most recent order per eSIM
    // This prevents multiple charges for the same physical eSIM
    const iccidMap = new Map<string, typeof orders[0]>();
    for (const order of orders) {
      const webhook = order.webhook_data as Record<string, any> | null;
      const iccid = order.iccid || webhook?.iccid;
      if (!iccid) continue;
      
      const existing = iccidMap.get(iccid);
      if (!existing || new Date(order.created_at) > new Date(existing.created_at)) {
        iccidMap.set(iccid, order);
      }
    }
    
    const deduplicatedOrders = Array.from(iccidMap.values());
    logStep(`Deduplicated ${orders.length} orders to ${deduplicatedOrders.length} unique ICCIDs`);

    // Filter out TUGE/DOCOMO orders - only DOCOMO carrier does not support top-ups
    const filteredOrders = deduplicatedOrders.filter(order => {
      const pkg = order.esim_packages as any;
      const providerCode = pkg?.esim_providers?.provider_code;
      if (providerCode === 'tuge' && pkg?.carrier === 'DOCOMO') {
        logStep(`Skipping TUGE/DOCOMO order ${order.id} - DOCOMO does not support top-ups`);
        return false;
      }
      return true;
    });
    logStep(`After TUGE/DOCOMO filter: ${filteredOrders.length} orders remaining`);

    const stripeKey = Deno.env.get("STRIPE_PROD_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_PROD_SECRET_KEY is not configured");
    }
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    let processedCount = 0;
    let renewedCount = 0;
    const results: any[] = [];

    // COOLDOWN: Minimum hours between renewals for the same ICCID
    const RENEWAL_COOLDOWN_HOURS = 2;

    for (const order of filteredOrders) {
      try {
        processedCount++;
        const pkg = order.esim_packages as any;
        const webhook = order.webhook_data as Record<string, any> | null;
        const topupId = webhook?.topupId || webhook?.topup_id || webhook?.topupid;

        if (!topupId) {
          logStep(`Order ${order.id} has no topupId, skipping`);
          continue;
        }

        // COOLDOWN CHECK: Skip if this ICCID was renewed recently (within 2 hours)
        // This prevents rapid back-to-back charges even when both time/data triggers fire
        if (order.last_renewal_attempt_at) {
          const hoursSinceLastRenewal = (Date.now() - new Date(order.last_renewal_attempt_at).getTime()) / (1000 * 60 * 60);
          if (hoursSinceLastRenewal < RENEWAL_COOLDOWN_HOURS) {
            logStep(`Order ${order.id} in cooldown period`, { 
              hoursSinceLastRenewal: hoursSinceLastRenewal.toFixed(2),
              cooldownHours: RENEWAL_COOLDOWN_HOURS
            });
            continue;
          }
        }

        // Determine package type
        const packageType = (pkg?.package_type || '').toLowerCase().replace(/[_\s-]/g, '');
        const isDayPass = packageType === 'daypass' || pkg?.daily_data_reset === true;
        const isMaxSpeed = packageType === 'maxspeed';
        const isLimitless = packageType === 'limitless';

        // Skip if not a relevant package type for auto-renewal
        if (!isDayPass && !isMaxSpeed && !isLimitless) {
          logStep(`Order ${order.id} is not Day Pass, Max Speed, or Limitless, skipping`);
          continue;
        }

        // Skip if package doesn't support true extension (creates new eSIM instead)
        if (pkg?.supports_extension === false) {
          logStep(`Order ${order.id} package doesn't support extension (creates new eSIM), skipping auto-renewal`);
          continue;
        }

        // Check if we can use cached data first (to minimize API calls)
        const existingCache = order.cached_usage as any;
        const usageCachedAt = (order as any).usage_cached_at;
        let percentageUsed = 0;
        let validUntil: string | null = null;
        let usedCachedData = false;
        let usageData: ReturnType<typeof calculateUsageFromResponse> | null = null;

        if (existingCache && usageCachedAt) {
          const cacheAge = Date.now() - new Date(usageCachedAt).getTime();
          
          // Use cached data if it's recent enough (less than 5 minutes old)
          if (cacheAge < CRON_CACHE_TTL_MS) {
            percentageUsed = existingCache.percentageUsed ?? 0;
            validUntil = existingCache.validUntil ?? null;
            usedCachedData = true;
            // Reconstruct usageData from cache for predictive logic
            usageData = {
              percentageUsed,
              validUntil,
              validFrom: existingCache.validFrom ?? null,
              usageMb: existingCache.usageMb ?? 0,
              dataUsed: existingCache.dataUsed ?? '0 MB',
              remainingData: existingCache.remainingData ?? null,
              remainingDataMb: existingCache.remainingDataMb ?? null,
              totalData: existingCache.totalData ?? null,
              usageRateMbPerHour: existingCache.usageRateMbPerHour ?? null,
              predictedExhaustionMinutes: existingCache.predictedExhaustionMinutes ?? null
            };
            logStep(`Using cached usage for order ${order.id}`, { 
              cacheAge: Math.round(cacheAge / 1000) + 's', 
              percentageUsed, 
              validUntil,
              usageRateMbPerHour: usageData.usageRateMbPerHour,
              predictedExhaustionMinutes: usageData.predictedExhaustionMinutes
            });
          }
        }

        // Only call USIMSA API if cache is stale or missing
        if (!usedCachedData) {
          logStep(`Fetching fresh usage for order ${order.id}`, { packageType, topupId: topupId.substring(0, 8) + '...' });
          
          const usageResponse = await checkUsageFromUSIMSA(topupId, order.environment);
          const code = usageResponse.code || usageResponse?.statusCode || '';

          if (code !== '0000') {
            logStep(`Failed to get usage for order ${order.id}`, { code, message: usageResponse.message });
            continue;
          }

          // Pass previous usage for rate calculation
          const previousUsage = existingCache ? {
            usageMb: existingCache.usageMb ?? 0,
            checkedAt: existingCache.checkedAt ?? usageCachedAt
          } : null;

          usageData = calculateUsageFromResponse(usageResponse, pkg?.data_amount, previousUsage);
          percentageUsed = usageData.percentageUsed;
          validUntil = usageData.validUntil;

          // Update cached usage with FULL data for UI display including rate tracking
          const cachedUsage = {
            percentageUsed: usageData.percentageUsed,
            validUntil: usageData.validUntil,
            validFrom: usageData.validFrom,
            usageMb: usageData.usageMb,
            dataUsed: usageData.dataUsed,
            remainingData: usageData.remainingData,
            remainingDataMb: usageData.remainingDataMb,
            totalData: usageData.totalData,
            // NEW rate tracking fields
            usageRateMbPerHour: usageData.usageRateMbPerHour,
            predictedExhaustionMinutes: usageData.predictedExhaustionMinutes,
            checkedAt: new Date().toISOString(),
            fromCron: true
          };

          logStep(`Fresh usage calculated for order ${order.id}`, {
            percentageUsed,
            usageRateMbPerHour: usageData.usageRateMbPerHour,
            predictedExhaustionMinutes: usageData.predictedExhaustionMinutes
          });

          await supabaseAdmin
            .from('orders')
            .update({
              cached_usage: cachedUsage,
              usage_cached_at: new Date().toISOString()
            })
            .eq('id', order.id);
        }

        // Prepare usage data for logging (include rate tracking)
        const usageDataForLog = { 
          percentageUsed, 
          validUntil, 
          usedCachedData,
          usageRateMbPerHour: usageData?.usageRateMbPerHour ?? null,
          predictedExhaustionMinutes: usageData?.predictedExhaustionMinutes ?? null
        };

        // Check renewal trigger conditions
        let shouldRenew = false;
        let triggerReason = '';

        if (isMaxSpeed) {
          // Max Speed: Trigger at 80% data usage, OR predictive trigger, OR 30 minutes before expiry
          
          // TRIGGER 1: Standard threshold (lowered from 90% to 80% for better buffer)
          if (percentageUsed >= 80) {
            shouldRenew = true;
            triggerReason = `Max Speed data at ${percentageUsed}% (threshold: 80%)`;
          }
          // TRIGGER 2: Predictive trigger for fast consumers
          else if (usageData && 
                   usageData.predictedExhaustionMinutes !== null && 
                   usageData.predictedExhaustionMinutes <= 15 &&
                   usageData.usageRateMbPerHour !== null &&
                   usageData.usageRateMbPerHour > 100) { // Only for fast consumers (>100 MB/hr)
            shouldRenew = true;
            triggerReason = `Max Speed predicted exhaustion in ${usageData.predictedExhaustionMinutes} min ` +
                            `(rate: ${Math.round(usageData.usageRateMbPerHour)} MB/hr, current: ${percentageUsed}%)`;
          }
          // TRIGGER 3: Time-based expiry
          else if (validUntil) {
            const hoursUntilExpiry = (new Date(validUntil).getTime() - Date.now()) / (1000 * 60 * 60);
            
            logStep(`Max Speed expiry check for order ${order.id}`, {
              hoursUntilExpiry: hoursUntilExpiry.toFixed(2),
              percentageUsed,
              validUntil,
              predictedExhaustionMinutes: usageData?.predictedExhaustionMinutes
            });
            
            if (hoursUntilExpiry <= 0.5) {
              shouldRenew = true;
              triggerReason = `Max Speed expires in ${(hoursUntilExpiry * 60).toFixed(0)} min (threshold: 30 min) - data at ${percentageUsed}%`;
            }
          }
        }

        if (!shouldRenew) {
          logStep(`Order ${order.id} does not need renewal`, { percentageUsed, validUntil });
          continue;
        }

        logStep(`Triggering renewal for order ${order.id}`, { triggerReason });

        // Get user email for Stripe customer lookup
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('email')
          .eq('user_id', order.user_id)
          .single();

        if (!profile?.email) {
          logStep(`No email found for user ${order.user_id}, skipping renewal`);
          continue;
        }

        // Find or skip if no saved payment method
        const customers = await stripe.customers.list({ email: profile.email, limit: 1 });
        
        if (customers.data.length === 0) {
          logStep(`No Stripe customer found for ${profile.email}, skipping`);
          await logRenewalAttempt(supabaseAdmin, order.id, 'failed', order.total_amount, order.currency, null, 'No Stripe customer found', usageDataForLog);
          continue;
        }

        const customerId = customers.data[0].id;

        // Get payment method - prefer order's selected card, then fall back to Stripe default
        let paymentMethodId = order.renewal_payment_method_id;
        
        if (!paymentMethodId) {
          // Fall back to Stripe default if no specific card selected
          const paymentMethods = await stripe.paymentMethods.list({
            customer: customerId,
            type: 'card',
            limit: 1,
          });
          
          if (paymentMethods.data.length === 0) {
            logStep(`No payment method found for customer ${customerId}, skipping`);
            await logRenewalAttempt(supabaseAdmin, order.id, 'failed', order.total_amount, order.currency, null, 'No saved payment method', usageDataForLog);
            
            // Update failure count
            await supabaseAdmin
              .from('orders')
              .update({
                renewal_failure_count: (order.renewal_failure_count || 0) + 1,
                renewal_failure_reason: 'No saved payment method',
                last_renewal_attempt_at: new Date().toISOString()
              })
              .eq('id', order.id);
            continue;
          }
          
          paymentMethodId = paymentMethods.data[0].id;
          logStep(`Using Stripe default payment method for order ${order.id}`, { paymentMethodId: paymentMethodId.substring(0, 8) + '...' });
        } else {
          logStep(`Using order's selected payment method for order ${order.id}`, { paymentMethodId: paymentMethodId.substring(0, 8) + '...' });
        }

        // Create payment intent for renewal
        const ZERO_DECIMAL = new Set(['BIF','CLP','DJF','GNF','JPY','KRW','KMF','MGA','PYG','RWF','UGX','VND','VUV','XAF','XOF','XPF']);

        // Get USIMSA package optionId for extension
        const optionId = pkg?.package_id;
        const topupIdForExtend = webhook?.topupId || webhook?.topup_id || webhook?.topupid;

        if (!optionId) {
          logStep(`Order ${order.id} has no package optionId, skipping`);
          continue;
        }

        // Calculate renewal price - use package price (renewals charge full price, not discounted)
        let renewalPrice = pkg?.price || order.original_amount || order.total_amount;
        const pkgCurrency = (pkg?.currency || 'USD').toUpperCase();
        const orderCurrency = (order.currency || 'USD').toUpperCase();
        
        // Handle currency mismatch - fall back to original order amount
        if (pkgCurrency !== orderCurrency) {
          renewalPrice = order.original_amount || order.total_amount;
        }
        const renewalCurrency = pkgCurrency !== orderCurrency ? orderCurrency : pkgCurrency;

        // Validate minimum charge threshold
        const MIN_CHARGE: Record<string, number> = { USD: 0.50, THB: 10 };
        const minForCurrency = MIN_CHARGE[renewalCurrency] || 0.50;

        if (renewalPrice < minForCurrency) {
          logStep(`Order ${order.id} renewal price too low`, { renewalPrice, minForCurrency, renewalCurrency });
          await logRenewalAttempt(supabaseAdmin, order.id, 'skipped', renewalPrice, renewalCurrency, null, 
            `Renewal price ${renewalPrice} ${renewalCurrency} below minimum ${minForCurrency}`, usageDataForLog);
          // Don't increment failure count - this is a configuration issue, not transient
          continue;
        }

        // Calculate Stripe amount with correct currency handling
        const renewalUnitAmount = ZERO_DECIMAL.has(renewalCurrency) 
          ? Math.round(renewalPrice) 
          : Math.round(renewalPrice * 100);

        try {
          // Step 1: Authorize payment (hold funds, don't capture yet)
          const paymentIntent = await stripe.paymentIntents.create({
            amount: renewalUnitAmount,
            currency: renewalCurrency.toLowerCase(),
            customer: customerId,
            payment_method: paymentMethodId,
            off_session: true,
            confirm: true,
            capture_method: 'manual', // Hold funds only
            metadata: {
              order_id: order.id,
              renewal_type: 'auto_renewal',
              original_package_id: order.package_id,
              trigger_reason: triggerReason
            }
          });

          if (paymentIntent.status !== 'requires_capture') {
            throw new Error(`Authorization failed: ${paymentIntent.status}`);
          }

          logStep(`Payment authorized for order ${order.id}`, { paymentIntentId: paymentIntent.id });

          // Step 2: Call USIMSA extend API
          const usimSAResult = await callUsimSAExtendAPI(topupIdForExtend, optionId);
          const originalIccid = order.iccid || webhook?.iccid;

          if (!usimSAResult.success) {
            // USIMSA failed - cancel the authorization (release hold, no charge)
            await stripe.paymentIntents.cancel(paymentIntent.id);
            logStep(`USIMSA extend failed, authorization cancelled`, { error: usimSAResult.error });
            
            await logRenewalAttempt(supabaseAdmin, order.id, 'failed', renewalPrice, renewalCurrency, null, 
              `USIMSA extend failed: ${usimSAResult.error}`, usageDataForLog);
            
            await supabaseAdmin
              .from('orders')
              .update({
                renewal_failure_count: (order.renewal_failure_count || 0) + 1,
                renewal_failure_reason: `USIMSA extend failed: ${usimSAResult.error}`,
                last_renewal_attempt_at: new Date().toISOString()
              })
              .eq('id', order.id);

            results.push({ orderId: order.id, status: 'failed', error: usimSAResult.error });
            continue;
          }

          // Check if USIMSA returned a NEW eSIM instead of extending (Pattern B)
          const returnedIccid = usimSAResult.iccid || usimSAResult.data?.iccid;
          const isNewEsim = returnedIccid && originalIccid && returnedIccid !== originalIccid;

          if (isNewEsim) {
            // Pattern B: USIMSA created a new eSIM instead of extending
            // Cancel payment and disable auto-renewal for this package
            await stripe.paymentIntents.cancel(paymentIntent.id);
            logStep(`USIMSA created new eSIM instead of extending, cancelling auto-renewal`, { 
              originalIccid, 
              newIccid: returnedIccid 
            });
            
            // Disable auto-renewal since this package doesn't support true extension
            await supabaseAdmin
              .from('orders')
              .update({
                auto_renewal_enabled: false,
                renewal_failure_reason: 'Package creates new eSIM instead of extending - auto-renewal disabled'
              })
              .eq('id', order.id);

            // NOTE: We no longer mark packages as non-extendable based on Pattern B responses
            // The real issue was users changing data amounts, which is now validated in extend-order

            await logRenewalAttempt(supabaseAdmin, order.id, 'blocked', renewalPrice, renewalCurrency, null, 
              'Package creates new eSIM instead of extending - auto-renewal blocked', usageDataForLog);

            results.push({ orderId: order.id, status: 'blocked', reason: 'new_esim_created' });
            continue;
          }

          // Step 3: USIMSA succeeded with true extension - capture the payment
          await stripe.paymentIntents.capture(paymentIntent.id);
          logStep(`Payment captured after successful extension`, { paymentIntentId: paymentIntent.id });

          // Step 4: Create extension order record
          const extensionOrderId = `EXT-${order.id.substring(0, 8)}-${Date.now()}`;
          const { data: extensionOrder, error: extensionError } = await supabaseAdmin
            .from('orders')
            .insert({
              user_id: order.user_id,
              package_id: order.package_id,
              total_amount: renewalPrice,
              original_amount: renewalPrice,
              currency: renewalCurrency,
              order_id: extensionOrderId,
              parent_order_id: order.order_id,
              status: 'completed',
              iccid: originalIccid,
              msisdn: webhook?.msisdn || null,
              qr_code: webhook?.qrCode || null,
              smdp_address: webhook?.smdpAddress || null,
              activation_code: webhook?.activationCode || null,
              expiry_date: usimSAResult.expiredDate || null,
              environment: 'production',
              auto_renewal_enabled: true,
              renewal_payment_method_id: paymentMethodId,
              webhook_data: {
                originalOrderId: order.id,
                isExtension: true,
                autoRenewal: true,
                paymentIntentId: paymentIntent.id,
                usimSAResponse: usimSAResult,
                triggerReason
              }
            })
            .select()
            .single();

          if (extensionError) {
            logStep(`Extension order created but record insert failed`, { error: extensionError.message });
          }

          // Log successful renewal
          await logRenewalAttempt(supabaseAdmin, order.id, 'success', renewalPrice, renewalCurrency, paymentIntent.id, null, usageDataForLog);

          // HANDOFF: Disable auto-renewal on the original order since the extension now takes over
          // This prevents both the original and extension orders from triggering renewals
          await supabaseAdmin
            .from('orders')
            .update({
              auto_renewal_enabled: false,
              renewal_failure_count: 0,
              renewal_failure_reason: null,
              last_renewal_attempt_at: new Date().toISOString()
            })
            .eq('id', order.id);
          
          logStep(`Disabled auto-renewal on original order ${order.id}, extension order ${extensionOrder?.id} now handles renewals`);

          renewedCount++;
          results.push({ 
            orderId: order.id, 
            status: 'renewed', 
            paymentIntentId: paymentIntent.id,
            extensionOrderId: extensionOrder?.id 
          });

        } catch (paymentError: any) {
          logStep(`Payment/renewal failed for order ${order.id}`, { error: paymentError.message });
          
          await logRenewalAttempt(supabaseAdmin, order.id, 'failed', renewalPrice, renewalCurrency, null, paymentError.message, usageDataForLog);
          
          await supabaseAdmin
            .from('orders')
            .update({
              renewal_failure_count: (order.renewal_failure_count || 0) + 1,
              renewal_failure_reason: paymentError.message,
              last_renewal_attempt_at: new Date().toISOString()
            })
            .eq('id', order.id);

          results.push({ orderId: order.id, status: 'failed', error: paymentError.message });
        }

      } catch (orderError: any) {
        logStep(`Error processing order ${order.id}`, { error: orderError.message });
        results.push({ orderId: order.id, status: 'error', error: orderError.message });
      }
    }

    logStep(`Cron job completed`, { processed: processedCount, renewed: renewedCount });

    return new Response(JSON.stringify({
      success: true,
      processed: processedCount,
      renewed: renewedCount,
      results
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    logStep("ERROR", { message: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function logRenewalAttempt(
  supabase: any,
  orderId: string,
  status: string,
  amount: number,
  currency: string,
  paymentIntentId: string | null,
  errorMessage: string | null,
  usageAtRenewal: any
) {
  try {
    await supabase.from('renewal_logs').insert({
      order_id: orderId,
      status,
      amount,
      currency,
      stripe_payment_intent_id: paymentIntentId,
      error_message: errorMessage,
      triggered_by: 'auto_cron',
      usage_at_renewal: usageAtRenewal
    });
  } catch (e: any) {
    console.error('Failed to log renewal attempt:', e);
  }
}
