import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();

    if (!token || typeof token !== 'string') {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Query the invitation by token
    const { data: invitation, error } = await supabaseAdmin
      .from("organization_invitations")
      .select(`
        id,
        organization_id,
        email,
        role,
        department,
        expires_at,
        status,
        created_at,
        organizations (
          id,
          name,
          logo_url
        )
      `)
      .eq("token", token)
      .single();

    if (error || !invitation) {
      return new Response(
        JSON.stringify({ error: "Invitation not found", invitation: null }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return invitation details (without the token itself for security)
    return new Response(
      JSON.stringify({ 
        invitation: {
          ...invitation,
          // Don't return the token back - they already have it
        }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error validating invitation token:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
