import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Fetch all active packages to update their data amounts
    const { data: packages, error: fetchError } = await supabaseClient
      .from('esim_packages')
      .select('*')
      .eq('is_active', true)
      .limit(500); // Process in smaller batches to avoid timeout

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Found ${packages?.length || 0} active packages to update`);

    const updates = [];

    for (const pkg of packages || []) {
      const update: any = {
        id: pkg.id
      };

      // Normalize strings for comparison (lowercase, no spaces)
      const qosSpeed = pkg.qos_speed?.toLowerCase().replace(/\s/g, '') || '';
      const speedAfter = pkg.speed_after_limit?.toLowerCase().replace(/\s/g, '') || '';
      const description = pkg.description?.toLowerCase() || '';
      
      // Determine package_type based on speed characteristics
      // Check for 384 Kbps (day_pass)
      if (qosSpeed.includes('384') || speedAfter.includes('384') || 
          qosSpeed.includes('384kbps') || speedAfter.includes('384kbps')) {
        update.package_type = 'day_pass';
        update.speed_after_limit = '384 Kbps';
        update.daily_data_reset = true;
        update.daily_reset_amount = pkg.data_amount;
      } 
      // Check for 1 Mbps (day_pass with 1 Mbps backup)
      else if (qosSpeed.includes('1mbps') || speedAfter.includes('1mbps') || 
               description.includes('1mbps') || description.includes('1 mbps')) {
        update.package_type = 'day_pass';
        update.speed_after_limit = '1 Mbps';
        update.daily_data_reset = true;
        update.daily_reset_amount = pkg.data_amount;
      }
      // Check for 5 Mbps (limitless)
      else if (qosSpeed.includes('5mbps') || speedAfter.includes('5mbps') || 
               description.includes('5mbps') || description.includes('5 mbps')) {
        update.package_type = 'limitless';
        update.speed_after_limit = 'No limit';
        update.daily_data_reset = false;
        update.daily_reset_amount = null;
      }
      // Check for 30GB (max_speed) - No throttle speed for max_speed packages
      else if (pkg.data_amount === '30GB' || description.includes('30gb')) {
        update.package_type = 'max_speed';
        update.speed_after_limit = null; // No throttle - data stops when exhausted
        update.daily_data_reset = false;
        update.daily_reset_amount = null;
      }

      if (update.package_type) {
        // Generate short_name
        if (update.daily_data_reset) {
          update.short_name = `${update.daily_reset_amount}/day`;
        } else {
          update.short_name = pkg.data_amount;
        }

        // Generate name
        update.name = `${pkg.country_name} ${pkg.validity_days} days, ${update.short_name}`;

        // Generate description
        switch (update.package_type) {
          case 'day_pass':
            const speedDesc = update.speed_after_limit === '1 Mbps' ? '1 Mbps' : '384 Kbps';
            const speedNote = update.speed_after_limit === '1 Mbps' ? 'Great for social media.' : 'Perfect for casual browsing.';
            update.description = `${update.daily_reset_amount} high-speed daily, then ${speedDesc} unlimited. ${speedNote}`;
            break;
          case 'max_speed':
            update.description = `${pkg.data_amount} at maximum network speeds until exhausted. Top up anytime to continue. Perfect for heavy usage.`;
            break;
          case 'limitless':
            update.description = 'Unlimited data at maximum network speeds (up to 5G). No caps, no throttling.';
            break;
        }

        updates.push(update);
      } else {
        console.log(`Skipping package ${pkg.id} (${pkg.country_name}): No matching pattern. qos_speed: ${pkg.qos_speed}, speed_after_limit: ${pkg.speed_after_limit}`);
      }
    }

    console.log(`Updating ${updates.length} packages`);

    // Update packages one by one with progress logging
    const results = [];
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < updates.length; i++) {
      const update = updates[i];
      
      if (i % 50 === 0) {
        console.log(`Progress: ${i}/${updates.length} packages processed`);
      }
      
      const { data, error } = await supabaseClient
        .from('esim_packages')
        .update({
          package_type: update.package_type,
          speed_after_limit: update.speed_after_limit,
          daily_data_reset: update.daily_data_reset,
          daily_reset_amount: update.daily_reset_amount,
          short_name: update.short_name,
          name: update.name,
          description: update.description,
        })
        .eq('id', update.id)
        .select();

      if (error) {
        console.error(`Error updating package ${update.id}:`, error);
        results.push({ id: update.id, success: false, error: error.message });
        failCount++;
      } else {
        results.push({ id: update.id, success: true });
        successCount++;
      }
    }

    console.log(`Completed: ${successCount} succeeded, ${failCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Updated ${successCount} packages successfully, ${failCount} failed`,
        total: updates.length,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
