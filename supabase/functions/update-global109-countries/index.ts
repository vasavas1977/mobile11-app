import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GLOBAL_109_COUNTRIES = [
  { name: 'Greece', code: 'GR', carriers: [{ name: 'Vodafone / Cosmote / Wind Hellas', networks: ['5G'] }] },
  { name: 'Netherlands', code: 'NL', carriers: [{ name: 'Vodafone / KPN', networks: ['5G'] }] },
  { name: 'Belgium', code: 'BE', carriers: [{ name: 'Proximus / Orange', networks: ['5G'] }] },
  { name: 'France', code: 'FR', carriers: [{ name: 'SFR / Orange', networks: ['5G'] }] },
  { name: 'Spain', code: 'ES', carriers: [{ name: 'Orange / Telefonica / Vodafone', networks: ['5G'] }] },
  { name: 'Hungary', code: 'HU', carriers: [{ name: 'Telenor / Vodafone', networks: ['5G'] }] },
  { name: 'Bosnia and Herzegovina', code: 'BA', carriers: [{ name: 'HT (Eronet)', networks: ['LTE'] }] },
  { name: 'Croatia', code: 'HR', carriers: [{ name: 'T-mobile / A1 Hrvatska', networks: ['5G'] }] },
  { name: 'Serbia', code: 'RS', carriers: [{ name: 'Telenor', networks: ['LTE'] }] },
  { name: 'Italy', code: 'IT', carriers: [{ name: 'Vodafone / TIM', networks: ['5G'] }] },
  { name: 'Romania', code: 'RO', carriers: [{ name: 'Vodafone', networks: ['LTE'] }] },
  { name: 'Switzerland', code: 'CH', carriers: [{ name: 'Sunrise / SALT', networks: ['5G'] }] },
  { name: 'Czech Republic', code: 'CZ', carriers: [{ name: 'Vodafone / T-mobile', networks: ['5G'] }] },
  { name: 'Slovakia', code: 'SK', carriers: [{ name: 'O2 / Orange', networks: ['5G'] }] },
  { name: 'Austria', code: 'AT', carriers: [{ name: 'T-mobile / Orange (H3G)', networks: ['5G'] }] },
  { name: 'United Kingdom', code: 'GB', carriers: [{ name: 'Vodafone / EE / O2', networks: ['5G'] }] },
  { name: 'Denmark', code: 'DK', carriers: [{ name: 'TDC / Telia', networks: ['5G'] }] },
  { name: 'Sweden', code: 'SE', carriers: [{ name: 'Telenor / TeliaSonera', networks: ['5G'] }] },
  { name: 'Norway', code: 'NO', carriers: [{ name: 'Telia / Telenor', networks: ['5G'] }] },
  { name: 'Finland', code: 'FI', carriers: [{ name: 'Elisa', networks: ['5G'] }] },
  { name: 'Lithuania', code: 'LT', carriers: [{ name: 'BITE / Tele2', networks: ['5G'] }] },
  { name: 'Latvia', code: 'LV', carriers: [{ name: 'Tele2', networks: ['5G'] }] },
  { name: 'Estonia', code: 'EE', carriers: [{ name: 'Tele2 / Elisa EMT', networks: ['5G'] }] },
  { name: 'Ukraine', code: 'UA', carriers: [{ name: 'Vodafone / Kyivstar', networks: ['LTE'] }] },
  { name: 'Moldova', code: 'MD', carriers: [{ name: 'Orange', networks: ['4G'] }] },
  { name: 'Poland', code: 'PL', carriers: [{ name: 'Orange / T-mobile', networks: ['5G'] }] },
  { name: 'Germany', code: 'DE', carriers: [{ name: 'Vodafone / O2', networks: ['5G'] }] },
  { name: 'Gibraltar', code: 'GI', carriers: [{ name: 'Gibtel', networks: ['4G'] }] },
  { name: 'Portugal', code: 'PT', carriers: [{ name: 'TMN / NOS / Vodafone', networks: ['5G'] }] },
  { name: 'Luxembourg', code: 'LU', carriers: [{ name: 'TANGO / POST / Orange', networks: ['5G'] }] },
  { name: 'Ireland', code: 'IE', carriers: [{ name: 'Meteor', networks: ['5G'] }] },
  { name: 'Iceland', code: 'IS', carriers: [{ name: 'Siminn', networks: ['5G'] }] },
  { name: 'Albania', code: 'AL', carriers: [{ name: 'Vodafone', networks: ['LTE'] }] },
  { name: 'Malta', code: 'MT', carriers: [{ name: 'Epic / GO', networks: ['5G'] }] },
  { name: 'Cyprus', code: 'CY', carriers: [{ name: 'CYTA', networks: ['LTE'] }] },
  { name: 'Georgia', code: 'GE', carriers: [{ name: 'Geocell / Mobitel', networks: ['4G'] }] },
  { name: 'Armenia', code: 'AM', carriers: [{ name: 'ArmenTel', networks: ['4G'] }] },
  { name: 'Bulgaria', code: 'BG', carriers: [{ name: 'Yettel (Telenor)', networks: ['5G'] }] },
  { name: 'Turkey', code: 'TR', carriers: [{ name: 'Turkcell', networks: ['5G'] }] },
  { name: 'Slovenia', code: 'SI', carriers: [{ name: 'A1 (Si Mobile)', networks: ['5G'] }] },
  { name: 'Faroe Islands', code: 'FO', carriers: [{ name: 'Faroese Telecom', networks: ['5G'] }] },
  { name: 'French Guiana', code: 'GF', carriers: [{ name: 'Digicel', networks: ['4G'] }] },
  { name: 'Martinique', code: 'MQ', carriers: [{ name: 'Digicel', networks: ['4G'] }] },
  { name: 'Montenegro', code: 'ME', carriers: [{ name: 'Telenor', networks: ['4G'] }] },
  { name: 'Russia', code: 'RU', carriers: [{ name: 'MTS / T2 Mobile', networks: ['4G'] }] },
  { name: 'Qatar', code: 'QA', carriers: [{ name: 'Ooredoo / Vodafone', networks: ['5G'] }] },
  { name: 'United Arab Emirates', code: 'AE', carriers: [{ name: 'Etisalat / DU', networks: ['5G'] }] },
  { name: 'Canada', code: 'CA', carriers: [{ name: 'Bell / Telus / Sasktel', networks: ['5G'] }] },
  { name: 'United States', code: 'US', carriers: [{ name: 'AT&T / T-Mobile', networks: ['5G'] }] },
  { name: 'Mexico', code: 'MX', carriers: [{ name: 'Telefonica / Telcel', networks: ['5G'] }] },
  { name: 'Dominican Republic', code: 'DO', carriers: [{ name: 'Claro / Altice', networks: ['4G'] }] },
  { name: 'Azerbaijan', code: 'AZ', carriers: [{ name: 'Azercell', networks: ['5G'] }] },
  { name: 'Kazakhstan', code: 'KZ', carriers: [{ name: 'Tele2', networks: ['5G'] }] },
  { name: 'India', code: 'IN', carriers: [{ name: 'Airtel', networks: ['4G'] }] },
  { name: 'Pakistan', code: 'PK', carriers: [{ name: 'CMPak', networks: ['4G'] }] },
  { name: 'Sri Lanka', code: 'LK', carriers: [{ name: 'Dialog', networks: ['4G'] }] },
  { name: 'Jordan', code: 'JO', carriers: [{ name: 'Zain', networks: ['4G'] }] },
  { name: 'Kuwait', code: 'KW', carriers: [{ name: 'Ooredoo', networks: ['5G'] }] },
  { name: 'Saudi Arabia', code: 'SA', carriers: [{ name: 'Mobily', networks: ['5G'] }] },
  { name: 'Yemen', code: 'YE', carriers: [{ name: 'MTN', networks: ['4G'] }] },
  { name: 'Oman', code: 'OM', carriers: [{ name: 'Omantel', networks: ['5G'] }] },
  { name: 'Israel', code: 'IL', carriers: [{ name: 'Partner / Cellcom', networks: ['5G'] }] },
  { name: 'Mongolia', code: 'MN', carriers: [{ name: 'Unitel', networks: ['4G'] }] },
  { name: 'Nepal', code: 'NP', carriers: [{ name: 'Nepal Telecom', networks: ['4G'] }] },
  { name: 'Iran', code: 'IR', carriers: [{ name: 'MTN Irancell', networks: ['4G'] }] },
  { name: 'Uzbekistan', code: 'UZ', carriers: [{ name: 'Unitel', networks: ['4G'] }] },
  { name: 'Tajikistan', code: 'TJ', carriers: [{ name: 'Beeline', networks: ['4G'] }] },
  { name: 'Japan', code: 'JP', carriers: [{ name: 'KDDI / Softbank', networks: ['5G'] }] },
  { name: 'Vietnam', code: 'VN', carriers: [{ name: 'Viettel / Vinaphone / Mobifone', networks: ['5G'] }] },
  { name: 'Hong Kong', code: 'HK', carriers: [{ name: 'CMHK', networks: ['4G'] }] },
  { name: 'Macau', code: 'MO', carriers: [{ name: 'CTM', networks: ['5G'] }] },
  { name: 'Cambodia', code: 'KH', carriers: [{ name: 'CamGSM', networks: ['4G'] }] },
  { name: 'China', code: 'CN', carriers: [{ name: 'CMCC', networks: ['5G'] }] },
  { name: 'Bangladesh', code: 'BD', carriers: [{ name: 'GrameenPhone', networks: ['4G'] }] },
  { name: 'Taiwan', code: 'TW', carriers: [{ name: 'Chunghwa', networks: ['4G'] }] },
  { name: 'Malaysia', code: 'MY', carriers: [{ name: 'Maxis / Celcom', networks: ['4G'] }] },
  { name: 'Australia', code: 'AU', carriers: [{ name: 'Optus', networks: ['5G'] }] },
  { name: 'Indonesia', code: 'ID', carriers: [{ name: 'XL / Indosat / Telkomsel', networks: ['4G'] }] },
  { name: 'Philippines', code: 'PH', carriers: [{ name: 'Smart', networks: ['5G'] }] },
  { name: 'Thailand', code: 'TH', carriers: [{ name: 'Truemove', networks: ['5G'] }] },
  { name: 'Singapore', code: 'SG', carriers: [{ name: 'Singtel', networks: ['5G'] }] },
  { name: 'Brunei', code: 'BN', carriers: [{ name: 'UNN', networks: ['5G'] }] },
  { name: 'New Zealand', code: 'NZ', carriers: [{ name: 'Spark / Vodafone', networks: ['5G'] }] },
  { name: 'Papua New Guinea', code: 'PG', carriers: [{ name: 'Digicel', networks: ['4G'] }] },
  { name: 'Tonga', code: 'TO', carriers: [{ name: 'Digicel', networks: ['4G'] }] },
  { name: 'Vanuatu', code: 'VU', carriers: [{ name: 'Digicel', networks: ['4G'] }] },
  { name: 'Fiji', code: 'FJ', carriers: [{ name: 'Digicel', networks: ['4G'] }] },
  { name: 'Egypt', code: 'EG', carriers: [{ name: 'Vodafone / Etisalat', networks: ['5G'] }] },
  { name: 'Algeria', code: 'DZ', carriers: [{ name: 'Mobilis', networks: ['4G'] }] },
  { name: 'Morocco', code: 'MA', carriers: [{ name: 'Orange Morocco', networks: ['4G'] }] },
  { name: "Cote d'Ivoire", code: 'CI', carriers: [{ name: 'MTN', networks: ['4G'] }] },
  { name: 'Mauritius', code: 'MU', carriers: [{ name: 'Emtel', networks: ['4G'] }] },
  { name: 'Liberia', code: 'LR', carriers: [{ name: 'Cellcom Liberia', networks: ['4G'] }] },
  { name: 'Ghana', code: 'GH', carriers: [{ name: 'MTN / Vodafone', networks: ['4G'] }] },
  { name: 'DR Congo', code: 'CD', carriers: [{ name: 'Airtel / Vodacom', networks: ['4G'] }] },
  { name: 'Seychelles', code: 'SC', carriers: [{ name: 'Airtel', networks: ['4G'] }] },
  { name: 'Sudan', code: 'SD', carriers: [{ name: 'MTN', networks: ['4G'] }] },
  { name: 'Rwanda', code: 'RW', carriers: [{ name: 'MTN Rwanda Cell', networks: ['4G'] }] },
  { name: 'Kenya', code: 'KE', carriers: [{ name: 'Airtel', networks: ['4G'] }] },
  { name: 'Tanzania', code: 'TZ', carriers: [{ name: 'Vodacom', networks: ['4G'] }] },
  { name: 'Uganda', code: 'UG', carriers: [{ name: 'Airtel', networks: ['4G'] }] },
  { name: 'Mozambique', code: 'MZ', carriers: [{ name: 'Vodacom', networks: ['4G'] }] },
  { name: 'Zambia', code: 'ZM', carriers: [{ name: 'Airtel', networks: ['4G'] }] },
  { name: 'Madagascar', code: 'MG', carriers: [{ name: 'Airtel', networks: ['4G'] }] },
  { name: 'Malawi', code: 'MW', carriers: [{ name: 'Airtel', networks: ['4G'] }] },
  { name: 'South Africa', code: 'ZA', carriers: [{ name: 'MTN / Vodacom', networks: ['5G'] }] },
  { name: 'Guatemala', code: 'GT', carriers: [{ name: 'Claro / Telefonica', networks: ['4G'] }] },
  { name: 'Costa Rica', code: 'CR', carriers: [{ name: 'Telefonica', networks: ['4G'] }] },
  { name: 'Panama', code: 'PA', carriers: [{ name: 'Telefonica', networks: ['4G'] }] },
  { name: 'Peru', code: 'PE', carriers: [{ name: 'Claro / Telefonica', networks: ['4G'] }] },
  { name: 'Argentina', code: 'AR', carriers: [{ name: 'Claro / Telefonica', networks: ['4G'] }] },
  { name: 'Brazil', code: 'BR', carriers: [{ name: 'VIVO', networks: ['4G'] }] },
  { name: 'Chile', code: 'CL', carriers: [{ name: 'Claro / Telefonica', networks: ['4G'] }] },
  { name: 'Colombia', code: 'CO', carriers: [{ name: 'Telefonica / Claro', networks: ['4G'] }] },
  { name: 'Uruguay', code: 'UY', carriers: [{ name: 'Antel / Telefonica', networks: ['4G'] }] },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[UPDATE-GLOBAL109] Updating included_countries for Global 109 packages...');

    const { data: packages, error: fetchError } = await supabase
      .from('esim_packages')
      .select('id, package_id, name')
      .ilike('country_name', '%Global 109%');

    if (fetchError) {
      console.error('[UPDATE-GLOBAL109] Fetch error:', fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[UPDATE-GLOBAL109] Found ${packages?.length || 0} Global 109 packages`);

    let updated = 0;
    const errors: any[] = [];

    for (const pkg of (packages || [])) {
      const { error: updateError } = await supabase
        .from('esim_packages')
        .update({ included_countries: GLOBAL_109_COUNTRIES })
        .eq('id', pkg.id);

      if (updateError) {
        console.error(`[UPDATE-GLOBAL109] Error updating ${pkg.package_id}:`, updateError);
        errors.push({ package_id: pkg.package_id, error: updateError.message });
      } else {
        updated++;
        console.log(`[UPDATE-GLOBAL109] Updated ${pkg.name}`);
      }
    }

    console.log(`[UPDATE-GLOBAL109] Complete. Updated: ${updated}, Errors: ${errors.length}`);

    return new Response(JSON.stringify({
      success: true,
      stats: { total: packages?.length || 0, updated, errors: errors.length },
      errors,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[UPDATE-GLOBAL109] Unexpected error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
