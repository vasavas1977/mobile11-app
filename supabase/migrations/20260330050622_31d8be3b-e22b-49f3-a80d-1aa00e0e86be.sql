-- =============================================================================
-- Default Outbound Sales Journeys Seed Data
-- =============================================================================
-- All records seeded in 'draft' status. Nothing sends until admin activates.
-- All records include metadata.system_seeded = true for identification.
--
-- TEMPLATE RESOLUTION ALGORITHM (for future sender when message_template_id IS NULL):
--
--   SELECT * FROM outbound_message_templates
--   WHERE channel_type = :resolved_channel
--     AND language = :customer_language
--     AND intent_type = :step_intent_type
--     AND (campaign_type = :campaign_type OR campaign_type IS NULL)
--     AND is_active = true
--   ORDER BY
--     CASE WHEN campaign_type IS NOT NULL THEN 0 ELSE 1 END,
--     created_at DESC
--   LIMIT 1;
--
-- Resolution priority: campaign-specific > generic. If no template found,
-- mark send as failed with failure_reason = 'no_matching_template'.
-- =============================================================================

WITH campaigns AS (
  INSERT INTO public.outbound_campaigns (
    id, campaign_name, campaign_type, campaign_objective, status,
    scheduling_mode, target_audience_definition, allowed_channels,
    priority, preference_category, goal_metric, is_recovery_campaign,
    created_by, metadata
  ) VALUES
    -- 1. Qualified Lead Follow-Up
    (
      'a1000000-0000-0000-0000-000000000001',
      'Qualified Lead Follow-Up',
      'sales_followup',
      'Convert qualified leads into first-time buyers through personalized follow-up sequence',
      'draft',
      'always_on',
      '{"stage_filters": [{"dimension": "funnel", "stages": ["qualified_lead"]}]}'::jsonb,
      '{line}',
      80,
      'sales_followup',
      'conversion_rate',
      false,
      NULL,
      '{"system_seeded": true}'::jsonb
    ),
    -- 2. Abandoned Checkout Recovery
    (
      'a1000000-0000-0000-0000-000000000002',
      'Abandoned Checkout Recovery',
      'recovery',
      'Recover abandoned checkouts with timely reminders and incentives',
      'draft',
      'always_on',
      '{"stage_filters": [{"dimension": "funnel", "stages": ["engaged_lead", "purchase_intent_high"]}], "behavioral_flags": ["abandoned_checkout"]}'::jsonb,
      '{line}',
      90,
      'sales_followup',
      'recovery_rate',
      true,
      NULL,
      '{"system_seeded": true}'::jsonb
    ),
    -- 3. Package Recommendation Follow-Up
    (
      'a1000000-0000-0000-0000-000000000003',
      'Package Recommendation Follow-Up',
      'sales_followup',
      'Follow up on package inquiries that did not convert to purchase',
      'draft',
      'always_on',
      '{"stage_filters": [{"dimension": "funnel", "stages": ["engaged_lead", "qualified_lead"]}], "behavioral_flags": ["package_inquiry_no_purchase"]}'::jsonb,
      '{line}',
      70,
      'sales_followup',
      'conversion_rate',
      false,
      NULL,
      '{"system_seeded": true}'::jsonb
    ),
    -- 4. Upsell After Purchase
    (
      'a1000000-0000-0000-0000-000000000004',
      'Upsell After Purchase',
      'upsell',
      'Upsell existing customers after successful eSIM activation',
      'draft',
      'always_on',
      '{"stage_filters": [{"dimension": "funnel", "stages": ["converted_customer"]}], "behavioral_flags": ["first_successful_activation"]}'::jsonb,
      '{line}',
      60,
      'sales_followup',
      'upsell_rate',
      false,
      NULL,
      '{"system_seeded": true}'::jsonb
    ),
    -- 5. Cross-Sell for Repeat Customer
    (
      'a1000000-0000-0000-0000-000000000005',
      'Cross-Sell for Repeat Customer',
      'cross_sell',
      'Suggest complementary destinations and bundles to repeat buyers',
      'draft',
      'always_on',
      '{"stage_filters": [{"dimension": "funnel", "stages": ["repeat_customer"]}], "behavioral_flags": ["repeat_buyer_opportunity"]}'::jsonb,
      '{line}',
      50,
      'news_and_promotions',
      'repeat_purchase_rate',
      false,
      NULL,
      '{"system_seeded": true}'::jsonb
    )
  RETURNING id, campaign_name
),

journeys AS (
  INSERT INTO public.outbound_journeys (
    id, campaign_id, journey_name, trigger_type, trigger_definition,
    stop_conditions, status, max_steps, metadata
  ) VALUES
    -- Journey 1: Qualified Lead Follow-Up
    (
      'b1000000-0000-0000-0000-000000000001',
      'a1000000-0000-0000-0000-000000000001',
      'Qualified Lead Follow-Up Journey',
      'event_signal',
      '{"trigger_key": "qualified_lead_detected"}'::jsonb,
      '[{"condition": "customer_converted", "action": "stop"}, {"condition": "customer_opted_out", "action": "stop"}, {"condition": "negative_reply", "action": "hand_off"}]'::jsonb,
      'draft',
      4,
      '{"system_seeded": true}'::jsonb
    ),
    -- Journey 2: Abandoned Checkout Recovery
    (
      'b1000000-0000-0000-0000-000000000002',
      'a1000000-0000-0000-0000-000000000002',
      'Abandoned Checkout Recovery Journey',
      'event_signal',
      '{"trigger_key": "abandoned_checkout"}'::jsonb,
      '[{"condition": "customer_converted", "action": "stop"}, {"condition": "customer_opted_out", "action": "stop"}, {"condition": "negative_reply", "action": "hand_off"}]'::jsonb,
      'draft',
      4,
      '{"system_seeded": true}'::jsonb
    ),
    -- Journey 3: Package Recommendation Follow-Up
    (
      'b1000000-0000-0000-0000-000000000003',
      'a1000000-0000-0000-0000-000000000003',
      'Package Recommendation Follow-Up Journey',
      'event_signal',
      '{"trigger_key": "package_inquiry_no_purchase"}'::jsonb,
      '[{"condition": "customer_converted", "action": "stop"}, {"condition": "customer_opted_out", "action": "stop"}, {"condition": "negative_reply", "action": "hand_off"}]'::jsonb,
      'draft',
      3,
      '{"system_seeded": true}'::jsonb
    ),
    -- Journey 4: Upsell After Purchase
    (
      'b1000000-0000-0000-0000-000000000004',
      'a1000000-0000-0000-0000-000000000004',
      'Upsell After Purchase Journey',
      'event_signal',
      '{"trigger_key": "first_successful_activation"}'::jsonb,
      '[{"condition": "customer_converted", "action": "stop"}, {"condition": "customer_opted_out", "action": "stop"}, {"condition": "negative_reply", "action": "hand_off"}]'::jsonb,
      'draft',
      4,
      '{"system_seeded": true}'::jsonb
    ),
    -- Journey 5: Cross-Sell for Repeat Customer
    (
      'b1000000-0000-0000-0000-000000000005',
      'a1000000-0000-0000-0000-000000000005',
      'Cross-Sell for Repeat Customer Journey',
      'event_signal',
      '{"trigger_key": "repeat_buyer_opportunity"}'::jsonb,
      '[{"condition": "customer_converted", "action": "stop"}, {"condition": "customer_opted_out", "action": "stop"}, {"condition": "negative_reply", "action": "hand_off"}]'::jsonb,
      'draft',
      3,
      '{"system_seeded": true}'::jsonb
    )
  RETURNING id, journey_name
),

steps AS (
  INSERT INTO public.outbound_journey_steps (
    id, journey_id, step_order, step_name, step_type,
    delay_before_hours, channel_selection_rule, message_template_id,
    action_if_replied, action_if_no_reply, action_if_converted, metadata
  ) VALUES
    -- Journey 1: Qualified Lead Follow-Up (4 steps)
    ('c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 1, 'Warm greeting with value proposition', 'send_message', 0, 'preferred', NULL, 'stop', 'next_step', 'stop', '{"system_seeded": true, "intent_type": "followup"}'::jsonb),
    ('c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 2, 'Soft reminder with social proof', 'send_message', 24, 'preferred', NULL, 'stop', 'next_step', 'stop', '{"system_seeded": true, "intent_type": "reminder"}'::jsonb),
    ('c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000001', 3, 'Limited-time offer', 'send_message', 72, 'preferred', NULL, 'stop', 'next_step', 'stop', '{"system_seeded": true, "intent_type": "offer"}'::jsonb),
    ('c1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000001', 4, 'Final check-in', 'send_message', 168, 'preferred', NULL, 'stop', 'next_step', 'stop', '{"system_seeded": true, "intent_type": "followup"}'::jsonb),

    -- Journey 2: Abandoned Checkout Recovery (4 steps)
    ('c1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000002', 1, 'Cart reminder', 'send_message', 1, 'preferred', NULL, 'stop', 'next_step', 'stop', '{"system_seeded": true, "intent_type": "recovery"}'::jsonb),
    ('c1000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000002', 2, 'Help offer', 'send_message', 24, 'preferred', NULL, 'stop', 'next_step', 'stop', '{"system_seeded": true, "intent_type": "recovery"}'::jsonb),
    ('c1000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000002', 3, 'Incentive offer', 'send_message', 48, 'preferred', NULL, 'stop', 'next_step', 'stop', '{"system_seeded": true, "intent_type": "offer"}'::jsonb),
    ('c1000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000002', 4, 'Last chance reminder', 'send_message', 120, 'preferred', NULL, 'stop', 'next_step', 'stop', '{"system_seeded": true, "intent_type": "recovery"}'::jsonb),

    -- Journey 3: Package Recommendation Follow-Up (3 steps)
    ('c1000000-0000-0000-0000-000000000009', 'b1000000-0000-0000-0000-000000000003', 1, 'Recommendation summary', 'send_message', 2, 'preferred', NULL, 'stop', 'next_step', 'stop', '{"system_seeded": true, "intent_type": "followup"}'::jsonb),
    ('c1000000-0000-0000-0000-000000000010', 'b1000000-0000-0000-0000-000000000003', 2, 'Comparison helper', 'send_message', 48, 'preferred', NULL, 'stop', 'next_step', 'stop', '{"system_seeded": true, "intent_type": "education"}'::jsonb),
    ('c1000000-0000-0000-0000-000000000011', 'b1000000-0000-0000-0000-000000000003', 3, 'Ready-to-buy nudge', 'send_message', 120, 'preferred', NULL, 'stop', 'next_step', 'stop', '{"system_seeded": true, "intent_type": "offer"}'::jsonb),

    -- Journey 4: Upsell After Purchase (4 steps)
    ('c1000000-0000-0000-0000-000000000012', 'b1000000-0000-0000-0000-000000000004', 1, 'Thank you with tips', 'send_message', 24, 'preferred', NULL, 'stop', 'next_step', 'stop', '{"system_seeded": true, "intent_type": "thank_you"}'::jsonb),
    ('c1000000-0000-0000-0000-000000000013', 'b1000000-0000-0000-0000-000000000004', 2, 'Usage check-in', 'send_message', 72, 'preferred', NULL, 'stop', 'next_step', 'stop', '{"system_seeded": true, "intent_type": "followup"}'::jsonb),
    ('c1000000-0000-0000-0000-000000000014', 'b1000000-0000-0000-0000-000000000004', 3, 'Upgrade suggestion', 'send_message', 168, 'preferred', NULL, 'stop', 'next_step', 'stop', '{"system_seeded": true, "intent_type": "upsell"}'::jsonb),
    ('c1000000-0000-0000-0000-000000000015', 'b1000000-0000-0000-0000-000000000004', 4, 'Loyalty offer', 'send_message', 336, 'preferred', NULL, 'stop', 'next_step', 'stop', '{"system_seeded": true, "intent_type": "offer"}'::jsonb),

    -- Journey 5: Cross-Sell for Repeat Customer (3 steps)
    ('c1000000-0000-0000-0000-000000000016', 'b1000000-0000-0000-0000-000000000005', 1, 'New destination suggestion', 'send_message', 48, 'preferred', NULL, 'stop', 'next_step', 'stop', '{"system_seeded": true, "intent_type": "cross_sell"}'::jsonb),
    ('c1000000-0000-0000-0000-000000000017', 'b1000000-0000-0000-0000-000000000005', 2, 'Bundle offer', 'send_message', 120, 'preferred', NULL, 'stop', 'next_step', 'stop', '{"system_seeded": true, "intent_type": "offer"}'::jsonb),
    ('c1000000-0000-0000-0000-000000000018', 'b1000000-0000-0000-0000-000000000005', 3, 'Seasonal recommendation', 'send_message', 240, 'preferred', NULL, 'stop', 'next_step', 'stop', '{"system_seeded": true, "intent_type": "cross_sell"}'::jsonb)
  RETURNING id, step_name
)

-- 36 Message Templates (18 steps x 2 languages, all LINE channel)
INSERT INTO public.outbound_message_templates (
  template_name, campaign_type, channel_type, language, intent_type, tone_type,
  message_text, cta_type, cta_text, supported_variables, is_active, metadata
) VALUES
  -- === Journey 1: Qualified Lead Follow-Up ===
  -- Step 1: Warm greeting (EN)
  ('Qualified Lead - Warm Greeting (EN)', 'sales_followup', 'line', 'en', 'followup', 'friendly',
   'Hi {{first_name}}! 👋 Thanks for your interest in Mobile11 eSIM. We noticed you''re looking at plans for {{destination}}. Our customers love the hassle-free connectivity — no physical SIM needed! Ready to explore your options?',
   'reply', 'Browse Plans', '["first_name", "destination"]'::jsonb, true, '{"system_seeded": true}'::jsonb),
  -- Step 1: Warm greeting (TH)
  ('Qualified Lead - Warm Greeting (TH)', 'sales_followup', 'line', 'th', 'followup', 'friendly',
   'สวัสดีค่ะ {{first_name}}! 👋 ขอบคุณที่สนใจ eSIM จาก Mobile11 เราเห็นว่าคุณกำลังดูแพ็กเกจสำหรับ {{destination}} ลูกค้าของเราชอบความสะดวกสบาย ไม่ต้องเปลี่ยนซิมการ์ด! พร้อมเลือกแพ็กเกจหรือยังคะ?',
   'reply', 'ดูแพ็กเกจ', '["first_name", "destination"]'::jsonb, true, '{"system_seeded": true}'::jsonb),
  -- Step 2: Social proof (EN)
  ('Qualified Lead - Social Proof (EN)', 'sales_followup', 'line', 'en', 'reminder', 'friendly',
   'Hi {{first_name}}, just checking in! 🌍 Over 50,000 travelers trust Mobile11 for their connectivity abroad. Our {{destination}} plans start from just a few dollars a day. Want me to help you pick the best one?',
   'reply', 'Help Me Choose', '["first_name", "destination"]'::jsonb, true, '{"system_seeded": true}'::jsonb),
  -- Step 2: Social proof (TH)
  ('Qualified Lead - Social Proof (TH)', 'sales_followup', 'line', 'th', 'reminder', 'friendly',
   'สวัสดีค่ะ {{first_name}} แวะมาทักทาย! 🌍 นักเดินทางกว่า 50,000 คนไว้วางใจ Mobile11 แพ็กเกจ {{destination}} เริ่มต้นเพียงไม่กี่บาทต่อวัน ให้ช่วยเลือกแพ็กเกจที่เหมาะกับคุณไหมคะ?',
   'reply', 'ช่วยเลือกให้', '["first_name", "destination"]'::jsonb, true, '{"system_seeded": true}'::jsonb),
  -- Step 3: Limited offer (EN)
  ('Qualified Lead - Limited Offer (EN)', 'sales_followup', 'line', 'en', 'offer', 'urgent',
   '⏰ {{first_name}}, don''t miss out! Get {{discount_code}} for a special discount on your {{destination}} eSIM. This offer expires soon — grab your plan now and stay connected on your trip!',
   'link', 'Get My eSIM', '["first_name", "destination", "discount_code"]'::jsonb, true, '{"system_seeded": true}'::jsonb),
  -- Step 3: Limited offer (TH)
  ('Qualified Lead - Limited Offer (TH)', 'sales_followup', 'line', 'th', 'offer', 'urgent',
   '⏰ {{first_name}} อย่าพลาด! ใช้โค้ด {{discount_code}} รับส่วนลดพิเศษสำหรับ eSIM {{destination}} ข้อเสนอนี้มีเวลาจำกัด สั่งซื้อเลยเพื่อเชื่อมต่อตลอดการเดินทาง!',
   'link', 'สั่งซื้อ eSIM', '["first_name", "destination", "discount_code"]'::jsonb, true, '{"system_seeded": true}'::jsonb),
  -- Step 4: Final check-in (EN)
  ('Qualified Lead - Final Check-in (EN)', 'sales_followup', 'line', 'en', 'followup', 'empathetic',
   'Hi {{first_name}}, this is our last check-in 😊 If you''re still planning your trip to {{destination}}, we''re here to help anytime. Just reply and we''ll find the perfect eSIM plan for you!',
   'reply', 'I''m Interested', '["first_name", "destination"]'::jsonb, true, '{"system_seeded": true}'::jsonb),
  -- Step 4: Final check-in (TH)
  ('Qualified Lead - Final Check-in (TH)', 'sales_followup', 'line', 'th', 'followup', 'empathetic',
   'สวัสดีค่ะ {{first_name}} นี่เป็นข้อความสุดท้ายนะคะ 😊 ถ้ายังวางแผนเดินทางไป {{destination}} อยู่ เราพร้อมช่วยเสมอค่ะ ตอบกลับมาได้เลย แล้วเราจะหาแพ็กเกจ eSIM ที่เหมาะกับคุณ!',
   'reply', 'สนใจค่ะ', '["first_name", "destination"]'::jsonb, true, '{"system_seeded": true}'::jsonb),

  -- === Journey 2: Abandoned Checkout Recovery ===
  -- Step 1: Cart reminder (EN)
  ('Abandoned Checkout - Cart Reminder (EN)', 'recovery', 'line', 'en', 'recovery', 'friendly',
   'Hey {{first_name}}! 🛒 Looks like you left something behind. Your {{package_name}} eSIM for {{destination}} is still waiting for you. Complete your purchase in just a few taps!',
   'link', 'Complete Purchase', '["first_name", "package_name", "destination"]'::jsonb, true, '{"system_seeded": true}'::jsonb),
  -- Step 1: Cart reminder (TH)
  ('Abandoned Checkout - Cart Reminder (TH)', 'recovery', 'line', 'th', 'recovery', 'friendly',
   'สวัสดีค่ะ {{first_name}}! 🛒 ดูเหมือนคุณยังไม่ได้สั่งซื้อ แพ็กเกจ {{package_name}} สำหรับ {{destination}} ยังรอคุณอยู่ค่ะ กดสั่งซื้อได้เลยในไม่กี่ขั้นตอน!',
   'link', 'สั่งซื้อเลย', '["first_name", "package_name", "destination"]'::jsonb, true, '{"system_seeded": true}'::jsonb),
  -- Step 2: Help offer (EN)
  ('Abandoned Checkout - Help Offer (EN)', 'recovery', 'line', 'en', 'recovery', 'empathetic',
   'Hi {{first_name}}, we noticed you didn''t complete your eSIM purchase. 🤔 Is there anything we can help with? Questions about setup, coverage, or pricing? Just reply and we''ll sort it out!',
   'reply', 'I Have a Question', '["first_name"]'::jsonb, true, '{"system_seeded": true}'::jsonb),
  -- Step 2: Help offer (TH)
  ('Abandoned Checkout - Help Offer (TH)', 'recovery', 'line', 'th', 'recovery', 'empathetic',
   'สวัสดีค่ะ {{first_name}} เราเห็นว่าคุณยังไม่ได้สั่งซื้อ eSIM 🤔 มีอะไรให้ช่วยไหมคะ? ไม่ว่าจะเรื่องการตั้งค่า พื้นที่ครอบคลุม หรือราคา ตอบกลับมาได้เลยค่ะ!',
   'reply', 'มีคำถาม', '["first_name"]'::jsonb, true, '{"system_seeded": true}'::jsonb),
  -- Step 3: Incentive (EN)
  ('Abandoned Checkout - Incentive (EN)', 'recovery', 'line', 'en', 'offer', 'urgent',
   '🎁 {{first_name}}, here''s a little something to help you decide! Use code {{discount_code}} for a special discount on your {{destination}} eSIM. Don''t let slow Wi-Fi ruin your trip!',
   'link', 'Use My Discount', '["first_name", "destination", "discount_code"]'::jsonb, true, '{"system_seeded": true}'::jsonb),
  -- Step 3: Incentive (TH)
  ('Abandoned Checkout - Incentive (TH)', 'recovery', 'line', 'th', 'offer', 'urgent',
   '🎁 {{first_name}} มีของขวัญเล็กๆ ให้ค่ะ! ใช้โค้ด {{discount_code}} รับส่วนลดพิเศษสำหรับ eSIM {{destination}} อย่าปล่อยให้ Wi-Fi ช้าทำลายทริปของคุณนะคะ!',
   'link', 'ใช้ส่วนลด', '["first_name", "destination", "discount_code"]'::jsonb, true, '{"system_seeded": true}'::jsonb),
  -- Step 4: Last chance (EN)
  ('Abandoned Checkout - Last Chance (EN)', 'recovery', 'line', 'en', 'recovery', 'urgent',
   '⏰ Last chance, {{first_name}}! Your {{destination}} eSIM deal is about to expire. Instant activation, no physical SIM needed. Tap below to secure your connection!',
   'link', 'Get It Now', '["first_name", "destination"]'::jsonb, true, '{"system_seeded": true}'::jsonb),
  -- Step 4: Last chance (TH)
  ('Abandoned Checkout - Last Chance (TH)', 'recovery', 'line', 'th', 'recovery', 'urgent',
   '⏰ โอกาสสุดท้ายค่ะ {{first_name}}! ดีลสำหรับ eSIM {{destination}} กำลังจะหมดอายุ เปิดใช้งานทันที ไม่ต้องเปลี่ยนซิม กดด้านล่างเพื่อรับ!',
   'link', 'สั่งซื้อเลย', '["first_name", "destination"]'::jsonb, true, '{"system_seeded": true}'::jsonb),

  -- === Journey 3: Package Recommendation Follow-Up ===
  -- Step 1: Recommendation summary (EN)
  ('Package Recommendation - Summary (EN)', 'sales_followup', 'line', 'en', 'followup', 'friendly',
   'Hi {{first_name}}! 📱 Here''s a quick recap of the eSIM plans we recommended for {{destination}}: {{package_name}}. Want to compare options or have any questions?',
   'reply', 'Tell Me More', '["first_name", "destination", "package_name"]'::jsonb, true, '{"system_seeded": true}'::jsonb),
  -- Step 1: Recommendation summary (TH)
  ('Package Recommendation - Summary (TH)', 'sales_followup', 'line', 'th', 'followup', 'friendly',
   'สวัสดีค่ะ {{first_name}}! 📱 สรุปแพ็กเกจ eSIM ที่แนะนำสำหรับ {{destination}}: {{package_name}} อยากเปรียบเทียบตัวเลือกหรือมีคำถามไหมคะ?',
   'reply', 'บอกเพิ่มเติม', '["first_name", "destination", "package_name"]'::jsonb, true, '{"system_seeded": true}'::jsonb),
  -- Step 2: Comparison helper (EN)
  ('Package Recommendation - Comparison (EN)', 'sales_followup', 'line', 'en', 'education', 'professional',
   '📊 {{first_name}}, not sure which plan is right for you? Here''s a quick tip: if you''re staying {{destination}} for a short trip, a day pass works great. For longer stays, our data packages give you the best value per GB!',
   'link', 'Compare Plans', '["first_name", "destination"]'::jsonb, true, '{"system_seeded": true}'::jsonb),
  -- Step 2: Comparison helper (TH)
  ('Package Recommendation - Comparison (TH)', 'sales_followup', 'line', 'th', 'education', 'professional',
   '📊 {{first_name}} ไม่แน่ใจว่าแพ็กเกจไหนเหมาะ? เคล็ดลับ: ถ้าอยู่ {{destination}} แค่ไม่กี่วัน Day Pass คุ้มสุด แต่ถ้าอยู่นาน แพ็กเกจเน้นดาต้าจะประหยัดกว่าต่อ GB ค่ะ!',
   'link', 'เปรียบเทียบแพ็กเกจ', '["first_name", "destination"]'::jsonb, true, '{"system_seeded": true}'::jsonb),
  -- Step 3: Buy nudge (EN)
  ('Package Recommendation - Buy Nudge (EN)', 'sales_followup', 'line', 'en', 'offer', 'friendly',
   '🌟 {{first_name}}, ready to stay connected in {{destination}}? Get your eSIM now and activate it instantly when you arrive. No roaming fees, no hassle!',
   'link', 'Buy Now', '["first_name", "destination"]'::jsonb, true, '{"system_seeded": true}'::jsonb),
  -- Step 3: Buy nudge (TH)
  ('Package Recommendation - Buy Nudge (TH)', 'sales_followup', 'line', 'th', 'offer', 'friendly',
   '🌟 {{first_name}} พร้อมเชื่อมต่อที่ {{destination}} หรือยัง? สั่งซื้อ eSIM เลยแล้วเปิดใช้ทันทีเมื่อถึง ไม่มีค่าโรมมิ่ง ไม่ยุ่งยาก!',
   'link', 'สั่งซื้อเลย', '["first_name", "destination"]'::jsonb, true, '{"system_seeded": true}'::jsonb),

  -- === Journey 4: Upsell After Purchase ===
  -- Step 1: Thank you (EN)
  ('Upsell - Thank You (EN)', 'upsell', 'line', 'en', 'thank_you', 'friendly',
   '🎉 Thanks for choosing Mobile11, {{first_name}}! Your eSIM for {{destination}} is ready. Pro tip: enable your eSIM before you travel so it''s ready to go when you land!',
   'link', 'Setup Guide', '["first_name", "destination"]'::jsonb, true, '{"system_seeded": true}'::jsonb),
  -- Step 1: Thank you (TH)
  ('Upsell - Thank You (TH)', 'upsell', 'line', 'th', 'thank_you', 'friendly',
   '🎉 ขอบคุณที่เลือก Mobile11 ค่ะ {{first_name}}! eSIM สำหรับ {{destination}} พร้อมแล้ว เคล็ดลับ: ตั้งค่า eSIM ก่อนเดินทางจะได้ใช้งานได้ทันทีเมื่อถึง!',
   'link', 'คู่มือตั้งค่า', '["first_name", "destination"]'::jsonb, true, '{"system_seeded": true}'::jsonb),
  -- Step 2: Usage check-in (EN)
  ('Upsell - Usage Check-in (EN)', 'upsell', 'line', 'en', 'followup', 'friendly',
   'Hi {{first_name}}! 📶 How''s your connectivity in {{destination}}? Everything working smoothly? If you need more data or have any issues, we''re here to help!',
   'reply', 'Need More Data', '["first_name", "destination"]'::jsonb, true, '{"system_seeded": true}'::jsonb),
  -- Step 2: Usage check-in (TH)
  ('Upsell - Usage Check-in (TH)', 'upsell', 'line', 'th', 'followup', 'friendly',
   'สวัสดีค่ะ {{first_name}}! 📶 การเชื่อมต่อที่ {{destination}} เป็นอย่างไรบ้างคะ? ทุกอย่างราบรื่นไหม? ถ้าต้องการเน็ตเพิ่มหรือมีปัญหา บอกเราได้เลยค่ะ!',
   'reply', 'ต้องการเน็ตเพิ่ม', '["first_name", "destination"]'::jsonb, true, '{"system_seeded": true}'::jsonb),
  -- Step 3: Upgrade suggestion (EN)
  ('Upsell - Upgrade Suggestion (EN)', 'upsell', 'line', 'en', 'upsell', 'professional',
   '📈 {{first_name}}, planning to extend your stay or need more data? Upgrade to our {{package_name}} for uninterrupted connectivity. Existing customers get priority pricing!',
   'link', 'View Upgrades', '["first_name", "package_name"]'::jsonb, true, '{"system_seeded": true}'::jsonb),
  -- Step 3: Upgrade suggestion (TH)
  ('Upsell - Upgrade Suggestion (TH)', 'upsell', 'line', 'th', 'upsell', 'professional',
   '📈 {{first_name}} วางแผนอยู่ต่อหรือต้องการเน็ตเพิ่มไหมคะ? อัปเกรดเป็น {{package_name}} เพื่อเชื่อมต่อต่อเนื่อง ลูกค้าเก่ารับราคาพิเศษ!',
   'link', 'ดูแพ็กเกจอัปเกรด', '["first_name", "package_name"]'::jsonb, true, '{"system_seeded": true}'::jsonb),
  -- Step 4: Loyalty offer (EN)
  ('Upsell - Loyalty Offer (EN)', 'upsell', 'line', 'en', 'offer', 'friendly',
   '💎 {{first_name}}, as a valued Mobile11 customer, here''s an exclusive deal: use code {{discount_code}} on your next eSIM purchase. Whether it''s your next trip or a gift for a friend!',
   'link', 'Redeem Offer', '["first_name", "discount_code"]'::jsonb, true, '{"system_seeded": true}'::jsonb),
  -- Step 4: Loyalty offer (TH)
  ('Upsell - Loyalty Offer (TH)', 'upsell', 'line', 'th', 'offer', 'friendly',
   '💎 {{first_name}} ในฐานะลูกค้าคนพิเศษ รับดีลพิเศษ: ใช้โค้ด {{discount_code}} ในการซื้อ eSIM ครั้งต่อไป ไม่ว่าจะเที่ยวเองหรือซื้อเป็นของขวัญ!',
   'link', 'รับข้อเสนอ', '["first_name", "discount_code"]'::jsonb, true, '{"system_seeded": true}'::jsonb),

  -- === Journey 5: Cross-Sell for Repeat Customer ===
  -- Step 1: New destination (EN)
  ('Cross-Sell - New Destination (EN)', 'cross_sell', 'line', 'en', 'cross_sell', 'friendly',
   '✈️ Hi {{first_name}}! Planning your next adventure? Based on your travel history, you might love {{destination}}. We have great eSIM plans starting from just a few dollars!',
   'link', 'Explore Plans', '["first_name", "destination"]'::jsonb, true, '{"system_seeded": true}'::jsonb),
  -- Step 1: New destination (TH)
  ('Cross-Sell - New Destination (TH)', 'cross_sell', 'line', 'th', 'cross_sell', 'friendly',
   '✈️ สวัสดีค่ะ {{first_name}}! วางแผนทริปต่อไปหรือยัง? จากประวัติการเดินทาง คุณน่าจะชอบ {{destination}} เรามีแพ็กเกจ eSIM ราคาเริ่มต้นเพียงไม่กี่บาท!',
   'link', 'ดูแพ็กเกจ', '["first_name", "destination"]'::jsonb, true, '{"system_seeded": true}'::jsonb),
  -- Step 2: Bundle offer (EN)
  ('Cross-Sell - Bundle Offer (EN)', 'cross_sell', 'line', 'en', 'offer', 'professional',
   '🌏 {{first_name}}, traveling to multiple countries? Save more with our regional eSIM bundles! One eSIM, multiple destinations — perfect for multi-stop trips.',
   'link', 'View Bundles', '["first_name"]'::jsonb, true, '{"system_seeded": true}'::jsonb),
  -- Step 2: Bundle offer (TH)
  ('Cross-Sell - Bundle Offer (TH)', 'cross_sell', 'line', 'th', 'offer', 'professional',
   '🌏 {{first_name}} เดินทางหลายประเทศ? ประหยัดกว่าด้วยแพ็กเกจ eSIM ภูมิภาค! eSIM เดียว ใช้ได้หลายประเทศ เหมาะสำหรับทริปหลายจุด',
   'link', 'ดูแพ็กเกจภูมิภาค', '["first_name"]'::jsonb, true, '{"system_seeded": true}'::jsonb),
  -- Step 3: Seasonal recommendation (EN)
  ('Cross-Sell - Seasonal (EN)', 'cross_sell', 'line', 'en', 'cross_sell', 'casual',
   '🌴 {{first_name}}, it''s the perfect season to visit {{destination}}! Grab your eSIM now and be ready to share every moment. Our repeat customers enjoy special perks!',
   'link', 'Plan My Trip', '["first_name", "destination"]'::jsonb, true, '{"system_seeded": true}'::jsonb),
  -- Step 3: Seasonal recommendation (TH)
  ('Cross-Sell - Seasonal (TH)', 'cross_sell', 'line', 'th', 'cross_sell', 'casual',
   '🌴 {{first_name}} ช่วงนี้เป็นเวลาที่ดีที่สุดไป {{destination}}! สั่ง eSIM เลยแล้วพร้อมแชร์ทุกช่วงเวลา ลูกค้าประจำรับสิทธิพิเศษเพิ่ม!',
   'link', 'วางแผนทริป', '["first_name", "destination"]'::jsonb, true, '{"system_seeded": true}'::jsonb);