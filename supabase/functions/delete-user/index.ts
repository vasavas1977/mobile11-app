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
      throw new Error("No authorization header");
    }

    // Verify the user is an admin
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if user has admin role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (roleError || !roleData) {
      throw new Error("Unauthorized: Admin access required");
    }

    // Get the user ID to delete from the request
    const { userId } = await req.json();
    
    if (!userId) {
      throw new Error("User ID is required");
    }

    // Prevent self-deletion
    if (userId === user.id) {
      throw new Error("Cannot delete your own account");
    }

    // Get user info before deletion for notification
    const { data: userProfile } = await supabaseAdmin
      .from("profiles")
      .select("email, first_name, last_name")
      .eq("user_id", userId)
      .single();

    const { data: adminProfile } = await supabaseAdmin
      .from("profiles")
      .select("email, first_name, last_name")
      .eq("user_id", user.id)
      .single();

    // Delete the user from auth.users (this will cascade to profiles and user_roles)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (deleteError) {
      throw deleteError;
    }

    // Send admin notification for this critical action
    try {
      await fetch(`${supabaseUrl}/functions/v1/send-admin-notification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          action_type: "user_delete",
          entity_type: "user",
          entity_id: userId,
          admin_email: adminProfile?.email || user.email,
          admin_name: adminProfile ? `${adminProfile.first_name || ''} ${adminProfile.last_name || ''}`.trim() : undefined,
          details: `User account deleted: ${userProfile?.email || userId}`,
          metadata: {
            deleted_user_email: userProfile?.email,
            deleted_user_name: userProfile ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() : null
          }
        }),
      });
    } catch (notifyError) {
      console.error("Failed to send admin notification:", notifyError);
      // Don't fail the deletion if notification fails
    }

    return new Response(
      JSON.stringify({ success: true, message: "User deleted successfully" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: error.message.includes("Unauthorized") ? 403 : 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
