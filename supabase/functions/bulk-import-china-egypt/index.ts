import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TUGE_PROVIDER_ID = '4e7e5af2-8e7a-4d5c-aea2-302fea9c5dac';
const MARKUP = 4.0;

function getPackageType(product: any): string {
  if (product.product_type === 'DATA_PACK') return 'max_speed';
  if (product.product_type === 'DAILY_PACK') {
    if (product.high_speed === 'Unlimited') return 'limitless';
    return 'day_pass';
  }
  return 'max_speed';
}

function parseDataAmount(product: any): string {
  if (product.data_total != null && product.data_unit) {
    return `${product.data_total}${product.data_unit}`;
  }
  if (product.high_speed) {
    if (product.high_speed === 'Unlimited') return 'Unlimited';
    let speed = product.high_speed;
    if (/^\d+M$/i.test(speed)) speed = speed + 'B';
    if (product.product_type === 'DAILY_PACK') return `${speed}/day`;
    return speed;
  }
  return '0MB';
}

function buildName(prefix: string, dataAmount: string, validityDays: number, packageType: string): string {
  const typeLabel = packageType === 'limitless' ? 'Limitless' : packageType === 'day_pass' ? 'DayPass' : 'MaxSpeed';
  return `${prefix} ${dataAmount} ${validityDays}Days ${typeLabel}`;
}

function buildDescription(packageType: string, dataAmount: string, validityDays: number, isChinaTTGPT: boolean): string {
  const socialNote = isChinaTTGPT ? 'Supports all social media including TikTok and ChatGPT. ' : '';

  if (packageType === 'limitless') {
    return `${socialNote}Unlimited data at full speed for ${validityDays} days. Daily data resets every 24 hours.`;
  }
  if (packageType === 'day_pass') {
    return `${socialNote}${dataAmount} high-speed data per day for ${validityDays} days. Speed reduced after daily limit.`;
  }
  return `${socialNote}${dataAmount} total high-speed data valid for ${validityDays} days.`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let filterTarget: string | null = null;
    let activateMode = false;
    try {
      const body = await req.json();
      filterTarget = body?.target || null; // 'china', 'egypt', or null for both
      activateMode = body?.activate === true;
    } catch { /* no body */ }

    // ── Activate mode: set all imported packages to active ──
    if (activateMode) {
      const { data, error } = await supabase
        .from('esim_packages')
        .update({ is_active: true })
        .eq('provider_metadata->>source', 'bulk-import-china-egypt')
        .eq('is_active', false)
        .select('id, country_name');

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`[ACTIVATE] Activated ${data?.length || 0} packages`);
      return new Response(JSON.stringify({ success: true, activated: data?.length || 0 }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results = { china: { imported: 0, skipped: 0, errors: [] as any[] }, egypt: { imported: 0, skipped: 0, errors: [] as any[] } };

    // ── China (TT&GPT) ──────────────────────────────────────────────
    if (!filterTarget || filterTarget === 'china') {
      console.log('[CHINA-TTGPT] Fetching TT&GPT products...');

      const { data: chinaProducts, error: chinaErr } = await supabase
        .from('tuge_product_cache')
        .select('*')
        .eq('card_type', 'C4')
        .like('product_code', '%AU%')
        .like('product_name', '%TT&GPT%')
        .contains('countries', JSON.stringify(['CN']))
        .limit(500);

      if (chinaErr) {
        console.error('[CHINA-TTGPT] Fetch error:', chinaErr);
        results.china.errors.push({ error: chinaErr.message });
      } else {
        const singleCountry = (chinaProducts || []).filter((p: any) => {
          const countries: string[] = p.countries || [];
          return countries.length === 1 && countries[0] === 'CN';
        });

        console.log(`[CHINA-TTGPT] Found ${singleCountry.length} single-country AU TT&GPT products`);

        for (const product of singleCountry) {
          try {
            const costPrice = Number(product.net_price || 0);
            const retailPrice = Math.round(costPrice * MARKUP * 100) / 100;
            const dataAmount = parseDataAmount(product);
            const validityDays = Number(product.usage_period || product.duration || 30);
            const packageType = getPackageType(product);

            let qosSpeed: string | null = null;
            let speedAfterLimit: string | null = null;
            if (packageType === 'limitless') {
              qosSpeed = 'Unlimited';
            } else if (packageType === 'day_pass') {
              speedAfterLimit = product.limit_speed || '128Kbps';
            } else if (product.high_speed && product.high_speed !== 'Unlimited') {
              qosSpeed = product.high_speed;
            }

            const name = buildName('China (TT&GPT)', dataAmount, validityDays, packageType);
            const description = buildDescription(packageType, dataAmount, validityDays, true);

            const record = {
              package_id: product.product_code,
              name,
              description,
              country_code: 'CN',
              country_name: 'China',
              data_amount: dataAmount,
              validity_days: validityDays,
              price: retailPrice,
              normal_price: 0,
              currency: 'USD',
              is_active: true,
              is_local_sim: false,
              carrier: 'CMCC (TT&GPT)',
              package_type: packageType,
              provider_id: TUGE_PROVIDER_ID,
              included_countries: null,
              cost_price: costPrice,
              network_type: '4G',
              sim_type: 'eSIM',
              qos_speed: qosSpeed,
              speed_after_limit: speedAfterLimit,
              daily_data_reset: packageType === 'day_pass' || packageType === 'limitless',
              daily_reset_amount: packageType === 'day_pass' ? dataAmount.replace('/day', '') : null,
              category: 'country',
              top_up: true,
              provider_metadata: { card_type: 'C4', source: 'bulk-import-china-egypt' },
            };

            const { error: upsertError } = await supabase
              .from('esim_packages')
              .upsert(record, { onConflict: 'package_id' });

            if (upsertError) {
              results.china.errors.push({ package_id: product.product_code, error: upsertError.message });
            } else {
              results.china.imported++;
            }
          } catch (e: any) {
            results.china.errors.push({ product_id: product.id, error: e instanceof Error ? e.message : String(e) });
          }
        }
      }
      console.log(`[CHINA-TTGPT] Done. Imported: ${results.china.imported}, Errors: ${results.china.errors.length}`);
    }

    // ── Egypt ────────────────────────────────────────────────────────
    if (!filterTarget || filterTarget === 'egypt') {
      console.log('[EGYPT] Fetching products...');

      const { data: egyptProducts, error: egyptErr } = await supabase
        .from('tuge_product_cache')
        .select('*')
        .eq('card_type', 'C4')
        .like('product_code', '%AU%')
        .contains('countries', JSON.stringify(['EG']))
        .limit(500);

      if (egyptErr) {
        console.error('[EGYPT] Fetch error:', egyptErr);
        results.egypt.errors.push({ error: egyptErr.message });
      } else {
        const singleCountry = (egyptProducts || []).filter((p: any) => {
          const countries: string[] = p.countries || [];
          return countries.length === 1 && countries[0] === 'EG';
        });

        console.log(`[EGYPT] Found ${singleCountry.length} single-country AU products`);

        for (const product of singleCountry) {
          try {
            const costPrice = Number(product.net_price || 0);
            const retailPrice = Math.round(costPrice * MARKUP * 100) / 100;
            const dataAmount = parseDataAmount(product);
            const validityDays = Number(product.usage_period || product.duration || 30);
            const packageType = getPackageType(product);

            let qosSpeed: string | null = null;
            let speedAfterLimit: string | null = null;
            if (packageType === 'limitless') {
              qosSpeed = 'Unlimited';
            } else if (packageType === 'day_pass') {
              speedAfterLimit = product.limit_speed || '128Kbps';
            } else if (product.high_speed && product.high_speed !== 'Unlimited') {
              qosSpeed = product.high_speed;
            }

            const name = buildName('Egypt', dataAmount, validityDays, packageType);
            const description = buildDescription(packageType, dataAmount, validityDays, false);

            const record = {
              package_id: product.product_code,
              name,
              description,
              country_code: 'EG',
              country_name: 'Egypt',
              data_amount: dataAmount,
              validity_days: validityDays,
              price: retailPrice,
              normal_price: 0,
              currency: 'USD',
              is_active: false,
              is_local_sim: false,
              carrier: 'Vodafone/Orange/Etisalat',
              package_type: packageType,
              provider_id: TUGE_PROVIDER_ID,
              included_countries: null,
              cost_price: costPrice,
              network_type: '4G',
              sim_type: 'eSIM',
              qos_speed: qosSpeed,
              speed_after_limit: speedAfterLimit,
              daily_data_reset: packageType === 'day_pass' || packageType === 'limitless',
              daily_reset_amount: packageType === 'day_pass' ? dataAmount.replace('/day', '') : null,
              category: 'country',
              top_up: true,
              provider_metadata: { card_type: 'C4', source: 'bulk-import-china-egypt' },
            };

            const { error: upsertError } = await supabase
              .from('esim_packages')
              .upsert(record, { onConflict: 'package_id' });

            if (upsertError) {
              results.egypt.errors.push({ package_id: product.product_code, error: upsertError.message });
            } else {
              results.egypt.imported++;
            }
          } catch (e: any) {
            results.egypt.errors.push({ product_id: product.id, error: e instanceof Error ? e.message : String(e) });
          }
        }
      }
      console.log(`[EGYPT] Done. Imported: ${results.egypt.imported}, Errors: ${results.egypt.errors.length}`);
    }

    return new Response(JSON.stringify({
      success: true,
      stats: {
        china: { imported: results.china.imported, errors: results.china.errors.length },
        egypt: { imported: results.egypt.imported, errors: results.egypt.errors.length },
      },
      errors: { china: results.china.errors, egypt: results.egypt.errors },
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[BULK-IMPORT] Unexpected error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
