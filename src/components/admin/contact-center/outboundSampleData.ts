// Sample data for outbound contact center modules (sample/preview mode)

const now = new Date();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000).toISOString();

// ─── Customers ─────────────────────────────────────────────
export const SAMPLE_CUSTOMERS = [
  {
    id: "cust-001", full_name: "Somchai Wongsakul", primary_email: "somchai@example.com",
    primary_phone: "+66812345678", created_at: daysAgo(90),
    customer_stage_state: [{ funnel_stage: "active", capability_stage: "intermediate", experience_stage: "satisfied" }],
    customer_preferences: [{ sales_followup_opt_out: false, news_promo_opt_out: false, preferred_channel: "line", preferred_language: "th" }],
  },
  {
    id: "cust-002", full_name: "Nattaporn Srisuk", primary_email: "nattaporn@example.com",
    primary_phone: "+66898765432", created_at: daysAgo(60),
    customer_stage_state: [{ funnel_stage: "lead", capability_stage: "beginner", experience_stage: "neutral" }],
    customer_preferences: [{ sales_followup_opt_out: false, news_promo_opt_out: true, preferred_channel: "email", preferred_language: "th" }],
  },
  {
    id: "cust-003", full_name: "James Chen", primary_email: "james.chen@example.com",
    primary_phone: "+85291234567", created_at: daysAgo(45),
    customer_stage_state: [{ funnel_stage: "trial", capability_stage: "beginner", experience_stage: "neutral" }],
    customer_preferences: [{ sales_followup_opt_out: false, news_promo_opt_out: false, preferred_channel: "whatsapp", preferred_language: "en" }],
  },
  {
    id: "cust-004", full_name: "Pimchanok Rattanawong", primary_email: "pimchanok@example.com",
    primary_phone: "+66823456789", created_at: daysAgo(120),
    customer_stage_state: [{ funnel_stage: "churned", capability_stage: "advanced", experience_stage: "frustrated" }],
    customer_preferences: [{ sales_followup_opt_out: true, news_promo_opt_out: true, preferred_channel: "line", preferred_language: "th" }],
  },
  {
    id: "cust-005", full_name: "Akira Tanaka", primary_email: "akira.t@example.com",
    primary_phone: "+81901234567", created_at: daysAgo(30),
    customer_stage_state: [{ funnel_stage: "active", capability_stage: "advanced", experience_stage: "satisfied" }],
    customer_preferences: [{ sales_followup_opt_out: false, news_promo_opt_out: false, preferred_channel: "line", preferred_language: "en" }],
  },
  {
    id: "cust-006", full_name: "Siriwan Chaiyasit", primary_email: "siriwan@example.com",
    primary_phone: "+66834567890", created_at: daysAgo(15),
    customer_stage_state: [{ funnel_stage: "visitor", capability_stage: "beginner", experience_stage: "neutral" }],
    customer_preferences: [{ sales_followup_opt_out: false, news_promo_opt_out: false, preferred_channel: "line", preferred_language: "th" }],
  },
  {
    id: "cust-007", full_name: "David Kim", primary_email: "david.kim@example.com",
    primary_phone: "+821012345678", created_at: daysAgo(75),
    customer_stage_state: [{ funnel_stage: "active", capability_stage: "intermediate", experience_stage: "satisfied" }],
    customer_preferences: [{ sales_followup_opt_out: false, news_promo_opt_out: false, preferred_channel: "email", preferred_language: "en" }],
  },
  {
    id: "cust-008", full_name: "Kanokwan Panyarat", primary_email: "kanokwan@example.com",
    primary_phone: "+66845678901", created_at: daysAgo(200),
    customer_stage_state: [{ funnel_stage: "dormant", capability_stage: "intermediate", experience_stage: "neutral" }],
    customer_preferences: [{ sales_followup_opt_out: true, news_promo_opt_out: false, preferred_channel: "line", preferred_language: "th" }],
  },
];

// ─── Campaigns ─────────────────────────────────────────────
export const SAMPLE_CAMPAIGNS = [
  {
    id: "camp-001", campaign_name: "Summer eSIM Promo Thailand", campaign_type: "promotion",
    campaign_objective: "Drive trial-to-active conversions for summer travel season",
    status: "active", scheduling_mode: "scheduled", allowed_channels: ["line", "email"],
    priority: 50, preference_category: "news_and_promotions", goal_metric: "conversion_rate",
    is_recovery_campaign: false, start_at: daysAgo(7), end_at: daysAgo(-14),
    max_sends: 5000, created_at: daysAgo(10), created_by: null,
  },
  {
    id: "camp-002", campaign_name: "Win-Back Churned Users", campaign_type: "win_back",
    campaign_objective: "Re-engage churned customers with personalized offers",
    status: "active", scheduling_mode: "always_on", allowed_channels: ["line", "email", "whatsapp"],
    priority: 30, preference_category: "sales_followup", goal_metric: "reply_rate",
    is_recovery_campaign: true, start_at: daysAgo(30), end_at: null,
    max_sends: null, created_at: daysAgo(35), created_by: null,
  },
  {
    id: "camp-003", campaign_name: "Enterprise Onboarding", campaign_type: "education",
    campaign_objective: "Educate new enterprise customers on platform features",
    status: "draft", scheduling_mode: "scheduled", allowed_channels: ["email"],
    priority: 100, preference_category: null, goal_metric: "open_rate",
    is_recovery_campaign: false, start_at: null, end_at: null,
    max_sends: 500, created_at: daysAgo(3), created_by: null,
  },
  {
    id: "camp-004", campaign_name: "Upsell Data Plans", campaign_type: "upsell",
    campaign_objective: "Upsell active users to higher data tier plans",
    status: "paused", scheduling_mode: "scheduled", allowed_channels: ["line"],
    priority: 70, preference_category: "sales_followup", goal_metric: "conversion_rate",
    is_recovery_campaign: false, start_at: daysAgo(20), end_at: daysAgo(-5),
    max_sends: 3000, created_at: daysAgo(25), created_by: null,
  },
  {
    id: "camp-005", campaign_name: "Cross-sell Travel Insurance", campaign_type: "cross_sell",
    campaign_objective: "Cross-sell travel insurance to active eSIM users",
    status: "completed", scheduling_mode: "scheduled", allowed_channels: ["line", "email"],
    priority: 80, preference_category: "news_and_promotions", goal_metric: "click_rate",
    is_recovery_campaign: false, start_at: daysAgo(60), end_at: daysAgo(30),
    max_sends: 2000, created_at: daysAgo(65), created_by: null,
  },
];

// ─── Journeys ──────────────────────────────────────────────
export const SAMPLE_JOURNEYS = [
  {
    id: "jour-001", campaign_id: "camp-001", journey_name: "Summer Promo Welcome Flow",
    trigger_type: "campaign_start", trigger_definition: {}, status: "active",
    stop_conditions: [{ type: "conversion" }, { type: "opt_out" }], max_steps: 4,
    created_at: daysAgo(9),
  },
  {
    id: "jour-002", campaign_id: "camp-002", journey_name: "Win-Back Re-engagement",
    trigger_type: "stage_change", trigger_definition: { stage: "churned" }, status: "active",
    stop_conditions: [{ type: "conversion" }, { type: "opt_out" }, { type: "max_attempts" }], max_steps: 5,
    created_at: daysAgo(34),
  },
  {
    id: "jour-003", campaign_id: "camp-004", journey_name: "Upsell Gentle Nudge",
    trigger_type: "event_signal", trigger_definition: { event: "data_usage_80pct" }, status: "paused",
    stop_conditions: [{ type: "conversion" }], max_steps: 3,
    created_at: daysAgo(24),
  },
  {
    id: "jour-004", campaign_id: "camp-003", journey_name: "Enterprise Onboarding Steps",
    trigger_type: "manual", trigger_definition: {}, status: "draft",
    stop_conditions: [{ type: "completed_all_steps" }], max_steps: 6,
    created_at: daysAgo(2),
  },
];

export const SAMPLE_JOURNEY_STEPS = [
  { id: "step-001", journey_id: "jour-001", step_order: 1, step_name: "Welcome Message", step_type: "send_message", delay_before_hours: 0, channel_selection_rule: "preferred", specific_channel: null, ai_generate_message: false, ai_generation_instructions: null, action_if_replied: "stop", action_if_no_reply: "next_step", action_if_converted: "stop", branch_target_step: null, metadata: {} },
  { id: "step-002", journey_id: "jour-001", step_order: 2, step_name: "Follow-up Offer", step_type: "send_message", delay_before_hours: 48, channel_selection_rule: "preferred", specific_channel: null, ai_generate_message: true, ai_generation_instructions: "Highlight summer discount", action_if_replied: "stop", action_if_no_reply: "next_step", action_if_converted: "stop", branch_target_step: null, metadata: {} },
  { id: "step-003", journey_id: "jour-001", step_order: 3, step_name: "AI Decision Point", step_type: "ai_decision", delay_before_hours: 72, channel_selection_rule: "ai_select", specific_channel: null, ai_generate_message: false, ai_generation_instructions: null, action_if_replied: "stop", action_if_no_reply: "next_step", action_if_converted: "stop", branch_target_step: null, metadata: {} },
  { id: "step-004", journey_id: "jour-002", step_order: 1, step_name: "We Miss You", step_type: "send_message", delay_before_hours: 0, channel_selection_rule: "preferred", specific_channel: null, ai_generate_message: true, ai_generation_instructions: "Empathetic win-back tone", action_if_replied: "stop", action_if_no_reply: "next_step", action_if_converted: "stop", branch_target_step: null, metadata: {} },
  { id: "step-005", journey_id: "jour-002", step_order: 2, step_name: "Special Offer", step_type: "send_message", delay_before_hours: 96, channel_selection_rule: "specific", specific_channel: "email", ai_generate_message: false, ai_generation_instructions: null, action_if_replied: "stop", action_if_no_reply: "next_step", action_if_converted: "stop", branch_target_step: null, metadata: {} },
];

// ─── Templates ─────────────────────────────────────────────
export const SAMPLE_TEMPLATES = [
  { id: "tpl-001", template_name: "Summer Promo - LINE TH", campaign_type: "promotion", channel_type: "line", language: "th", intent_type: "offer", tone_type: "friendly", message_text: "สวัสดีค่ะ {{name}} 🌴 eSIM สำหรับซัมเมอร์ลด 20%! ใช้โค้ด SUMMER20 ก่อนหมดเขต", email_subject: null, cta_type: "link", cta_text: "สั่งซื้อเลย", cta_url: "https://example.com/promo", supported_variables: ["name"], version_label: "v1", is_active: true, metadata: {}, created_at: daysAgo(10), updated_at: daysAgo(5) },
  { id: "tpl-002", template_name: "Summer Promo - Email EN", campaign_type: "promotion", channel_type: "email", language: "en", intent_type: "offer", tone_type: "professional", message_text: "Hi {{name}}, enjoy 20% off your next eSIM plan this summer! Use code SUMMER20 at checkout.", email_subject: "☀️ Summer Sale: 20% Off eSIM Plans", cta_type: "link", cta_text: "Shop Now", cta_url: "https://example.com/promo", supported_variables: ["name"], version_label: "v1", is_active: true, metadata: {}, created_at: daysAgo(10), updated_at: daysAgo(5) },
  { id: "tpl-003", template_name: "Win-Back - LINE TH", campaign_type: "win_back", channel_type: "line", language: "th", intent_type: "winback", tone_type: "empathetic", message_text: "สวัสดีค่ะ {{name}} เราคิดถึงคุณ 💙 กลับมาใช้ eSIM อีกครั้ง รับส่วนลดพิเศษ 30%", email_subject: null, cta_type: "reply", cta_text: "สนใจ", cta_url: null, supported_variables: ["name"], version_label: "v1", is_active: true, metadata: {}, created_at: daysAgo(35), updated_at: daysAgo(20) },
  { id: "tpl-004", template_name: "Education - Onboarding Email", campaign_type: "education", channel_type: "email", language: "en", intent_type: "education", tone_type: "friendly", message_text: "Welcome {{name}}! Here's how to get started with your eSIM in 3 easy steps.", email_subject: "Getting Started with Mobile11 eSIM", cta_type: "link", cta_text: "View Guide", cta_url: "https://example.com/guide", supported_variables: ["name"], version_label: "v1", is_active: true, metadata: {}, created_at: daysAgo(3), updated_at: daysAgo(1) },
  { id: "tpl-005", template_name: "Upsell - LINE EN", campaign_type: "upsell", channel_type: "line", language: "en", intent_type: "upsell", tone_type: "casual", message_text: "Hey {{name}} 📱 You're almost out of data! Upgrade to our Premium plan for unlimited browsing.", email_subject: null, cta_type: "button", cta_text: "Upgrade", cta_url: "https://example.com/upgrade", supported_variables: ["name"], version_label: "v1", is_active: true, metadata: {}, created_at: daysAgo(25), updated_at: daysAgo(15) },
  { id: "tpl-006", template_name: "Recovery - WhatsApp TH", campaign_type: "recovery", channel_type: "whatsapp", language: "th", intent_type: "recovery", tone_type: "empathetic", message_text: "สวัสดีค่ะ {{name}} เราเห็นว่าคุณมีปัญหาในการใช้งาน eSIM ทีมของเราพร้อมช่วยเหลือค่ะ", email_subject: null, cta_type: "reply", cta_text: "ต้องการความช่วยเหลือ", cta_url: null, supported_variables: ["name"], version_label: "v1", is_active: true, metadata: {}, created_at: daysAgo(15), updated_at: daysAgo(8) },
];

// ─── AI Message Batches ────────────────────────────────────
export const SAMPLE_AI_BATCHES = [
  {
    id: "batch-001", campaign_type: "promotion", channel_type: "line", intent_type: "offer",
    tone_type: "friendly", customer_profile_id: null, customer_context: { funnel_stage: "trial", experience_stage: "neutral" },
    generated_variants: [
      { variant_key: "short_th", language: "th", style: "short", message_text: "โปรซัมเมอร์! eSIM ลด 20% 🌴", email_subject: null, supported_variables: [], approval_status: "approved", notes: null },
      { variant_key: "medium_en", language: "en", style: "medium", message_text: "This summer, travel smarter with 20% off any eSIM plan. Limited time only!", email_subject: null, supported_variables: [], approval_status: "pending", notes: null },
    ],
    prompt_version: "v2.1", generation_engine: "gpt-4o", status: "partially_approved",
    approved_template_ids: ["tpl-001"], created_by: null, created_at: daysAgo(5),
  },
  {
    id: "batch-002", campaign_type: "win_back", channel_type: "email", intent_type: "winback",
    tone_type: "empathetic", customer_profile_id: "cust-004", customer_context: { funnel_stage: "churned", experience_stage: "frustrated" },
    generated_variants: [
      { variant_key: "soft_cta_en", language: "en", style: "soft_cta", message_text: "We noticed you haven't been around lately. We'd love to have you back — here's a special offer just for you.", email_subject: "We miss you 💙", supported_variables: ["name"], approval_status: "pending", notes: null },
      { variant_key: "strong_cta_th", language: "th", style: "strong_cta", message_text: "คุณ {{name}} กลับมาใช้ eSIM วันนี้รับส่วนลด 30% ทันที! สิทธิ์มีจำกัด", email_subject: "ข้อเสนอพิเศษสำหรับคุณ", supported_variables: ["name"], approval_status: "rejected", notes: "Too aggressive for churned segment" },
    ],
    prompt_version: "v2.1", generation_engine: "gpt-4o", status: "pending_review",
    approved_template_ids: [], created_by: null, created_at: daysAgo(2),
  },
  {
    id: "batch-003", campaign_type: "education", channel_type: "line", intent_type: "education",
    tone_type: "friendly", customer_profile_id: null, customer_context: { funnel_stage: "lead", experience_stage: "neutral" },
    generated_variants: [
      { variant_key: "short_en", language: "en", style: "short", message_text: "New to eSIM? Here's a quick guide 📖", email_subject: null, supported_variables: [], approval_status: "approved", notes: null },
      { variant_key: "medium_th", language: "th", style: "medium", message_text: "เริ่มต้นใช้ eSIM ง่ายๆ ใน 3 ขั้นตอน! ดูคู่มือของเราเลย 📱", email_subject: null, supported_variables: [], approval_status: "approved", notes: null },
    ],
    prompt_version: "v2.0", generation_engine: "gpt-4o", status: "approved",
    approved_template_ids: ["tpl-004"], created_by: null, created_at: daysAgo(8),
  },
];

// ─── Send Logs ─────────────────────────────────────────────
export const SAMPLE_SEND_LOGS = [
  { id: "sl-001", customer_profile_id: "cust-001", channel_type: "line", provider_name: "LINE Official", send_attempt_number: 1, send_status: "sent", delivery_status: "delivered", reply_status: "replied", click_status: "clicked", conversion_status: "converted", email_subject: null, rendered_content: "สวัสดีค่ะ Somchai 🌴 eSIM สำหรับซัมเมอร์ลด 20%!", external_message_id: "line-msg-001", failure_reason: null, sent_at: hoursAgo(48), delivered_at: hoursAgo(47), replied_at: hoursAgo(24), clicked_at: hoursAgo(20), converted_at: hoursAgo(12), created_at: hoursAgo(49), metadata: {} },
  { id: "sl-002", customer_profile_id: "cust-002", channel_type: "email", provider_name: "SendGrid", send_attempt_number: 1, send_status: "sent", delivery_status: "delivered", reply_status: "none", click_status: "clicked", conversion_status: "none", email_subject: "☀️ Summer Sale: 20% Off", rendered_content: "Hi Nattaporn, enjoy 20% off!", external_message_id: "sg-msg-001", failure_reason: null, sent_at: hoursAgo(36), delivered_at: hoursAgo(35), replied_at: null, clicked_at: hoursAgo(30), converted_at: null, created_at: hoursAgo(37), metadata: {} },
  { id: "sl-003", customer_profile_id: "cust-003", channel_type: "whatsapp", provider_name: "Twilio", send_attempt_number: 1, send_status: "sent", delivery_status: "delivered", reply_status: "replied", click_status: "none", conversion_status: "none", email_subject: null, rendered_content: "Hi James! Your eSIM guide is ready.", external_message_id: "tw-msg-001", failure_reason: null, sent_at: hoursAgo(24), delivered_at: hoursAgo(23), replied_at: hoursAgo(18), clicked_at: null, converted_at: null, created_at: hoursAgo(25), metadata: {} },
  { id: "sl-004", customer_profile_id: "cust-004", channel_type: "line", provider_name: "LINE Official", send_attempt_number: 1, send_status: "failed", delivery_status: "bounced", reply_status: "none", click_status: "none", conversion_status: "none", email_subject: null, rendered_content: "สวัสดีค่ะ Pimchanok กลับมาใช้ eSIM อีกครั้ง", external_message_id: null, failure_reason: "User blocked the account", sent_at: hoursAgo(72), delivered_at: null, replied_at: null, clicked_at: null, converted_at: null, created_at: hoursAgo(73), metadata: {} },
  { id: "sl-005", customer_profile_id: "cust-005", channel_type: "line", provider_name: "LINE Official", send_attempt_number: 1, send_status: "sent", delivery_status: "delivered", reply_status: "none", click_status: "none", conversion_status: "none", email_subject: null, rendered_content: "Hey Akira! Upgrade to Premium plan.", external_message_id: "line-msg-002", failure_reason: null, sent_at: hoursAgo(12), delivered_at: hoursAgo(11), replied_at: null, clicked_at: null, converted_at: null, created_at: hoursAgo(13), metadata: {} },
  { id: "sl-006", customer_profile_id: "cust-006", channel_type: "line", provider_name: "LINE Official", send_attempt_number: 1, send_status: "sent", delivery_status: "delivered", reply_status: "none", click_status: "clicked", conversion_status: "none", email_subject: null, rendered_content: "สวัสดีค่ะ Siriwan เริ่มต้นใช้ eSIM", external_message_id: "line-msg-003", failure_reason: null, sent_at: hoursAgo(6), delivered_at: hoursAgo(5), replied_at: null, clicked_at: hoursAgo(3), converted_at: null, created_at: hoursAgo(7), metadata: {} },
  { id: "sl-007", customer_profile_id: "cust-007", channel_type: "email", provider_name: "SendGrid", send_attempt_number: 1, send_status: "sent", delivery_status: "bounced", reply_status: "none", click_status: "none", conversion_status: "none", email_subject: "Upgrade Your eSIM Plan", rendered_content: "Hi David, upgrade your plan today!", external_message_id: "sg-msg-002", failure_reason: "Mailbox full", sent_at: hoursAgo(96), delivered_at: null, replied_at: null, clicked_at: null, converted_at: null, created_at: hoursAgo(97), metadata: {} },
  { id: "sl-008", customer_profile_id: "cust-001", channel_type: "line", provider_name: "LINE Official", send_attempt_number: 2, send_status: "sent", delivery_status: "delivered", reply_status: "none", click_status: "none", conversion_status: "none", email_subject: null, rendered_content: "Follow-up: eSIM ซัมเมอร์ สิทธิ์เหลือจำกัด!", external_message_id: "line-msg-004", failure_reason: null, sent_at: hoursAgo(2), delivered_at: hoursAgo(1), replied_at: null, clicked_at: null, converted_at: null, created_at: hoursAgo(3), metadata: {} },
  { id: "sl-009", customer_profile_id: "cust-002", channel_type: "line", provider_name: "LINE Official", send_attempt_number: 1, send_status: "pending", delivery_status: "unknown", reply_status: "none", click_status: "none", conversion_status: "none", email_subject: null, rendered_content: "สวัสดีค่ะ Nattaporn โปรโมชั่นพิเศษ!", external_message_id: null, failure_reason: null, sent_at: null, delivered_at: null, replied_at: null, clicked_at: null, converted_at: null, created_at: hoursAgo(1), metadata: {} },
  { id: "sl-010", customer_profile_id: "cust-008", channel_type: "email", provider_name: "SendGrid", send_attempt_number: 1, send_status: "sent", delivery_status: "delivered", reply_status: "none", click_status: "none", conversion_status: "none", email_subject: "We'd love to have you back", rendered_content: "Hi Kanokwan, it's been a while...", external_message_id: "sg-msg-003", failure_reason: null, sent_at: hoursAgo(120), delivered_at: hoursAgo(119), replied_at: null, clicked_at: null, converted_at: null, created_at: hoursAgo(121), metadata: {} },
];

// ─── Preferences (for Suppression & Consent) ──────────────
export const SAMPLE_PREFERENCES = SAMPLE_CUSTOMERS.map(c => ({
  id: `pref-${c.id}`,
  customer_profile_id: c.id,
  sales_followup_opt_out: c.customer_preferences[0].sales_followup_opt_out,
  news_promo_opt_out: c.customer_preferences[0].news_promo_opt_out,
  opt_out_all: c.customer_preferences[0].sales_followup_opt_out && c.customer_preferences[0].news_promo_opt_out,
  preferred_channel: c.customer_preferences[0].preferred_channel,
  preferred_language: c.customer_preferences[0].preferred_language,
  updated_at: daysAgo(Math.floor(Math.random() * 30)),
  customer_profiles: { id: c.id, full_name: c.full_name, primary_email: c.primary_email },
}));

// ─── Outbound Analytics (Learning Events) ──────────────────
export const SAMPLE_ANALYTICS_EVENTS = (() => {
  const events: any[] = [];
  const channels = ["line", "line", "line", "email", "whatsapp"];
  const statuses = ["delivered", "delivered", "delivered", "bounced", "delivered"];
  const replyStatuses = ["replied", "none", "none", "none", "replied"];
  const clickStatuses = ["clicked", "none", "clicked", "none", "none"];
  const convStatuses = ["converted", "none", "none", "none", "none"];
  const optOutStatuses = ["none", "none", "none", "none", "opted_out"];
  const campaignIds = ["camp-001", "camp-001", "camp-002", "camp-002", "camp-001"];

  for (let i = 0; i < 35; i++) {
    const idx = i % 5;
    events.push({
      id: `le-${i.toString().padStart(3, "0")}`,
      campaign_id: campaignIds[idx],
      channel_type: channels[idx],
      delivery_status: statuses[idx],
      reply_status: replyStatuses[idx],
      click_status: clickStatuses[idx],
      conversion_status: convStatuses[idx],
      opt_out_status: optOutStatuses[idx],
      created_at: daysAgo(Math.floor(Math.random() * 7)),
    });
  }
  return events;
})();

// ─── Optimization Recommendations ──────────────────────────
export const SAMPLE_OPTIMIZATION_RECS = [
  {
    id: "opt-001", recommendation_type: "channel_order", severity: "high",
    title: "Switch LINE-first for churned segment", explanation: "LINE has 3x higher reply rate than email for churned customers in Thailand. Recommend switching primary channel to LINE.",
    evidence: { line_reply_rate: 12.4, email_reply_rate: 3.8, sample_size: 284 },
    current_value: { primary_channel: "email" }, recommended_value: { primary_channel: "line" },
    impact_score: 78, confidence_score: 85, status: "pending",
    reviewed_by: null, reviewed_at: null, review_notes: null,
    implemented_at: null, implementation_notes: null, engine_version: "v1.2",
    analysis_window_days: 14, created_at: daysAgo(1),
    campaign_id: "camp-002", journey_id: null, journey_step_id: null, template_id: null, experiment_id: null,
  },
  {
    id: "opt-002", recommendation_type: "send_timing", severity: "medium",
    title: "Shift send time to 10AM for promotions", explanation: "Open rates peak at 10:00 local time. Current sends at 14:00 show 22% lower engagement.",
    evidence: { peak_hour: 10, current_hour: 14, open_rate_delta: -22 },
    current_value: { send_hour: 14 }, recommended_value: { send_hour: 10 },
    impact_score: 55, confidence_score: 72, status: "pending",
    reviewed_by: null, reviewed_at: null, review_notes: null,
    implemented_at: null, implementation_notes: null, engine_version: "v1.2",
    analysis_window_days: 30, created_at: daysAgo(2),
    campaign_id: "camp-001", journey_id: null, journey_step_id: null, template_id: null, experiment_id: null,
  },
  {
    id: "opt-003", recommendation_type: "message_tone", severity: "critical",
    title: "Reduce urgency in win-back messages", explanation: "High-urgency tone variants show 2.5x higher opt-out rate for churned segment. Recommend softer, empathetic tone.",
    evidence: { urgent_optout_rate: 5.2, soft_optout_rate: 1.8, sample_size: 150 },
    current_value: { tone: "urgent" }, recommended_value: { tone: "empathetic" },
    impact_score: 92, confidence_score: 88, status: "accepted",
    reviewed_by: "admin-001", reviewed_at: daysAgo(1), review_notes: "Agreed — tone change makes sense for this segment",
    implemented_at: null, implementation_notes: null, engine_version: "v1.2",
    analysis_window_days: 21, created_at: daysAgo(3),
    campaign_id: "camp-002", journey_id: "jour-002", journey_step_id: null, template_id: "tpl-003", experiment_id: null,
  },
  {
    id: "opt-004", recommendation_type: "suppression_rule", severity: "low",
    title: "Suppress low-intent visitors from promos", explanation: "Visitors with <2 page views show 0% conversion on promotional messages. Suppressing saves budget.",
    evidence: { visitor_conversion_rate: 0, threshold: 2 },
    current_value: null, recommended_value: { min_pageviews: 2 },
    impact_score: 30, confidence_score: 95, status: "implemented",
    reviewed_by: "admin-001", reviewed_at: daysAgo(5), review_notes: "Good catch",
    implemented_at: daysAgo(4), implementation_notes: "Added page view filter to campaign audience",
    engine_version: "v1.1", analysis_window_days: 30, created_at: daysAgo(7),
    campaign_id: "camp-001", journey_id: null, journey_step_id: null, template_id: null, experiment_id: null,
  },
];

// ─── NBA Decisions ─────────────────────────────────────────
export const SAMPLE_NBA_DECISIONS = [
  {
    id: "nba-001", customer_profile_id: "cust-001", recommended_action: "send_promotion",
    confidence_score: 87, explanation: "Active user with high engagement. Summer promo likely to convert.",
    status: "accepted", funnel_stage: "active", capability_stage: "intermediate", experience_stage: "satisfied",
    recent_sentiment: "positive", sends_last_7d: 1, complaints_last_30d: 0,
    current_channel: "line", recommended_channel: "line", recommended_delay_hours: 0,
    reasoning_factors: { engagement_score: 0.92, purchase_history: "frequent", season_fit: "high" },
    review_notes: "Auto-accepted (low risk, high confidence)", reviewed_at: daysAgo(1),
    expires_at: daysAgo(-6), engine_version: "v1.0", created_at: daysAgo(2),
    customer_profiles: { id: "cust-001", full_name: "Somchai Wongsakul", primary_email: "somchai@example.com" },
  },
  {
    id: "nba-002", customer_profile_id: "cust-004", recommended_action: "suppress_annoyance",
    confidence_score: 92, explanation: "Churned customer showing frustration signals. High risk of complaint if contacted.",
    status: "pending", funnel_stage: "churned", capability_stage: "advanced", experience_stage: "frustrated",
    recent_sentiment: "negative", sends_last_7d: 0, complaints_last_30d: 2,
    current_channel: "line", recommended_channel: null, recommended_delay_hours: null,
    reasoning_factors: { complaint_count: 2, sentiment_trend: "declining", churn_risk: "confirmed" },
    review_notes: null, reviewed_at: null,
    expires_at: daysAgo(-3), engine_version: "v1.0", created_at: daysAgo(1),
    customer_profiles: { id: "cust-004", full_name: "Pimchanok Rattanawong", primary_email: "pimchanok@example.com" },
  },
  {
    id: "nba-003", customer_profile_id: "cust-003", recommended_action: "send_educational",
    confidence_score: 75, explanation: "Trial user with low capability. Educational content may increase activation.",
    status: "pending", funnel_stage: "trial", capability_stage: "beginner", experience_stage: "neutral",
    recent_sentiment: "neutral", sends_last_7d: 0, complaints_last_30d: 0,
    current_channel: "whatsapp", recommended_channel: "whatsapp", recommended_delay_hours: 24,
    reasoning_factors: { activation_score: 0.3, days_since_signup: 45, feature_usage: "low" },
    review_notes: null, reviewed_at: null,
    expires_at: daysAgo(-5), engine_version: "v1.0", created_at: daysAgo(1),
    customer_profiles: { id: "cust-003", full_name: "James Chen", primary_email: "james.chen@example.com" },
  },
  {
    id: "nba-004", customer_profile_id: "cust-005", recommended_action: "move_to_upsell",
    confidence_score: 82, explanation: "Active advanced user nearing data cap. Strong upsell candidate.",
    status: "pending", funnel_stage: "active", capability_stage: "advanced", experience_stage: "satisfied",
    recent_sentiment: "positive", sends_last_7d: 1, complaints_last_30d: 0,
    current_channel: "line", recommended_channel: "line", recommended_delay_hours: 0,
    reasoning_factors: { data_usage_pct: 85, plan_tier: "standard", upgrade_propensity: 0.78 },
    review_notes: null, reviewed_at: null,
    expires_at: daysAgo(-4), engine_version: "v1.0", created_at: daysAgo(1),
    customer_profiles: { id: "cust-005", full_name: "Akira Tanaka", primary_email: "akira.t@example.com" },
  },
  {
    id: "nba-005", customer_profile_id: "cust-008", recommended_action: "send_recovery",
    confidence_score: 68, explanation: "Dormant user hasn't engaged in 60+ days. Recovery message may re-activate.",
    status: "rejected", funnel_stage: "dormant", capability_stage: "intermediate", experience_stage: "neutral",
    recent_sentiment: "neutral", sends_last_7d: 0, complaints_last_30d: 0,
    current_channel: "line", recommended_channel: "email", recommended_delay_hours: 48,
    reasoning_factors: { days_inactive: 65, last_channel: "line", email_available: true },
    review_notes: "Customer already opted out of sales — respect consent", reviewed_at: daysAgo(1),
    expires_at: daysAgo(-2), engine_version: "v1.0", created_at: daysAgo(2),
    customer_profiles: { id: "cust-008", full_name: "Kanokwan Panyarat", primary_email: "kanokwan@example.com" },
  },
  {
    id: "nba-006", customer_profile_id: "cust-002", recommended_action: "wait",
    confidence_score: 71, explanation: "Lead user recently received promo. Wait before next contact to avoid fatigue.",
    status: "accepted", funnel_stage: "lead", capability_stage: "beginner", experience_stage: "neutral",
    recent_sentiment: "neutral", sends_last_7d: 2, complaints_last_30d: 0,
    current_channel: "email", recommended_channel: null, recommended_delay_hours: 72,
    reasoning_factors: { recent_sends: 2, fatigue_score: 0.6, optimal_wait: "3 days" },
    review_notes: null, reviewed_at: daysAgo(1),
    expires_at: daysAgo(-1), engine_version: "v1.0", created_at: daysAgo(2),
    customer_profiles: { id: "cust-002", full_name: "Nattaporn Srisuk", primary_email: "nattaporn@example.com" },
  },
];

// ─── Autonomy Rules ────────────────────────────────────────
export const SAMPLE_AUTONOMY_RULES = [
  {
    id: "rule-001", rule_name: "Low-risk wording tests", risk_level: "low_risk",
    description: "Allow automated A/B tests on message wording for small audiences (<5% rollout)",
    is_active: true, auto_test_allowed: true, controlled_rollout_allowed: true, manual_approval_required: false,
    max_rollout_pct: 5, min_sample_size: 100, cooldown_hours: 24,
    rollback_thresholds: { opt_out_rate: 3, complaint_rate: 1, ticket_rate: 2 },
  },
  {
    id: "rule-002", rule_name: "Medium-risk timing changes", risk_level: "medium_risk",
    description: "Journey timing and channel changes for specific segments. Requires supervisor approval or controlled rollout with monitoring.",
    is_active: true, auto_test_allowed: false, controlled_rollout_allowed: true, manual_approval_required: true,
    max_rollout_pct: 20, min_sample_size: 200, cooldown_hours: 48,
    rollback_thresholds: { opt_out_rate: 2, complaint_rate: 0.5, ticket_rate: 1.5, conversion_rate: -5 },
  },
  {
    id: "rule-003", rule_name: "High-risk audience expansion", risk_level: "high_risk",
    description: "Broad audience changes, frequency increases, or recovery strategy alterations. Always requires manual approval.",
    is_active: true, auto_test_allowed: false, controlled_rollout_allowed: false, manual_approval_required: true,
    max_rollout_pct: 100, min_sample_size: 500, cooldown_hours: 72,
    rollback_thresholds: { opt_out_rate: 1.5, complaint_rate: 0.3, ticket_rate: 1, conversion_rate: -10 },
  },
];

// ─── Autonomy Requests ─────────────────────────────────────
export const SAMPLE_AUTONOMY_REQUESTS = [
  {
    id: "areq-001", title: "Test soft CTA vs strong CTA", description: "A/B test message CTA style for summer promo campaign",
    risk_level: "low_risk", status: "auto_testing", change_category: "message_wording",
    rollout_pct: 5, monitoring_window_days: 3, created_by_type: "ai",
    change_payload: { prior_state: { cta_style: "strong" }, proposed_state: { cta_style: "soft" } },
    baseline_metrics: { sample_size: 120, delivery_rate: 95.2, conversion_rate: 4.1, opt_out_rate: 0.8, complaint_rate: 0, ticket_rate: 0.3 },
    current_metrics: { sample_size: 85, delivery_rate: 94.8, conversion_rate: 5.3, opt_out_rate: 0.5, complaint_rate: 0, ticket_rate: 0.2 },
    created_at: daysAgo(2), approved_by: null, approved_at: null,
    rejected_by: null, rejected_at: null, rejection_reason: null,
    rolled_back_at: null, rolled_back_by_type: null, rolled_back_by_user_id: null, rollback_triggered_by: null, rollback_evidence: null,
  },
  {
    id: "areq-002", title: "Shift win-back send time to morning", description: "Change win-back campaign send time from 14:00 to 10:00 based on engagement analysis",
    risk_level: "medium_risk", status: "pending", change_category: "send_timing",
    rollout_pct: 15, monitoring_window_days: 7, created_by_type: "ai",
    change_payload: { prior_state: { send_hour: 14 }, proposed_state: { send_hour: 10 } },
    baseline_metrics: { sample_size: 200, delivery_rate: 92.0, conversion_rate: 2.8, opt_out_rate: 1.2, complaint_rate: 0.3, ticket_rate: 0.5 },
    current_metrics: null,
    created_at: daysAgo(1), approved_by: null, approved_at: null,
    rejected_by: null, rejected_at: null, rejection_reason: null,
    rolled_back_at: null, rolled_back_by_type: null, rolled_back_by_user_id: null, rollback_triggered_by: null, rollback_evidence: null,
  },
  {
    id: "areq-003", title: "Expand promo audience to all leads", description: "Broaden summer promo from trial-only to all lead+trial customers",
    risk_level: "high_risk", status: "rejected", change_category: "audience_expansion",
    rollout_pct: 100, monitoring_window_days: 14, created_by_type: "ai",
    change_payload: { prior_state: { audience: "trial_only" }, proposed_state: { audience: "lead_and_trial" } },
    baseline_metrics: null, current_metrics: null,
    created_at: daysAgo(3), approved_by: null, approved_at: null,
    rejected_by: "admin-001", rejected_at: daysAgo(2), rejection_reason: "Too aggressive — wait for trial results first",
    rolled_back_at: null, rolled_back_by_type: null, rolled_back_by_user_id: null, rollback_triggered_by: null, rollback_evidence: null,
  },
  {
    id: "areq-004", title: "Increase send frequency for active users", description: "Change from 1x/week to 2x/week for active segment",
    risk_level: "medium_risk", status: "rolled_back", change_category: "frequency_change",
    rollout_pct: 10, monitoring_window_days: 7, created_by_type: "ai",
    change_payload: { prior_state: { frequency: "1x_week" }, proposed_state: { frequency: "2x_week" } },
    baseline_metrics: { sample_size: 300, delivery_rate: 96.0, conversion_rate: 3.5, opt_out_rate: 0.5, complaint_rate: 0.1, ticket_rate: 0.2 },
    current_metrics: { sample_size: 250, delivery_rate: 95.0, conversion_rate: 3.2, opt_out_rate: 2.8, complaint_rate: 0.8, ticket_rate: 1.5 },
    created_at: daysAgo(10), approved_by: "admin-001", approved_at: daysAgo(9),
    rejected_by: null, rejected_at: null, rejection_reason: null,
    rolled_back_at: daysAgo(7), rolled_back_by_type: "system", rolled_back_by_user_id: null,
    rollback_triggered_by: "auto_threshold", rollback_evidence: { triggers: ["opt_out_rate exceeded 2% threshold (2.8%)", "complaint_rate exceeded 0.5% threshold (0.8%)"] },
  },
];

// ─── Autonomy Audit Log ────────────────────────────────────
export const SAMPLE_AUTONOMY_AUDIT = [
  { id: "audit-001", request_id: "areq-001", action: "created", actor_type: "ai", actor_user_id: null, details: { change_category: "message_wording" }, created_at: daysAgo(2) },
  { id: "audit-002", request_id: "areq-001", action: "auto_test_started", actor_type: "system", actor_user_id: null, details: { rollout_pct: 5 }, created_at: daysAgo(2) },
  { id: "audit-003", request_id: "areq-003", action: "created", actor_type: "ai", actor_user_id: null, details: { change_category: "audience_expansion" }, created_at: daysAgo(3) },
  { id: "audit-004", request_id: "areq-003", action: "rejected", actor_type: "user", actor_user_id: "admin-001", details: { reason: "Too aggressive" }, created_at: daysAgo(2) },
  { id: "audit-005", request_id: "areq-004", action: "approved", actor_type: "user", actor_user_id: "admin-001", details: {}, created_at: daysAgo(9) },
  { id: "audit-006", request_id: "areq-004", action: "rollback_executed", actor_type: "system", actor_user_id: null, details: { reason: "Auto threshold breach", triggers: ["opt_out_rate", "complaint_rate"] }, created_at: daysAgo(7) },
];

// ─── Experiments ───────────────────────────────────────────
export const SAMPLE_EXPERIMENTS = [
  {
    id: "exp-001", experiment_name: "Summer Promo CTA Style", experiment_type: "ab",
    description: "Testing soft vs strong CTA for summer promo LINE messages",
    status: "active", channel_type: "line", success_metric: "conversion_rate",
    min_improvement_pct: "5", min_sends_per_variant: 100, rollout_percentage: 50,
    stop_loss_threshold: "3", stop_loss_metric: "opt_out_rate",
    winner_variant_id: null, created_at: daysAgo(5),
  },
  {
    id: "exp-002", experiment_name: "Win-Back Tone Test", experiment_type: "multivariate",
    description: "Comparing empathetic vs urgent vs casual tone for win-back emails",
    status: "completed", channel_type: "email", success_metric: "reply_rate",
    min_improvement_pct: "10", min_sends_per_variant: 50, rollout_percentage: 100,
    stop_loss_threshold: "5", stop_loss_metric: "opt_out_rate",
    winner_variant_id: "var-emp-001", created_at: daysAgo(30),
  },
];

export const SAMPLE_EXPERIMENT_RESULTS = [
  { id: "er-001", experiment_id: "exp-001", variant_id: "var-soft-001", sends_count: 85, delivery_rate: "94.8", reply_rate: "8.2", click_rate: "12.5", conversion_rate: "5.3", opt_out_rate: "0.5" },
  { id: "er-002", experiment_id: "exp-001", variant_id: "var-strong-001", sends_count: 90, delivery_rate: "95.1", reply_rate: "6.1", click_rate: "15.8", conversion_rate: "4.1", opt_out_rate: "1.2" },
  { id: "er-003", experiment_id: "exp-002", variant_id: "var-emp-001", sends_count: 55, delivery_rate: "92.0", reply_rate: "18.5", click_rate: "5.2", conversion_rate: "3.8", opt_out_rate: "0.8" },
  { id: "er-004", experiment_id: "exp-002", variant_id: "var-urg-001", sends_count: 52, delivery_rate: "91.5", reply_rate: "9.2", click_rate: "7.8", conversion_rate: "2.1", opt_out_rate: "4.2" },
  { id: "er-005", experiment_id: "exp-002", variant_id: "var-cas-001", sends_count: 48, delivery_rate: "93.0", reply_rate: "14.1", click_rate: "6.0", conversion_rate: "3.2", opt_out_rate: "1.5" },
];

export const SAMPLE_EXPERIMENT_VARIANTS_MAP = [
  { id: "ev-001", experiment_id: "exp-001", variant_id: "var-soft-001", role: "candidate", outbound_message_variants: { variant_label: "Soft CTA", style: "soft_cta", language: "th", channel_type: "line" } },
  { id: "ev-002", experiment_id: "exp-001", variant_id: "var-strong-001", role: "control", outbound_message_variants: { variant_label: "Strong CTA", style: "strong_cta", language: "th", channel_type: "line" } },
  { id: "ev-003", experiment_id: "exp-002", variant_id: "var-emp-001", role: "candidate", outbound_message_variants: { variant_label: "Empathetic", style: "soft_cta", language: "en", channel_type: "email" } },
  { id: "ev-004", experiment_id: "exp-002", variant_id: "var-urg-001", role: "control", outbound_message_variants: { variant_label: "Urgent", style: "strong_cta", language: "en", channel_type: "email" } },
  { id: "ev-005", experiment_id: "exp-002", variant_id: "var-cas-001", role: "candidate", outbound_message_variants: { variant_label: "Casual", style: "medium", language: "en", channel_type: "email" } },
];

export const SAMPLE_MESSAGE_VARIANTS = [
  { id: "var-soft-001", template_id: "tpl-001", variant_key: "soft_th", variant_label: "Soft CTA", style: "soft_cta", language: "th", channel_type: "line", cta_type: "reply", is_active: true, created_at: daysAgo(5), outbound_message_templates: { template_name: "Summer Promo - LINE TH" } },
  { id: "var-strong-001", template_id: "tpl-001", variant_key: "strong_th", variant_label: "Strong CTA", style: "strong_cta", language: "th", channel_type: "line", cta_type: "button", is_active: true, created_at: daysAgo(5), outbound_message_templates: { template_name: "Summer Promo - LINE TH" } },
  { id: "var-emp-001", template_id: "tpl-003", variant_key: "empathetic_en", variant_label: "Empathetic", style: "soft_cta", language: "en", channel_type: "email", cta_type: "link", is_active: true, created_at: daysAgo(30), outbound_message_templates: { template_name: "Win-Back - LINE TH" } },
  { id: "var-urg-001", template_id: "tpl-003", variant_key: "urgent_en", variant_label: "Urgent", style: "strong_cta", language: "en", channel_type: "email", cta_type: "button", is_active: false, created_at: daysAgo(30), outbound_message_templates: { template_name: "Win-Back - LINE TH" } },
  { id: "var-cas-001", template_id: "tpl-003", variant_key: "casual_en", variant_label: "Casual", style: "medium", language: "en", channel_type: "email", cta_type: "reply", is_active: true, created_at: daysAgo(30), outbound_message_templates: { template_name: "Win-Back - LINE TH" } },
];
