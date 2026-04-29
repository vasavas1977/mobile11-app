import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the user is an admin
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user has admin role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get request body
    const { email, password, firstName, lastName, phone, role } = await req.json();
    
    // Validate required fields
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Email and password are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate password length
    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 8 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate role if provided
    const validRoles = ["customer", "agent", "supervisor", "admin", "partner_manager", "affiliate"];
    const userRole = role || "customer";
    if (!validRoles.includes(userRole)) {
      return new Response(
        JSON.stringify({ error: "Invalid role" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create user with Supabase Auth Admin API
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for admin-created users
      user_metadata: {
        first_name: firstName || "",
        last_name: lastName || "",
        auth_provider: "admin_created"
      }
    });

    if (createError) {
      console.error("Error creating user:", createError);
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!newUser.user) {
      return new Response(
        JSON.stringify({ error: "Failed to create user" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const newUserId = newUser.user.id;

    // Update profile with phone if provided (trigger creates basic profile)
    if (phone) {
      await supabaseAdmin
        .from("profiles")
        .update({ phone })
        .eq("user_id", newUserId);
    }

    // If role is not customer, add the additional role
    // Note: handle_new_user trigger already adds customer role
    if (userRole !== "customer") {
      const { error: roleInsertError } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: newUserId, role: userRole });
      
      if (roleInsertError) {
        console.error("Error assigning role:", roleInsertError);
        // Don't fail the whole operation, user is created
      }
    }

    // Get admin profile for notification
    const { data: adminProfile } = await supabaseAdmin
      .from("profiles")
      .select("email, first_name, last_name")
      .eq("user_id", user.id)
      .single();

    // Send admin notification
    try {
      await fetch(`${supabaseUrl}/functions/v1/send-admin-notification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          action_type: "user_create",
          entity_type: "user",
          entity_id: newUserId,
          admin_email: adminProfile?.email || user.email,
          admin_name: adminProfile ? `${adminProfile.first_name || ''} ${adminProfile.last_name || ''}`.trim() : undefined,
          details: `New user created: ${email} with role ${userRole}`,
          metadata: {
            created_user_email: email,
            created_user_name: `${firstName || ''} ${lastName || ''}`.trim() || null,
            assigned_role: userRole
          }
        }),
      });
    } catch (notifyError) {
      console.error("Failed to send admin notification:", notifyError);
      // Don't fail the creation if notification fails
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "User created successfully",
        userId: newUserId 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error creating user:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
