INSERT INTO public.trigger_catalog (trigger_key, display_name, description, evaluation_mode, source_event_types, default_config, is_enabled)
VALUES
  ('destination_promo_available', 'Destination Promo Available', 'Fires when a destination promotion campaign is scheduled to start', 'scheduled', '{campaign_scheduled}', '{}', true),
  ('seasonal_travel_window', 'Seasonal Travel Window', 'Fires when a seasonal travel campaign window opens', 'scheduled', '{campaign_scheduled}', '{}', true),
  ('new_product_launched', 'New Product Launched', 'Fires when a new product or package is launched', 'scheduled', '{campaign_scheduled}', '{}', true),
  ('limited_time_offer_started', 'Limited-Time Offer Started', 'Fires when a limited-time discount campaign begins', 'scheduled', '{campaign_scheduled}', '{}', true),
  ('education_content_ready', 'Educational Content Ready', 'Fires when educational content is ready for distribution', 'scheduled', '{campaign_scheduled}', '{}', true)
ON CONFLICT DO NOTHING;

WITH inserted_campaigns AS (
  INSERT INTO public.outbound_campaigns (campaign_name, campaign_type, campaign_objective, status, scheduling_mode, target_audience_definition, allowed_channels, priority, preference_category, goal_metric, is_recovery_campaign, created_by, metadata)
  VALUES
    ('Destination Promotion', 'promotion', 'Promote specific travel destinations with curated content and offers', 'draft', 'scheduled', '{"stage_filters":[{"dimension":"funnel","stages":["engaged_lead","qualified_lead","converted_customer","repeat_customer"]}]}'::jsonb, '{line}', 70, 'news_and_promotions', 'click_through_rate', false, NULL, '{"system_seeded":true}'::jsonb),
    ('Seasonal Travel Campaign', 'promotion', 'Drive conversions during peak travel seasons with seasonal bundles', 'draft', 'scheduled', '{"stage_filters":[{"dimension":"funnel","stages":["engaged_lead","qualified_lead","converted_customer","repeat_customer"]}],"behavioral_flags":["seasonal_travel_window"]}'::jsonb, '{line}', 75, 'news_and_promotions', 'conversion_rate', false, NULL, '{"system_seeded":true}'::jsonb),
    ('Product Launch', 'promotion', 'Announce new eSIM packages and features', 'draft', 'scheduled', '{"stage_filters":[{"dimension":"funnel","stages":["new_lead","engaged_lead","qualified_lead","converted_customer","repeat_customer"]}]}'::jsonb, '{line}', 80, 'news_and_promotions', 'awareness_rate', false, NULL, '{"system_seeded":true}'::jsonb),
    ('Limited-Time Discount', 'promotion', 'Create urgency with time-limited discount offers', 'draft', 'scheduled', '{"stage_filters":[{"dimension":"funnel","stages":["engaged_lead","qualified_lead","purchase_intent_high","converted_customer"]}]}'::jsonb, '{line}', 85, 'news_and_promotions', 'conversion_rate', false, NULL, '{"system_seeded":true}'::jsonb),
    ('Educational Campaign', 'education', 'Educate customers on eSIM setup and travel connectivity', 'draft', 'scheduled', '{"stage_filters":[{"dimension":"capability","stages":["never_used_esim","first_time_esim_user"]}]}'::jsonb, '{line}', 50, 'news_and_promotions', 'engagement_rate', false, NULL, '{"system_seeded":true}'::jsonb),
    ('Recovery Offer for Unhappy Customer', 'win_back', 'Win back customers who had negative experiences', 'draft', 'always_on', '{"stage_filters":[{"dimension":"experience","stages":["bad_experience_customer","unresolved_issue_customer"]}],"behavioral_flags":["bad_experience_detected"]}'::jsonb, '{line}', 20, 'news_and_promotions', 'recovery_rate', true, NULL, '{"system_seeded":true}'::jsonb),
    ('Loyalty Campaign', 'promotion', 'Reward loyal customers and encourage referrals', 'draft', 'always_on', '{"stage_filters":[{"dimension":"experience","stages":["good_experience_customer","high_value_customer"]}],"behavioral_flags":["good_experience_detected"]}'::jsonb, '{line}', 60, 'news_and_promotions', 'repeat_purchase_rate', false, NULL, '{"system_seeded":true}'::jsonb)
  RETURNING id, campaign_name
),
inserted_journeys AS (
  INSERT INTO public.outbound_journeys (campaign_id, journey_name, trigger_type, trigger_definition, stop_conditions, status, max_steps, metadata)
  SELECT c.id, j.journey_name, j.trigger_type, j.trigger_definition::jsonb, '[{"condition":"customer_converted","action":"stop"},{"condition":"customer_opted_out","action":"stop"},{"condition":"negative_reply","action":"hand_off"}]'::jsonb, 'draft', j.max_steps, '{"system_seeded":true}'::jsonb
  FROM inserted_campaigns c
  JOIN (VALUES
    ('Destination Promotion','Destination Promotion Journey','schedule','{"trigger_key":"destination_promo_available"}',3),
    ('Seasonal Travel Campaign','Seasonal Travel Journey','schedule','{"trigger_key":"seasonal_travel_window"}',4),
    ('Product Launch','Product Launch Journey','schedule','{"trigger_key":"new_product_launched"}',3),
    ('Limited-Time Discount','Limited-Time Discount Journey','schedule','{"trigger_key":"limited_time_offer_started"}',3),
    ('Educational Campaign','Educational Campaign Journey','schedule','{"trigger_key":"education_content_ready"}',3),
    ('Recovery Offer for Unhappy Customer','Recovery Offer Journey','event_signal','{"trigger_key":"bad_experience_detected"}',4),
    ('Loyalty Campaign','Loyalty Campaign Journey','event_signal','{"trigger_key":"good_experience_detected"}',3)
  ) AS j(campaign_name,journey_name,trigger_type,trigger_definition,max_steps) ON c.campaign_name=j.campaign_name
  RETURNING id, journey_name
),
inserted_steps AS (
  INSERT INTO public.outbound_journey_steps (journey_id, step_order, step_name, step_type, delay_before_hours, channel_selection_rule, message_template_id, ai_generate_message, action_if_replied, action_if_no_reply, action_if_converted, metadata)
  SELECT jn.id, s.step_order, s.step_name, 'send_message', s.delay_hours, 'preferred', NULL, false, 'stop', 'next_step', 'stop', jsonb_build_object('system_seeded',true,'intent_type',s.intent_type)
  FROM inserted_journeys jn
  JOIN (VALUES
    ('Destination Promotion Journey',1,'Destination highlight',0,'followup'),
    ('Destination Promotion Journey',2,'Travel tips and social proof',48,'education'),
    ('Destination Promotion Journey',3,'Limited offer for destination',120,'offer'),
    ('Seasonal Travel Journey',1,'Season announcement',0,'welcome'),
    ('Seasonal Travel Journey',2,'Featured destinations',48,'followup'),
    ('Seasonal Travel Journey',3,'Seasonal bundle offer',96,'offer'),
    ('Seasonal Travel Journey',4,'Last chance reminder',168,'reminder'),
    ('Product Launch Journey',1,'New product announcement',0,'welcome'),
    ('Product Launch Journey',2,'Feature highlights',48,'education'),
    ('Product Launch Journey',3,'Launch offer',96,'offer'),
    ('Limited-Time Discount Journey',1,'Discount announcement',0,'offer'),
    ('Limited-Time Discount Journey',2,'Reminder with urgency',24,'reminder'),
    ('Limited-Time Discount Journey',3,'Final hours',48,'reminder'),
    ('Educational Campaign Journey',1,'Educational content intro',0,'education'),
    ('Educational Campaign Journey',2,'How-to guide',72,'education'),
    ('Educational Campaign Journey',3,'Ready to try CTA',168,'followup'),
    ('Recovery Offer Journey',1,'Apology and acknowledgment',2,'recovery'),
    ('Recovery Offer Journey',2,'Resolution follow-up',24,'followup'),
    ('Recovery Offer Journey',3,'Recovery offer',72,'offer'),
    ('Recovery Offer Journey',4,'Win-back check-in',168,'winback'),
    ('Loyalty Campaign Journey',1,'Thank you and recognition',24,'thank_you'),
    ('Loyalty Campaign Journey',2,'Exclusive loyalty offer',72,'offer'),
    ('Loyalty Campaign Journey',3,'Referral invitation',168,'followup')
  ) AS s(journey_name,step_order,step_name,delay_hours,intent_type) ON jn.journey_name=s.journey_name
  RETURNING id, step_name
)
INSERT INTO public.outbound_message_templates (template_name,campaign_type,channel_type,language,intent_type,tone_type,message_text,cta_type,cta_text,supported_variables,is_active,metadata) VALUES
('Destination Highlight EN','promotion','line','en','followup','friendly','Hi {{customer_name}}! 🌏 Discover amazing connectivity in {{destination}}.','link','Explore Packages','["customer_name","destination"]'::jsonb,true,'{"system_seeded":true}'::jsonb),
('Destination Highlight TH','promotion','line','th','followup','friendly','สวัสดี {{customer_name}}! 🌏 ค้นพบการเชื่อมต่อที่ยอดเยี่ยมใน{{destination}}','link','ดูแพ็กเกจ','["customer_name","destination"]'::jsonb,true,'{"system_seeded":true}'::jsonb),
('Travel Tips EN','promotion','line','en','education','friendly','Traveling to {{destination}}? Here are top tips plus our best packages.','link','Read Tips','["customer_name","destination"]'::jsonb,true,'{"system_seeded":true}'::jsonb),
('Travel Tips TH','promotion','line','th','education','friendly','เดินทางไป{{destination}}? เคล็ดลับจากนักเดินทาง พร้อมแพ็กเกจที่ดีที่สุด','link','อ่านเคล็ดลับ','["customer_name","destination"]'::jsonb,true,'{"system_seeded":true}'::jsonb),
('Destination Offer EN','promotion','line','en','offer','friendly','🎉 Special offer for {{destination}}! Get {{discount_amount}} off with code {{promo_code}}.','link','Get Offer','["customer_name","destination","discount_amount","promo_code"]'::jsonb,true,'{"system_seeded":true}'::jsonb),
('Destination Offer TH','promotion','line','th','offer','friendly','🎉 โปรพิเศษสำหรับ{{destination}}! รับส่วนลด {{discount_amount}} ด้วยรหัส {{promo_code}}','link','รับข้อเสนอ','["customer_name","destination","discount_amount","promo_code"]'::jsonb,true,'{"system_seeded":true}'::jsonb),
('Season Announcement EN','promotion','line','en','welcome','friendly','Hi {{customer_name}}! ✈️ Travel season is here! Explore our seasonal eSIM bundles.','link','View Seasonal Deals','["customer_name"]'::jsonb,true,'{"system_seeded":true}'::jsonb),
('Season Announcement TH','promotion','line','th','welcome','friendly','สวัสดี {{customer_name}}! ✈️ ฤดูท่องเที่ยวมาถึงแล้ว! สำรวจแพ็กเกจตามฤดูกาล','link','ดูดีลตามฤดูกาล','["customer_name"]'::jsonb,true,'{"system_seeded":true}'::jsonb),
('Featured Destinations EN','promotion','line','en','followup','friendly','Thinking about your next trip? 🗺️ Check out our featured destinations.','link','Browse Destinations','["customer_name","destination"]'::jsonb,true,'{"system_seeded":true}'::jsonb),
('Featured Destinations TH','promotion','line','th','followup','friendly','กำลังคิดเรื่องทริปถัดไป? 🗺️ ดูจุดหมายเด่นพร้อมแพ็กเกจที่ดีที่สุด','link','เลือกจุดหมาย','["customer_name","destination"]'::jsonb,true,'{"system_seeded":true}'::jsonb),
('Seasonal Bundle EN','promotion','line','en','offer','friendly','📦 Seasonal bundle deal! Get {{package_name}} at a special price with code {{promo_code}}.','link','Grab the Deal','["customer_name","package_name","promo_code"]'::jsonb,true,'{"system_seeded":true}'::jsonb),
('Seasonal Bundle TH','promotion','line','th','offer','friendly','📦 ดีลแพ็กเกจตามฤดูกาล! รับ {{package_name}} ในราคาพิเศษ ใช้รหัส {{promo_code}}','link','รับดีล','["customer_name","package_name","promo_code"]'::jsonb,true,'{"system_seeded":true}'::jsonb),
('Last Chance Seasonal EN','promotion','line','en','reminder','friendly','⏰ Last chance! Seasonal travel deals end soon. Don''t miss {{package_name}}.','link','Shop Now','["customer_name","package_name"]'::jsonb,true,'{"system_seeded":true}'::jsonb),
('Last Chance Seasonal TH','promotion','line','th','reminder','friendly','⏰ โอกาสสุดท้าย! ดีลตามฤดูกาลใกล้หมด อย่าพลาด {{package_name}}','link','ช้อปเลย','["customer_name","package_name"]'::jsonb,true,'{"system_seeded":true}'::jsonb),
('Product Announcement EN','promotion','line','en','welcome','friendly','Hi {{customer_name}}! 🚀 We just launched {{package_name}} — a brand new eSIM experience.','link','Learn More','["customer_name","package_name"]'::jsonb,true,'{"system_seeded":true}'::jsonb),
('Product Announcement TH','promotion','line','th','welcome','friendly','สวัสดี {{customer_name}}! 🚀 เราเพิ่งเปิดตัว {{package_name}} — eSIM ใหม่ล่าสุด','link','เรียนรู้เพิ่มเติม','["customer_name","package_name"]'::jsonb,true,'{"system_seeded":true}'::jsonb),
('Feature Highlights EN','promotion','line','en','education','friendly','Here''s what makes {{package_name}} special: faster speeds, wider coverage, better value.','link','See Features','["customer_name","package_name"]'::jsonb,true,'{"system_seeded":true}'::jsonb),
('Feature Highlights TH','promotion','line','th','education','friendly','นี่คือสิ่งที่ทำให้ {{package_name}} พิเศษ: เร็วขึ้น ครอบคลุมมากขึ้น คุ้มค่ามากขึ้น','link','ดูฟีเจอร์','["customer_name","package_name"]'::jsonb,true,'{"system_seeded":true}'::jsonb),
('Launch Offer EN','promotion','line','en','offer','friendly','🎁 Launch special! Get {{discount_amount}} off {{package_name}} with code {{promo_code}}.','link','Get Launch Price','["customer_name","package_name","discount_amount","promo_code"]'::jsonb,true,'{"system_seeded":true}'::jsonb),
('Launch Offer TH','promotion','line','th','offer','friendly','🎁 โปรเปิดตัว! รับส่วนลด {{discount_amount}} สำหรับ {{package_name}} ด้วยรหัส {{promo_code}}','link','รับราคาเปิดตัว','["customer_name","package_name","discount_amount","promo_code"]'::jsonb,true,'{"system_seeded":true}'::jsonb),
('Discount Announcement EN','promotion','line','en','offer','friendly','Hi {{customer_name}}! 💰 Flash sale! Get {{discount_amount}} off. Use code {{promo_code}}.','link','Shop the Sale','["customer_name","discount_amount","promo_code"]'::jsonb,true,'{"system_seeded":true}'::jsonb),
('Discount Announcement TH','promotion','line','th','offer','friendly','สวัสดี {{customer_name}}! 💰 Flash Sale! รับส่วนลด {{discount_amount}} ใช้รหัส {{promo_code}}','link','ช้อปเซลล์','["customer_name","discount_amount","promo_code"]'::jsonb,true,'{"system_seeded":true}'::jsonb),
('Urgency Reminder EN','promotion','line','en','reminder','friendly','⚡ Time is running out! Don''t miss {{discount_amount}} off with code {{promo_code}}.','link','Use My Discount','["customer_name","discount_amount","promo_code"]'::jsonb,true,'{"system_seeded":true}'::jsonb),
('Urgency Reminder TH','promotion','line','th','reminder','friendly','⚡ เวลาใกล้หมด! อย่าพลาดส่วนลด {{discount_amount}} ด้วยรหัส {{promo_code}}','link','ใช้ส่วนลด','["customer_name","discount_amount","promo_code"]'::jsonb,true,'{"system_seeded":true}'::jsonb),
('Final Hours EN','promotion','line','en','reminder','friendly','🔥 FINAL HOURS! Your {{discount_amount}} discount expires tonight.','link','Save Now','["customer_name","discount_amount","package_name"]'::jsonb,true,'{"system_seeded":true}'::jsonb),
('Final Hours TH','promotion','line','th','reminder','friendly','🔥 ชั่วโมงสุดท้าย! ส่วนลด {{discount_amount}} หมดอายุคืนนี้','link','ประหยัดเลย','["customer_name","discount_amount","package_name"]'::jsonb,true,'{"system_seeded":true}'::jsonb),
('Education Intro EN','education','line','en','education','friendly','Hi {{customer_name}}! 📱 New to eSIM? Here''s a quick guide to get started.','link','Read the Guide','["customer_name"]'::jsonb,true,'{"system_seeded":true}'::jsonb),
('Education Intro TH','education','line','th','education','friendly','สวัสดี {{customer_name}}! 📱 ใหม่กับ eSIM? เรามีคู่มือเริ่มต้นสำหรับคุณ','link','อ่านคู่มือ','["customer_name"]'::jsonb,true,'{"system_seeded":true}'::jsonb),
('How-To Guide EN','education','line','en','education','friendly','Step-by-step: Install and activate your eSIM in under 5 minutes.','link','Watch Tutorial','["customer_name"]'::jsonb,true,'{"system_seeded":true}'::jsonb),
('How-To Guide TH','education','line','th','education','friendly','ทีละขั้น: ติดตั้งและเปิดใช้งาน eSIM ในไม่ถึง 5 นาที','link','ดูบทเรียน','["customer_name"]'::jsonb,true,'{"system_seeded":true}'::jsonb),
('Ready to Try EN','education','line','en','followup','friendly','Ready to try eSIM? 🌍 Browse our packages and find the perfect plan.','link','Browse Packages','["customer_name","destination"]'::jsonb,true,'{"system_seeded":true}'::jsonb),
('Ready to Try TH','education','line','th','followup','friendly','พร้อมลอง eSIM? 🌍 เลือกแพ็กเกจที่เหมาะกับคุณ','link','ดูแพ็กเกจ','["customer_name","destination"]'::jsonb,true,'{"system_seeded":true}'::jsonb),
('Apology EN','win_back','line','en','recovery','friendly','Hi {{customer_name}}, we''re sorry about your recent experience. We want to make it right.','link','Contact Support','["customer_name"]'::jsonb,true,'{"system_seeded":true}'::jsonb),
('Apology TH','win_back','line','th','recovery','friendly','สวัสดี {{customer_name}} เราขอโทษสำหรับประสบการณ์ที่ผ่านมา เราให้ความสำคัญกับคุณ','link','ติดต่อฝ่ายช่วยเหลือ','["customer_name"]'::jsonb,true,'{"system_seeded":true}'::jsonb),
('Resolution Follow-up EN','win_back','line','en','followup','friendly','Hi {{customer_name}}, has your issue been resolved? We''re here to help.','link','Get Help','["customer_name"]'::jsonb,true,'{"system_seeded":true}'::jsonb),
('Resolution Follow-up TH','win_back','line','th','followup','friendly','สวัสดี {{customer_name}} ปัญหาได้รับการแก้ไขแล้วหรือยัง? เราพร้อมช่วยเหลือ','link','ขอความช่วยเหลือ','["customer_name"]'::jsonb,true,'{"system_seeded":true}'::jsonb),
('Recovery Offer EN','win_back','line','en','offer','friendly','As a thank you for your patience, here''s {{discount_amount}} off. Use code {{promo_code}}.','link','Claim Offer','["customer_name","discount_amount","promo_code"]'::jsonb,true,'{"system_seeded":true}'::jsonb),
('Recovery Offer TH','win_back','line','th','offer','friendly','เพื่อขอบคุณสำหรับความอดทน รับส่วนลด {{discount_amount}} ใช้รหัส {{promo_code}}','link','รับข้อเสนอ','["customer_name","discount_amount","promo_code"]'::jsonb,true,'{"system_seeded":true}'::jsonb),
('Win-back Check-in EN','win_back','line','en','winback','friendly','Hi {{customer_name}}, we hope things are better now. Check our latest packages!','link','See What''s New','["customer_name","package_name"]'::jsonb,true,'{"system_seeded":true}'::jsonb),
('Win-back Check-in TH','win_back','line','th','winback','friendly','สวัสดี {{customer_name}} หวังว่าทุกอย่างดีขึ้นแล้ว ดูแพ็กเกจใหม่ล่าสุด!','link','ดูอะไรใหม่','["customer_name","package_name"]'::jsonb,true,'{"system_seeded":true}'::jsonb),
('Thank You EN','promotion','line','en','thank_you','friendly','Hi {{customer_name}}! 🙏 Thank you for being a loyal customer.','link','View Rewards','["customer_name"]'::jsonb,true,'{"system_seeded":true}'::jsonb),
('Thank You TH','promotion','line','th','thank_you','friendly','สวัสดี {{customer_name}}! 🙏 ขอบคุณที่เป็นลูกค้าผู้ภักดีของเรา','link','ดูรางวัล','["customer_name"]'::jsonb,true,'{"system_seeded":true}'::jsonb),
('Loyalty Offer EN','promotion','line','en','offer','friendly','🌟 Exclusive! Enjoy {{discount_amount}} off {{package_name}} with code {{promo_code}}.','link','Get Exclusive Deal','["customer_name","package_name","discount_amount","promo_code"]'::jsonb,true,'{"system_seeded":true}'::jsonb),
('Loyalty Offer TH','promotion','line','th','offer','friendly','🌟 สิทธิพิเศษ! รับส่วนลด {{discount_amount}} สำหรับ {{package_name}} ด้วยรหัส {{promo_code}}','link','รับดีลพิเศษ','["customer_name","package_name","discount_amount","promo_code"]'::jsonb,true,'{"system_seeded":true}'::jsonb),
('Referral Invitation EN','promotion','line','en','followup','friendly','Love Mobile11? 💕 Share with friends and earn rewards!','link','Invite Friends','["customer_name"]'::jsonb,true,'{"system_seeded":true}'::jsonb),
('Referral Invitation TH','promotion','line','th','followup','friendly','ชอบ Mobile11? 💕 แชร์ให้เพื่อนและรับรางวัล!','link','เชิญเพื่อน','["customer_name"]'::jsonb,true,'{"system_seeded":true}'::jsonb);