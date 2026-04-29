// Sample data for all non-outbound Contact Center modules
// Used when PartnerDataMode is set to 'sample'

const now = new Date();
const ago = (hours: number) => new Date(now.getTime() - hours * 3600000).toISOString();
const daysAgo = (days: number) => new Date(now.getTime() - days * 86400000).toISOString();
const dateStr = (days: number) => new Date(now.getTime() - days * 86400000).toISOString().split('T')[0];

// ==================== OPERATIONS ====================

export const SAMPLE_DASHBOARD_STATS = {
  open: 14,
  pending: 7,
  resolved: 243,
  urgent: 3,
  channels: { web: 8, email: 4, line: 38, facebook: 12, whatsapp: 6, instagram: 2, voice: 1 },
  onlineAgents: 4,
  busyAgents: 2,
  totalAgents: 8,
};

export const SAMPLE_RECENT_CONVERSATIONS = [
  { id: 's-conv-1', subject: 'eSIM activation not working', status: 'open', channel: 'line', priority: 'high', updated_at: ago(0.5), contact: { name: 'สมชาย วงศ์สวัสดิ์', email: 'somchai@example.com', facebook_display_name: null, facebook_picture_url: null, facebook_id: null } },
  { id: 's-conv-2', subject: 'Refund request for unused plan', status: 'pending', channel: 'facebook', priority: 'medium', updated_at: ago(1.2), contact: { name: 'Sarah Chen', email: 'sarah.c@example.com', facebook_display_name: 'Sarah Chen', facebook_picture_url: null, facebook_id: 'fb-123' } },
  { id: 's-conv-3', subject: 'QR code not received', status: 'open', channel: 'line', priority: 'urgent', updated_at: ago(0.2), contact: { name: 'พิมพ์ใจ สุขสันต์', email: null, facebook_display_name: null, facebook_picture_url: null, facebook_id: null } },
  { id: 's-conv-4', subject: 'Package recommendation for Japan trip', status: 'open', channel: 'web', priority: 'low', updated_at: ago(2.5), contact: { name: 'Tanaka Yuki', email: 'tanaka@example.com', facebook_display_name: null, facebook_picture_url: null, facebook_id: null } },
  { id: 's-conv-5', subject: 'Cannot connect after landing', status: 'resolved', channel: 'whatsapp', priority: 'high', updated_at: ago(4), contact: { name: 'อนุชา เจริญรุ่ง', email: null, facebook_display_name: null, facebook_picture_url: null, facebook_id: null } },
];

export const SAMPLE_CONVERSATIONS = [
  { id: 's-conv-1', subject: 'eSIM activation not working', status: 'open', channel: 'line', priority: 'high', assigned_to: 's-agent-1', updated_at: ago(0.5), created_at: ago(2), metadata: { issue_category: 'activation' }, ticket_id: 'TK-1001', contact: { name: 'สมชาย วงศ์สวัสดิ์', email: 'somchai@example.com', phone: null, whatsapp_phone: null, facebook_display_name: null, facebook_picture_url: null, facebook_id: null, line_display_name: 'สมชาย', line_picture_url: null, session_token: null, user_id: 'u-1' } },
  { id: 's-conv-2', subject: 'Refund request for unused plan', status: 'pending', channel: 'facebook', priority: 'medium', assigned_to: 's-agent-2', updated_at: ago(1.2), created_at: ago(5), metadata: { issue_category: 'refund' }, ticket_id: 'TK-1002', contact: { name: 'Sarah Chen', email: 'sarah.c@example.com', phone: null, whatsapp_phone: null, facebook_display_name: 'Sarah Chen', facebook_picture_url: null, facebook_id: 'fb-123', line_display_name: null, line_picture_url: null, session_token: null, user_id: 'u-2' } },
  { id: 's-conv-3', subject: 'QR code not received', status: 'open', channel: 'line', priority: 'urgent', assigned_to: null, updated_at: ago(0.2), created_at: ago(0.5), metadata: { issue_category: 'provisioning' }, ticket_id: 'TK-1003', contact: { name: 'พิมพ์ใจ สุขสันต์', email: null, phone: '0891234567', whatsapp_phone: null, facebook_display_name: null, facebook_picture_url: null, facebook_id: null, line_display_name: 'พิมพ์ใจ', line_picture_url: null, session_token: null, user_id: null } },
  { id: 's-conv-4', subject: 'Package recommendation for Japan trip', status: 'open', channel: 'web', priority: 'low', assigned_to: null, updated_at: ago(2.5), created_at: ago(3), metadata: { issue_category: 'general' }, ticket_id: 'TK-1004', contact: { name: 'Tanaka Yuki', email: 'tanaka@example.com', phone: null, whatsapp_phone: null, facebook_display_name: null, facebook_picture_url: null, facebook_id: null, line_display_name: null, line_picture_url: null, session_token: null, user_id: 'u-4' } },
  { id: 's-conv-5', subject: 'Cannot connect after landing', status: 'resolved', channel: 'whatsapp', priority: 'high', assigned_to: 's-agent-1', updated_at: ago(4), created_at: ago(12), metadata: { issue_category: 'connectivity' }, ticket_id: 'TK-1005', contact: { name: 'อนุชา เจริญรุ่ง', email: null, phone: null, whatsapp_phone: '+66891234567', facebook_display_name: null, facebook_picture_url: null, facebook_id: null, line_display_name: null, line_picture_url: null, session_token: null, user_id: null } },
  { id: 's-conv-6', subject: 'Top-up data question', status: 'open', channel: 'line', priority: 'medium', assigned_to: 's-agent-3', updated_at: ago(1), created_at: ago(1.5), metadata: { issue_category: 'top-up' }, ticket_id: 'TK-1006', contact: { name: 'วิภา รัตนากร', email: 'wipa@example.com', phone: null, whatsapp_phone: null, facebook_display_name: null, facebook_picture_url: null, facebook_id: null, line_display_name: 'วิภา', line_picture_url: null, session_token: null, user_id: 'u-6' } },
  { id: 's-conv-7', subject: 'Billing discrepancy on last order', status: 'pending', channel: 'email', priority: 'high', assigned_to: 's-agent-2', updated_at: ago(6), created_at: ago(24), metadata: { issue_category: 'billing' }, ticket_id: 'TK-1007', contact: { name: 'Park Jimin', email: 'jimin.park@example.com', phone: null, whatsapp_phone: null, facebook_display_name: null, facebook_picture_url: null, facebook_id: null, line_display_name: null, line_picture_url: null, session_token: null, user_id: 'u-7' } },
  { id: 's-conv-8', subject: 'Promo code not applying at checkout', status: 'open', channel: 'web', priority: 'medium', assigned_to: null, updated_at: ago(0.8), created_at: ago(1), metadata: { issue_category: 'promo' }, ticket_id: 'TK-1008', contact: { name: 'Maria Santos', email: 'maria.s@example.com', phone: null, whatsapp_phone: null, facebook_display_name: null, facebook_picture_url: null, facebook_id: null, line_display_name: null, line_picture_url: null, session_token: null, user_id: 'u-8' } },
  { id: 's-conv-9', subject: 'Device compatibility question', status: 'resolved', channel: 'line', priority: 'low', assigned_to: 's-agent-4', updated_at: ago(8), created_at: ago(10), metadata: { issue_category: 'compatibility' }, ticket_id: 'TK-1009', contact: { name: 'ณัฐพล สิริวัฒน์', email: null, phone: null, whatsapp_phone: null, facebook_display_name: null, facebook_picture_url: null, facebook_id: null, line_display_name: 'ณัฐพล', line_picture_url: null, session_token: null, user_id: null } },
  { id: 's-conv-10', subject: 'Account login issues', status: 'open', channel: 'facebook', priority: 'medium', assigned_to: 's-agent-3', updated_at: ago(3), created_at: ago(4), metadata: { issue_category: 'account' }, ticket_id: 'TK-1010', contact: { name: 'Alex Kim', email: 'alex.k@example.com', phone: null, whatsapp_phone: null, facebook_display_name: 'Alex Kim', facebook_picture_url: null, facebook_id: 'fb-456', line_display_name: null, line_picture_url: null, session_token: null, user_id: 'u-10' } },
];

export const SAMPLE_AGENTS = [
  { id: 'sa-1', user_id: 's-agent-1', status: 'online', active_conversations: 3, max_conversations: 8, last_activity_at: ago(0.1), profile: { user_id: 's-agent-1', email: 'natthapong@mobile11.com', first_name: 'ณัฐพงษ์', last_name: 'ศรีสุข' }, todayMetrics: { conversations_handled: 12, conversations_resolved: 9 } },
  { id: 'sa-2', user_id: 's-agent-2', status: 'online', active_conversations: 5, max_conversations: 8, last_activity_at: ago(0.05), profile: { user_id: 's-agent-2', email: 'jessica.w@mobile11.com', first_name: 'Jessica', last_name: 'Wong' }, todayMetrics: { conversations_handled: 15, conversations_resolved: 11 } },
  { id: 'sa-3', user_id: 's-agent-3', status: 'busy', active_conversations: 8, max_conversations: 8, last_activity_at: ago(0.02), profile: { user_id: 's-agent-3', email: 'praewphan@mobile11.com', first_name: 'แพรวพรรณ', last_name: 'จินดา' }, todayMetrics: { conversations_handled: 18, conversations_resolved: 14 } },
  { id: 'sa-4', user_id: 's-agent-4', status: 'online', active_conversations: 2, max_conversations: 8, last_activity_at: ago(0.3), profile: { user_id: 's-agent-4', email: 'ken.t@mobile11.com', first_name: 'Ken', last_name: 'Tanaka' }, todayMetrics: { conversations_handled: 8, conversations_resolved: 7 } },
  { id: 'sa-5', user_id: 's-agent-5', status: 'offline', active_conversations: 0, max_conversations: 8, last_activity_at: ago(10), profile: { user_id: 's-agent-5', email: 'siriwan@mobile11.com', first_name: 'ศิริวรรณ', last_name: 'ภูมิใจ' }, todayMetrics: null },
];

export const SAMPLE_ESCALATIONS = [
  { id: 's-conv-3', subject: 'QR code not received', status: 'open', channel: 'line', priority: 'urgent', assigned_to: null, updated_at: ago(0.2), contact: { name: 'พิมพ์ใจ สุขสันต์', facebook_display_name: null, line_display_name: 'พิมพ์ใจ', email: null, whatsapp_phone: null } },
  { id: 's-conv-1', subject: 'eSIM activation not working', status: 'open', channel: 'line', priority: 'high', assigned_to: 's-agent-1', updated_at: ago(0.5), contact: { name: 'สมชาย วงศ์สวัสดิ์', facebook_display_name: null, line_display_name: 'สมชาย', email: 'somchai@example.com', whatsapp_phone: null } },
  { id: 's-conv-5', subject: 'Cannot connect after landing', status: 'open', channel: 'whatsapp', priority: 'high', assigned_to: 's-agent-1', updated_at: ago(4), contact: { name: 'อนุชา เจริญรุ่ง', facebook_display_name: null, line_display_name: null, email: null, whatsapp_phone: '+66891234567' } },
  { id: 's-conv-7', subject: 'Billing discrepancy on last order', status: 'pending', channel: 'email', priority: 'high', assigned_to: 's-agent-2', updated_at: ago(6), contact: { name: 'Park Jimin', facebook_display_name: null, line_display_name: null, email: 'jimin.park@example.com', whatsapp_phone: null } },
];

export const SAMPLE_PENDING_ACTIONS = [
  { id: 'spa-1', action_type: 'create_refund_request', action_summary: 'Refund ฿299 for unused Japan 5-day plan', action_status: 'pending', approval_status: 'pending_approval', created_at: ago(1) },
  { id: 'spa-2', action_type: 'resend_qr_code', action_summary: 'Re-send QR for order ORD-4521', action_status: 'pending', approval_status: 'pending_approval', created_at: ago(0.3) },
];

// ==================== QUALITY ====================

export const SAMPLE_RATINGS = Array.from({ length: 20 }, (_, i) => ({
  id: `sr-${i}`,
  rating: [5, 4, 5, 3, 4, 5, 2, 4, 5, 1, 4, 5, 3, 5, 4, 5, 4, 2, 5, 3][i],
  feedback_text: [
    'ตอบเร็วมาก ขอบคุณค่ะ', 'Good help with activation', null, 'Took too long to resolve', 'Great service!',
    'ชอบมากเลย', 'Bot kept asking same question', 'Helpful agent', 'สุดยอดเลย', 'Never solved my issue',
    null, 'Quick and accurate', 'Decent but slow', 'Perfect!', 'ดีมาก',
    'Very professional', null, 'Confusing answers', 'เยี่ยมมาก', 'Average experience',
  ][i] || null,
  channel: ['line', 'web', 'line', 'facebook', 'line', 'whatsapp', 'line', 'email', 'line', 'facebook', 'line', 'web', 'line', 'whatsapp', 'line', 'line', 'email', 'line', 'line', 'web'][i],
  language: ['th', 'en', 'th', 'en', 'en', 'th', 'th', 'en', 'th', 'en', 'th', 'en', 'th', 'en', 'th', 'th', 'en', 'th', 'th', 'en'][i],
  conversation_id: `s-conv-${(i % 10) + 1}`,
  conversation: { id: `s-conv-${(i % 10) + 1}`, channel: ['line', 'web', 'line', 'facebook', 'line', 'whatsapp', 'line', 'email', 'line', 'facebook'][i % 10], subject: ['eSIM activation', 'Refund request', 'QR code issue', 'Package recommendation', 'Connection problem', 'Top-up question', 'Billing issue', 'Promo code', 'Compatibility', 'Account login'][i % 10], status: 'resolved', contact_id: null },
  created_at: ago(i * 4 + 1),
}));

export const SAMPLE_AI_SCORES = Array.from({ length: 12 }, (_, i) => ({
  id: `sas-${i}`,
  conversation_id: `s-conv-${(i % 10) + 1}`,
  composite_score: [82, 91, 45, 73, 88, 67, 55, 94, 78, 39, 85, 71][i],
  predicted_customer_satisfaction_score: [78, 88, 35, 65, 85, 60, 42, 92, 74, 28, 82, 68][i],
  ai_accuracy_score: [85, 93, 40, 70, 90, 65, 50, 95, 80, 35, 88, 73][i],
  ai_empathy_score: [80, 88, 50, 75, 85, 70, 60, 92, 76, 42, 83, 69][i],
  channel: ['line', 'web', 'line', 'facebook', 'line', 'whatsapp', 'line', 'email', 'line', 'facebook', 'line', 'web'][i],
  language: ['th', 'en', 'th', 'en', 'th', 'en', 'th', 'en', 'th', 'en', 'th', 'en'][i],
  created_at: ago(i * 3),
}));

export const SAMPLE_DEAD_AIR_EVENTS = Array.from({ length: 10 }, (_, i) => ({
  id: `sda-${i}`,
  conversation_id: `s-conv-${(i % 10) + 1}`,
  bot_message: [
    'Could you please provide more details?',
    'Let me check that for you.',
    'I understand your concern.',
    'กรุณารอสักครู่นะคะ',
    'Is there anything else I can help with?',
    'Let me look into this.',
    'ขอตรวจสอบให้สักครู่ค่ะ',
    'I see, let me verify.',
    'Thank you for your patience.',
    'กำลังตรวจสอบให้ค่ะ',
  ][i],
  silence_duration_seconds: [45, 62, 38, 55, 41, 78, 35, 50, 43, 67][i],
  channel: ['line', 'web', 'line', 'facebook', 'line', 'whatsapp', 'line', 'email', 'line', 'line'][i],
  customer_returned: [true, false, true, true, false, true, true, false, true, true][i],
  created_at: ago(i * 6 + 2),
}));

export const SAMPLE_DAILY_REPORTS = Array.from({ length: 7 }, (_, i) => ({
  id: `sdr-${i}`,
  report_date: dateStr(i + 1),
  total_conversations_analyzed: [142, 158, 131, 167, 145, 152, 139][i],
  avg_composite_score: [74.2, 76.8, 72.1, 78.4, 75.0, 73.5, 77.1][i],
  avg_customer_rating: [4.1, 4.3, 3.9, 4.4, 4.2, 4.0, 4.3][i],
  total_failures: [12, 8, 15, 6, 10, 14, 7][i],
  total_dead_air_events: [8, 5, 11, 4, 7, 9, 3][i],
  executive_summary: `Daily performance summary for ${dateStr(i + 1)}. AI handled ${[142, 158, 131, 167, 145, 152, 139][i]} conversations with an average score of ${[74.2, 76.8, 72.1, 78.4, 75.0, 73.5, 77.1][i]}. ${[12, 8, 15, 6, 10, 14, 7][i]} failures detected across channels. Key focus areas: activation issues and language switching patterns.`,
  avg_score_by_channel: { line: [75, 78, 73, 80, 76, 74, 79][i], web: [72, 74, 70, 76, 73, 71, 75][i], facebook: [71, 73, 69, 75, 72, 70, 74][i] },
  avg_rating_by_channel: { line: [4.2, 4.4, 4.0, 4.5, 4.3, 4.1, 4.4][i], web: [4.0, 4.2, 3.8, 4.3, 4.1, 3.9, 4.2][i] },
  low_score_clusters: [{ name: 'Activation failures', score: 45, conversations: 18, impact: 8, root_cause: 'Missing carrier provisioning KB', action: 'Add carrier-specific activation guides' }],
  top_failure_patterns: [{ type: 'missing_knowledge', count: 5 }, { type: 'wrong_language', count: 3 }, { type: 'dead_air_trigger', count: 2 }],
  top_dead_air_patterns: [{ bot_text: 'Let me check that for you', occurrences: 4, avg_silence_seconds: 52, return_rate: 60 }],
  top_missing_knowledge: [{ cause: 'Carrier-specific APN settings', count: 6 }],
  top_weak_prompts: [{ cause: 'Refund eligibility check too verbose', count: 3 }],
  top_unresolved_intents: [{ cause: 'Multi-country plan comparison', count: 4 }],
  top_repeated_complaints: [{ cause: 'Slow QR delivery', count: 5 }],
  recommended_kb_improvements: [{ title: 'APN settings guide for iOS 18', type: 'new_article', priority: 9 }],
  recommended_prompt_experiments: [{ target: 'refund_prompt', occurrences: 8, suggestion: 'Shorten eligibility explanation' }],
  recommended_actions: [{ action_needed: 'Auto-resend QR after 5 min delay', occurrences: 12 }],
  highest_impact_opportunity: { cluster: 'Activation failures', score: 45, conversations: 18, impact: 8, action: 'Add carrier-specific activation guides' },
  biggest_score_decline: { previous_score: [76, 74, 75, 72, 78, 75, 73][i], current_score: [74, 77, 72, 78, 75, 74, 77][i], delta: [-2, 3, -3, 6, -3, -1, 4][i] },
  quick_wins: [{ cluster: 'QR delivery delay', score: 62, action: 'Add auto-resend logic', impact: 5 }],
  high_risk_issues: [{ cluster: 'Activation failures in Japan', score: 42, urgency: 8, root_cause: 'Missing Docomo APN settings' }],
  kb_candidates_generated: [3, 2, 4, 1, 3, 5, 2][i],
  prompt_candidates_generated: [1, 2, 1, 3, 1, 2, 1][i],
  winning_experiments: [],
  rollback_events: [],
  created_at: daysAgo(i + 1),
}));

// ==================== AI INTELLIGENCE ====================

export const SAMPLE_CONTROL_TOWER_HEALTH = {
  avgScore: 75.3,
  prevAvgScore: 72.1,
  avgRating: 4.18,
  prevAvgRating: 4.05,
  totalConvos: 1247,
  humanHandoffRate: 18.2,
  deadAirCount: 67,
  prevDeadAirCount: 82,
  actionsSuccess: 234,
  actionsFail: 12,
  resolvedConvos: 892,
  repeatContactRate: 8.4,
};

export const SAMPLE_CONTROL_TOWER_TRENDS = Array.from({ length: 14 }, (_, i) => ({
  date: dateStr(14 - i).slice(5),
  score: (72 + Math.sin(i * 0.5) * 4 + i * 0.3).toFixed(1),
  rating: (3.9 + Math.sin(i * 0.4) * 0.3 + i * 0.02).toFixed(2),
  failures: Math.max(2, Math.round(15 - i * 0.5 + Math.sin(i) * 3)),
  deadAir: Math.max(1, Math.round(10 - i * 0.3 + Math.cos(i) * 2)),
  convos: Math.round(130 + Math.sin(i * 0.7) * 20 + i * 2),
}));

export const SAMPLE_CONTROL_TOWER_LEARNING = {
  clusters: [
    { cluster_name: 'Activation troubleshooting', conversation_count: 145, average_ai_score: 62, impact_score: 8.5 },
    { cluster_name: 'Package recommendation', conversation_count: 198, average_ai_score: 81, impact_score: 6.2 },
    { cluster_name: 'Refund processing', conversation_count: 67, average_ai_score: 71, impact_score: 7.1 },
    { cluster_name: 'QR code delivery', conversation_count: 89, average_ai_score: 58, impact_score: 7.8 },
    { cluster_name: 'Multi-country plans', conversation_count: 54, average_ai_score: 69, impact_score: 5.4 },
  ],
  kbMissing: [
    { issue_summary: 'Missing APN settings for NTT Docomo', impact_level: 'high', status: 'pending' },
    { issue_summary: 'Korea eSIM activation steps outdated', impact_level: 'high', status: 'pending' },
    { issue_summary: 'Multi-device setup instructions needed', impact_level: 'medium', status: 'pending' },
  ],
  missingActions: [
    { action_name: 'auto_resend_qr', detected_intent: 'qr_not_received', impact_score: 8, occurrence_count: 34 },
    { action_name: 'auto_check_provisioning', detected_intent: 'activation_failed', impact_score: 7, occurrence_count: 28 },
  ],
  prompts: [
    { version_name: 'v3.2 Empathy Boost', prompt_type: 'global_system_prompt', is_active: true },
    { version_name: 'v2.1 Sales Thai', prompt_type: 'sales_prompt', is_active: true },
  ],
  experiments: [
    { experiment_name: 'Shorter refund explanation', status: 'running', rollout_percentage: 30, updated_at: ago(12) },
    { experiment_name: 'Proactive upsell in support', status: 'completed', rollout_percentage: 100, updated_at: daysAgo(3) },
  ],
  rollbacks: [],
};

export const SAMPLE_CONTROL_TOWER_QUEUE = {
  kb: [
    { id: 'skb-1', issue_summary: 'Missing APN settings for NTT Docomo', impact_level: 'high', created_at: daysAgo(2) },
    { id: 'skb-2', issue_summary: 'Korea eSIM activation steps outdated', impact_level: 'high', created_at: daysAgo(3) },
    { id: 'skb-3', issue_summary: 'Multi-device setup instructions', impact_level: 'medium', created_at: daysAgo(4) },
  ],
  experiments: [
    { id: 'sexp-1', experiment_name: 'Shorter refund explanation', rollout_percentage: 30, status: 'running' },
  ],
  actions: [
    { id: 'sma-1', action_name: 'auto_resend_qr', impact_score: 8, occurrence_count: 34 },
    { id: 'sma-2', action_name: 'auto_check_provisioning', impact_score: 7, occurrence_count: 28 },
  ],
  approvals: [
    { id: 'sap-1', domain: 'guardrail', action_type: 'risk_escalation', risk_level: 'high', created_at: ago(2) },
  ],
};

export const SAMPLE_CONTROL_TOWER_IMPACT = {
  totalConvos: 1247,
  aiResolved: 892,
  humanResolved: 234,
  actionsCompleted: 234,
  salesLeads: 45,
  refundRequests: 67,
  refundRejected: 8,
  containmentRate: 71.5,
  estimatedCostSaving: 15400,
};

export const SAMPLE_AI_FAILURES = Array.from({ length: 10 }, (_, i) => ({
  id: `saf-${i}`,
  failure_type: ['wrong_answer', 'missing_knowledge', 'dead_air_trigger', 'wrong_language', 'unclear_answer', 'hallucination', 'missing_kb', 'tone_inappropriate', 'loop_detected', 'incomplete_answer'][i],
  failure_subtype: [null, 'carrier_apn', null, 'th_to_en', null, null, 'refund_policy', null, null, null][i],
  severity: ['high', 'critical', 'medium', 'high', 'medium', 'critical', 'high', 'low', 'medium', 'medium'][i],
  conversation_id: `s-conv-${(i % 10) + 1}`,
  customer_last_message: [
    'ทำไม eSIM ไม่ทำงาน?', 'What are the APN settings for Docomo?', null, 'ฉันต้องการ refund',
    'How do I activate?', 'Is this plan available in Antarctica?', 'What is the refund policy?',
    'Your bot is rude', null, 'Can you help me with...',
  ][i] || null,
  bot_response_excerpt: [
    'Please try restarting your device', 'I apologize, I don\'t have that information',
    null, 'Sure, let me help you with a refund', 'To activate, please follow these steps...',
    'Yes, we offer plans for Antarctica', 'Our refund policy allows...', 'I understand your frustration',
    null, 'Of course! What do you need?',
  ][i] || null,
  root_cause_guess: ['outdated_kb', 'missing_kb', 'slow_processing', 'language_detection_error', 'vague_prompt', 'hallucination', 'incomplete_kb', 'tone_calibration', 'intent_loop', 'truncated_response'][i],
  suggested_fix_type: ['update_kb', 'add_kb', 'optimize_prompt', 'fix_language_detection', 'improve_prompt', 'add_guardrail', 'expand_kb', 'adjust_tone_prompt', 'add_loop_breaker', 'increase_token_limit'][i],
  conversations: { channel: ['line', 'web', 'line', 'facebook', 'line', 'whatsapp', 'line', 'email', 'line', 'facebook'][i], subject: 'Sample conversation', status: 'resolved' },
  scores: [{ composite_score: [45, 38, 55, 42, 60, 35, 48, 72, 58, 63][i] }],
  created_at: ago(i * 5 + 1),
}));

export const SAMPLE_INTENT_CLUSTERS = [
  { id: 'sic-1', intent_key: 'esim_activation', display_name: 'eSIM Activation Support', description: 'Customer needs help activating their eSIM', category: 'support', avg_score: 68.5, avg_rating: 3.8, containment_rate: 72, total_conversations: 245, is_active: true, ideal_behavior: { tone: 'Patient and technical', greeting: 'Let me help you with your eSIM activation', steps: ['Verify order details', 'Check device compatibility', 'Guide through activation steps'], must_do: ['Confirm device model', 'Check carrier support'], must_not_do: ['Assume device is compatible'] }, ideal_actions: [{ action_type: 'check_provisioning_status', when: 'When activation fails', required: true }], resolution_criteria: { must_resolve: ['eSIM activated successfully'], success_indicators: ['Customer confirms connection'], max_turns: 8 }, typical_failures: [{ failure_type: 'missing_knowledge', frequency: 'common', description: 'Missing carrier-specific APN settings' }], score_expectations: { min_accuracy: 80, min_empathy: 70 }, related_kb_categories: ['activation', 'troubleshooting'], related_action_types: ['check_provisioning', 'resend_qr'], matching_keywords: ['activate', 'activation', 'eSIM', 'install', 'QR code'] },
  { id: 'sic-2', intent_key: 'package_recommendation', display_name: 'Package Recommendation', description: 'Customer looking for the right data plan', category: 'sales', avg_score: 84.2, avg_rating: 4.5, containment_rate: 89, total_conversations: 312, is_active: true, ideal_behavior: { tone: 'Friendly and consultative', greeting: 'I\'d love to help you find the perfect plan!', steps: ['Ask about destination', 'Ask about duration', 'Ask about data needs', 'Recommend plans'], must_do: ['Ask about trip details'], must_not_do: ['Push expensive plans without context'] }, ideal_actions: [{ action_type: 'search_packages', when: 'After gathering trip details', required: true }], resolution_criteria: { must_resolve: ['Customer selects a plan or gets comparison'], success_indicators: ['Add to cart or bookmark'], max_turns: 6 }, typical_failures: [{ failure_type: 'incomplete_answer', frequency: 'occasional', description: 'Missing multi-country plan options' }], score_expectations: { min_accuracy: 85, min_empathy: 75 }, related_kb_categories: ['plans', 'pricing', 'coverage'], related_action_types: ['search_packages', 'create_sales_lead'], matching_keywords: ['plan', 'package', 'recommend', 'data', 'travel'] },
  { id: 'sic-3', intent_key: 'refund_request', display_name: 'Refund Request', description: 'Customer requesting a refund', category: 'support', avg_score: 71.3, avg_rating: 3.6, containment_rate: 65, total_conversations: 98, is_active: true, ideal_behavior: { tone: 'Empathetic and professional', greeting: 'I understand you\'d like to request a refund', steps: ['Verify order', 'Check eligibility', 'Process or explain'], must_do: ['Check refund policy', 'Verify order status'], must_not_do: ['Refuse without checking policy'] }, ideal_actions: [{ action_type: 'create_refund_request', when: 'When eligible', required: true }], resolution_criteria: { must_resolve: ['Refund processed or clear explanation given'], success_indicators: ['Customer acknowledges outcome'], max_turns: 5 }, typical_failures: [{ failure_type: 'policy_risk', frequency: 'occasional', description: 'Approving refunds outside policy' }], score_expectations: { min_accuracy: 90, min_empathy: 80 }, related_kb_categories: ['refunds', 'billing'], related_action_types: ['create_refund_request', 'check_order_status'], matching_keywords: ['refund', 'money back', 'return', 'cancel'] },
];

export const SAMPLE_INBOUND_JOURNEYS = [
  { id: 'sj-1', journey_key: 'package_recommendation', journey_name: 'Package Recommendation Flow', description: 'Guide customer to select the right eSIM plan', category: 'commerce', priority: 10, is_active: true, ideal_steps: [{ step: 1, description: 'Ask destination country', required: true }, { step: 2, description: 'Ask trip duration', required: true }, { step: 3, description: 'Ask data usage level', required: true }, { step: 4, description: 'Present matching plans', required: true }, { step: 5, description: 'Handle comparison requests', required: false }], action_opportunities: [{ action: 'search_packages', when: 'After trip details collected', required: true }, { action: 'create_sales_lead', when: 'If customer shows interest', required: false }], handoff_triggers: [{ trigger: 'Corporate/bulk order request', priority: 'medium' }], scoring_criteria: { min_accuracy: 85, min_empathy: 75, must_recommend_relevant: true }, success_outcomes: { primary: 'Customer adds plan to cart', secondary: 'Customer saves plan for later' }, optimization_targets: { containment_rate: 90, min_satisfaction: 4.5, max_turns: 6 }, fallback_rules: { max_fallback_turns: 2 } },
  { id: 'sj-2', journey_key: 'activation_not_working', journey_name: 'Activation Troubleshooting', description: 'Help customer resolve eSIM activation issues', category: 'support', priority: 9, is_active: true, ideal_steps: [{ step: 1, description: 'Verify order and device', required: true }, { step: 2, description: 'Check provisioning status', required: true }, { step: 3, description: 'Guide through activation steps', required: true }, { step: 4, description: 'Test connection', required: true }], action_opportunities: [{ action: 'check_provisioning_status', when: 'After order verified', required: true }, { action: 'resend_qr_code', when: 'If QR is corrupted', required: false }], handoff_triggers: [{ trigger: 'Carrier-side issue detected', priority: 'high' }, { trigger: 'Multiple failed attempts', priority: 'critical' }], scoring_criteria: { min_accuracy: 90, min_empathy: 80, must_verify_device: true }, success_outcomes: { primary: 'eSIM activated and connected', secondary: 'Ticket escalated with full context' }, optimization_targets: { containment_rate: 75, min_satisfaction: 4.0, max_turns: 8, max_resolution_seconds: 600 }, fallback_rules: { max_fallback_turns: 3, on_stuck: 'escalate_to_human' } },
];

export const SAMPLE_CLUSTERS = [
  { id: 'sc-1', cluster_name: 'Activation troubleshooting - Japan carriers', cluster_description: 'Customers having issues activating eSIMs on Japanese carriers (Docomo, Softbank, au)', language: 'mixed', conversation_count: 145, average_ai_score: 52, average_customer_rating: 3.2, dead_air_rate: 0.12, human_handoff_rate: 0.28, containment_rate: 0.72, repeat_contact_rate: 0.15, representative_questions: ['How do I set APN for Docomo?', 'eSIM ไม่ทำงานในญี่ปุ่น', 'Activation failed with error code'], common_bad_responses: ['Please try restarting your device (without checking APN)', 'I don\'t have specific carrier settings'], channel_distribution: { line: 85, web: 35, whatsapp: 25 }, language_distribution: { th: 90, en: 45, ja: 10 }, root_cause_hypothesis: 'Missing carrier-specific APN configuration in KB', recommended_action: 'Add detailed APN guides for each Japanese carrier', impact_score: 8.5, urgency_score: 9.2, status: 'active', admin_label: null, admin_notes: null, created_at: daysAgo(14), updated_at: daysAgo(1) },
  { id: 'sc-2', cluster_name: 'QR code delivery delays', cluster_description: 'Customers not receiving QR codes after purchase, causing activation delays', language: 'th', conversation_count: 89, average_ai_score: 58, average_customer_rating: 3.5, dead_air_rate: 0.08, human_handoff_rate: 0.22, containment_rate: 0.78, repeat_contact_rate: 0.2, representative_questions: ['ยังไม่ได้รับ QR code', 'QR code มาช้ามาก', 'Where is my QR code?'], common_bad_responses: ['Please check your spam folder', 'QR codes are sent within 24 hours'], channel_distribution: { line: 60, facebook: 20, email: 9 }, language_distribution: { th: 70, en: 19 }, root_cause_hypothesis: 'Email delivery delays and lack of auto-resend mechanism', recommended_action: 'Implement auto-resend QR after 5 min delay', impact_score: 7.8, urgency_score: 8.1, status: 'active', admin_label: null, admin_notes: null, created_at: daysAgo(10), updated_at: daysAgo(2) },
  { id: 'sc-3', cluster_name: 'Multi-country plan confusion', cluster_description: 'Customers confused about plans covering multiple countries', language: 'en', conversation_count: 54, average_ai_score: 69, average_customer_rating: 3.8, dead_air_rate: 0.05, human_handoff_rate: 0.15, containment_rate: 0.85, repeat_contact_rate: 0.08, representative_questions: ['Can I use one plan in Japan and Korea?', 'Is there a plan for Southeast Asia?', 'Which plan covers Europe?'], common_bad_responses: ['I recommend checking our website for multi-country plans'], channel_distribution: { web: 30, line: 15, facebook: 9 }, language_distribution: { en: 42, th: 12 }, root_cause_hypothesis: 'KB lacks clear multi-country plan comparison table', recommended_action: 'Create comparison table for regional plans', impact_score: 5.4, urgency_score: 4.8, status: 'active', admin_label: null, admin_notes: null, created_at: daysAgo(21), updated_at: daysAgo(5) },
  { id: 'sc-4', cluster_name: 'Refund eligibility confusion', cluster_description: 'Customers unclear about refund eligibility criteria', language: 'th', conversation_count: 67, average_ai_score: 71, average_customer_rating: 3.4, dead_air_rate: 0.03, human_handoff_rate: 0.35, containment_rate: 0.65, repeat_contact_rate: 0.12, representative_questions: ['ขอ refund ได้ไหม?', 'What is your refund policy?', 'ซื้อไปแล้ว 3 วัน ขอคืนเงินได้ไหม'], common_bad_responses: ['Our refund policy states...', 'Please contact support for refund'], channel_distribution: { line: 40, web: 18, email: 9 }, language_distribution: { th: 48, en: 19 }, root_cause_hypothesis: 'Refund prompt too verbose and unclear on time limits', recommended_action: 'Simplify refund eligibility check in prompt', impact_score: 7.1, urgency_score: 6.5, status: 'active', admin_label: null, admin_notes: null, created_at: daysAgo(18), updated_at: daysAgo(3) },
  { id: 'sc-5', cluster_name: 'Language switching mid-conversation', cluster_description: 'Bot struggles when customers switch between Thai and English mid-conversation', language: 'mixed', conversation_count: 42, average_ai_score: 55, average_customer_rating: 3.1, dead_air_rate: 0.18, human_handoff_rate: 0.25, containment_rate: 0.75, repeat_contact_rate: 0.1, representative_questions: ['ช่วยได้ไหม? I need help with my plan', 'สั่งซื้อแล้ว but QR not arrived'], common_bad_responses: ['I apologize but I can only help in English', 'ขออภัย ระบบกำลังประมวลผล'], channel_distribution: { line: 30, facebook: 8, web: 4 }, language_distribution: { mixed: 42 }, root_cause_hypothesis: 'Language detection model not handling code-switching well', recommended_action: 'Improve language detection for mixed Thai-English input', impact_score: 6.2, urgency_score: 7.0, status: 'active', admin_label: null, admin_notes: null, created_at: daysAgo(7), updated_at: daysAgo(1) },
];

// ==================== OPTIMIZATION ====================

export const SAMPLE_KB_CANDIDATES = [
  { id: 'skbc-1', issue_summary: 'Missing APN settings for NTT Docomo on iOS 18', issue_type: 'missing_content', status: 'pending', suggested_title: 'Docomo APN Settings for iOS 18', suggested_category: 'troubleshoot', suggested_language: 'en', proposed_kb_draft: '# Docomo APN Settings for iOS 18\n\n1. Go to Settings > Cellular\n2. Tap on your eSIM plan\n3. Tap Cellular Data Network\n4. Enter: APN: mopera.net\n\nFor Android devices, see our Android APN guide.', current_kb_excerpt: null, weakness_analysis: 'No carrier-specific APN settings exist in KB, causing activation failures for Japan travelers', missing_facts: ['Docomo APN: mopera.net', 'Softbank APN settings', 'au APN settings'], expected_impact: 'high', confidence_level: 0.92, impact_score: 8.5, priority: 9, related_failure_types: ['missing_knowledge', 'missing_kb'], conversation_examples: [], rejected_reason: null, created_at: daysAgo(2), related_cluster_id: 'sc-1', related_article_id: null, generated_by: 'ai_daily_report', approved_by: null },
  { id: 'skbc-2', issue_summary: 'Korea eSIM activation steps are outdated', issue_type: 'outdated_content', status: 'pending', suggested_title: 'Updated Korea eSIM Activation Guide', suggested_category: 'activation', suggested_language: 'en', proposed_kb_draft: '# Korea eSIM Activation\n\nUpdated steps for Korean carriers...', current_kb_excerpt: 'Old activation steps that reference deprecated settings...', weakness_analysis: 'Current KB references old carrier settings that were changed in Q4 2025', missing_facts: ['New KT activation flow', 'Updated SK Telecom settings'], expected_impact: 'high', confidence_level: 0.88, impact_score: 7.8, priority: 8, related_failure_types: ['wrong_answer'], conversation_examples: [], rejected_reason: null, created_at: daysAgo(3), related_cluster_id: null, related_article_id: 'art-123', generated_by: 'ai_daily_report', approved_by: null },
  { id: 'skbc-3', issue_summary: 'Multi-device setup instructions needed', issue_type: 'missing_content', status: 'approved', suggested_title: 'How to Use eSIM on Multiple Devices', suggested_category: 'how-to', suggested_language: 'en', proposed_kb_draft: '# Using eSIM on Multiple Devices\n\nYour eSIM can only be active on one device at a time...', current_kb_excerpt: null, weakness_analysis: 'Customers frequently ask about transferring eSIM between devices', missing_facts: ['Transfer process', 'Device limit policy'], expected_impact: 'medium', confidence_level: 0.85, impact_score: 5.4, priority: 6, related_failure_types: ['incomplete_answer'], conversation_examples: [], rejected_reason: null, created_at: daysAgo(5), related_cluster_id: null, related_article_id: null, generated_by: 'cluster_analysis', approved_by: 's-agent-2' },
  { id: 'skbc-4', issue_summary: 'Refund eligibility criteria needs clarification', issue_type: 'unclear_content', status: 'published', suggested_title: 'Refund Policy - Clear Eligibility Guide', suggested_category: 'billing', suggested_language: 'th', proposed_kb_draft: '# นโยบายการคืนเงิน\n\nคุณสามารถขอคืนเงินได้ภายใน 7 วัน...', current_kb_excerpt: 'Our refund policy allows refunds under certain conditions...', weakness_analysis: 'Current refund KB is too vague about time limits and conditions', missing_facts: ['7-day window', 'Unused data requirement', 'Processing time'], expected_impact: 'high', confidence_level: 0.95, impact_score: 7.1, priority: 8, related_failure_types: ['unclear_answer', 'policy_risk'], conversation_examples: [], rejected_reason: null, created_at: daysAgo(10), related_cluster_id: 'sc-4', related_article_id: 'art-456', generated_by: 'ai_daily_report', approved_by: 's-agent-1' },
];

export const SAMPLE_FAQ_CANDIDATES = [
  { id: 'sfaq-1', canonical_question: 'How do I activate my eSIM?', customer_phrasings: ['eSIM ติดตั้งยังไง?', 'How to activate?', 'วิธีเปิดใช้ eSIM', 'QR code scan แล้วทำไงต่อ?'], short_answer: 'Scan the QR code from your email, then go to Settings > Cellular > Add eSIM Plan. Follow the on-screen instructions.', long_answer: '# How to Activate Your eSIM\n\n## Step 1: Find Your QR Code\nCheck your email for the QR code...\n\n## Step 2: Scan the QR Code\n...', faq_title: 'How to Activate Your eSIM', intent_tag: 'esim_activation', language: 'en', category: 'activation', source_cluster_id: 'sc-1', source_failure_types: ['missing_knowledge'], conversation_count: 245, frequency_score: 0.85, confusion_score: 0.42, expected_support_reduction: 0.25, confidence: 0.91, priority: 9, status: 'published', publish_target: 'bot-core-knowledge', published_article_id: 'art-789', rejected_reason: null, pre_publish_low_rating_rate: 0.18, post_publish_low_rating_rate: 0.08, pre_publish_dead_air_rate: 0.12, post_publish_dead_air_rate: 0.05, published_at: daysAgo(14), analytics_measured_at: daysAgo(7), created_at: daysAgo(21) },
  { id: 'sfaq-2', canonical_question: 'What is the refund policy?', customer_phrasings: ['ขอคืนเงินได้ไหม?', 'Can I get a refund?', 'refund policy คืออะไร', 'How to get money back?'], short_answer: 'You can request a refund within 7 days of purchase if the data has not been used.', long_answer: null, faq_title: 'Refund Policy FAQ', intent_tag: 'refund_request', language: 'en', category: 'billing', source_cluster_id: 'sc-4', source_failure_types: ['unclear_answer'], conversation_count: 98, frequency_score: 0.72, confusion_score: 0.55, expected_support_reduction: 0.2, confidence: 0.88, priority: 8, status: 'pending', publish_target: null, published_article_id: null, rejected_reason: null, pre_publish_low_rating_rate: null, post_publish_low_rating_rate: null, pre_publish_dead_air_rate: null, post_publish_dead_air_rate: null, published_at: null, analytics_measured_at: null, created_at: daysAgo(5) },
  { id: 'sfaq-3', canonical_question: 'Which countries are supported?', customer_phrasings: ['eSIM ใช้ได้ประเทศไหนบ้าง?', 'Coverage countries?', 'Do you cover Japan?'], short_answer: 'We currently support 100+ countries including Japan, Korea, Thailand, and across Europe, Asia, and the Americas.', long_answer: null, faq_title: 'Supported Countries', intent_tag: 'coverage_inquiry', language: 'en', category: 'coverage', source_cluster_id: null, source_failure_types: [], conversation_count: 167, frequency_score: 0.78, confusion_score: 0.22, expected_support_reduction: 0.15, confidence: 0.94, priority: 7, status: 'approved', publish_target: null, published_article_id: null, rejected_reason: null, pre_publish_low_rating_rate: null, post_publish_low_rating_rate: null, pre_publish_dead_air_rate: null, post_publish_dead_air_rate: null, published_at: null, analytics_measured_at: null, created_at: daysAgo(8) },
];

export const SAMPLE_PROMPT_VERSIONS = [
  { id: 'spv-1', version_name: 'v3.2 Empathy Boost', prompt_type: 'global_system_prompt', description: 'Enhanced empathy and natural conversation flow', prompt_text: 'You are a friendly and empathetic customer support agent for Mobile11...', language: null, channel_scope: null, intent_scope: null, model_scope: null, is_active: true, created_by: 's-agent-1', created_at: daysAgo(5), updated_at: daysAgo(5) },
  { id: 'spv-2', version_name: 'v2.1 Sales Thai', prompt_type: 'sales_prompt', description: 'Thai-optimized sales conversation flow', prompt_text: 'คุณเป็นที่ปรึกษาด้านแพ็คเกจ eSIM ของ Mobile11...', language: 'th', channel_scope: ['line'], intent_scope: ['package_recommendation'], model_scope: null, is_active: true, created_by: 's-agent-2', created_at: daysAgo(12), updated_at: daysAgo(3) },
  { id: 'spv-3', version_name: 'v1.5 Refund Handler', prompt_type: 'refund_prompt', description: 'Streamlined refund processing with clear eligibility checks', prompt_text: 'When handling refund requests, follow these steps...', language: null, channel_scope: null, intent_scope: ['refund_request'], model_scope: null, is_active: true, created_by: 's-agent-1', created_at: daysAgo(20), updated_at: daysAgo(8) },
  { id: 'spv-4', version_name: 'v3.1 Previous Global', prompt_type: 'global_system_prompt', description: 'Previous version of global system prompt', prompt_text: 'You are a customer support agent...', language: null, channel_scope: null, intent_scope: null, model_scope: null, is_active: false, created_by: 's-agent-1', created_at: daysAgo(30), updated_at: daysAgo(5) },
];

export const SAMPLE_PROMPT_EXPERIMENTS = [
  { id: 'spe-1', experiment_name: 'Shorter refund explanation', prompt_type: 'refund_prompt', description: 'Test shorter refund eligibility explanation', status: 'running', rollout_percentage: 30, target_metric: 'avg_customer_rating', baseline_value: 3.6, current_value: 3.9, improvement_percentage: 8.3, min_conversations: 100, conversations_completed: 42, channel_scope: null, language_scope: null, variant_a_id: 'spv-3', variant_b_id: null, variant_b_text: 'When handling refund requests, briefly state: eligible within 7 days if data unused...', winner: null, created_at: daysAgo(7), updated_at: ago(12), auto_promoted: false },
  { id: 'spe-2', experiment_name: 'Proactive upsell in support', prompt_type: 'sales_prompt', description: 'Test suggesting relevant add-ons during support conversations', status: 'completed', rollout_percentage: 100, target_metric: 'avg_ai_score', baseline_value: 78, current_value: 82, improvement_percentage: 5.1, min_conversations: 200, conversations_completed: 215, channel_scope: ['line'], language_scope: ['th'], variant_a_id: 'spv-2', variant_b_id: null, variant_b_text: 'After resolving the support issue, suggest relevant add-on plans...', winner: 'variant_b', created_at: daysAgo(21), updated_at: daysAgo(3), auto_promoted: false },
  { id: 'spe-3', experiment_name: 'Thai greeting warmth', prompt_type: 'brand_tone_prompt', description: 'Test warmer Thai greeting style', status: 'draft', rollout_percentage: 0, target_metric: 'avg_customer_rating', baseline_value: null, current_value: null, improvement_percentage: null, min_conversations: 150, conversations_completed: 0, channel_scope: ['line'], language_scope: ['th'], variant_a_id: null, variant_b_id: null, variant_b_text: 'สวัสดีค่ะ ยินดีต้อนรับสู่ Mobile11! วันนี้มีอะไรให้ช่วยคะ?', winner: null, created_at: daysAgo(2), updated_at: daysAgo(2), auto_promoted: false },
];

// ==================== GOVERNANCE ====================

export const SAMPLE_ACTION_CATALOG = [
  { id: 'sac-1', action_type: 'check_provisioning_status', display_name: 'Check Provisioning Status', description: 'Check the provisioning status of an eSIM order', category: 'order_management', requires_approval: false, is_enabled: true, input_schema: {}, max_retries: 3, timeout_seconds: 30 },
  { id: 'sac-2', action_type: 'resend_qr_code', display_name: 'Resend QR Code', description: 'Re-send the eSIM QR code to customer', category: 'order_management', requires_approval: false, is_enabled: true, input_schema: {}, max_retries: 2, timeout_seconds: 15 },
  { id: 'sac-3', action_type: 'create_refund_request', display_name: 'Create Refund Request', description: 'Create a refund request for an order', category: 'billing', requires_approval: true, is_enabled: true, input_schema: {}, max_retries: 1, timeout_seconds: 60 },
  { id: 'sac-4', action_type: 'create_sales_lead', display_name: 'Create Sales Lead', description: 'Create a sales lead from a conversation', category: 'sales', requires_approval: false, is_enabled: true, input_schema: {}, max_retries: 2, timeout_seconds: 30 },
];

export const SAMPLE_ACTION_LOGS = [
  { id: 'sal-1', action_type: 'check_provisioning_status', action_payload: { order_id: 'ORD-4521' }, action_result: { status: 'provisioned', carrier: 'Docomo' }, action_status: 'completed', approval_status: 'auto_approved', conversation_id: 's-conv-1', customer_id: null, triggered_by: 'ai_agent', is_dry_run: false, retry_count: 0, max_retries: 3, error_message: null, approved_by: null, approved_at: null, completed_at: ago(1), action_summary: 'Checked provisioning for ORD-4521 — provisioned on Docomo', requires_approval: false, created_at: ago(1.2), updated_at: ago(1) },
  { id: 'sal-2', action_type: 'resend_qr_code', action_payload: { order_id: 'ORD-4523' }, action_result: { sent: true, channel: 'email' }, action_status: 'completed', approval_status: 'auto_approved', conversation_id: 's-conv-3', customer_id: null, triggered_by: 'ai_agent', is_dry_run: false, retry_count: 0, max_retries: 2, error_message: null, approved_by: null, approved_at: null, completed_at: ago(0.5), action_summary: 'Re-sent QR code for ORD-4523 via email', requires_approval: false, created_at: ago(0.6), updated_at: ago(0.5) },
  { id: 'sal-3', action_type: 'create_refund_request', action_payload: { order_id: 'ORD-4518', amount: 299 }, action_result: null, action_status: 'pending', approval_status: 'pending_approval', conversation_id: 's-conv-2', customer_id: null, triggered_by: 'ai_agent', is_dry_run: false, retry_count: 0, max_retries: 1, error_message: null, approved_by: null, approved_at: null, completed_at: null, action_summary: 'Refund ฿299 for unused Japan 5-day plan (ORD-4518)', requires_approval: true, created_at: ago(2), updated_at: ago(2) },
  { id: 'sal-4', action_type: 'create_sales_lead', action_payload: { destination: 'Japan', duration: 14 }, action_result: { lead_id: 'SL-892' }, action_status: 'completed', approval_status: 'auto_approved', conversation_id: 's-conv-4', customer_id: null, triggered_by: 'ai_agent', is_dry_run: false, retry_count: 0, max_retries: 2, error_message: null, approved_by: null, approved_at: null, completed_at: ago(3), action_summary: 'Created sales lead SL-892 for Japan 14-day trip', requires_approval: false, created_at: ago(3.2), updated_at: ago(3) },
  { id: 'sal-5', action_type: 'check_provisioning_status', action_payload: { order_id: 'ORD-4530' }, action_result: null, action_status: 'failed', approval_status: 'auto_approved', conversation_id: 's-conv-5', customer_id: null, triggered_by: 'ai_agent', is_dry_run: false, retry_count: 3, max_retries: 3, error_message: 'Carrier API timeout after 3 retries', approved_by: null, approved_at: null, completed_at: null, action_summary: 'Failed to check provisioning for ORD-4530 — carrier timeout', requires_approval: false, created_at: ago(5), updated_at: ago(4.5) },
  { id: 'sal-6', action_type: 'create_refund_request', action_payload: { order_id: 'ORD-4515', amount: 499 }, action_result: { refund_id: 'RF-201' }, action_status: 'completed', approval_status: 'approved', conversation_id: 's-conv-7', customer_id: null, triggered_by: 'ai_agent', is_dry_run: false, retry_count: 0, max_retries: 1, error_message: null, approved_by: 's-agent-2', approved_at: ago(8), completed_at: ago(7.5), action_summary: 'Refund ฿499 approved for ORD-4515', requires_approval: true, created_at: ago(10), updated_at: ago(7.5) },
];

export const SAMPLE_MISSING_ACTIONS = [
  { id: 'sma-1', action_name: 'auto_resend_qr', description: 'Automatically resend QR code when customer reports not receiving it', detected_intent: 'qr_not_received', impact_score: 8, occurrence_count: 34, example_conversations: ['s-conv-3'], status: 'detected', proposed_input_schema: { order_id: 'string' }, proposed_approval_required: false, admin_notes: null, created_at: daysAgo(5), updated_at: daysAgo(5) },
  { id: 'sma-2', action_name: 'auto_check_provisioning', description: 'Auto-check carrier provisioning status during activation issues', detected_intent: 'activation_failed', impact_score: 7, occurrence_count: 28, example_conversations: ['s-conv-1'], status: 'reviewing', proposed_input_schema: { order_id: 'string', carrier: 'string' }, proposed_approval_required: false, admin_notes: 'Needs carrier API integration', created_at: daysAgo(8), updated_at: daysAgo(3) },
  { id: 'sma-3', action_name: 'auto_extend_plan', description: 'Extend data plan validity when customer has connectivity issues', detected_intent: 'connectivity_complaint', impact_score: 6, occurrence_count: 15, example_conversations: ['s-conv-5'], status: 'detected', proposed_input_schema: { order_id: 'string', extension_days: 'number' }, proposed_approval_required: true, admin_notes: null, created_at: daysAgo(3), updated_at: daysAgo(3) },
  { id: 'sma-4', action_name: 'auto_apply_promo', description: 'Automatically apply valid promo code for customer', detected_intent: 'promo_code_issue', impact_score: 5, occurrence_count: 12, example_conversations: ['s-conv-8'], status: 'approved', proposed_input_schema: { promo_code: 'string', order_id: 'string' }, proposed_approval_required: false, admin_notes: 'Approved for implementation', created_at: daysAgo(12), updated_at: daysAgo(2) },
];

export const SAMPLE_GUARDRAIL_RULES = [
  { id: 'sgr-1', rule_name: 'Refund Amount Limit', description: 'Block auto-approval of refunds exceeding ฿1,000', risk_level: 'high', domain: 'billing', action_type_pattern: 'create_refund_request', is_active: true, max_auto_amount: 1000, conditions: { max_amount: 1000 }, created_at: daysAgo(30), updated_at: daysAgo(5) },
  { id: 'sgr-2', rule_name: 'Sales Lead Verification', description: 'Require minimum conversation length before creating sales lead', risk_level: 'low', domain: 'sales', action_type_pattern: 'create_sales_lead', is_active: true, max_auto_amount: null, conditions: { min_conversation_turns: 3 }, created_at: daysAgo(25), updated_at: daysAgo(10) },
  { id: 'sgr-3', rule_name: 'High-Value Order Protection', description: 'Require human approval for actions on orders above ฿5,000', risk_level: 'critical', domain: 'order_management', action_type_pattern: '*', is_active: true, max_auto_amount: 5000, conditions: { min_order_value: 5000 }, created_at: daysAgo(45), updated_at: daysAgo(15) },
];

export const SAMPLE_GUARDRAIL_ROLLBACKS = [
  { id: 'sgrb-1', reason: 'Customer complaint rate exceeded 5% threshold', trigger_type: 'metric_threshold', trigger_metric: 'complaint_rate', created_at: daysAgo(8), guardrail_change_requests: { change_title: 'Relaxed refund auto-approval limit' } },
  { id: 'sgrb-2', reason: 'Dead air rate increased after prompt change', trigger_type: 'metric_threshold', trigger_metric: 'dead_air_rate', created_at: daysAgo(15), guardrail_change_requests: { change_title: 'Updated greeting prompt for LINE channel' } },
];

export const SAMPLE_APPROVAL_POLICIES = [
  { id: 'sapl-1', policy_name: 'Refund Auto-Approve Small Amounts', domain: 'inbound', decision: 'auto_approve', description: 'Auto-approve refunds under ฿500 for unused plans within 7 days', is_active: true, risk_level: 'low', action_type_pattern: 'create_refund_request', max_auto_amount: 500, channel_scope: null, language_scope: null, customer_tier_scope: null, intent_scope: ['refund_request'], priority: 5, approval_roles: null, escalation_timeout_hours: null, auto_test_allowed: true, canary_rollout_pct: null, created_at: daysAgo(30), updated_at: daysAgo(10), created_by: 's-agent-1' },
  { id: 'sapl-2', policy_name: 'High-Value Actions Need Approval', domain: 'inbound', decision: 'require_approval', description: 'Require human approval for any action involving amounts above ฿1,000', is_active: true, risk_level: 'high', action_type_pattern: '*', max_auto_amount: 1000, channel_scope: null, language_scope: null, customer_tier_scope: null, intent_scope: null, priority: 10, approval_roles: ['admin', 'supervisor'], escalation_timeout_hours: 4, auto_test_allowed: false, canary_rollout_pct: null, created_at: daysAgo(45), updated_at: daysAgo(5), created_by: 's-agent-1' },
  { id: 'sapl-3', policy_name: 'QR Resend Auto-Approve', domain: 'inbound', decision: 'auto_approve', description: 'Auto-approve QR code resends for verified orders', is_active: true, risk_level: 'low', action_type_pattern: 'resend_qr_code', max_auto_amount: null, channel_scope: null, language_scope: null, customer_tier_scope: null, intent_scope: ['qr_not_received'], priority: 3, approval_roles: null, escalation_timeout_hours: null, auto_test_allowed: true, canary_rollout_pct: null, created_at: daysAgo(40), updated_at: daysAgo(20), created_by: 's-agent-2' },
];

export const SAMPLE_APPROVAL_AUDIT = [
  { id: 'saa-1', domain: 'inbound', decision: 'auto_approved', decided_at: ago(1), decided_by: null, decision_reason: 'Matched policy: QR Resend Auto-Approve', action_type: 'resend_qr_code', risk_level: 'low', matched_policy_name: 'QR Resend Auto-Approve', policy_id: 'sapl-3', reference_id: 'sal-2', channel: 'line', language: 'th', customer_tier: null, execution_status: 'completed', created_at: ago(1), input_context: null },
  { id: 'saa-2', domain: 'inbound', decision: 'pending', decided_at: ago(2), decided_by: null, decision_reason: 'Amount ฿299 — requires approval per policy', action_type: 'create_refund_request', risk_level: 'medium', matched_policy_name: 'Refund Auto-Approve Small Amounts', policy_id: 'sapl-1', reference_id: 'sal-3', channel: 'facebook', language: 'en', customer_tier: null, execution_status: 'pending', created_at: ago(2), input_context: null },
  { id: 'saa-3', domain: 'inbound', decision: 'approved', decided_at: ago(8), decided_by: 's-agent-2', decision_reason: 'Valid refund — customer never used the plan', action_type: 'create_refund_request', risk_level: 'medium', matched_policy_name: 'Refund Auto-Approve Small Amounts', policy_id: 'sapl-1', reference_id: 'sal-6', channel: 'email', language: 'en', customer_tier: null, execution_status: 'completed', created_at: ago(10), input_context: null },
  { id: 'saa-4', domain: 'inbound', decision: 'auto_approved', decided_at: ago(3), decided_by: null, decision_reason: 'Low-risk action, no amount threshold', action_type: 'create_sales_lead', risk_level: 'low', matched_policy_name: null, policy_id: null, reference_id: 'sal-4', channel: 'web', language: 'en', customer_tier: null, execution_status: 'completed', created_at: ago(3.2), input_context: null },
];

// ==================== QUALITY SUB-COMPONENTS ====================

export const SAMPLE_QUALITY_RATING_SUMMARY = {
  ratings: SAMPLE_RATINGS,
  prevRatings: SAMPLE_RATINGS.slice(0, 15).map(r => ({ rating: Math.max(1, r.rating - 1) })),
  deadAirCount: 67,
};

export const SAMPLE_LOW_RATED_CONVERSATIONS = SAMPLE_RATINGS.filter(r => r.rating <= 2);

// ==================== CHANNELS (static component, no sample data needed) ====================
// ContactCenterChannels is a static config page — no Supabase queries to mock
