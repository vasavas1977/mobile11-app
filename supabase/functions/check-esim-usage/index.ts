import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Base Cache TTL in milliseconds (10 minutes) - extended from 5 minutes
const BASE_CACHE_TTL_MS = 10 * 60 * 1000;

// Minimum time between API calls (60 seconds) - prevents duplicate calls
const MIN_API_CALL_INTERVAL_MS = 60 * 1000;

// Dynamic TTL based on eSIM status (returns TTL in milliseconds)
const calculateDynamicTTL = (cachedUsage: any): number => {
  if (!cachedUsage) return BASE_CACHE_TTL_MS;
  
  // Not yet activated - check less frequently (30 minutes)
  if (cachedUsage.notYetActivated) {
    return 30 * 60 * 1000;
  }
  
  // Expired eSIM - check rarely (1 hour)
  if (cachedUsage.validUntil) {
    const expiryTime = new Date(cachedUsage.validUntil).getTime();
    if (expiryTime < Date.now()) {
      return 60 * 60 * 1000;
    }
  }
  
  const percentageUsed = cachedUsage.percentageUsed ?? 0;
  
  // High urgency: <30% data remaining (>70% used) - 5 minutes
  if (percentageUsed >= 70) {
    return 5 * 60 * 1000;
  }
  
  // Medium urgency: 30-50% data remaining (50-70% used) - 10 minutes
  if (percentageUsed >= 50) {
    return 10 * 60 * 1000;
  }
  
  // Low urgency: >50% data remaining (<50% used) - 15 minutes
  return 15 * 60 * 1000;
};

// Multi-timezone countries with available options
const MULTI_TIMEZONE_COUNTRIES: Record<string, Record<string, string>> = {
  'USA': {
    'America/New_York': 'Eastern Time',
    'America/Chicago': 'Central Time',
    'America/Denver': 'Mountain Time',
    'America/Los_Angeles': 'Pacific Time',
    'America/Anchorage': 'Alaska Time',
    'Pacific/Honolulu': 'Hawaii Time',
  },
  'United States': {
    'America/New_York': 'Eastern Time',
    'America/Chicago': 'Central Time',
    'America/Denver': 'Mountain Time',
    'America/Los_Angeles': 'Pacific Time',
    'America/Anchorage': 'Alaska Time',
    'Pacific/Honolulu': 'Hawaii Time',
  },
  'Canada': {
    'America/Toronto': 'Eastern Time',
    'America/Winnipeg': 'Central Time',
    'America/Edmonton': 'Mountain Time',
    'America/Vancouver': 'Pacific Time',
  },
  'Australia': {
    'Australia/Sydney': 'Sydney (AEDT)',
    'Australia/Brisbane': 'Brisbane (AEST)',
    'Australia/Adelaide': 'Adelaide (ACDT)',
    'Australia/Perth': 'Perth (AWST)',
  },
};

// Country to default timezone mapping for destination time display
const COUNTRY_TIMEZONES: Record<string, string> = {
  'Thailand': 'Asia/Bangkok',
  'Japan': 'Asia/Tokyo',
  'South Korea': 'Asia/Seoul',
  'Korea': 'Asia/Seoul',
  'Singapore': 'Asia/Singapore',
  'Malaysia': 'Asia/Kuala_Lumpur',
  'Indonesia': 'Asia/Jakarta',
  'Taiwan': 'Asia/Taipei',
  'Hong Kong': 'Asia/Hong_Kong',
  'Hongkong': 'Asia/Hong_Kong',
  'China': 'Asia/Shanghai',
  'Vietnam': 'Asia/Ho_Chi_Minh',
  'Philippines': 'Asia/Manila',
  'India': 'Asia/Kolkata',
  'Australia': 'Australia/Sydney',
  'New Zealand': 'Pacific/Auckland',
  'USA': 'America/New_York',
  'United States': 'America/New_York',
  'UK': 'Europe/London',
  'United Kingdom': 'Europe/London',
  'France': 'Europe/Paris',
  'Germany': 'Europe/Berlin',
  'Italy': 'Europe/Rome',
  'Spain': 'Europe/Madrid',
  'Netherlands': 'Europe/Amsterdam',
  'Switzerland': 'Europe/Zurich',
  'Canada': 'America/Toronto',
  'Mexico': 'America/Mexico_City',
  'Brazil': 'America/Sao_Paulo',
  'UAE': 'Asia/Dubai',
  'United Arab Emirates': 'Asia/Dubai',
  'Saudi Arabia': 'Asia/Riyadh',
  'Turkey': 'Europe/Istanbul',
  'Russia': 'Europe/Moscow',
  'Cambodia': 'Asia/Phnom_Penh',
  'Laos': 'Asia/Vientiane',
  'Myanmar': 'Asia/Yangon',
  'Sri Lanka': 'Asia/Colombo',
  'Nepal': 'Asia/Kathmandu',
  'Bangladesh': 'Asia/Dhaka',
  'Pakistan': 'Asia/Karachi',
  // Regional packages - default to UTC or popular destination
  'Asia 13 Countries': 'Asia/Bangkok',
  'Europe 42 Countries': 'Europe/Paris',
  'Europe 42 Countries + 2Stopover': 'Europe/Paris',
  'Global 109 Countries': 'UTC',
  'Global 151 Countries': 'UTC',
  'Global': 'UTC',
  'Europe': 'Europe/Paris',
  'Asia': 'Asia/Bangkok',
};

// Get available timezones for a country (if multi-timezone)
const getAvailableTimezones = (countryName: string | null): Record<string, string> | null => {
  if (!countryName) return null;
  
  // Direct match
  if (MULTI_TIMEZONE_COUNTRIES[countryName]) {
    return MULTI_TIMEZONE_COUNTRIES[countryName];
  }
  
  // Case-insensitive match
  const lowerName = countryName.toLowerCase();
  for (const [country, timezones] of Object.entries(MULTI_TIMEZONE_COUNTRIES)) {
    if (country.toLowerCase() === lowerName) {
      return timezones;
    }
  }
  
  // Partial match
  for (const [country, timezones] of Object.entries(MULTI_TIMEZONE_COUNTRIES)) {
    if (lowerName.includes(country.toLowerCase()) || country.toLowerCase().includes(lowerName)) {
      return timezones;
    }
  }
  
  return null;
};

// Get timezone for a country name (with fuzzy matching)
const getTimezoneForCountry = (countryName: string | null): string => {
  if (!countryName) return 'UTC';
  
  // Direct match
  if (COUNTRY_TIMEZONES[countryName]) {
    return COUNTRY_TIMEZONES[countryName];
  }
  
  // Case-insensitive match
  const lowerName = countryName.toLowerCase();
  for (const [country, tz] of Object.entries(COUNTRY_TIMEZONES)) {
    if (country.toLowerCase() === lowerName) {
      return tz;
    }
  }
  
  // Partial match (e.g., "Asia 13 Countries" contains "Asia")
  for (const [country, tz] of Object.entries(COUNTRY_TIMEZONES)) {
    if (lowerName.includes(country.toLowerCase()) || country.toLowerCase().includes(lowerName)) {
      return tz;
    }
  }
  
  return 'UTC';
};

// Helper to normalize USIMSA timestamps (naive timestamps are in UTC)
const normalizeUsimTimestamp = (timestamp: string | null | undefined): string | null => {
  if (!timestamp) return null;
  // If already has timezone info (Z or +/-HH:MM), return as-is
  if (/Z|[+-]\d{2}:\d{2}$/.test(timestamp)) return timestamp;
  // Naive timestamp: USIMSA returns UTC, convert to ISO 8601 with Z suffix
  return timestamp.replace(' ', 'T') + 'Z';
};

// Helper function to format MB to human-readable string
// Show GB for 1000+ MB for cleaner display (user preference)
const formatDataAmount = (mb: number): string => {
  if (mb >= 1000) {
    const gb = mb / 1024;
    // For values >= 1GB, show 1 decimal; otherwise show 2 decimals
    return gb >= 1 ? `${gb.toFixed(1)} GB` : `${gb.toFixed(2)} GB`;
  }
  return `${mb.toFixed(0)} MB`;
};

// Helper to parse package data amount to MB
const parsePackageDataToMB = (dataStr: string | null): number | null => {
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
};

// ============ TUGE PROVIDER SUPPORT ============

// TUGE token cache
let tugeTokenCache: { token: string; expiresAt: number } | null = null;

// Helper to check TUGE success code (handles both string "0000" and number 0)
function isTugeSuccessCode(code: string | number): boolean {
  return code === '0000' || code === 0 || code === '0';
}

// Get TUGE auth token (with caching)
async function getTugeToken(accountId: string, secret: string, baseUrl: string): Promise<string> {
  // Check if cached token is still valid (with 5 minute buffer)
  if (tugeTokenCache && tugeTokenCache.expiresAt > Date.now() + 5 * 60 * 1000) {
    return tugeTokenCache.token;
  }

  console.log('[TUGE] Fetching new auth token');
  const authResponse = await fetch(`${baseUrl}/oauth/token`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json; charset=utf-8',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ accountId, secret }),
  });

  const authResult = await authResponse.json();
  if (!isTugeSuccessCode(authResult.code)) {
    throw new Error(`TUGE authentication failed: ${authResult.msg || authResult.message}`);
  }

  // Handle both token field names per TUGE API
  const token = authResult.data?.token || authResult.data?.accessToken;
  if (!token) {
    throw new Error('No token received in TUGE auth response');
  }

  // Cache the token - expires is in seconds, convert to milliseconds
  tugeTokenCache = {
    token,
    expiresAt: Date.now() + (authResult.data.expires * 1000),
  };

  return token;
}

// Helper to safely parse date to ISO string (returns null on invalid date)
function safeToISOString(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  } catch {
    return null;
  }
}

// Fetch profile/expiry data from TUGE Profile API
async function fetchTugeProfile(
  iccid: string,
  token: string,
  baseUrl: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    console.log('[TUGE] Fetching profile for ICCID:', iccid);
    const profileResponse = await fetch(`${baseUrl}/eSIMApi/v2/iccid/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ iccid }), // FIXED: lowercase key per TUGE API spec
    });

    const profileResult = await profileResponse.json();
    console.log('[TUGE] Profile API response:', JSON.stringify(profileResult));

    if (!isTugeSuccessCode(profileResult.code)) {
      return { 
        success: false, 
        error: profileResult.msg || profileResult.message || 'Failed to fetch TUGE profile' 
      };
    }

    return { success: true, data: profileResult.data };
  } catch (error: any) {
    console.error('[TUGE] Error fetching profile:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

// Fetch order info from TUGE Order Query API (returns activatedEndTime for expiry)
async function fetchTugeOrderInfo(
  orderNo: string,
  token: string,
  baseUrl: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    console.log('[TUGE] Fetching order info for orderNo:', orderNo);
    const response = await fetch(`${baseUrl}/eSIMApi/v2/order/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ orderNo }),
    });

    const result = await response.json();
    console.log('[TUGE] Order Query API response:', JSON.stringify(result));

    if (!isTugeSuccessCode(result.code)) {
      return { 
        success: false, 
        error: result.msg || result.message || 'Failed to fetch TUGE order info' 
      };
    }

    // API returns list, get first match
    const orderInfo = result.data?.list?.[0];
    return { success: true, data: orderInfo };
  } catch (error: any) {
    console.error('[TUGE] Error fetching order info:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

// Fetch usage from TUGE API
async function fetchTugeUsage(
  providerOrderId: string,
  packageDataAmount: string | null,
  packageType: string | null,
  validityDays: number,
  destinationCountry: string | null,
  destinationTimezone: string,
  availableTimezones: Record<string, string> | null,
  iccid?: string | null
): Promise<{ success: boolean; usage?: any; error?: string }> {
  // Get TUGE credentials (production first, fallback to sandbox)
  const accountId = Deno.env.get("TUGE_PROD_ACCOUNT_ID") || Deno.env.get("TUGE_ACCOUNT_ID");
  const secret = Deno.env.get("TUGE_PROD_SECRET") || Deno.env.get("TUGE_SECRET");
  const baseUrl = Deno.env.get("TUGE_PROD_BASE_URL") || Deno.env.get("TUGE_BASE_URL") || "https://enterpriseapi.tugegroup.com:8070/openapi";

  if (!accountId || !secret) {
    return { success: false, error: 'TUGE credentials not configured' };
  }

  try {
    const token = await getTugeToken(accountId, secret, baseUrl);

    // Call TUGE usage API using orderNo
    console.log('[TUGE] Fetching usage for orderNo:', providerOrderId);
    const usageResponse = await fetch(`${baseUrl}/eSIMApi/v2/order/usage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        orderNo: providerOrderId,
      }),
    });

    const usageResult = await usageResponse.json();
    console.log('[TUGE] Usage API response:', JSON.stringify(usageResult));

    if (!isTugeSuccessCode(usageResult.code)) {
      return { 
        success: false, 
        error: usageResult.msg || usageResult.message || 'Failed to fetch TUGE usage' 
      };
    }

    // Extract TUGE usage data
    const tugeData = usageResult.data || {};
    
    // Fetch order info for real expiry dates (activatedEndTime)
    // This is more accurate than profile API which only returns installTime
    let orderInfo: any = {};
    const orderInfoResult = await fetchTugeOrderInfo(providerOrderId, token, baseUrl);
    if (orderInfoResult.success && orderInfoResult.data) {
      orderInfo = orderInfoResult.data;
      console.log('[TUGE] Order info merged:', JSON.stringify(orderInfo));
    }
    
    // Also fetch profile data as fallback
    let profileData: any = {};
    const iccidToUse = iccid || tugeData.iccId || orderInfo.iccId;
    if (iccidToUse) {
      const profileResult = await fetchTugeProfile(iccidToUse, token, baseUrl);
      if (profileResult.success && profileResult.data) {
        profileData = profileResult.data;
        console.log('[TUGE] Profile data merged:', JSON.stringify(profileData));
      }
    }
    
    // TUGE API returns different field names and formats:
    // - dataUsage: string in MB (e.g., "700.00")
    // - dataTotal: string "unlimited" or bytes number
    // - dataResidual: string "unlimited" or bytes number
    // Handle both the v2/order/usage and profile API formats
    
    let dataUsedMB = 0;
    let dataTotalMB = 0;
    const isUnlimited = String(tugeData.dataTotal).toLowerCase() === 'unlimited' || 
                        String(tugeData.dataResidual).toLowerCase() === 'unlimited';
    
    // Parse dataUsage (MB as string) or dataUsed (bytes as number)
    if (tugeData.dataUsage !== undefined) {
      // v2/order/usage format: dataUsage is MB as string
      dataUsedMB = parseFloat(String(tugeData.dataUsage)) || 0;
    } else if (tugeData.dataUsed !== undefined) {
      // Alternative format: dataUsed is bytes
      dataUsedMB = (Number(tugeData.dataUsed) || 0) / (1024 * 1024);
    }
    
    // Parse dataTotal
    if (!isUnlimited) {
      if (typeof tugeData.dataTotal === 'number') {
        dataTotalMB = tugeData.dataTotal / (1024 * 1024);
      } else if (typeof tugeData.dataTotal === 'string') {
        dataTotalMB = parseFloat(tugeData.dataTotal) || 0;
      }
    }
    
    const percentUsed = dataTotalMB > 0 ? (dataUsedMB / dataTotalMB) * 100 : 0;
    
    // Format for UI display (same keys as USIMSA path)
    const usageMb = Math.round(dataUsedMB * 100) / 100;
    const dataUsed = formatDataAmount(usageMb);
    
    // For total data - use TUGE's value or fall back to package
    let totalData: string;
    let totalDataMb: number | null;
    if (isUnlimited) {
      totalData = 'Unlimited';
      totalDataMb = null;
    } else if (dataTotalMB > 0) {
      totalData = formatDataAmount(dataTotalMB);
      totalDataMb = dataTotalMB;
    } else {
      // Fallback to package data
      totalDataMb = parsePackageDataToMB(packageDataAmount);
      totalData = packageDataAmount || 'Unlimited';
    }
    
    // Calculate remaining
    let remainingData: string | null = null;
    let remainingDataMb: number | null = null;
    if (isUnlimited) {
      remainingData = 'Unlimited';
    } else if (totalDataMb && totalDataMb > 0) {
      remainingDataMb = Math.max(0, totalDataMb - usageMb);
      remainingData = formatDataAmount(remainingDataMb);
    }
    
    // Determine if this is a Day Pass
    const normalizedType = (packageType || '').toLowerCase().replace(/[_\s-]/g, '');
    const isDayPass = normalizedType === 'daypass';
    
    // Get expiry info - PRIORITY: Order Query API > Profile API > Calculated fallback
    // Order Query API returns: activatedStartTime, activatedEndTime, orderStatus (MOST ACCURATE)
    // Profile API returns: expireTime, installTime, activeTime
    let expireTime = orderInfo.activatedEndTime || profileData.expireTime || tugeData.expireTime;
    let activeTime = orderInfo.activatedStartTime || profileData.installTime || profileData.activeTime || 
                     profileData.latestActivationTime || tugeData.activeTime || profileData.createdTime;
    const orderState = orderInfo.orderStatus || profileData.orderState || tugeData.orderState;
    let daysRemaining = profileData.daysRemaining ?? tugeData.daysRemaining;
    
    console.log('[TUGE] Expiry sources:', { 
      orderActivatedEndTime: orderInfo.activatedEndTime,
      profileExpireTime: profileData.expireTime,
      usingExpireTime: expireTime 
    });
    
    // FALLBACK: If still no expireTime but installTime exists, calculate expiry
    // This is for edge cases where Order Query API doesn't return dates yet
    if (!expireTime && activeTime && validityDays > 0) {
      const startDate = new Date(activeTime);
      if (!isNaN(startDate.getTime())) {
        const expiryDate = new Date(startDate);
        expiryDate.setDate(expiryDate.getDate() + validityDays);
        expireTime = expiryDate.toISOString();
        console.log('[TUGE] Calculated expireTime as fallback:', { activeTime, validityDays, expireTime });
      }
    }
    
    // Calculate daysRemaining from expireTime
    if (expireTime) {
      const expiryDate = new Date(expireTime);
      if (!isNaN(expiryDate.getTime())) {
        const now = new Date();
        daysRemaining = Math.max(0, Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      }
    }
    
    // Map to validUntil, validFrom (with safe parsing)
    const validUntil = safeToISOString(expireTime);
    const validFrom = safeToISOString(activeTime);
    
    console.log('[TUGE] Validity info:', { expireTime, activeTime, validUntil, validFrom, daysRemaining, orderState });
    
    // Determine if eSIM is not yet activated
    // If there's actual usage, the eSIM IS activated regardless of orderState
    const isNotYetActivated = usageMb > 0 
      ? false 
      : ['NOTACTIVE', 'PENDING', 'CREATED'].includes((orderState || '').toUpperCase());
    
    console.log('[TUGE] Activation status:', { orderState, isNotYetActivated });
    
    // Build UI-friendly usage object (compatible with EsimCard display)
    const usage = {
      // UI-friendly fields (same as USIMSA path)
      dataUsed,
      remainingData,
      totalData,
      percentageUsed: Math.round(percentUsed * 100) / 100,
      usageMb,
      remainingDataMb,
      // Clear validity dates for non-activated eSIMs to prevent misleading UI
      validFrom: isNotYetActivated ? null : validFrom,
      validUntil: isNotYetActivated ? null : validUntil,
      notYetActivated: isNotYetActivated,
      isDayPass,
      destinationCountry,
      destinationTimezone,
      availableTimezones,
      
      // TUGE-specific fields (for debugging/backward compat)
      dataUsedMB: Math.round(dataUsedMB * 100) / 100,
      dataTotalMB: Math.round(dataTotalMB * 100) / 100,
      percentUsed: Math.round(percentUsed * 100) / 100,
      orderState,
      expireTime,
      activeTime,
      daysRemaining,
      iccId: iccidToUse,
      
      // Provider info
      provider: {
        name: 'tuge',
        code: usageResult.code,
        message: usageResult.msg || usageResult.message,
      }
    };

    return { success: true, usage };
  } catch (error: any) {
    console.error('[TUGE] Error fetching usage:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

// Check if cached_usage looks like corrupt/stale TUGE cache
// This happens when check-esim-usage was called before proper TUGE support
function isTugeCacheCorrupt(cachedUsage: any): boolean {
  if (!cachedUsage) return false;
  
  // Check 1: USIMSA-format cache on a TUGE order
  // - Has notYetActivated: true
  // - Missing TUGE-specific fields like orderState, expireTime
  // - Has USIMSA-specific fields like topupId
  const hasNotActivatedFlag = cachedUsage.notYetActivated === true;
  const missingTugeFields = !cachedUsage.orderState && !cachedUsage.expireTime;
  const hasUsimFields = cachedUsage.topupId !== undefined || cachedUsage.activationStatus !== undefined;
  
  if (hasNotActivatedFlag && missingTugeFields && hasUsimFields) {
    return true;
  }
  
  // Check 2: Zero-usage TUGE cache that should have data
  // If provider.name is 'tuge' but usageMb is 0 and there's no expireTime/validUntil,
  // it might be stale from before proper TUGE support was added
  const isTugeProvider = cachedUsage.provider?.name === 'tuge';
  const hasZeroUsage = (cachedUsage.usageMb === 0 || cachedUsage.usageMb === undefined) &&
                       (cachedUsage.dataUsedMB === 0 || cachedUsage.dataUsedMB === undefined);
  const noValidityInfo = !cachedUsage.validUntil && !cachedUsage.expireTime;
  const notActivatedFalse = cachedUsage.notYetActivated === false;
  
  // Suspect stale TUGE cache: has provider marker, zero usage, no expiry, but marked as activated
  if (isTugeProvider && hasZeroUsage && noValidityInfo && notActivatedFalse) {
    return true;
  }
  
  return false;
}

// ============ MAIN HANDLER ============

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse orderId, optional preferredTimezone, and forceRefresh flag
    const body = await req.json();
    const { orderId, preferredTimezone, forceRefresh = false } = body;

    if (!orderId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'orderId is required' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin OR owns this order
    const { data: roleData } = await supabaseAdmin.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    const isAdmin = roleData === true;

    // If not admin, verify order ownership
    if (!isAdmin) {
      const { data: orderCheck, error: orderCheckError } = await supabaseAdmin
        .from('orders')
        .select('user_id')
        .eq('id', orderId)
        .maybeSingle();

      if (orderCheckError || !orderCheck) {
        return new Response(
          JSON.stringify({ error: 'Order not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (orderCheck.user_id !== user.id) {
        return new Response(
          JSON.stringify({ error: 'Forbidden - You can only check usage for your own orders' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('Request received:', { orderId, userId: user.id, isAdmin, forceRefresh });

    // Fetch order with package info, cache data, webhook data, provider info, AND iccid
    const { data: orderData, error: orderError } = await supabaseAdmin
      .from('orders')
      .select(`
        webhook_data, 
        environment,
        cached_usage,
        usage_cached_at,
        provider_order_id,
        iccid,
        esim_packages(country_name, data_amount, package_type, daily_data_reset, daily_reset_amount, speed_after_limit, validity_days),
        esim_providers(provider_code)
      `)
      .eq('id', orderId)
      .maybeSingle();

    if (orderError || !orderData) {
      console.error('Error fetching order:', orderError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Order not found or error fetching order details' 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine provider
    const providerCode = (orderData as any).esim_providers?.provider_code || 'usimsa';
    const isTugeOrder = providerCode === 'tuge';
    console.log('Provider detected:', { providerCode, isTugeOrder });

    // Get destination country, timezone, and package data
    const esimPackage = (orderData as any).esim_packages;
    const destinationCountry = esimPackage?.country_name || null;
    const packageDataAmount = esimPackage?.data_amount || null;
    const packageType = esimPackage?.package_type || null;
    const dailyDataReset = esimPackage?.daily_data_reset || false;
    const dailyResetAmount = esimPackage?.daily_reset_amount || null;
    const speedAfterLimit = esimPackage?.speed_after_limit || null;
    const validityDays = esimPackage?.validity_days || 7;
    
    // Determine if this is a Day Pass plan
    const normalizedType = (packageType || '').toLowerCase().replace(/[_\s-]/g, '');
    const isDayPass = normalizedType === 'daypass' || dailyDataReset === true;
    const availableTimezones = getAvailableTimezones(destinationCountry);
    
    // Use preferred timezone if valid, otherwise default
    let destinationTimezone: string;
    if (preferredTimezone && availableTimezones && availableTimezones[preferredTimezone]) {
      destinationTimezone = preferredTimezone;
    } else {
      destinationTimezone = getTimezoneForCountry(destinationCountry);
    }
    console.log('Destination info:', { destinationCountry, destinationTimezone, availableTimezones, preferredTimezone });

    // Check cache first (unless forceRefresh is true)
    const cachedUsage = (orderData as any).cached_usage;
    const usageCachedAt = (orderData as any).usage_cached_at;
    
    // For TUGE orders, also check if cache is corrupt (USIMSA format)
    const tugeCacheCorrupt = isTugeOrder && isTugeCacheCorrupt(cachedUsage);
    if (tugeCacheCorrupt) {
      console.log('[TUGE] Cache appears corrupt (USIMSA format), will refresh');
    }
    
    if (!forceRefresh && !tugeCacheCorrupt && cachedUsage && usageCachedAt) {
      const cacheAge = Date.now() - new Date(usageCachedAt).getTime();
      const dynamicTTL = calculateDynamicTTL(cachedUsage);
      
      if (cacheAge < dynamicTTL) {
        console.log('Returning cached usage data, age:', Math.round(cacheAge / 1000), 'seconds, TTL:', Math.round(dynamicTTL / 1000), 'seconds');
        return new Response(
          JSON.stringify({
            success: true,
            usage: cachedUsage,
            fromCache: true,
            cacheAge: Math.round(cacheAge / 1000),
            cacheTTL: Math.round(dynamicTTL / 1000),
            nextRefreshAt: new Date(new Date(usageCachedAt).getTime() + dynamicTTL).toISOString()
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Also check if an API call happened very recently (within 60 seconds)
      if (cacheAge < MIN_API_CALL_INTERVAL_MS) {
        console.log('Recent API call detected, returning cached data to prevent duplicate calls, age:', Math.round(cacheAge / 1000), 'seconds');
        return new Response(
          JSON.stringify({
            success: true,
            usage: cachedUsage,
            fromCache: true,
            cacheAge: Math.round(cacheAge / 1000),
            recentApiCallProtection: true
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('Cache expired, age:', Math.round(cacheAge / 1000), 'seconds, TTL was:', Math.round(dynamicTTL / 1000), 'seconds, fetching fresh data');
    } else if (forceRefresh) {
      console.log('Force refresh requested, bypassing cache');
    }

    // ============ TUGE PATH ============
    if (isTugeOrder) {
      const providerOrderId = (orderData as any).provider_order_id;
      
      if (!providerOrderId) {
        console.log('[TUGE] No provider_order_id, returning not-yet-activated status');
        const totalDataMb = parsePackageDataToMB(packageDataAmount);
        
        const notActivatedUsage = {
          notYetActivated: true,
          usageMb: 0,
          dataUsed: '0 MB',
          remainingData: packageDataAmount || 'Unlimited',
          remainingDataMb: totalDataMb,
          totalData: packageDataAmount || 'Unlimited',
          percentageUsed: 0,
          validFrom: null,
          validUntil: null,
          isDayPass,
          destinationTimezone,
          availableTimezones,
          provider: { name: 'tuge' }
        };
        
        await supabaseAdmin
          .from('orders')
          .update({
            cached_usage: notActivatedUsage,
            usage_cached_at: new Date().toISOString()
          })
          .eq('id', orderId);
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            usage: notActivatedUsage,
            message: 'TUGE eSIM not yet provisioned. Usage data will be available after order completion.'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Fetch usage from TUGE (also pass ICCID for profile API call)
      const orderIccid = (orderData as any).iccid;
      const tugeResult = await fetchTugeUsage(
        providerOrderId,
        packageDataAmount,
        packageType,
        validityDays,
        destinationCountry,
        destinationTimezone,
        availableTimezones,
        orderIccid
      );
      
      if (!tugeResult.success) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: tugeResult.error || 'Failed to fetch TUGE usage'
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Cache the TUGE usage
      await supabaseAdmin
        .from('orders')
        .update({
          cached_usage: tugeResult.usage,
          usage_cached_at: new Date().toISOString(),
          provider_status: tugeResult.usage.orderState
        })
        .eq('id', orderId);
      
      return new Response(
        JSON.stringify({
          success: true,
          usage: tugeResult.usage
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============ USIMSA PATH (original logic) ============
    const environment = orderData.environment || 'production';
    console.log('Order environment:', environment);

    let accessKey: string;
    let secretKey: string;
    let baseUrl: string;

    if ((environment || '').toLowerCase() === 'sandbox') {
      accessKey = Deno.env.get('USIMSA_ACCESS_KEY') || '';
      secretKey = Deno.env.get('USIMSA_SECRET_KEY') || '';
      baseUrl = Deno.env.get('USIMSA_BASE_URL') || 'https://open-api-sandbox.usimsa.com/api';
    } else {
      accessKey = Deno.env.get('USIMSA_PROD_ACCESS_KEY') || Deno.env.get('USIMSA_ACCESS_KEY') || '';
      secretKey = Deno.env.get('USIMSA_PROD_SECRET_KEY') || Deno.env.get('USIMSA_SECRET_KEY') || '';
      baseUrl = Deno.env.get('USIMSA_PROD_BASE_URL') || Deno.env.get('USIMSA_BASE_URL') || 'https://open-api.usimsa.com/api';
    }

    const webhook = (orderData as any).webhook_data as Record<string, any> | null;
    // Check for topupId in various locations (direct, nested in usimSAResponse for extension orders)
    const topupId = webhook?.topupId || webhook?.topup_id || webhook?.topupid || 
                    webhook?.usimSAResponse?.topupId || webhook?.usimSAResponse?.topup_id || '';
    console.log('Retrieved from order:', { topupId, environment, webhookKeys: webhook ? Object.keys(webhook) : [] });

    if (!topupId) {
      // No topupId available - this eSIM hasn't been activated yet or doesn't support usage tracking
      console.log('No topupId available, returning not-yet-activated status');
      
      const totalDataMb = parsePackageDataToMB(packageDataAmount);
      
      const notActivatedUsage = {
        notYetActivated: true,
        usageMb: 0,
        dataUsed: '0 MB',
        remainingData: packageDataAmount || null,
        remainingDataMb: totalDataMb,
        totalData: packageDataAmount,
        percentageUsed: 0,
        validFrom: null,
        validUntil: null,
        isDayPass,
        destinationTimezone,
        availableTimezones: availableTimezones || null,
        speedAfterLimit: speedAfterLimit || null,
      };
      
      // Cache this response
      await supabaseAdmin
        .from('orders')
        .update({
          cached_usage: notActivatedUsage,
          usage_cached_at: new Date().toISOString()
        })
        .eq('id', orderId);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          usage: notActivatedUsage,
          message: 'eSIM not yet activated. Usage data will be available after activation.'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const finalBaseUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
    const path = `/api/v2/topup/${encodeURIComponent(topupId)}`;
    const url = `${finalBaseUrl.replace(/\/api$/, '')}/api/v2/topup/${encodeURIComponent(topupId)}`;
    const timestamp = Date.now().toString();

    console.log('Making GET request:', { path, url, topupId });

    // Generate HMAC signature: GET {path}\n{timestamp}\n{accessKey}
    const stringToSign = `GET ${path}\n${timestamp}\n${accessKey}`;
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

    console.log('Request details:', {
      method: 'GET',
      path,
      timestamp,
      accessKey: accessKey.substring(0, 8) + '...'
    });

    const usageResponse = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'x-gat-access-key': accessKey,
        'x-gat-timestamp': timestamp,
        'x-gat-signature': base64Signature,
      },
    });

    const responseText = await usageResponse.text();
    console.log('USIMSA API Response:', { status: usageResponse.status, body: responseText });

    let providerJson;
    try {
      providerJson = JSON.parse(responseText);
    } catch (e: any) {
      console.error('Failed to parse response:', e);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid response from provider',
          details: responseText 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalize provider response
    const code = providerJson.code || providerJson?.statusCode || '';
    const message = providerJson.message || providerJson.msg || null;
    const topupData = providerJson.topup || providerJson.data?.topup || null;

    console.log('Provider response code:', code);

    // Handle special cases where provider returns non-success codes that aren't true errors
    // Code 1002: "No data currently in use" - eSIM not yet activated, return default usage
    if (code === '1002' || (code !== '0000' && message?.toLowerCase().includes('no data currently in use'))) {
      console.log('eSIM not yet activated or no data usage - returning default values');
      
      const totalDataMb = parsePackageDataToMB(packageDataAmount);
      
      const notActivatedUsage = {
        notYetActivated: true,
        usageMb: 0,
        dataUsed: '0 MB',
        remainingData: packageDataAmount || null,
        remainingDataMb: totalDataMb,
        totalData: packageDataAmount,
        percentageUsed: 0,
        validFrom: null,
        validUntil: null,
        isDayPass,
        dailyAllowance: dailyResetAmount,
        speedAfterLimit,
        destinationTimezone,
        availableTimezones,
        providerCode: code,
        providerMessage: message
      };

      // Cache the not-yet-activated state too
      await supabaseAdmin
        .from('orders')
        .update({
          cached_usage: notActivatedUsage,
          usage_cached_at: new Date().toISOString()
        })
        .eq('id', orderId);
      
      return new Response(
        JSON.stringify({ 
          success: true,
          usage: notActivatedUsage
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For other non-success codes, return error
    if (code !== '0000') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: message || 'Failed to fetch usage data',
          providerCode: code,
          providerMessage: message
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract usage data from multiple possible formats
    let usageMb = 0;
    let unitFromProvider: string | undefined;
    let usedDataRaw: string | number | null = null;
    let totalDataRaw: string | number | null = null;
    let remainingDataRaw: string | number | null = null;

    // Format 1: topup.usage as string (MB) - this is data USED
    if (topupData?.usage != null) {
      const num = Number(topupData.usage);
      usageMb = Number.isFinite(num) ? num : 0;
      unitFromProvider = 'MB';
      usedDataRaw = topupData.usage;
    } 
    // Format 2: data.usage with usedData/totalData/unit
    else if (providerJson.data?.usage) {
      const usage = providerJson.data.usage;
      const used = parseFloat(usage.usedData || '0');
      const unit = (usage.unit || '').toUpperCase();
      
      usedDataRaw = usage.usedData || '0';
      totalDataRaw = usage.totalData || '0';
      remainingDataRaw = usage.remainingData || '0';
      unitFromProvider = unit || 'MB';

      if (unit === 'MB') {
        usageMb = used;
      } else if (unit === 'GB') {
        usageMb = used * 1024;
      } else if (unit === 'KB') {
        usageMb = used / 1024;
      } else {
        usageMb = used;
      }
    }

    // Format data for UI - using field names the UI expects
    const formattedUsageMb = Math.round(usageMb * 100) / 100;
    const dataUsed = formatDataAmount(formattedUsageMb);
    
    // Get total data from package
    const totalDataMb = parsePackageDataToMB(packageDataAmount);
    const totalData = packageDataAmount || null;
    
    // Calculate remaining data
    let remainingData: string | null = null;
    let remainingDataMb: number | null = null;
    let percentageUsed: number | null = null;
    
    if (remainingDataRaw !== null) {
      // Use provider's remaining data if available
      const remainingNum = Number(remainingDataRaw);
      if (Number.isFinite(remainingNum) && remainingNum > 0) {
        let remaining = remainingNum;
        if (unitFromProvider === 'GB') {
          remaining = remainingNum * 1024;
        } else if (unitFromProvider === 'KB') {
          remaining = remainingNum / 1024;
        }
        remainingDataMb = remaining;
        remainingData = formatDataAmount(remaining);
      }
    } else if (totalDataMb !== null) {
      // Calculate remaining: total - used
      remainingDataMb = Math.max(0, totalDataMb - formattedUsageMb);
      remainingData = formatDataAmount(remainingDataMb);
    }
    
    // Calculate percentage used
    if (totalDataMb !== null && totalDataMb > 0) {
      percentageUsed = Math.min(100, Math.max(0, (formattedUsageMb / totalDataMb) * 100));
    }

    // Log for debugging
    console.log('Usage calculation:', {
      packageDataAmount,
      totalDataMb,
      usageMb: formattedUsageMb,
      remainingDataMb,
      percentageUsed,
      remainingData,
      isDayPass,
      dailyResetAmount,
    });

    // Calculate Day Pass specific fields
    let dayPassFields: Record<string, any> = {};
    if (isDayPass) {
      const activeTime = normalizeUsimTimestamp(topupData?.activeTime);
      
      if (activeTime) {
        const startTime = new Date(activeTime).getTime();
        const now = Date.now();
        const msPerDay = 24 * 60 * 60 * 1000;
        
        // Calculate current day (1-indexed)
        const daysPassed = Math.floor((now - startTime) / msPerDay);
        const currentDay = Math.min(Math.max(1, daysPassed + 1), validityDays);
        
        // Calculate next reset time
        const nextResetTime = new Date(startTime + (daysPassed + 1) * msPerDay);
        const secondsUntilReset = Math.max(0, Math.floor((nextResetTime.getTime() - now) / 1000));
        
        // Parse daily allowance (default to 10GB for Limitless plans)
        const dailyAllowanceMb = parsePackageDataToMB(dailyResetAmount) || 10240;
        
        // For Day Pass, today's usage resets each day
        const cyclePosition = formattedUsageMb % dailyAllowanceMb;
        const todayUsedMb = (cyclePosition === 0 && formattedUsageMb > 0)
          ? dailyAllowanceMb  // Full daily allowance consumed
          : cyclePosition;
        const todayRemainingMb = Math.max(0, dailyAllowanceMb - todayUsedMb);
        
        // Determine speed status
        const speedStatus = todayRemainingMb > 0 ? 'high-speed' : 'throttled';
        
        dayPassFields = {
          isDayPass: true,
          dailyAllowance: dailyResetAmount || '2GB',
          dailyAllowanceMb,
          todayUsedMb,
          todayRemainingMb,
          currentDay,
          totalDays: validityDays,
          nextResetTime: nextResetTime.toISOString(),
          secondsUntilReset,
          speedStatus,
          fallbackSpeed: speedAfterLimit || '384 Kbps',
        };
      }
    }

    // Log raw timestamps for debugging
    console.log('Raw USIMSA timestamps:', {
      createTime: topupData?.createTime,
      activeTime: topupData?.activeTime,
      expireTime: topupData?.expireTime,
    });

    // Build the usage response object
    const usageData = {
      topupId: topupData?.topupId || topupId || undefined,
      createTime: normalizeUsimTimestamp(topupData?.createTime),
      // Keep original field names for admin UI backward compatibility
      activeTime: normalizeUsimTimestamp(topupData?.activeTime),
      expireTime: normalizeUsimTimestamp(topupData?.expireTime),
      // Map to field names user-facing UI expects
      validFrom: normalizeUsimTimestamp(topupData?.activeTime),
      validUntil: normalizeUsimTimestamp(topupData?.expireTime),
      // Status fields from provider
      status: topupData?.status || null,
      activationStatus: topupData?.activationStatus || null,
      // Destination timezone info for proper date display
      destinationCountry,
      destinationTimezone,
      // Available timezones for multi-timezone countries
      availableTimezones,
      // Formatted data for display
      dataUsed,
      remainingData,
      totalData, // Package total data (e.g., "10 GB")
      percentageUsed, // Percentage of data used (0-100)
      // Also keep raw values for flexibility
      usageMb: formattedUsageMb,
      remainingDataMb,
      usedDataRaw,
      totalDataRaw,
      remainingDataRaw,
      unit: unitFromProvider || 'MB',
      // Day Pass specific fields
      ...dayPassFields,
      provider: {
        code,
        message,
        raw: providerJson
      }
    };

    // Update cache in database
    console.log('Updating usage cache for order:', orderId);
    await supabaseAdmin
      .from('orders')
      .update({
        cached_usage: usageData,
        usage_cached_at: new Date().toISOString()
      })
      .eq('id', orderId);

    return new Response(
      JSON.stringify({
        success: true,
        usage: usageData
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : typeof err === 'string' ? err : JSON.stringify(err);
    console.error('Error in check-esim-usage function:', err);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: message || 'Internal server error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
