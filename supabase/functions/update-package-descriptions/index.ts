import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Package {
  id: string;
  data_amount: string;
  country_name: string;
  validity_days: number;
  short_name: string | null;
  included_countries?: any;
  package_type?: string;
  qos_speed?: string;
}

function generateDescription(pkg: Package): string {
  const { data_amount, country_name, validity_days, short_name, included_countries, package_type, qos_speed } = pkg;
  
  // Handle non-stop packages (consistent speed, no throttling)
  if (package_type === 'non_stop') {
    // Extract the speed from qos_speed field (e.g., "1Mbps" or "5Mbps")
    const speedValue = qos_speed || '5Mbps'; // default to 5Mbps if not specified
    const speedDisplay = speedValue.replace('Mbps', ' Mbps'); // "1Mbps" -> "1 Mbps"
    
    const isRegional = included_countries && 
      (Array.isArray(included_countries) ? included_countries.length > 1 : 
       (typeof included_countries === 'object' && Object.keys(included_countries).length > 1));
    
    if (isRegional) {
      const countryCount = Array.isArray(included_countries) 
        ? included_countries.length 
        : Object.keys(included_countries).length;
      return `Experience consistent ${data_amount} connectivity across ${countryCount} countries with a steady ${speedDisplay} speed throughout your entire ${validity_days}-day period. No throttling, no slowdowns - ideal for multi-country travel with reliable performance.`;
    }
    
    return `Enjoy consistent ${data_amount} connectivity in ${country_name} with a steady ${speedDisplay} speed throughout your entire ${validity_days}-day period. No throttling, no slowdowns - just reliable internet access from start to finish. Perfect for streaming, video calls, and everyday browsing.`;
  }
  
  // Check if it's a regional package with multiple countries (for max_speed/day_pass)
  const isRegional = included_countries && 
    (Array.isArray(included_countries) ? included_countries.length > 1 : 
     (typeof included_countries === 'object' && Object.keys(included_countries).length > 1));
  
  if (isRegional) {
    const countryCount = Array.isArray(included_countries) 
      ? included_countries.length 
      : Object.keys(included_countries).length;
    
    // For Day Pass and Max Speed, use "backup" terminology instead of "unlimited"
    // since 384 Kbps is not practically usable
    return `Get ${data_amount} of high-speed data across ${countryCount} countries. After your high-speed limit, stay connected with 384 Kbps backup speed. Valid for ${validity_days} days. Perfect for multi-country travel.`;
  }
  
  // Standard packages - use "backup" terminology for throttled speeds
  return `Get ${data_amount} of high-speed data in ${country_name}. After your high-speed limit, stay connected with 384 Kbps backup speed for the remainder of your ${validity_days}-day validity period. Perfect for travelers who need reliable connectivity.`;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching non-stop packages to update descriptions...');

    // Fetch all non_stop packages (will update all, even if they have basic descriptions)
    // AND package_id is not null (to avoid constraint violations)
    const { data: packages, error: fetchError } = await supabase
      .from('esim_packages')
      .select('id, data_amount, country_name, validity_days, short_name, included_countries, package_id, package_type, qos_speed')
      .eq('package_type', 'non_stop')
      .not('package_id', 'is', null);

    if (fetchError) {
      console.error('Error fetching packages:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch packages', details: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!packages || packages.length === 0) {
      console.log('No non-stop packages found to update');
      
      // Check if there are packages with null package_id that were skipped
      const { count: nullPackageIdCount } = await supabase
        .from('esim_packages')
        .select('*', { count: 'exact', head: true })
        .eq('package_type', 'non_stop')
        .is('package_id', null);
      
      if (nullPackageIdCount && nullPackageIdCount > 0) {
        console.log(`Warning: Found ${nullPackageIdCount} non-stop packages with null package_id that need to be fixed first`);
        return new Response(
          JSON.stringify({ 
            message: `No valid non-stop packages to update. Found ${nullPackageIdCount} packages with null package_id that need to be fixed first.`,
            updated: 0,
            skipped: nullPackageIdCount
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ message: 'No non-stop packages found to update', updated: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${packages.length} non-stop packages to update`);

    console.log('Generating descriptions and updating packages...');
    let totalUpdated = 0;

    // Update packages one by one to avoid upsert issues
    for (let i = 0; i < packages.length; i++) {
      const pkg = packages[i];
      const description = generateDescription(pkg);
      
      if ((i + 1) % 50 === 0) {
        console.log(`Processing ${i + 1} of ${packages.length}...`);
      }
      
      const { error: updateError } = await supabase
        .from('esim_packages')
        .update({ 
          description,
          updated_at: new Date().toISOString()
        })
        .eq('id', pkg.id);

      if (updateError) {
        console.error(`Error updating package ${pkg.id}:`, updateError);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to update packages', 
            details: updateError.message,
            updated: totalUpdated
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      totalUpdated++;
    }

    console.log(`Successfully updated ${totalUpdated} non-stop packages with QoS-accurate descriptions (1 Mbps or 5 Mbps)`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully updated ${totalUpdated} non-stop packages with accurate QoS speed descriptions (1 Mbps or 5 Mbps based on actual speed)`,
        updated: totalUpdated 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
