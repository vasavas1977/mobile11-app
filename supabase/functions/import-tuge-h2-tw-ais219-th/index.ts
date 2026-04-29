import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TUGE_PROVIDER_ID = '4e7e5af2-8e7a-4d5c-aea2-302fea9c5dac';
const MARKUP = 4.0;

const PACKAGES = [
  // Taiwan H2 — Chunghwa/FarEasTone
  {
    package_id: 'A-004-ES-AU-H2-T-3D/60D-5GB',
    country_code: 'TW', country_name: 'Taiwan',
    carrier: 'Chunghwa/FarEasTone',
    data_amount: '5GB', validity_days: 3, cost_price: 3.15,
    network_type: '4G', kyc: false,
    activation_note: null,
  },
  {
    package_id: 'A-004-ES-AU-H2-T-5D/60D-10GB',
    country_code: 'TW', country_name: 'Taiwan',
    carrier: 'Chunghwa/FarEasTone',
    data_amount: '10GB', validity_days: 5, cost_price: 4.16,
    network_type: '4G', kyc: false,
    activation_note: null,
  },
  {
    package_id: 'A-004-ES-AU-H2-T-7D/60D-15GB',
    country_code: 'TW', country_name: 'Taiwan',
    carrier: 'Chunghwa/FarEasTone',
    data_amount: '15GB', validity_days: 7, cost_price: 4.98,
    network_type: '4G', kyc: false,
    activation_note: null,
  },
  {
    package_id: 'A-004-ES-AU-H2-T-30D/60D-15GB',
    country_code: 'TW', country_name: 'Taiwan',
    carrier: 'Chunghwa/FarEasTone',
    data_amount: '15GB', validity_days: 30, cost_price: 6.65,
    network_type: '4G', kyc: false,
    activation_note: null,
  },
  {
    package_id: 'A-004-ES-AU-H2-T-30D/60D-30GB',
    country_code: 'TW', country_name: 'Taiwan',
    carrier: 'Chunghwa/FarEasTone',
    data_amount: '30GB', validity_days: 30, cost_price: 9.97,
    network_type: '4G', kyc: false,
    activation_note: null,
  },
  // Thailand AIS219 — AIS
  {
    package_id: 'A-007-ES-AU-AIS-T-10D/60D-50GB',
    country_code: 'TH', country_name: 'Thailand',
    carrier: 'AIS',
    data_amount: '50GB', validity_days: 10, cost_price: 5.06,
    network_type: '4G/5G', kyc: true,
    activation_note: 'KYC required. Includes 100 THB voice credit. Promo: unlimited data valid until March 31, 2025.',
    description: 'Get 50GB of high-speed data in Thailand. After your high-speed limit, stay connected with 384 Kbps backup speed for the remainder of your 10-day validity period. Includes 100 THB credit, valid for local calls within Thailand only. Perfect for travelers who need reliable connectivity.',
  },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    console.log('[IMPORT-H2-AIS219] Starting import of 6 packages...');

    const results = { upserted: 0, errors: [] as any[] };

    for (const pkg of PACKAGES) {
      try {
        const retailPrice = Math.round(pkg.cost_price * MARKUP * 100) / 100;
        const name = `${pkg.country_name} ${pkg.data_amount}, ${pkg.validity_days} days`;

        const record = {
          package_id: pkg.package_id,
          name,
          country_code: pkg.country_code,
          country_name: pkg.country_name,
          data_amount: pkg.data_amount,
          validity_days: pkg.validity_days,
          price: retailPrice,
          normal_price: 0,
          currency: 'USD',
          is_active: true,
          carrier: pkg.carrier,
          package_type: 'max_speed',
          provider_id: TUGE_PROVIDER_ID,
          cost_price: pkg.cost_price,
          network_type: pkg.network_type,
          sim_type: 'eSIM',
          qos_speed: 'Max Speed',
          is_local_sim: pkg.country_code === 'TH',
          kyc: pkg.kyc,
          activation_note: pkg.activation_note,
          description: (pkg as any).description || null,
          top_up: true,
          category: 'country',
          provider_metadata: { card_type: pkg.country_code === 'TW' ? 'H2' : 'AIS219', source: 'import-h2-ais219' },
        };

        const { error } = await supabase
          .from('esim_packages')
          .upsert(record, { onConflict: 'package_id' });

        if (error) {
          console.error(`[IMPORT-H2-AIS219] Upsert error for ${pkg.package_id}:`, error);
          results.errors.push({ package_id: pkg.package_id, error: error.message });
        } else {
          results.upserted++;
          console.log(`[IMPORT-H2-AIS219] Upserted: ${name}`);
        }
      } catch (e: any) {
        const msg = e instanceof Error ? e.message : String(e);
        results.errors.push({ package_id: pkg.package_id, error: msg });
      }
    }

    console.log(`[IMPORT-H2-AIS219] Done. Upserted: ${results.upserted}, Errors: ${results.errors.length}`);

    return new Response(JSON.stringify({
      success: true,
      stats: { total: PACKAGES.length, upserted: results.upserted, errors: results.errors.length },
      errors: results.errors,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[IMPORT-H2-AIS219] Unexpected error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
