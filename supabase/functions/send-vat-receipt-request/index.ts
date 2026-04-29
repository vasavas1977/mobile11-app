import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { requestId } = await req.json();
    if (!requestId) throw new Error("requestId is required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch VAT request
    const { data: vatReq, error: vatErr } = await supabase
      .from("vat_receipt_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (vatErr || !vatReq) throw new Error("VAT request not found");

    // Fetch order details
    const { data: order } = await supabase
      .from("orders")
      .select("order_id, total_amount, currency, created_at")
      .eq("id", vatReq.order_id)
      .single();

    const typeLabel = vatReq.receipt_type === "personal" ? "Personal" : "Company";
    const idLabel = vatReq.receipt_type === "personal" ? "ID Number" : "Company Tax ID";
    const idValue = vatReq.receipt_type === "personal" ? vatReq.id_number : vatReq.company_tax_id;

    const formatAmount = (amount: number, currency: string) => {
      if (currency === "THB") return `฿${Math.round(amount).toLocaleString()} THB`;
      return `$${amount.toFixed(2)} USD`;
    };

    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #FAF7F2;">
        <div style="background-color: #ffffff; border-radius: 12px; overflow: hidden; margin: 20px;">
          <div style="background-color: #ffffff; padding: 30px; text-align: center; border-bottom: 1px solid #E5E7EB;">
            <img src="https://jaqyvbjllsanrnpzlyjw.supabase.co/storage/v1/object/public/assets/logo.png" alt="mobile11" style="height: 40px; width: auto;" />
            <p style="color: #9CA3AF; margin: 5px 0 0 0;">VAT Receipt Request</p>
          </div>

          <div style="padding: 30px;">
            <div style="background: #FFF7ED; border-left: 4px solid #f97316; padding: 20px; border-radius: 0 8px 8px 0; margin-bottom: 20px;">
              <h2 style="color: #1A1A1A; margin: 0 0 10px 0;">📄 ${typeLabel} VAT Receipt Request</h2>
              <p style="margin: 0; color: #4B5563;">Order: ${order?.order_id || vatReq.order_id}</p>
              ${order ? `<p style="margin: 5px 0 0 0; color: #4B5563;">Amount: ${formatAmount(order.total_amount, order.currency || 'THB')}</p>` : ''}
            </div>

            <div style="background: #FAF7F2; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h3 style="margin: 0 0 15px 0; color: #1A1A1A;">Customer Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 6px 0; color: #4B5563;">Name:</td><td style="padding: 6px 0; color: #1A1A1A; font-weight: bold;">${vatReq.first_name} ${vatReq.last_name}</td></tr>
                <tr><td style="padding: 6px 0; color: #4B5563;">Address:</td><td style="padding: 6px 0; color: #1A1A1A;">${vatReq.address}</td></tr>
                <tr><td style="padding: 6px 0; color: #4B5563;">Phone:</td><td style="padding: 6px 0; color: #1A1A1A;">${vatReq.phone}</td></tr>
                <tr><td style="padding: 6px 0; color: #4B5563;">Email:</td><td style="padding: 6px 0; color: #1A1A1A;">${vatReq.email}</td></tr>
                ${idValue ? `<tr><td style="padding: 6px 0; color: #4B5563;">${idLabel}:</td><td style="padding: 6px 0; color: #1A1A1A; font-weight: bold;">${idValue}</td></tr>` : ''}
                <tr><td style="padding: 6px 0; color: #4B5563;">Type:</td><td style="padding: 6px 0; color: #1A1A1A;">${typeLabel}</td></tr>
              </table>
            </div>

            <div style="border-top: 1px solid #E5E7EB; padding-top: 20px; text-align: center;">
              <p style="color: #9CA3AF; font-size: 12px; margin: 0;">This is an automated VAT receipt request notification.</p>
            </div>
          </div>
        </div>
      </div>
    `;

    // Send to billing team
    await resend.emails.send({
      from: "mobile11 <noreply@mobile11.com>",
      to: ["billing@zoom.in.th"],
      subject: `VAT Receipt Request - ${typeLabel} - ${order?.order_id || vatReq.order_id}`,
      html: emailBody,
    });

    // Send confirmation to customer
    await resend.emails.send({
      from: "mobile11 <noreply@mobile11.com>",
      to: [vatReq.email],
      subject: `VAT Receipt Request Received - ${order?.order_id || vatReq.order_id}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #FAF7F2;">
          <div style="background-color: #ffffff; border-radius: 12px; overflow: hidden; margin: 20px;">
            <div style="background-color: #ffffff; padding: 30px; text-align: center; border-bottom: 1px solid #E5E7EB;">
              <img src="https://jaqyvbjllsanrnpzlyjw.supabase.co/storage/v1/object/public/assets/logo.png" alt="mobile11" style="height: 40px; width: auto;" />
            </div>
            <div style="padding: 30px;">
              <div style="background: #F0FDF4; border-left: 4px solid #22c55e; padding: 20px; border-radius: 0 8px 8px 0; margin-bottom: 20px; text-align: center;">
                <h2 style="color: #15803d; margin: 0 0 10px 0;">✅ VAT Receipt Request Received</h2>
                <p style="margin: 0; color: #166534;">We have received your ${typeLabel.toLowerCase()} VAT receipt request for order ${order?.order_id || ''}.</p>
                <p style="margin: 10px 0 0 0; color: #166534;">Our billing team will process your request and send the official receipt to your email.</p>
              </div>
              <div style="border-top: 1px solid #E5E7EB; padding-top: 20px; text-align: center;">
                <p style="color: #4B5563; font-size: 14px;">Need help? <a href="mailto:support@mobile11.com" style="color: #f97316;">support@mobile11.com</a></p>
              </div>
            </div>
          </div>
        </div>
      `,
    });

    console.log("VAT receipt request emails sent for:", requestId);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("send-vat-receipt-request error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
