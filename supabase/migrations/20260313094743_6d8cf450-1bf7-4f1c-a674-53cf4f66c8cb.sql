
-- Insert core product knowledge as kb_articles so both voice bot and chatbot share the same source of truth
-- Category: bot-core-knowledge, source: both, is_internal: false

INSERT INTO kb_articles (title, content, category, language, source, is_published, is_internal, slug, display_order) VALUES

-- 1. Packages overview
('Package Types', '## PACKAGES — RECOMMEND ONLY Unlimited & Value
- Unlimited: Best for streaming & heavy use. RECOMMEND for heavy users.
- Value: Daily data quota at full speed, resets every 24 hours. Perfect for normal everyday usage including social media, maps, and occasional video. RECOMMEND as default.
- Lite (Pay-per-use): Fixed total data quota. Only mention if customer asks for cheapest/budget option. NEVER suggest proactively.
Thai names: "Value (คุ้มค่า)", "Unlimited (ไม่จำกัด)", "Lite (ประหยัด)"', 'bot-core-knowledge', 'en', 'both', true, false, 'package-types', 1),

('Package Types', '## แพ็กเกจ — แนะนำ Unlimited & Value เท่านั้น
- Unlimited (ไม่จำกัด): ดีที่สุดสำหรับสตรีม & ใช้งานหนัก แนะนำสำหรับผู้ใช้งานหนัก
- Value (คุ้มค่า): โควต้ารายวัน รีเซ็ตทุก 24 ชม. เหมาะสำหรับโซเชียล แผนที่ วิดีโอ แนะนำเป็นค่าเริ่มต้น
- Lite (ประหยัด): โควต้าข้อมูลรวม พูดถึงเฉพาะเมื่อลูกค้าถามตัวเลือกประหยัด', 'bot-core-knowledge', 'th', 'both', true, false, 'package-types', 1),

-- 2. Value usage estimates
('Value Package Usage Estimates', '## VALUE (DAY_PASS) USAGE ESTIMATES
When customer asks what they can do with Value plan or which tier to choose:

5GB/day: Heavy use — Facebook/LINE all day, TikTok/Instagram 6-8 hrs, YouTube 3-8 hrs, can share hotspot
3GB/day: Normal use — Facebook all day, TikTok/Instagram 4-6 hrs, YouTube 2-5 hrs, chat/maps/browse comfortably
1GB/day: Light use — Facebook/chat/LINE/maps 1-2 hrs, TikTok/Instagram 30-60 min, YouTube 30-120 min

Always add disclaimer: actual usage depends on content type and video quality.', 'bot-core-knowledge', 'en', 'both', true, false, 'value-usage-estimates', 2),

('Value Package Usage Estimates', '## การประมาณการใช้งาน Value (DAY_PASS)
เมื่อลูกค้าถามว่าแพลน Value ใช้อะไรได้บ้าง:

5GB/วัน: ใช้งานหนัก — เล่น Facebook/LINE ตลอดวัน, ดูวิดีโอ TikTok/Instagram 6-8 ชม., YouTube 3-8 ชม., แชร์ Hotspot ได้
3GB/วัน: ใช้งานปกติ — Facebook ได้ทั้งวัน, TikTok/Instagram 4-6 ชม., YouTube 2-5 ชม., แชต/แผนที่สบาย
1GB/วัน: ใช้งานเบา — Facebook/แชต/LINE/แผนที่ 1-2 ชม., TikTok 30-60 นาที, YouTube 30-120 นาที

ปริมาณจริงขึ้นอยู่กับประเภทเนื้อหาและคุณภาพวิดีโอ', 'bot-core-knowledge', 'th', 'both', true, false, 'value-usage-estimates', 2),

-- 3. Pricing guidance
('Pricing Guidance', '## PRICING GUIDANCE
- Value packages typically start from $2/day (฿70/day) for popular destinations
- Unlimited packages typically start from $4/day (฿140/day) for popular destinations
- For exact pricing, direct customer to the country page on mobile11.com', 'bot-core-knowledge', 'en', 'both', true, false, 'pricing-guidance', 3),

('Pricing Guidance', '## ราคาเบื้องต้น
- แพ็กเกจ Value เริ่มต้นประมาณ $2/วัน (฿70/วัน) สำหรับจุดหมายยอดนิยม
- แพ็กเกจ Unlimited เริ่มต้นประมาณ $4/วัน (฿140/วัน) สำหรับจุดหมายยอดนิยม
- ราคาที่แน่นอน ให้ดูที่หน้าประเทศบน mobile11.com', 'bot-core-knowledge', 'th', 'both', true, false, 'pricing-guidance', 3),

-- 4. Country page URLs
('Country Page URLs', '## COUNTRY PAGE URLS
When a customer mentions a destination, you can reference the country page:
- Format: https://mobile11.com/esim/{country-name-lowercase}
- Examples: https://mobile11.com/esim/japan, https://mobile11.com/esim/thailand, https://mobile11.com/esim/korea
- For voice: say "you can check prices on mobile11.com, search for {country}"
- For chatbot transcript: include the clickable URL in the text for customers to visit', 'bot-core-knowledge', 'en', 'both', true, false, 'country-page-urls', 4),

('Country Page URLs', '## ลิงก์หน้าประเทศ
เมื่อลูกค้าพูดถึงจุดหมาย ให้อ้างอิงหน้าประเทศ:
- รูปแบบ: https://mobile11.com/esim/{ชื่อประเทศภาษาอังกฤษ}
- ตัวอย่าง: https://mobile11.com/esim/japan, https://mobile11.com/esim/thailand, https://mobile11.com/esim/korea
- สำหรับเสียง: พูดว่า "ดูราคาได้ที่ mobile11.com ค้นหาชื่อประเทศได้เลยค่ะ"
- สำหรับแชท: ใส่ลิงก์ URL ให้ลูกค้ากดได้', 'bot-core-knowledge', 'th', 'both', true, false, 'country-page-urls', 4),

-- 5. Unlimited FUP
('Unlimited Fair Usage Policy', '## UNLIMITED FAIR USAGE POLICY (FUP)
If customer asks whether Unlimited speed is capped or limited:
- We normally do NOT cap speed. You get full network speed.
- However, with very heavy usage, speed may temporarily be reduced under a Fair Usage Policy. This is standard across all eSIMs worldwide, not just Mobile11.
- After a few hours the speed goes back to normal automatically.
- For normal usage like streaming, video calls, social media, they will never notice any difference.
- DOCOMO (Japan): reduced to 2 Mbps if triggered, resets within 24 hours.
- Other carriers: reduced to 5 Mbps if triggered, resets within 24 hours.
- Hotspot/tethering is fully supported.', 'bot-core-knowledge', 'en', 'both', true, false, 'unlimited-fup', 5),

-- 6. Loyalty
('Loyalty Program', '## LOYALTY: Mobile11 Money (cashback, NOT points)
- Currency: Mobile11 Money (cashback credits, NOT points)
- Tiers: Explorer (5% cashback), Silver Explorer ($50 spent, 7%), Gold Explorer ($100 spent, 10%), Platinum Explorer ($200 spent, 15%)
- Cashback earned on purchases WITHOUT discount/referral codes
- Mobile11 Money expires after 1 year of inactivity
- NEVER use terms: "M-Points", "loyalty points", "reward points"', 'bot-core-knowledge', 'en', 'both', true, false, 'loyalty-program', 6),

-- 7. Refund policy
('Refund Policy', '## REFUND POLICY
- Full refund: ONLY if eSIM has NOT been installed yet
- Full refund: Technical issues preventing installation (verified by team)
- NO refund: eSIM installed and activated, or any data consumed
- NO refund: QR code revealed/downloaded
- Processing: 5-10 business days', 'bot-core-knowledge', 'en', 'both', true, false, 'refund-policy', 7),

-- 8. Payment methods
('Payment Methods', '## PAYMENT METHODS
- Credit/Debit cards (Visa, Mastercard)
- PromptPay (Thai QR payment)
- Mobile11 Money balance', 'bot-core-knowledge', 'en', 'both', true, false, 'payment-methods', 8),

-- 9. Device compatibility
('Device Compatibility', '## DEVICE COMPATIBILITY
- iPhone XS and newer: confirmed eSIM support
- Samsung Galaxy S20 and newer: confirmed
- Google Pixel 3 and newer: confirmed
- For other Android phones: suggest dialing *#06# and looking for a 32-digit EID number
- NEVER confidently state an uncertain device supports eSIM', 'bot-core-knowledge', 'en', 'both', true, false, 'device-compatibility', 9),

-- 10. Special cases (Japan, China)
('Special Country Cases', '## JAPAN SPECIAL CASE
- Two carrier options: DOCOMO (best for rural/countryside) and Softbank/KDDI (best for cities)
- Customers CHOOSE which one — it is NOT auto-selected

## CHINA SPECIAL CASE
- CMCC (TT&GPT): GUARANTEED TikTok and ChatGPT access
- CMCC: Does NOT guarantee TikTok/ChatGPT', 'bot-core-knowledge', 'en', 'both', true, false, 'special-country-cases', 10),

-- 11. Local SIM packages
('Local SIM Packages', '## LOCAL SIM PACKAGES (third-party, NOT sold by Mobile11)
Only mention if customer specifically asks about physical SIM options at destination.
- Thailand: AIS — 35GB for 7 days. KYC REQUIRED before activation.
- USA: T-Mobile — Unlimited data, 7 to 50 days. Requires IMEI2 + EID2 (6-day advance booking).
- Australia: Vodafone — 80GB for 28 days. Includes voice + SMS.
- Israel: Partner/Cellcom — 3GB, 5GB, or 10GB options. KYC REQUIRED.
- Mongolia: Unitel — 8GB to 50GB options.', 'bot-core-knowledge', 'en', 'both', true, false, 'local-sim-packages', 11),

-- 12. Songkran 2026 promotion
('Songkran 2026 Promotion', '## SONGKRAN 2026 PROMOTION (March 14-31, 2026)
- Code: SG2026, 40% off any eSIM package
- Buy now, activate within 180 days
- Only mention between March 14-31, 2026', 'bot-core-knowledge', 'en', 'both', true, false, 'songkran-2026-promo', 12);
