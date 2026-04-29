import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// INTENT RESOLUTION CONTRACT:
// outbound_journey_steps.step_type is a technical execution type (send_message, check_condition, etc.)
// The message-purpose intent used for template matching is stored in:
//   outbound_journey_steps.metadata->>'intent_type'
// Valid intent values: followup, offer, recovery, education, reminder, welcome,
//   upsell, cross_sell, winback, thank_you
// If metadata.intent_type is missing, the send fails with 'no_matching_template'

// SECURITY NOTE:
// This function uses verify_jwt = false because it is invoked internally by
// cron/scheduler only. It must NOT be called from browser clients.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_BATCH_SIZE = 50;
const MAX_RETRY_ATTEMPTS = 3;

// ─── Types ───────────────────────────────────────────────────────────────────

interface QueueRow {
  id: string;
  enrollment_id: string;
  journey_step_id: string;
  customer_profile_id: string;
  channel_type: string;
  message_template_id: string | null;
  scheduled_send_at: string;
  status: string;
  attempt_count: number;
  metadata: Record<string, any> | null;
}

interface ResolvedTemplate {
  id: string;
  template_name: string;
  message_text: string;
  email_subject: string | null;
  intent_type: string;
  campaign_type: string | null;
  language: string;
  channel_type: string;
}

interface ExperimentVariant {
  experiment_id: string;
  experiment_name: string;
  variant_id: string;
  variant_label: string;
  message_text: string;
  email_subject: string | null;
}

interface SendResult {
  success: boolean;
  providerName: string | null;
  externalMessageId?: string;
  error?: string;
}

// ─── Template Resolution ─────────────────────────────────────────────────────

async function resolveTemplate(
  supabase: any,
  intentType: string,
  channelType: string,
  customerLanguage: string | null,
  campaignType: string | null
): Promise<ResolvedTemplate | null> {
  const lang = customerLanguage || 'en';

  // 4-step deterministic fallback
  const fallbackSteps = [
    { language: lang, campaign_type: campaignType, exact_campaign: true },
    { language: lang, campaign_type: null, exact_campaign: true },
    { language: 'en', campaign_type: campaignType, exact_campaign: true },
    { language: 'en', campaign_type: null, exact_campaign: true },
  ];

  // Skip duplicate steps (e.g. if lang is already 'en')
  const seen = new Set<string>();

  for (const step of fallbackSteps) {
    if (step.language === 'en' && lang === 'en' && fallbackSteps.indexOf(step) >= 2) continue;

    const key = `${step.language}|${step.campaign_type}`;
    if (seen.has(key)) continue;
    seen.add(key);

    let query = supabase
      .from('outbound_message_templates')
      .select('id, template_name, message_text, email_subject, intent_type, campaign_type, language, channel_type')
      .eq('is_active', true)
      .eq('channel_type', channelType)
      .eq('language', step.language)
      .eq('intent_type', intentType);

    if (step.campaign_type) {
      query = query.eq('campaign_type', step.campaign_type);
    } else {
      query = query.is('campaign_type', null);
    }

    query = query.order('updated_at', { ascending: false }).limit(1);
    const { data, error } = await query;

    if (!error && data && data.length > 0) {
      return data[0] as ResolvedTemplate;
    }
  }

  return null;
}

// ─── Experiment Resolution ───────────────────────────────────────────────────

async function resolveExperiment(
  supabase: any,
  journeyStepId: string,
  channelType: string,
  intentType: string,
  campaignType: string | null
): Promise<ExperimentVariant | null> {
  // Find active experiments matching context
  const { data: experiments, error: expError } = await supabase
    .from('outbound_experiments')
    .select('id, experiment_name, rollout_percentage')
    .eq('status', 'active')
    .or(`journey_step_id.eq.${journeyStepId},journey_step_id.is.null`);

  if (expError || !experiments || experiments.length === 0) return null;

  // Use the most specific experiment (one with journey_step_id match)
  const experiment = experiments.find((e: any) => e.journey_step_id === journeyStepId) || experiments[0];

  // Rollout percentage check
  const rolloutPct = experiment.rollout_percentage ?? 100;
  if (Math.random() * 100 > rolloutPct) return null;

  // Get variants
  const { data: variants, error: varError } = await supabase
    .from('outbound_experiment_variants')
    .select('id, variant_label, message_text, email_subject, allocation_weight')
    .eq('experiment_id', experiment.id);

  if (varError || !variants || variants.length === 0) {
    throw new Error(`experiment_resolution_error: no variants for experiment ${experiment.id}`);
  }

  // Weighted random selection
  const totalWeight = variants.reduce((sum: number, v: any) => sum + (v.allocation_weight || 1), 0);
  let rand = Math.random() * totalWeight;

  for (const variant of variants) {
    rand -= (variant.allocation_weight || 1);
    if (rand <= 0) {
      return {
        experiment_id: experiment.id,
        experiment_name: experiment.experiment_name,
        variant_id: variant.id,
        variant_label: variant.variant_label,
        message_text: variant.message_text,
        email_subject: variant.email_subject,
      };
    }
  }

  // Fallback to first variant
  const v = variants[0];
  return {
    experiment_id: experiment.id,
    experiment_name: experiment.experiment_name,
    variant_id: v.id,
    variant_label: v.variant_label,
    message_text: v.message_text,
    email_subject: v.email_subject,
  };
}

// ─── Variable Rendering ─────────────────────────────────────────────────────

function renderVariables(
  text: string,
  customerProfile: Record<string, any>,
  stepMetadata: Record<string, any> | null,
  campaignMetadata: Record<string, any> | null
): { rendered: string; unresolvedVars: string[] } {
  const fullName = customerProfile.full_name || '';
  const firstName = fullName.split(' ')[0] || '';

  const vars: Record<string, string> = {
    first_name: firstName,
    full_name: fullName,
    country: customerProfile.country || '',
    package_name: stepMetadata?.package_name || campaignMetadata?.package_name || '',
    destination: stepMetadata?.destination || campaignMetadata?.destination || '',
    discount_code: stepMetadata?.discount_code || campaignMetadata?.discount_code || '',
  };

  let rendered = text;
  for (const [key, value] of Object.entries(vars)) {
    rendered = rendered.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }

  // Check for unresolved variables
  const remaining = rendered.match(/\{\{[^}]+\}\}/g) || [];
  return { rendered, unresolvedVars: remaining };
}

// ─── Opt-out Check ───────────────────────────────────────────────────────────

async function checkOptOut(
  supabase: any,
  customerProfileId: string,
  channelType: string
): Promise<boolean> {
  const { data: prefs } = await supabase
    .from('customer_preferences')
    .select('opt_out_all, opt_out_line, opt_out_email, opt_out_whatsapp')
    .eq('customer_profile_id', customerProfileId)
    .maybeSingle();

  if (!prefs) return false; // No preferences = not opted out

  if (prefs.opt_out_all) return true;

  const channelOptOutMap: Record<string, string> = {
    line: 'opt_out_line',
    email: 'opt_out_email',
    whatsapp: 'opt_out_whatsapp',
  };

  const key = channelOptOutMap[channelType];
  return key ? !!prefs[key] : false;
}

// ─── Channel Adapters ────────────────────────────────────────────────────────

async function sendLine(
  supabase: any,
  customerProfileId: string,
  content: string
): Promise<SendResult> {
  const accessToken = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN');
  if (!accessToken) {
    return { success: false, providerName: 'line', error: 'LINE_CHANNEL_ACCESS_TOKEN not configured' };
  }

  // Resolve LINE channel identity
  const { data: identity } = await supabase
    .from('customer_channel_identities')
    .select('channel_user_id')
    .eq('customer_profile_id', customerProfileId)
    .eq('channel_type', 'line')
    .eq('is_reachable', true)
    .eq('is_opted_in', true)
    .limit(1)
    .maybeSingle();

  if (!identity?.channel_user_id) {
    return { success: false, providerName: null, error: 'no_sendable_channel' };
  }

  const lineResponse = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      to: identity.channel_user_id,
      messages: [{ type: 'text', text: content }],
    }),
  });

  if (!lineResponse.ok) {
    const errorBody = await lineResponse.text();
    return {
      success: false,
      providerName: 'line',
      error: `LINE API ${lineResponse.status}: ${errorBody}`,
    };
  }

  // Consume response body
  await lineResponse.text();

  return { success: true, providerName: 'line' };
}

async function sendChannel(
  supabase: any,
  channelType: string,
  customerProfileId: string,
  content: string
): Promise<SendResult> {
  switch (channelType) {
    case 'line':
      return sendLine(supabase, customerProfileId, content);
    case 'email':
      return { success: false, providerName: null, error: 'channel_not_implemented' };
    case 'whatsapp':
      return { success: false, providerName: null, error: 'channel_not_implemented' };
    default:
      return { success: false, providerName: null, error: `unknown_channel: ${channelType}` };
  }
}

// ─── Logging Helpers ─────────────────────────────────────────────────────────

async function createSendLog(
  supabase: any,
  params: {
    queueRow: QueueRow;
    sendStatus: string;
    renderedContent: string | null;
    emailSubject: string | null;
    providerName: string | null;
    externalMessageId: string | null;
    failureReason: string | null;
    templateId: string | null;
    metadata: Record<string, any>;
  }
) {
  const { error } = await supabase.from('outbound_send_logs').insert({
    customer_profile_id: params.queueRow.customer_profile_id,
    channel_type: params.queueRow.channel_type,
    message_template_id: params.templateId,
    send_status: params.sendStatus,
    rendered_content: params.renderedContent,
    email_subject: params.emailSubject,
    provider_name: params.providerName,
    external_message_id: params.externalMessageId,
    failure_reason: params.failureReason,
    send_attempt_number: params.queueRow.attempt_count + 1,
    sent_at: params.sendStatus === 'sent' ? new Date().toISOString() : null,
    metadata: {
      queue_id: params.queueRow.id,
      enrollment_id: params.queueRow.enrollment_id,
      journey_step_id: params.queueRow.journey_step_id,
      ...params.metadata,
    },
  });

  if (error) console.error('Failed to create send log:', error);
}

async function createLearningEvent(
  supabase: any,
  params: {
    queueRow: QueueRow;
    templateId: string;
    experimentId: string | null;
    variantId: string | null;
    renderedContent: string;
    channelType: string;
  }
) {
  // Get enrollment for stage snapshot
  const { data: enrollment } = await supabase
    .from('journey_enrollments')
    .select('funnel_stage, capability_stage, experience_stage')
    .eq('id', params.queueRow.enrollment_id)
    .maybeSingle();

  const stageSnapshot = enrollment
    ? {
        funnel_stage: enrollment.funnel_stage,
        capability_stage: enrollment.capability_stage,
        experience_stage: enrollment.experience_stage,
      }
    : null;

  const { error } = await supabase.from('outbound_learning_events').insert({
    customer_profile_id: params.queueRow.customer_profile_id,
    event_type: 'message_sent',
    channel: params.channelType,
    message_template_id: params.templateId,
    experiment_id: params.experimentId,
    variant_id: params.variantId,
    stage_snapshot: stageSnapshot,
    payload: {
      queue_id: params.queueRow.id,
      enrollment_id: params.queueRow.enrollment_id,
      journey_step_id: params.queueRow.journey_step_id,
      rendered_length: params.renderedContent.length,
    },
  });

  if (error) console.error('Failed to create learning event:', error);
}

async function advanceEnrollment(
  supabase: any,
  enrollmentId: string,
  stepOrder: number,
  customerProfileId: string
) {
  // Update enrollment
  const { error: enrollError } = await supabase
    .from('journey_enrollments')
    .update({
      current_step_order: stepOrder,
      last_step_executed_at: new Date().toISOString(),
    })
    .eq('id', enrollmentId);

  if (enrollError) console.error('Failed to advance enrollment:', enrollError);

  // Update customer profile last_outbound_at
  const { error: profileError } = await supabase
    .from('customer_profiles')
    .update({ last_outbound_at: new Date().toISOString() })
    .eq('id', customerProfileId);

  if (profileError) console.error('Failed to update customer profile:', profileError);
}

// ─── Main Processing ─────────────────────────────────────────────────────────

async function processQueueRow(supabase: any, row: QueueRow) {
  const logMeta: Record<string, any> = {};

  try {
    // 1. Load journey step
    const { data: step, error: stepError } = await supabase
      .from('outbound_journey_steps')
      .select('id, step_type, step_order, metadata, journey_id')
      .eq('id', row.journey_step_id)
      .single();

    if (stepError || !step) {
      await createSendLog(supabase, {
        queueRow: row, sendStatus: 'failed', renderedContent: null,
        emailSubject: null, providerName: null, externalMessageId: null,
        failureReason: 'journey_step_not_found', templateId: null, metadata: logMeta,
      });
      await supabase.from('outbound_send_queue').update({ status: 'failed' }).eq('id', row.id);
      return;
    }

    // 2. Extract intent from step metadata
    const stepMeta = (step.metadata || {}) as Record<string, any>;
    const intentType = stepMeta.intent_type ?? null;

    if (!intentType) {
      await createSendLog(supabase, {
        queueRow: row, sendStatus: 'failed', renderedContent: null,
        emailSubject: null, providerName: null, externalMessageId: null,
        failureReason: 'no_matching_template: step has no intent_type in metadata',
        templateId: null, metadata: logMeta,
      });
      await supabase.from('outbound_send_queue').update({ status: 'failed' }).eq('id', row.id);
      return;
    }

    // 3. Load customer profile
    const { data: customer } = await supabase
      .from('customer_profiles')
      .select('id, full_name, country, preferred_language, preferred_channel')
      .eq('id', row.customer_profile_id)
      .single();

    if (!customer) {
      await createSendLog(supabase, {
        queueRow: row, sendStatus: 'failed', renderedContent: null,
        emailSubject: null, providerName: null, externalMessageId: null,
        failureReason: 'customer_profile_not_found', templateId: null, metadata: logMeta,
      });
      await supabase.from('outbound_send_queue').update({ status: 'failed' }).eq('id', row.id);
      return;
    }

    // 4. Opt-out check
    const isOptedOut = await checkOptOut(supabase, row.customer_profile_id, row.channel_type);
    if (isOptedOut) {
      await createSendLog(supabase, {
        queueRow: row, sendStatus: 'failed', renderedContent: null,
        emailSubject: null, providerName: null, externalMessageId: null,
        failureReason: 'opt_out_detected_at_send_time', templateId: null, metadata: logMeta,
      });
      await supabase.from('outbound_send_queue').update({ status: 'failed' }).eq('id', row.id);
      return;
    }

    // 5. Load campaign metadata
    const { data: journey } = await supabase
      .from('outbound_journeys')
      .select('campaign_id')
      .eq('id', step.journey_id)
      .maybeSingle();

    let campaignType: string | null = null;
    let campaignMeta: Record<string, any> | null = null;

    if (journey?.campaign_id) {
      const { data: campaign } = await supabase
        .from('outbound_campaigns')
        .select('campaign_type, metadata')
        .eq('id', journey.campaign_id)
        .maybeSingle();

      if (campaign) {
        campaignType = campaign.campaign_type;
        campaignMeta = (campaign.metadata || {}) as Record<string, any>;
      }
    }

    // 6. Template resolution
    let template: ResolvedTemplate | null = null;

    if (row.message_template_id) {
      // Direct template reference from queue
      const { data: directTemplate } = await supabase
        .from('outbound_message_templates')
        .select('id, template_name, message_text, email_subject, intent_type, campaign_type, language, channel_type')
        .eq('id', row.message_template_id)
        .eq('is_active', true)
        .maybeSingle();

      if (!directTemplate) {
        await createSendLog(supabase, {
          queueRow: row, sendStatus: 'failed', renderedContent: null,
          emailSubject: null, providerName: null, externalMessageId: null,
          failureReason: 'no_matching_template: referenced template inactive or missing',
          templateId: row.message_template_id, metadata: logMeta,
        });
        await supabase.from('outbound_send_queue').update({ status: 'failed' }).eq('id', row.id);
        return;
      }
      template = directTemplate;
    } else {
      // Dynamic resolution with 4-step fallback
      template = await resolveTemplate(
        supabase,
        intentType,
        row.channel_type,
        customer.preferred_language,
        campaignType
      );
    }

    if (!template) {
      await createSendLog(supabase, {
        queueRow: row, sendStatus: 'failed', renderedContent: null,
        emailSubject: null, providerName: null, externalMessageId: null,
        failureReason: `no_matching_template: intent=${intentType}, channel=${row.channel_type}, lang=${customer.preferred_language || 'en'}`,
        templateId: null, metadata: logMeta,
      });
      await supabase.from('outbound_send_queue').update({ status: 'failed' }).eq('id', row.id);
      return;
    }

    logMeta.template_id = template.id;
    logMeta.template_name = template.template_name;
    logMeta.resolution_method = row.message_template_id ? 'direct' : 'dynamic_fallback';

    // 7. Experiment resolution (override model)
    let messageText = template.message_text;
    let emailSubject = template.email_subject;
    let experimentId: string | null = null;
    let variantId: string | null = null;

    try {
      const variant = await resolveExperiment(
        supabase,
        row.journey_step_id,
        row.channel_type,
        intentType,
        campaignType
      );

      if (variant) {
        messageText = variant.message_text;
        emailSubject = variant.email_subject || emailSubject;
        experimentId = variant.experiment_id;
        variantId = variant.variant_id;
        logMeta.experiment_id = variant.experiment_id;
        logMeta.experiment_name = variant.experiment_name;
        logMeta.variant_id = variant.variant_id;
        logMeta.variant_label = variant.variant_label;
      }
    } catch (expErr: any) {
      await createSendLog(supabase, {
        queueRow: row, sendStatus: 'failed', renderedContent: null,
        emailSubject: null, providerName: null, externalMessageId: null,
        failureReason: expErr.message || 'experiment_resolution_error',
        templateId: template.id, metadata: logMeta,
      });
      await supabase.from('outbound_send_queue').update({ status: 'failed' }).eq('id', row.id);
      return;
    }

    // 8. Variable rendering
    const { rendered, unresolvedVars } = renderVariables(
      messageText,
      customer,
      stepMeta,
      campaignMeta
    );

    if (unresolvedVars.length > 0) {
      await createSendLog(supabase, {
        queueRow: row, sendStatus: 'failed', renderedContent: null,
        emailSubject, providerName: null, externalMessageId: null,
        failureReason: `missing_required_variables: ${unresolvedVars.join(', ')}`,
        templateId: template.id, metadata: logMeta,
      });
      await supabase.from('outbound_send_queue').update({ status: 'failed' }).eq('id', row.id);
      return;
    }

    // 9. Channel dispatch
    const sendResult = await sendChannel(supabase, row.channel_type, row.customer_profile_id, rendered);

    if (!sendResult.success) {
      const isProviderError = sendResult.providerName !== null;
      const canRetry = isProviderError && row.attempt_count + 1 < MAX_RETRY_ATTEMPTS;
      const newStatus = canRetry ? 'retryable' : 'failed';

      await createSendLog(supabase, {
        queueRow: row, sendStatus: 'failed',
        renderedContent: isProviderError ? rendered : (sendResult.error === 'no_sendable_channel' ? rendered : null),
        emailSubject, providerName: sendResult.providerName,
        externalMessageId: null,
        failureReason: sendResult.error || 'unknown_send_error',
        templateId: template.id, metadata: logMeta,
      });

      await supabase.from('outbound_send_queue').update({
        status: newStatus,
        attempt_count: row.attempt_count + 1,
      }).eq('id', row.id);

      return;
    }

    // 10. Success path
    await createSendLog(supabase, {
      queueRow: row, sendStatus: 'sent', renderedContent: rendered,
      emailSubject, providerName: sendResult.providerName,
      externalMessageId: sendResult.externalMessageId || null,
      failureReason: null, templateId: template.id, metadata: logMeta,
    });

    await supabase.from('outbound_send_queue').update({
      status: 'sent',
      attempt_count: row.attempt_count + 1,
    }).eq('id', row.id);

    // Learning event (success only)
    await createLearningEvent(supabase, {
      queueRow: row,
      templateId: template.id,
      experimentId,
      variantId,
      renderedContent: rendered,
      channelType: row.channel_type,
    });

    // Enrollment advancement (success only)
    await advanceEnrollment(
      supabase,
      row.enrollment_id,
      step.step_order,
      row.customer_profile_id
    );

  } catch (err: any) {
    console.error(`Unexpected error processing queue row ${row.id}:`, err);
    await createSendLog(supabase, {
      queueRow: row, sendStatus: 'failed', renderedContent: null,
      emailSubject: null, providerName: null, externalMessageId: null,
      failureReason: `unexpected_error: ${err.message}`, templateId: null, metadata: logMeta,
    });
    await supabase.from('outbound_send_queue').update({ status: 'failed' }).eq('id', row.id);
  }
}

// ─── Main Handler ────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Optimistic concurrency: pick up pending/retryable rows and lock them to 'sending'
    const now = new Date().toISOString();

    const { data: pendingRows, error: fetchError } = await supabase
      .from('outbound_send_queue')
      .select('id')
      .in('status', ['pending', 'retryable'])
      .lte('scheduled_send_at', now)
      .order('scheduled_send_at', { ascending: true })
      .limit(MAX_BATCH_SIZE);

    if (fetchError) {
      console.error('Failed to fetch queue:', fetchError);
      return new Response(JSON.stringify({ error: 'Failed to fetch queue' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!pendingRows || pendingRows.length === 0) {
      return new Response(JSON.stringify({ processed: 0, message: 'No pending items' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const ids = pendingRows.map((r: any) => r.id);

    // Optimistic lock: update status to 'sending' only for rows still pending/retryable
    const { data: lockedRows, error: lockError } = await supabase
      .from('outbound_send_queue')
      .update({ status: 'sending' })
      .in('id', ids)
      .in('status', ['pending', 'retryable'])
      .select('id, enrollment_id, journey_step_id, customer_profile_id, channel_type, message_template_id, scheduled_send_at, status, attempt_count, metadata');

    if (lockError) {
      console.error('Failed to lock queue rows:', lockError);
      return new Response(JSON.stringify({ error: 'Failed to lock queue rows' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!lockedRows || lockedRows.length === 0) {
      return new Response(JSON.stringify({ processed: 0, message: 'All rows already claimed' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing ${lockedRows.length} queue items`);

    let successCount = 0;
    let failCount = 0;

    for (const row of lockedRows as QueueRow[]) {
      try {
        await processQueueRow(supabase, row);
        // Check final status
        const { data: finalRow } = await supabase
          .from('outbound_send_queue')
          .select('status')
          .eq('id', row.id)
          .maybeSingle();

        if (finalRow?.status === 'sent') successCount++;
        else failCount++;
      } catch (err: any) {
        failCount++;
        console.error(`Error processing row ${row.id}:`, err);
      }
    }

    console.log(`Batch complete: ${successCount} sent, ${failCount} failed/retryable`);

    return new Response(JSON.stringify({
      processed: lockedRows.length,
      sent: successCount,
      failed: failCount,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('outbound-sender error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
