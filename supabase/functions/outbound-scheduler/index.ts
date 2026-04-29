import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Quiet hours config (Asia/Bangkok)
const QUIET_HOURS_START = 22; // 10 PM
const QUIET_HOURS_END = 8; // 8 AM
const DEFAULT_TZ = "Asia/Bangkok";
const RETRY_COOLDOWN_MINUTES = 30;

interface DryRunItem {
  enrollment_id: string;
  customer_profile_id: string;
  journey_step_id: string;
  step_order: number;
  channel_type: string | null;
  scheduled_send_at: string | null;
  result: "pending" | "suppressed" | "skipped";
  reason: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Validate JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const isDryRun = body.dry_run === true;
    const runMode = isDryRun ? "dry_run" : "live";

    // 1. Create run log
    const { data: runLog, error: runLogError } = await supabase
      .from("scheduler_run_logs")
      .insert({ run_mode: runMode })
      .select("id")
      .single();

    if (runLogError) throw runLogError;
    const runLogId = runLog.id;

    let totalQueued = 0;
    let totalSuppressed = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    let totalEvaluated = 0;
    const dryRunItems: DryRunItem[] = [];
    const suppressionBreakdown: Record<string, number> = {};
    const channelBreakdown: Record<string, number> = {};

    // 2. Retry pass — reset retryable rows to pending
    if (!isDryRun) {
      const { error: retryError } = await supabase
        .from("outbound_send_queue")
        .update({ status: "pending" })
        .eq("status", "retryable")
        .lt("last_attempt_at", new Date(Date.now() - RETRY_COOLDOWN_MINUTES * 60000).toISOString());

      if (retryError) {
        console.error("Retry pass error:", retryError);
        totalErrors++;
      }
    }

    // 3. Find eligible enrollments
    const { data: enrollments, error: enrollError } = await supabase
      .from("journey_enrollments")
      .select(`
        id,
        customer_profile_id,
        journey_id,
        current_step_order,
        last_step_executed_at,
        enrolled_at
      `)
      .eq("status", "active");

    if (enrollError) throw enrollError;
    if (!enrollments || enrollments.length === 0) {
      await finalizeRunLog(supabase, runLogId, totalEvaluated, totalQueued, totalSuppressed, totalSkipped, totalErrors, {}, {}, dryRunItems, isDryRun);
      return new Response(JSON.stringify({ run_id: runLogId, mode: runMode, evaluated: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all journey IDs for campaign lookup
    const journeyIds = [...new Set(enrollments.map((e) => e.journey_id))];

    // Fetch journeys with campaign info
    const { data: journeys } = await supabase
      .from("outbound_journeys")
      .select("id, campaign_id, status")
      .in("id", journeyIds);

    const journeyMap = new Map((journeys || []).map((j) => [j.id, j]));

    // Fetch campaigns
    const campaignIds = [...new Set((journeys || []).map((j) => j.campaign_id).filter(Boolean))];
    const { data: campaigns } = await supabase
      .from("outbound_campaigns")
      .select("id, status, start_date, end_date")
      .in("id", campaignIds.length ? campaignIds : ["00000000-0000-0000-0000-000000000000"]);

    const campaignMap = new Map((campaigns || []).map((c) => [c.id, c]));

    // For each enrollment, find next step
    for (const enrollment of enrollments) {
      totalEvaluated++;
      const nextStepOrder = (enrollment.current_step_order || 0) + 1;

      // Fetch next step
      const { data: steps } = await supabase
        .from("outbound_journey_steps")
        .select("*")
        .eq("journey_id", enrollment.journey_id)
        .eq("step_order", nextStepOrder)
        .limit(1);

      const step = steps?.[0];
      if (!step) continue; // No more steps

      // 4. Check if already queued (non-terminal)
      const { data: existing } = await supabase
        .from("outbound_send_queue")
        .select("id")
        .eq("enrollment_id", enrollment.id)
        .eq("journey_step_id", step.id)
        .not("status", "in", '("sent","failed","suppressed","skipped")')
        .limit(1);

      if (existing && existing.length > 0) continue;

      // 5. Calculate readiness
      const baseTime = enrollment.current_step_order === 0
        ? new Date(enrollment.enrolled_at)
        : new Date(enrollment.last_step_executed_at || enrollment.enrolled_at);
      const delayHours = step.delay_before_hours || 0;
      const readyAt = new Date(baseTime.getTime() + delayHours * 3600000);

      if (readyAt > new Date()) continue; // Not yet ready

      // 6. Check campaign/journey status
      const journey = journeyMap.get(enrollment.journey_id);
      if (!journey || journey.status !== "active") {
        const skipReason = !journey ? "step_missing" : "journey_paused";
        if (isDryRun) {
          dryRunItems.push({ enrollment_id: enrollment.id, customer_profile_id: enrollment.customer_profile_id, journey_step_id: step.id, step_order: nextStepOrder, channel_type: null, scheduled_send_at: null, result: "skipped", reason: skipReason });
        } else {
          await insertQueueRow(supabase, enrollment, step, null, null, "skipped", null, skipReason);
        }
        totalSkipped++;
        continue;
      }

      if (journey.campaign_id) {
        const campaign = campaignMap.get(journey.campaign_id);
        if (!campaign || campaign.status !== "active") {
          const skipReason = !campaign ? "campaign_inactive" : "campaign_inactive";
          if (isDryRun) {
            dryRunItems.push({ enrollment_id: enrollment.id, customer_profile_id: enrollment.customer_profile_id, journey_step_id: step.id, step_order: nextStepOrder, channel_type: null, scheduled_send_at: null, result: "skipped", reason: skipReason });
          } else {
            await insertQueueRow(supabase, enrollment, step, null, null, "skipped", null, skipReason);
          }
          totalSkipped++;
          continue;
        }
        // Check campaign dates
        const now = new Date();
        if (campaign.end_date && new Date(campaign.end_date) < now) {
          if (isDryRun) {
            dryRunItems.push({ enrollment_id: enrollment.id, customer_profile_id: enrollment.customer_profile_id, journey_step_id: step.id, step_order: nextStepOrder, channel_type: null, scheduled_send_at: null, result: "skipped", reason: "campaign_expired" });
          } else {
            await insertQueueRow(supabase, enrollment, step, null, null, "skipped", null, "campaign_expired");
          }
          totalSkipped++;
          continue;
        }
      }

      // 6b. Consent & suppression checks
      const { data: prefs } = await supabase
        .from("customer_preferences")
        .select("*")
        .eq("customer_profile_id", enrollment.customer_profile_id)
        .limit(1);

      const pref = prefs?.[0];

      if (pref?.opt_out_all) {
        await recordSuppression(supabase, enrollment, step, "opt_out_all", isDryRun, dryRunItems);
        totalSuppressed++;
        suppressionBreakdown["opt_out_all"] = (suppressionBreakdown["opt_out_all"] || 0) + 1;
        continue;
      }

      if (pref?.manual_suppressed_until && new Date(pref.manual_suppressed_until) > new Date()) {
        await recordSuppression(supabase, enrollment, step, "manual_suppressed", isDryRun, dryRunItems);
        totalSuppressed++;
        suppressionBreakdown["manual_suppressed"] = (suppressionBreakdown["manual_suppressed"] || 0) + 1;
        continue;
      }

      // Frequency cap checks
      if (pref?.max_sends_7d || pref?.max_sends_30d) {
        const { count: sent7d } = await supabase
          .from("outbound_send_queue")
          .select("id", { count: "exact", head: true })
          .eq("customer_profile_id", enrollment.customer_profile_id)
          .eq("status", "sent")
          .gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString());

        if (pref.max_sends_7d && (sent7d || 0) >= pref.max_sends_7d) {
          await recordSuppression(supabase, enrollment, step, "frequency_cap_7d", isDryRun, dryRunItems);
          totalSuppressed++;
          suppressionBreakdown["frequency_cap_7d"] = (suppressionBreakdown["frequency_cap_7d"] || 0) + 1;
          continue;
        }

        const { count: sent30d } = await supabase
          .from("outbound_send_queue")
          .select("id", { count: "exact", head: true })
          .eq("customer_profile_id", enrollment.customer_profile_id)
          .eq("status", "sent")
          .gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString());

        if (pref.max_sends_30d && (sent30d || 0) >= pref.max_sends_30d) {
          await recordSuppression(supabase, enrollment, step, "frequency_cap_30d", isDryRun, dryRunItems);
          totalSuppressed++;
          suppressionBreakdown["frequency_cap_30d"] = (suppressionBreakdown["frequency_cap_30d"] || 0) + 1;
          continue;
        }
      }

      // 7. Channel resolution
      const channelRule = step.channel_selection_rule || "specific";
      let resolvedChannel: string | null = null;

      if (channelRule === "specific") {
        resolvedChannel = step.specific_channel || step.channel_type || null;
      } else {
        // preferred or ai_select — query customer_channel_identities
        const { data: identities } = await supabase
          .from("customer_channel_identities")
          .select("channel_type, sendability_status, is_reachable, is_primary, is_opted_in, last_seen_at")
          .eq("customer_profile_id", enrollment.customer_profile_id)
          .eq("sendability_status", "sendable")
          .eq("is_reachable", true)
          .order("is_primary", { ascending: false })
          .order("last_seen_at", { ascending: false, nullsFirst: false })
          .limit(1);

        resolvedChannel = identities?.[0]?.channel_type || null;
      }

      if (!resolvedChannel) {
        await recordSuppression(supabase, enrollment, step, "no_sendable_channel", isDryRun, dryRunItems);
        totalSuppressed++;
        suppressionBreakdown["no_sendable_channel"] = (suppressionBreakdown["no_sendable_channel"] || 0) + 1;
        continue;
      }

      // Check channel-specific opt-out
      if (pref) {
        const channelOptOuts = pref.opted_out_channels as string[] | null;
        if (channelOptOuts && channelOptOuts.includes(resolvedChannel)) {
          await recordSuppression(supabase, enrollment, step, "opt_out_channel", isDryRun, dryRunItems);
          totalSuppressed++;
          suppressionBreakdown["opt_out_channel"] = (suppressionBreakdown["opt_out_channel"] || 0) + 1;
          continue;
        }
      }

      // 6c. Quiet hours deferral
      let scheduledAt = new Date();
      const bangkokHour = getHourInTimezone(scheduledAt, DEFAULT_TZ);

      if (bangkokHour >= QUIET_HOURS_START || bangkokHour < QUIET_HOURS_END) {
        // Defer to next quiet_hours_end
        scheduledAt = getNextQuietHoursEnd(scheduledAt, DEFAULT_TZ);
      }

      // 8. Insert queue row
      channelBreakdown[resolvedChannel] = (channelBreakdown[resolvedChannel] || 0) + 1;

      if (isDryRun) {
        dryRunItems.push({
          enrollment_id: enrollment.id,
          customer_profile_id: enrollment.customer_profile_id,
          journey_step_id: step.id,
          step_order: nextStepOrder,
          channel_type: resolvedChannel,
          scheduled_send_at: scheduledAt.toISOString(),
          result: "pending",
          reason: null,
        });
      } else {
        await insertQueueRow(
          supabase, enrollment, step, resolvedChannel,
          scheduledAt.toISOString(), "pending", null, null
        );
      }
      totalQueued++;
    }

    // 10. Finalize run log
    await finalizeRunLog(supabase, runLogId, totalEvaluated, totalQueued, totalSuppressed, totalSkipped, totalErrors, suppressionBreakdown, channelBreakdown, dryRunItems, isDryRun);

    return new Response(
      JSON.stringify({
        run_id: runLogId,
        mode: runMode,
        evaluated: totalEvaluated,
        queued: totalQueued,
        suppressed: totalSuppressed,
        skipped: totalSkipped,
        errors: totalErrors,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Scheduler error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Helper functions

async function insertQueueRow(
  supabase: any, enrollment: any, step: any,
  channelType: string | null, scheduledAt: string | null,
  status: string, suppressionReason: string | null, failureReason: string | null
) {
  const isTerminal = ["suppressed", "skipped"].includes(status);
  const { error } = await supabase.from("outbound_send_queue").insert({
    enrollment_id: enrollment.id,
    journey_step_id: step.id,
    customer_profile_id: enrollment.customer_profile_id,
    channel_type: channelType || "unknown",
    message_template_id: step.message_template_id || null,
    scheduled_send_at: scheduledAt || new Date().toISOString(),
    status,
    suppression_reason: suppressionReason,
    failure_reason: failureReason,
    resolved_at: isTerminal ? new Date().toISOString() : null,
  });
  if (error) console.error("Insert queue error:", error);
}

async function recordSuppression(
  supabase: any, enrollment: any, step: any,
  reason: string, isDryRun: boolean, dryRunItems: DryRunItem[]
) {
  if (isDryRun) {
    dryRunItems.push({
      enrollment_id: enrollment.id,
      customer_profile_id: enrollment.customer_profile_id,
      journey_step_id: step.id,
      step_order: (enrollment.current_step_order || 0) + 1,
      channel_type: null,
      scheduled_send_at: null,
      result: "suppressed",
      reason,
    });
  } else {
    await insertQueueRow(supabase, enrollment, step, "unknown", new Date().toISOString(), "suppressed", reason, null);
  }
}

async function finalizeRunLog(
  supabase: any, runLogId: string,
  evaluated: number, queued: number, suppressed: number, skipped: number, errors: number,
  suppressionBreakdown: Record<string, number>, channelBreakdown: Record<string, number>,
  dryRunItems: DryRunItem[], isDryRun: boolean
) {
  const details: any = { suppression_breakdown: suppressionBreakdown, channel_breakdown: channelBreakdown };
  if (isDryRun) {
    details.dry_run_items = dryRunItems;
  }
  await supabase
    .from("scheduler_run_logs")
    .update({
      completed_at: new Date().toISOString(),
      enrollments_evaluated: evaluated,
      sends_queued: queued,
      sends_suppressed: suppressed,
      sends_skipped: skipped,
      errors,
      details,
    })
    .eq("id", runLogId);
}

function getHourInTimezone(date: Date, tz: string): number {
  const formatter = new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: tz });
  return parseInt(formatter.format(date), 10);
}

function getNextQuietHoursEnd(date: Date, tz: string): Date {
  // Get current date in target timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", hour12: false, timeZone: tz,
  });
  const parts = formatter.formatToParts(date);
  const hour = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);

  // If before midnight (e.g. 22-23), next end is today + 1 day at QUIET_HOURS_END
  // If after midnight but before end (0-7), next end is today at QUIET_HOURS_END
  const result = new Date(date);
  if (hour >= QUIET_HOURS_START) {
    // Move to next day
    result.setDate(result.getDate() + 1);
  }
  // Set to QUIET_HOURS_END in Bangkok (UTC+7)
  const year = result.getFullYear();
  const month = result.getMonth();
  const day = result.getDate();
  // QUIET_HOURS_END (8 AM Bangkok) = 1 AM UTC
  return new Date(Date.UTC(year, month, day, QUIET_HOURS_END - 7, 0, 0));
}
