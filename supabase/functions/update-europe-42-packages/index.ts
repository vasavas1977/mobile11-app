import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// New stopover countries to add
const STOPOVER_COUNTRIES = [
  {
    country: "Qatar",
    code: "QA",
    carriers: ["Ooredoo"],
    network: "4G/5G"
  },
  {
    country: "United Arab Emirates",
    code: "AE",
    carriers: ["Etisalat", "du"],
    network: "4G/5G"
  }
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('Starting Europe 42 Countries package updates...')

    // Fetch all Europe 42 Countries packages
    const { data: packages, error: fetchError } = await supabase
      .from('esim_packages')
      .select('id, package_id, name, country_name, included_countries')
      .eq('country_name', 'Europe 42 Countries')

    if (fetchError) {
      console.error('Error fetching packages:', fetchError)
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!packages || packages.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No Europe 42 Countries packages found to update',
        updated_count: 0
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`Found ${packages.length} Europe 42 Countries packages to update`)

    const results = {
      updated: [] as any[],
      errors: [] as any[],
    }

    for (const pkg of packages) {
      try {
        // Update the name to include "+ 2Stopover"
        const newName = pkg.name.replace('Europe 42 Countries', 'Europe 42 Countries + 2Stopover')
        
        // Parse existing included_countries and add stopover countries
        let includedCountries = []
        
        if (pkg.included_countries) {
          if (typeof pkg.included_countries === 'string') {
            try {
              includedCountries = JSON.parse(pkg.included_countries)
            } catch {
              includedCountries = []
            }
          } else if (Array.isArray(pkg.included_countries)) {
            includedCountries = pkg.included_countries
          }
        }

        // Check if stopover countries already exist
        const existingCodes = new Set(includedCountries.map((c: any) => c.code))
        
        for (const stopover of STOPOVER_COUNTRIES) {
          if (!existingCodes.has(stopover.code)) {
            includedCountries.push(stopover)
            console.log(`  Adding ${stopover.country} (${stopover.code}) to package ${pkg.package_id}`)
          }
        }

        // Update the package
        const { error: updateError } = await supabase
          .from('esim_packages')
          .update({
            name: newName,
            country_name: 'Europe 42 Countries + 2Stopover',
            included_countries: includedCountries,
            updated_at: new Date().toISOString()
          })
          .eq('id', pkg.id)

        if (updateError) {
          console.error(`Failed to update package ${pkg.package_id}:`, updateError)
          results.errors.push({
            package_id: pkg.package_id,
            old_name: pkg.name,
            error: updateError.message
          })
        } else {
          results.updated.push({
            package_id: pkg.package_id,
            old_name: pkg.name,
            new_name: newName,
            old_country_name: pkg.country_name,
            new_country_name: 'Europe 42 Countries + 2Stopover',
            countries_added: STOPOVER_COUNTRIES.map(c => c.country),
            total_countries: includedCountries.length
          })
        }
      } catch (pkgError) {
        console.error(`Error processing package ${pkg.package_id}:`, pkgError)
        results.errors.push({
          package_id: pkg.package_id,
          error: pkgError instanceof Error ? pkgError.message : 'Unknown error'
        })
      }
    }

    console.log(`Update complete. Updated: ${results.updated.length}, Errors: ${results.errors.length}`)

    return new Response(JSON.stringify({
      success: true,
      summary: {
        total_packages: packages.length,
        updated: results.updated.length,
        errors: results.errors.length,
      },
      stopover_countries_added: STOPOVER_COUNTRIES,
      updated_packages: results.updated,
      errors: results.errors,
      message: `Successfully updated ${results.updated.length} Europe packages to "Europe 42 Countries + 2Stopover" with Qatar and UAE added.`
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('Unexpected error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
