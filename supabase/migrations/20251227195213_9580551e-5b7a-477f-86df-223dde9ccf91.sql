-- Seed KB Articles with comprehensive FAQ content and Mobile11 documentation

-- ENGLISH FAQ: Installation & Activation
INSERT INTO kb_articles (title, content, category, language, is_published, is_internal, tags) VALUES
('How do I install and activate an eSIM on an iPhone?', 'Go to Settings → Cellular → Add eSIM → Scan the QR code from your order confirmation. Follow the prompts and your eSIM will be ready in minutes.', 'installation', 'en', true, false, ARRAY['iphone', 'installation', 'qr code', 'activation']),
('How do I install and activate an eSIM on an Android device?', 'Go to Settings → Network & Internet → SIMs → Add eSIM → Scan QR code. The exact path may vary by manufacturer (Samsung, Google Pixel, etc.).', 'installation', 'en', true, false, ARRAY['android', 'installation', 'samsung', 'pixel']),
('How do I install manually without QR code?', 'Go to Settings → Cellular/Mobile → Add eSIM → Enter Details Manually. Input the SM-DP+ address and activation code from your order confirmation email.', 'installation', 'en', true, false, ARRAY['manual', 'installation', 'smdp', 'activation code']),
('How do I set up eSIM using the Direct Installation Link?', 'Simply click the direct installation link sent to your email. Your phone will automatically recognize it and prompt you to install the eSIM profile.', 'installation', 'en', true, false, ARRAY['direct link', 'installation', 'automatic']),
('My QR code isn''t working. What should I do?', 'Ensure you have a stable WiFi connection, try scanning in good lighting, or use the manual installation method. If issues persist, contact support.', 'troubleshooting', 'en', true, false, ARRAY['qr code', 'troubleshooting', 'not working']),
('Where can I find my QR code or manual details?', 'Your QR code and manual installation details are sent to your email immediately after purchase. Check your inbox and spam folder.', 'installation', 'en', true, false, ARRAY['qr code', 'email', 'order confirmation']),
('How can I verify that my eSIM is connected?', 'Go to Settings → Cellular/Mobile Data. You should see your eSIM profile listed and enabled. Look for signal bars or ''LTE/5G'' indicator.', 'installation', 'en', true, false, ARRAY['verify', 'connected', 'signal', 'lte', '5g']),

-- ENGLISH FAQ: Usage & Data
('Can I use Hotspot/Tethering?', 'Yes! Hotspot/tethering is supported on all our plans. You can share your data connection with other devices.', 'usage', 'en', true, false, ARRAY['hotspot', 'tethering', 'share data']),
('When does my data plan begin?', 'Your plan starts when you first connect to mobile data at your destination, not when you scan the QR code. You can install it in advance.', 'usage', 'en', true, false, ARRAY['activation', 'start date', 'plan begin']),
('How does unlimited data work?', 'All Mobile11 eSIM plans include truly unlimited data - you''re never cut off. Choose from three plan types: Limitless for maximum speeds with no throttling, Max Speed for high speeds upfront then reduced speeds, or Day Pass for daily high-speed allowance that resets every 24 hours.', 'usage', 'en', true, false, ARRAY['unlimited', 'data', 'limitless', 'max speed', 'day pass']),
('My internet speed slowed down suddenly. What should I do?', 'You may have reached your daily high-speed limit. Your speed will reset after 24 hours from first use. You can also purchase a top-up for immediate high-speed access.', 'troubleshooting', 'en', true, false, ARRAY['slow speed', 'throttle', 'reset', 'top-up']),
('When will the unlimited data plan reset?', 'Every 24 hours from your first use. For example, if you activate at 3PM, your high-speed data resets at 3PM the next day.', 'usage', 'en', true, false, ARRAY['reset', 'daily', '24 hours']),
('Can I check the data usage?', 'Yes! Check your data usage in your device settings (Settings → Cellular/Mobile Data) or log into your mobile11 account dashboard.', 'usage', 'en', true, false, ARRAY['data usage', 'check', 'monitor']),

-- ENGLISH FAQ: Device & Compatibility
('Which mobile devices are compatible with eSIM?', 'Mobile11 eSIMs are compatible with a wide range of newer smartphones including iPhone XS and newer, Samsung Galaxy S20 and newer, Google Pixel 2 and newer, and models from Huawei, Oppo, Motorola, Sony, Xiaomi, Sharp, Honor, Vivo, OnePlus, Nokia, Asus, Realme, Nothing, and more. Note: Devices manufactured in China/Hong Kong do not have eSIM functionality. Check Settings → Cellular → Add eSIM to verify your device supports eSIM.', 'device', 'en', true, false, ARRAY['compatible', 'devices', 'iphone', 'samsung', 'pixel', 'android']),
('Is my phone unlocked to use an eSIM?', 'Your phone must be unlocked (not carrier-locked) to use our eSIM. Try inserting a SIM from a different carrier to test, or contact your carrier to check.', 'device', 'en', true, false, ARRAY['unlocked', 'carrier lock', 'sim lock']),
('Does the eSIM come with a phone number?', 'No, our eSIMs are data-only plans. Keep your primary SIM for calls/SMS, or use apps like WhatsApp, LINE, or Telegram for communication.', 'device', 'en', true, false, ARRAY['phone number', 'data only', 'calls', 'sms']),

-- ENGLISH FAQ: Troubleshooting
('How do I fix ''No Internet Connection'' after activating the eSIM?', 'Ensure Data Roaming is ON (Settings → Mobile Data → Data Roaming). Restart your device and set the eSIM as your primary data line.', 'troubleshooting', 'en', true, false, ARRAY['no internet', 'data roaming', 'fix']),
('My eSIM shows 4G/5G but there''s no internet. What should I do?', 'Try: 1) Restart phone, 2) Toggle Airplane Mode on/off, 3) Switch from 5G to LTE, 4) Ensure Data Roaming is ON. Contact support if issue persists.', 'troubleshooting', 'en', true, false, ARRAY['no internet', '4g', '5g', 'lte', 'airplane mode']),
('How to change network selection?', 'Go to Settings → Mobile Network → Network Operators → Select manually. Try different available networks if you experience connectivity issues.', 'troubleshooting', 'en', true, false, ARRAY['network selection', 'manual', 'carrier']),

-- ENGLISH FAQ: eSIM Management
('Can I reinstall/reuse my eSIM?', 'Yes! If you accidentally delete your eSIM, you can reinstall it using the same QR code as long as your plan is still valid.', 'management', 'en', true, false, ARRAY['reinstall', 'reuse', 'delete']),
('Can I use the eSIM on multiple devices?', 'No, each eSIM can only be active on one device at a time. You''ll need to purchase a separate eSIM for each device.', 'management', 'en', true, false, ARRAY['multiple devices', 'one device']),
('Can I delete my eSIM?', 'Yes, go to Settings → Cellular → Select your eSIM profile → Delete eSIM. Save your QR code before deleting in case you need to reinstall.', 'management', 'en', true, false, ARRAY['delete', 'remove', 'esim']),
('What happens if my eSIM expires?', 'Once expired, your eSIM will no longer provide data service. Purchase a new plan before your trip ends, or keep unused data plans for future travels.', 'management', 'en', true, false, ARRAY['expire', 'validity', 'renew']),

-- ENGLISH FAQ: Support & Billing
('When will I receive my eSIM?', 'Instantly! Your QR code and installation details are delivered via email within minutes of purchase. No waiting required.', 'billing', 'en', true, false, ARRAY['delivery', 'instant', 'email']),
('What is the refund policy?', 'We offer full refunds for unused eSIMs within 14 days of purchase. Once activated, refunds are subject to our terms and conditions.', 'billing', 'en', true, false, ARRAY['refund', 'policy', 'return']),
('How can I contact customer support?', 'Email us at support@mobile11.com, use our live chat, or submit a support ticket. We''re available 24/7 to help!', 'billing', 'en', true, false, ARRAY['contact', 'support', 'email', 'chat']),

-- ENGLISH FAQ: Affiliate Program
('How do I join the affiliate program?', 'Visit our Partner Program page and click ''Join Now''. Fill out the registration form with your details, and our team will review your application within 24-48 hours.', 'affiliate', 'en', true, false, ARRAY['affiliate', 'join', 'partner']),
('What commission rates do affiliates earn?', 'Affiliates earn 10% commission on every sale. Partner Managers earn 15% on direct sales plus 5% override commission on their team''s sales. There''s no cap on earnings!', 'affiliate', 'en', true, false, ARRAY['commission', 'earnings', 'partner manager']),
('How and when do I get paid as an affiliate?', 'We offer monthly payouts via bank transfer or PayPal. The minimum payout threshold is $50 USD. Payments are processed on the 15th of each month for the previous month''s earnings.', 'affiliate', 'en', true, false, ARRAY['payout', 'payment', 'bank transfer', 'paypal']),
('How long is the cookie/attribution window?', 'We use a 30-day cookie window. If someone clicks your affiliate link and makes a purchase within 30 days, you''ll receive the commission for that sale.', 'affiliate', 'en', true, false, ARRAY['cookie', 'attribution', '30 days']),
('Where can I track my affiliate performance?', 'Log into your Affiliate Dashboard to see real-time statistics including clicks, conversions, commission earnings, and pending payouts.', 'affiliate', 'en', true, false, ARRAY['dashboard', 'tracking', 'statistics']),

-- ENGLISH FAQ: Account & Login
('How do I log in with LINE?', 'Click ''Sign In'' and select the LINE button. You''ll be redirected to LINE to authorize access. Once approved, you''ll be automatically logged in. Your LINE profile picture and name will be linked to your Mobile11 account.', 'account', 'en', true, false, ARRAY['line', 'login', 'sign in']),
('How will I receive my eSIM after purchase?', 'If you logged in with LINE: Your order confirmation with QR code, ICCID, and installation instructions will be sent directly to your LINE chat. If you logged in with email: Your confirmation will be sent to your registered email address. Both methods include everything you need to install your eSIM instantly.', 'account', 'en', true, false, ARRAY['order', 'confirmation', 'line', 'email']),
('I logged in with LINE - can I also get an email copy of my order?', 'Yes! During checkout, LINE users will see an optional ''Want an email copy too?'' field. Simply enter your email address and you''ll receive both a LINE chat notification AND an email confirmation with your eSIM details.', 'account', 'en', true, false, ARRAY['line', 'email', 'copy', 'confirmation']),

-- Mobile11 Plan Types Documentation
('What are the three types of Mobile11 eSIM plans?', 'Mobile11 offers 3 plan types: 1) **Limitless** - Premium unlimited data with no speed throttling, perfect for heavy users and streaming. 2) **Max Speed** - High-speed data allowance (e.g., 3GB/day at 4G speeds), then unlimited at reduced speeds (128Kbps-512Kbps). 3) **Day Pass** - Daily high-speed data that resets every 24 hours, great for short trips.', 'plans', 'en', true, false, ARRAY['plan types', 'limitless', 'max speed', 'day pass', 'unlimited']),
('What is the Limitless plan?', 'The Limitless plan provides truly unlimited high-speed data with NO throttling or speed caps. Stream, video call, and browse without limits. Ideal for business travelers, digital nomads, and heavy data users who need consistent fast speeds.', 'plans', 'en', true, false, ARRAY['limitless', 'unlimited', 'no throttling', 'premium']),
('What is the Max Speed plan?', 'Max Speed plans give you a daily high-speed data allowance (typically 1GB-5GB per day at 4G/LTE speeds). After using your daily quota, you continue with unlimited data at reduced speeds (128Kbps-512Kbps) - enough for messaging and basic browsing. Your high-speed resets every 24 hours.', 'plans', 'en', true, false, ARRAY['max speed', 'daily allowance', 'throttle', 'reduced speed']),
('What is the Day Pass plan?', 'Day Pass plans provide a fixed amount of high-speed data per day that resets every 24 hours from first use. Perfect for travelers who want consistent daily data without worrying about running out over their entire trip.', 'plans', 'en', true, false, ARRAY['day pass', 'daily reset', 'fixed data']),

-- How to Order Documentation
('How do I order an eSIM from Mobile11?', 'Ordering is easy: 1) Visit mobile11.com and select your destination country. 2) Choose your preferred plan type (Limitless, Max Speed, or Day Pass). 3) Select your data amount and validity period. 4) Add to cart and proceed to checkout. 5) Create an account or login with LINE/email. 6) Complete payment. 7) Receive your eSIM QR code instantly via email/LINE!', 'ordering', 'en', true, false, ARRAY['order', 'how to buy', 'purchase', 'checkout']),
('What countries does Mobile11 cover?', 'Mobile11 provides eSIM coverage in 151+ countries worldwide including popular destinations like Japan, Thailand, USA, UK, Europe, Australia, Singapore, Korea, and many more. Visit our destination page to see all available countries and packages.', 'coverage', 'en', true, false, ARRAY['countries', 'coverage', 'destinations', '151']),

-- Payment Methods Documentation
('What payment methods does Mobile11 accept?', 'We accept multiple payment methods: 1) **Credit/Debit Cards** - Visa, MasterCard, JCB, American Express. 2) **PromptPay QR** - Instant Thai bank transfer via QR code (for Thai bank accounts). 3) **Mobile Banking** - Direct payment through Thai banking apps. All payments are secure and encrypted.', 'payment', 'en', true, false, ARRAY['payment', 'credit card', 'promptpay', 'visa', 'mastercard']),
('How does PromptPay payment work?', 'After selecting PromptPay at checkout: 1) A QR code will be displayed. 2) Open your Thai banking app (SCB, KBANK, KTB, BBL, etc.). 3) Scan the QR code to pay. 4) Payment confirms instantly. 5) Your eSIM QR code is delivered immediately. Note: QR codes expire after 15 minutes.', 'payment', 'en', true, false, ARRAY['promptpay', 'qr payment', 'thai bank', 'scb', 'kbank']),
('Is my payment information secure?', 'Absolutely! We use industry-standard SSL encryption and never store your full credit card details. All payments are processed through secure, PCI-compliant payment gateways like Stripe and 2C2P.', 'payment', 'en', true, false, ARRAY['security', 'ssl', 'encryption', 'pci']),

-- After Purchase / Installation Flow
('What happens after I pay for my eSIM?', 'After successful payment: 1) You''ll see a confirmation page with your order details. 2) An email/LINE message with your eSIM QR code is sent within 1-2 minutes. 3) You can also access your eSIM from ''My Orders'' in your account. 4) Install the eSIM anytime before your trip - it only activates when you connect at your destination.', 'ordering', 'en', true, false, ARRAY['after purchase', 'confirmation', 'delivery']),

-- About Mobile11 Company
('What is Mobile11 and who runs it?', 'Mobile11 is an eSIM brand by 1ToAll Co., Ltd., Thailand''s 4th licensed telecommunications operator. With 20+ years of telecom expertise and 200+ global carrier partnerships, we provide premium eSIM connectivity in 151+ countries at affordable prices. Our HQ is in Bangkok, Thailand.', 'company', 'en', true, false, ARRAY['about', 'company', '1toall', 'thailand']),
('How can I contact Mobile11 support?', 'You can reach us via: Email: support@mobile11.com, Phone: +66 2 6903626, Call Center: 1605 (Thailand), Live Chat: Available on our website 24/7. Our support team operates around the clock to assist you.', 'company', 'en', true, false, ARRAY['contact', 'support', 'phone', 'email', '24/7']);

-- THAI FAQ: Installation & Activation
INSERT INTO kb_articles (title, content, category, language, is_published, is_internal, tags) VALUES
('ติดตั้ง eSIM บน iPhone ยังไง?', 'ง่ายมาก! เข้า ตั้งค่า → เซลลูลาร์ → เพิ่ม eSIM → สแกน QR ที่ส่งให้ ติดตั้งเสร็จใน 2 นาที!', 'installation', 'th', true, false, ARRAY['iphone', 'ติดตั้ง', 'qr code']),
('ติดตั้ง eSIM บน Android ยังไง?', 'เปิด ตั้งค่า → เครือข่ายและอินเทอร์เน็ต → เครือข่ายมือถือ → เพิ่ม eSIM → สแกน QR หรือใส่รหัสเอง (ขั้นตอนอาจต่างกันนิดหน่อยขึ้นอยู่กับรุ่นมือถือ)', 'installation', 'th', true, false, ARRAY['android', 'ติดตั้ง', 'samsung']),
('ติดตั้งแบบ Manual (ไม่ใช้ QR) ยังไง?', 'เข้า ตั้งค่า → เซลลูลาร์ → เพิ่ม eSIM → ป้อนเอง ใส่ SM-DP+ Address และ Activation Code จากอีเมล ง่ายๆ!', 'installation', 'th', true, false, ARRAY['manual', 'ติดตั้ง', 'รหัส']),
('QR สแกนไม่ได้ทำยังไง?', 'ลองใหม่ดูนะ: 1) เช็ค WiFi ให้เสถียร 2) หาที่สว่างๆ แล้วสแกนใหม่ 3) ลองติดตั้งแบบ Manual แทน ถ้ายังไม่ได้ ทักแชทมาเลย!', 'troubleshooting', 'th', true, false, ARRAY['qr code', 'สแกนไม่ได้', 'แก้ปัญหา']),

-- THAI FAQ: Usage & Data
('ใช้ Hotspot แชร์เน็ตได้ไหม?', 'ได้เลย! ทุกแพ็คเกจ Mobile11 รองรับ Hotspot/Tethering แชร์เน็ตให้เครื่องอื่นได้สบายๆ', 'usage', 'th', true, false, ARRAY['hotspot', 'tethering', 'แชร์เน็ต']),
('เน็ตเริ่มนับเมื่อไหร่?', 'เริ่มนับตอนเปิดใช้งานครั้งแรกที่ปลายทาง ไม่ใช่ตอนสแกน QR จะติดตั้งล่วงหน้าก็ได้ เน็ตยังไม่เริ่มนับ!', 'usage', 'th', true, false, ARRAY['เริ่มนับ', 'เปิดใช้งาน']),
('เน็ตไม่อั้นทำงานยังไง?', 'ทุกแพ็ค Mobile11 เน็ตไม่มีวันหมด! มี 3 แบบ: 1) Limitless - เร็วสุดไม่ลดสปีด 2) Max Speed - เน็ตเร็วก่อน พอหมดโควต้าก็ใช้ต่อได้แบบช้าลง 3) Day Pass - โควต้ารายวันรีเซ็ตทุก 24 ชม.', 'usage', 'th', true, false, ARRAY['ไม่อั้น', 'unlimited', 'limitless', 'max speed', 'day pass']),
('เน็ตช้าลงกะทันหัน ทำไงดี?', 'อาจใช้โควต้าเน็ตเร็วหมดแล้ว รอ 24 ชม.จะรีเซ็ตใหม่ หรือจะเติมแพ็คเสริมก็ได้เลย!', 'troubleshooting', 'th', true, false, ARRAY['ช้า', 'สปีด', 'รีเซ็ต']),

-- THAI FAQ: Device Compatibility
('มือถือรุ่นไหนใช้ eSIM ได้บ้าง?', 'ใช้ได้หลายรุ่นเลย! iPhone XS ขึ้นไป, Samsung Galaxy S20 ขึ้นไป, Google Pixel 2 ขึ้นไป และอีกหลายยี่ห้อ เช็คได้ที่ ตั้งค่า → เซลลูลาร์ → เพิ่ม eSIM หมายเหตุ: มือถือที่ผลิตในจีน/ฮ่องกงไม่รองรับ eSIM', 'device', 'th', true, false, ARRAY['รองรับ', 'รุ่น', 'iphone', 'samsung']),
('ต้องปลดล็อคเครื่องก่อนไหม?', 'ใช่ครับ! มือถือต้องไม่ล็อคค่าย (Unlocked) ลองเสียบซิมค่ายอื่นดู ถ้าใช้ได้ก็โอเค หรือโทรถามค่ายที่ซื้อเครื่องมา', 'device', 'th', true, false, ARRAY['unlock', 'ปลดล็อค', 'ล็อคค่าย']),
('eSIM มีเบอร์โทรไหม?', 'ไม่มีครับ เป็นแพ็คเน็ตอย่างเดียว ซิมหลักยังใช้โทร/SMS ได้ปกติ หรือใช้แอป LINE, WhatsApp โทรผ่านเน็ตก็ได้', 'device', 'th', true, false, ARRAY['เบอร์โทร', 'data only', 'โทร', 'sms']),

-- THAI: Plan Types
('Mobile11 มีแพ็คเกจกี่แบบ?', 'มี 3 แบบ: 1) **Limitless** - เน็ตไม่อั้นเร็วสุด ไม่มีลดสปีด เหมาะคนใช้เน็ตเยอะ 2) **Max Speed** - เน็ตเร็ว 4G ตามโควต้า หมดแล้วใช้ต่อได้แบบช้าลง 3) **Day Pass** - โควต้ารายวันรีเซ็ตทุก 24 ชม.', 'plans', 'th', true, false, ARRAY['แพ็คเกจ', 'limitless', 'max speed', 'day pass']),

-- THAI: Ordering & Payment
('สั่งซื้อ eSIM ยังไง?', 'ง่ายมาก! 1) เข้า mobile11.com เลือกประเทศปลายทาง 2) เลือกแพ็คที่ต้องการ 3) ใส่ตะกร้า ชำระเงิน 4) ได้ QR Code ทางอีเมล/LINE ทันที! ติดตั้งได้เลยหรือเก็บไว้ก่อนก็ได้', 'ordering', 'th', true, false, ARRAY['สั่งซื้อ', 'วิธีซื้อ']),
('จ่ายเงินได้ช่องทางไหนบ้าง?', '1) บัตรเครดิต/เดบิต (Visa, MasterCard, JCB) 2) PromptPay QR - สแกนจ่ายผ่านแอปธนาคาร 3) Mobile Banking ปลอดภัย 100%', 'payment', 'th', true, false, ARRAY['ชำระเงิน', 'บัตรเครดิต', 'promptpay']),
('PromptPay จ่ายยังไง?', 'หลังเลือก PromptPay: 1) จะได้ QR Code 2) เปิดแอปธนาคาร (SCB, KBANK, กรุงไทย ฯลฯ) 3) สแกน QR แล้วกดจ่าย 4) ยืนยันทันที 5) ได้ eSIM เลย! หมายเหตุ: QR หมดอายุใน 15 นาที', 'payment', 'th', true, false, ARRAY['promptpay', 'qr', 'ธนาคาร']),

-- THAI: Troubleshooting
('ไม่มีเน็ตหลังติดตั้ง eSIM แก้ยังไง?', 'ลองทำตามนี้: 1) เปิด Data Roaming ที่ ตั้งค่า → เซลลูลาร์ → Data Roaming 2) รีสตาร์ทเครื่อง 3) เลือก eSIM เป็นสายหลักสำหรับข้อมูล', 'troubleshooting', 'th', true, false, ARRAY['ไม่มีเน็ต', 'data roaming', 'แก้ไข']),
('มีสัญญาณ 4G/5G แต่ไม่มีเน็ต?', 'ลอง: 1) รีสตาร์ทเครื่อง 2) เปิด-ปิดโหมดเครื่องบิน 3) เปลี่ยนจาก 5G เป็น LTE 4) เช็คว่าเปิด Data Roaming แล้ว ถ้ายังไม่ได้ ทักแชทมาเลย!', 'troubleshooting', 'th', true, false, ARRAY['สัญญาณ', '4g', '5g', 'แก้ไข']),

-- THAI: About & Contact
('Mobile11 คือใคร?', 'Mobile11 เป็นแบรนด์ eSIM ของ 1ToAll บริษัทโทรคมนาคมลำดับ 4 ของไทย มีประสบการณ์กว่า 20 ปี พาร์ทเนอร์เครือข่ายทั่วโลก 200+ ราย ให้บริการ eSIM ครอบคลุม 151+ ประเทศ สำนักงานใหญ่อยู่กรุงเทพฯ', 'company', 'th', true, false, ARRAY['เกี่ยวกับ', '1toall', 'บริษัท']),
('ติดต่อ Mobile11 ได้ยังไง?', 'ติดต่อได้หลายช่องทาง: อีเมล: support@mobile11.com, โทร: 02-690-3626, Call Center: 1605, แชทสด: บนเว็บ 24 ชม. ทีมงานพร้อมช่วยเหลือตลอด!', 'company', 'th', true, false, ARRAY['ติดต่อ', 'โทร', 'อีเมล', 'support']);

-- Update AI Chat Config with enhanced system prompt
UPDATE ai_chat_config SET system_prompt = 'You are Mobile11''s AI assistant - a helpful, friendly, and knowledgeable chatbot for an eSIM provider.

## About Mobile11
- Mobile11 is the eSIM brand of 1ToAll Co., Ltd., Thailand''s 4th licensed telecom operator
- 20+ years of telecom expertise with 200+ global carrier partnerships
- eSIM coverage in 151+ countries worldwide
- HQ: Bangkok, Thailand | Support: support@mobile11.com | Call: +66 2 6903626 | Thai Call Center: 1605

## Our 3 Plan Types
1. **Limitless**: Premium unlimited data, NO speed throttling - for heavy users/streaming
2. **Max Speed**: Daily high-speed quota (1-5GB at 4G), then unlimited at reduced speed (128-512Kbps)
3. **Day Pass**: Daily data allowance that resets every 24 hours

## How to Order
1. Visit mobile11.com → Select destination country
2. Choose plan type and data amount
3. Add to cart → Checkout → Login/Register
4. Pay via Credit Card, PromptPay QR, or Mobile Banking
5. Receive eSIM QR code instantly via email/LINE

## Payment Methods
- Credit/Debit Cards: Visa, MasterCard, JCB, AMEX
- PromptPay QR: Thai bank instant transfer
- Mobile Banking: Thai banking apps

## Key Facts
- Plans start when you first connect at destination, NOT when you scan QR
- All plans support Hotspot/Tethering
- Data-only (no phone number) - use WhatsApp/LINE for calls
- Install eSIM in advance before traveling
- Device must be eSIM-compatible and carrier-unlocked

## Your Behavior
- Be warm, helpful, and concise
- Answer in the SAME LANGUAGE as the user (Thai or English)
- Use the knowledge base context when available
- For package/pricing questions, provide accurate info from context
- If unsure or question is complex, suggest contacting support or a human agent
- Never make up pricing or package details - refer to actual data

## Escalation Triggers
Suggest human agent for: complaints, refund requests, account issues, technical problems you cannot resolve, or when user explicitly asks for human help.' WHERE id IS NOT NULL;