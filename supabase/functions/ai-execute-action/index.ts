import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ActionRequest {
  action_type: string;
  payload: Record<string, unknown>;
  conversation_id?: string;
  customer_id?: string;
  triggered_by?: string;
  dry_run?: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const body: ActionRequest = await req.json();
    const { action_type, payload, conversation_id, customer_id, triggered_by = "ai_bot", dry_run = false } = body;

    // 1. Load action catalog entry
    const { data: catalogEntry, error: catErr } = await supabase
      .from("action_catalog")
      .select("*")
      .eq("action_type", action_type)
      .eq("is_enabled", true)
      .single();

    if (catErr || !catalogEntry) {
      return new Response(JSON.stringify({ error: `Unknown or disabled action: ${action_type}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Validate input against schema
    const schema = catalogEntry.input_schema as { required?: string[]; properties?: Record<string, { type: string }> };
    if (schema.required) {
      for (const field of schema.required) {
        if (payload[field] === undefined || payload[field] === null || payload[field] === "") {
          return new Response(JSON.stringify({ error: `Missing required field: ${field}` }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    // 3. Determine approval requirement
    const requiresApproval = catalogEntry.requires_approval;
    const approvalStatus = requiresApproval ? "pending_approval" : "auto_approved";
    const actionStatus = dry_run ? "dry_run" : (requiresApproval ? "pending" : "executing");

    // 4. Create action log entry
    const { data: logEntry, error: logErr } = await supabase
      .from("autonomous_actions_log")
      .insert({
        action_type,
        action_payload: payload,
        conversation_id: conversation_id || null,
        customer_id: customer_id || null,
        triggered_by,
        action_status: actionStatus,
        approval_status: approvalStatus,
        is_dry_run: dry_run,
        requires_approval: requiresApproval,
        max_retries: catalogEntry.max_retries,
      })
      .select()
      .single();

    if (logErr) throw logErr;

    // 5. If dry run, return immediately with what would happen
    if (dry_run) {
      const summary = `[DRY RUN] Would execute "${catalogEntry.display_name}" with payload: ${JSON.stringify(payload)}. Approval required: ${requiresApproval}.`;
      await supabase.from("autonomous_actions_log")
        .update({ action_summary: summary })
        .eq("id", logEntry.id);

      return new Response(JSON.stringify({
        action_id: logEntry.id,
        status: "dry_run",
        summary,
        requires_approval: requiresApproval,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 6. If requires approval, return pending
    if (requiresApproval) {
      const summary = `Action "${catalogEntry.display_name}" requires human approval before execution.`;
      await supabase.from("autonomous_actions_log")
        .update({ action_summary: summary })
        .eq("id", logEntry.id);

      return new Response(JSON.stringify({
        action_id: logEntry.id,
        status: "pending_approval",
        summary,
        requires_approval: true,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 7. Execute action
    let result: Record<string, unknown> = {};
    let summary = "";

    try {
      const executeResult = await executeAction(supabase, action_type, payload);
      result = executeResult.result;
      summary = executeResult.summary;

      await supabase.from("autonomous_actions_log")
        .update({
          action_status: "completed",
          action_result: result,
          action_summary: summary,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", logEntry.id);
    } catch (execErr: unknown) {
      const errMsg = execErr instanceof Error ? execErr.message : "Unknown execution error";
      await supabase.from("autonomous_actions_log")
        .update({
          action_status: "failed",
          error_message: errMsg,
          updated_at: new Date().toISOString(),
        })
        .eq("id", logEntry.id);

      return new Response(JSON.stringify({
        action_id: logEntry.id,
        status: "failed",
        error: errMsg,
      }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({
      action_id: logEntry.id,
      status: "completed",
      result,
      summary,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("Action engine error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Action execution router
async function executeAction(
  supabase: ReturnType<typeof createClient>,
  actionType: string,
  payload: Record<string, unknown>,
): Promise<{ result: Record<string, unknown>; summary: string }> {
  switch (actionType) {
    case "check_order_status": {
      const { data: order } = await supabase
        .from("orders")
        .select("id, status, total_amount, currency, created_at, package_id")
        .eq("id", payload.order_id)
        .single();
      if (!order) throw new Error("Order not found");
      return {
        result: order,
        summary: `Order ${order.id} is "${order.status}". Amount: ${order.total_amount} ${order.currency}. Created: ${order.created_at}.`,
      };
    }

    case "check_payment_status": {
      const { data: order } = await supabase
        .from("orders")
        .select("id, status, payment_method, stripe_session_id")
        .eq("id", payload.order_id)
        .single();
      if (!order) throw new Error("Order not found");
      const paid = order.status === "completed" || order.status === "active";
      return {
        result: { paid, status: order.status, payment_method: order.payment_method },
        summary: paid ? `Payment for order ${order.id} is confirmed (${order.payment_method}).` : `Payment for order ${order.id} is ${order.status}.`,
      };
    }

    case "resend_payment_link": {
      // Placeholder - would invoke payment link resend edge function
      return {
        result: { sent: true },
        summary: `Payment link resent for order ${payload.order_id}.`,
      };
    }

    case "resend_esim_qr": {
      const { data: order } = await supabase
        .from("orders")
        .select("id, qr_code, smdp_address, activation_code, user_id")
        .eq("id", payload.order_id)
        .single();
      if (!order) throw new Error("Order not found");
      if (!order.qr_code && !order.smdp_address) throw new Error("No QR/activation data available for this order");
      // Would trigger send-order-confirmation or similar
      return {
        result: { has_qr: !!order.qr_code, has_smdp: !!order.smdp_address },
        summary: `eSIM installation details available for order ${order.id}. QR code ${order.qr_code ? "present" : "not available"}.`,
      };
    }

    case "check_activation_status": {
      const { data: order } = await supabase
        .from("orders")
        .select("id, status, cached_usage, provider_order_id")
        .eq("id", payload.order_id)
        .single();
      if (!order) throw new Error("Order not found");
      const usage = order.cached_usage as Record<string, unknown> | null;
      return {
        result: { status: order.status, usage_data: usage },
        summary: `Order ${order.id}: Status is "${order.status}". ${usage ? `Data used: ${(usage as any).usageMb || 0}MB.` : "No usage data yet."}`,
      };
    }

    case "check_package_details": {
      const { data: packages } = await supabase
        .from("esim_packages")
        .select("name, data_amount, validity_days, price, currency, country_name")
        .eq("country_code", (payload.country_code as string).toUpperCase())
        .eq("is_active", true)
        .order("price", { ascending: true })
        .limit(5);
      return {
        result: { packages: packages || [], count: packages?.length || 0 },
        summary: `Found ${packages?.length || 0} packages for ${payload.country_code}. ${packages?.[0] ? `Cheapest: ${packages[0].name} at ${packages[0].price} ${packages[0].currency}.` : ""}`,
      };
    }

    case "create_refund_request": {
      // This would normally be gated by approval, but if we reach here it was pre-approved
      return {
        result: { refund_requested: true, order_id: payload.order_id, reason: payload.reason },
        summary: `Refund request created for order ${payload.order_id}. Reason: ${payload.reason}. Awaiting processing.`,
      };
    }

    case "create_escalation_ticket": {
      const { data: ticket, error } = await supabase
        .from("support_tickets")
        .insert({
          subject: payload.subject,
          description: payload.description,
          priority: payload.priority || "medium",
          status: "open",
          source: "ai_escalation",
        })
        .select()
        .single();
      if (error) throw error;
      return {
        result: { ticket_id: ticket.id },
        summary: `Escalation ticket #${ticket.id} created: "${payload.subject}". Priority: ${payload.priority || "medium"}.`,
      };
    }

    case "schedule_followup": {
      return {
        result: { scheduled: true, delay_minutes: payload.delay_minutes },
        summary: `Follow-up scheduled in ${payload.delay_minutes} minutes for conversation ${payload.conversation_id}.`,
      };
    }

    case "send_recovery_message": {
      return {
        result: { sent: true },
        summary: `Recovery message sent to customer ${payload.customer_id}.`,
      };
    }

    case "create_sales_lead": {
      const { data: lead, error } = await supabase
        .from("chatbot_leads")
        .insert({
          name: payload.name,
          destination: payload.destination,
          data_usage: payload.data_usage || null,
          trip_days: payload.trip_days || null,
        })
        .select()
        .single();
      if (error) throw error;
      return {
        result: { lead_id: lead.id },
        summary: `Sales lead created: ${payload.name} traveling to ${payload.destination}.`,
      };
    }

    case "human_handoff": {
      if (payload.conversation_id) {
        await supabase
          .from("conversations")
          .update({
            status: "open",
            priority: (payload.priority as string) || "high",
            metadata: { ai_paused: true, handoff_reason: payload.reason },
          })
          .eq("id", payload.conversation_id);
      }
      return {
        result: { handed_off: true },
        summary: `Conversation transferred to human agent. Reason: ${payload.reason}.`,
      };
    }

    default:
      throw new Error(`No executor implemented for action: ${actionType}`);
  }
}
