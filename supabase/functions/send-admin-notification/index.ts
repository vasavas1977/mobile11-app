import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AdminNotificationRequest {
  action_type: string;
  entity_type: string;
  entity_id?: string;
  admin_email: string;
  admin_name?: string;
  details: string;
  metadata?: Record<string, any>;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const {
      action_type,
      entity_type,
      entity_id,
      admin_email,
      admin_name,
      details,
      metadata
    }: AdminNotificationRequest = await req.json();

    // Get all admin emails for notification
    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    const adminEmails: string[] = [];
    if (adminRoles && adminRoles.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("email")
        .in("user_id", adminRoles.map(r => r.user_id));
      
      if (profiles) {
        adminEmails.push(...profiles.map(p => p.email).filter(Boolean));
      }
    }

    // If no admins found, log and return
    if (adminEmails.length === 0) {
      console.log("No admin emails found for notification");
      return new Response(JSON.stringify({ success: true, message: "No admins to notify" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const actionLabel = action_type.replace(/_/g, ' ').toUpperCase();
    const timestamp = new Date().toLocaleString('en-US', { 
      timeZone: 'Asia/Bangkok',
      dateStyle: 'full',
      timeStyle: 'long'
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #FAF7F2; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; }
          .header { background-color: #ffffff; padding: 24px; text-align: center; border-bottom: 1px solid #E5E7EB; }
          .header img { height: 40px; width: auto; }
          .alert-banner { background-color: #FEF3C7; border-bottom: 1px solid #F59E0B; padding: 16px 24px; text-align: center; }
          .alert-banner p { color: #92400E; font-weight: 600; margin: 0; }
          .content { padding: 24px; }
          .alert-box { background: #FFF7ED; border-left: 4px solid #f97316; border-radius: 0 6px 6px 0; padding: 16px; margin-bottom: 20px; }
          .alert-title { color: #9a3412; font-weight: 600; margin-bottom: 8px; }
          .detail-row { display: flex; border-bottom: 1px solid #E5E7EB; padding: 12px 0; }
          .detail-label { font-weight: 500; color: #4B5563; width: 140px; }
          .detail-value { color: #1A1A1A; flex: 1; }
          .footer { background: #FAF7F2; padding: 16px 24px; text-align: center; font-size: 12px; color: #9CA3AF; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://jaqyvbjllsanrnpzlyjw.supabase.co/storage/v1/object/public/assets/logo.png" alt="mobile11" />
          </div>
          <div class="alert-banner">
            <p>⚠️ Critical Admin Action Alert</p>
          </div>
          <div class="content">
            <div class="alert-box">
              <div class="alert-title">${actionLabel}</div>
              <div style="color: #4B5563;">${details}</div>
            </div>
            
            <div class="detail-row">
              <div class="detail-label">Action Type</div>
              <div class="detail-value">${action_type}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Entity Type</div>
              <div class="detail-value">${entity_type}</div>
            </div>
            ${entity_id ? `
            <div class="detail-row">
              <div class="detail-label">Entity ID</div>
              <div class="detail-value" style="font-family: monospace; font-size: 12px;">${entity_id}</div>
            </div>
            ` : ''}
            <div class="detail-row">
              <div class="detail-label">Performed By</div>
              <div class="detail-value">${admin_name || admin_email}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Timestamp</div>
              <div class="detail-value">${timestamp}</div>
            </div>
            ${metadata ? `
            <div class="detail-row">
              <div class="detail-label">Additional Info</div>
              <div class="detail-value"><pre style="margin: 0; font-size: 11px; white-space: pre-wrap;">${JSON.stringify(metadata, null, 2)}</pre></div>
            </div>
            ` : ''}
          </div>
          <div class="footer">
            This is an automated notification from Mobile11 Admin System.<br>
            Please review this action in the admin dashboard if needed.
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Mobile11 Admin <onboarding@resend.dev>",
      to: adminEmails,
      subject: `🚨 Admin Alert: ${actionLabel} - ${entity_type}`,
      html: htmlContent,
    });

    console.log("Admin notification sent:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error sending admin notification:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
