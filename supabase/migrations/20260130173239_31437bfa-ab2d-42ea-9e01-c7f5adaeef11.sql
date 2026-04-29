-- Phase 1: Fix what-is-loyalty-program with correct 4-tier structure (EN)
UPDATE kb_articles 
SET 
  content = '## Program Overview {#overview}

The Mobile11 Loyalty Program rewards you with cashback on every eSIM purchase. Rewards are credited as **Mobile11 Money** to your account automatically.

**Key Benefits:**
- Automatic enrollment with your first purchase
- Cashback credited immediately after each order
- Tiers never expire - only go up!
- Use Mobile11 Money on future purchases

## Loyalty Tiers {#tiers}

Your tier is based on **lifetime spending** (excluding discounts and referral credits):

| Tier | Cashback Rate | Spending Threshold |
|------|---------------|-------------------|
| 🌍 Traveler | 5% | Starting tier |
| ✈️ Silver Traveler | 6% | $20 USD spent |
| 🥇 Gold Traveler | 7% | $70 USD spent |
| 💎 Platinum Traveler | 10% | $200 USD spent |

## How It Works {#how-it-works}

1. **Make a purchase** - Buy any eSIM package
2. **Earn cashback** - Automatically calculated based on your tier
3. **Get Mobile11 Money** - Credited to your account instantly
4. **Use it** - Apply to future purchases (min $1.00 balance required)

## Important Rules {#rules}

- **No cashback with discounts**: If you use a promo code or referral discount, you will not earn cashback on that order
- **Tier calculation**: Based on order amounts before discounts
- **Expiration**: Mobile11 Money expires after 1 year of account inactivity
- **Minimum usage**: $1.00 minimum balance to apply at checkout
- **Reset**: Any new purchase resets the 1-year expiration timer for your entire balance

## Check Your Tier {#check-tier}

1. Log in to your Mobile11 account
2. Go to **Profile** page
3. View your current tier and progress to the next tier

## FAQ {#faq}

### How do I join the loyalty program?
You are automatically enrolled when you create an account. Your first purchase determines your starting tier.

### Can I lose my tier?
No! Your tier is based on lifetime spending and never decreases.

### Why did I not receive cashback?
Cashback is not awarded when using promo codes or referral discounts.

### When does my Mobile11 Money expire?
After 1 year of no purchases. Any new order resets the timer for your entire balance.',
  description = 'Learn about Mobile11 Loyalty Program with 4 tiers: Traveler (5%), Silver (6%), Gold (7%), and Platinum (10%) cashback. Earn Mobile11 Money on every eSIM purchase.',
  table_of_contents = '[{"id":"overview","title":"Program Overview"},{"id":"tiers","title":"Loyalty Tiers"},{"id":"how-it-works","title":"How It Works"},{"id":"rules","title":"Important Rules"},{"id":"check-tier","title":"Check Your Tier"},{"id":"faq","title":"FAQ"}]'::jsonb,
  updated_at = now()
WHERE slug = 'what-is-loyalty-program' 
  AND category = 'account'
  AND language = 'en';

-- Phase 1: Fix what-is-loyalty-program with correct 4-tier structure (TH)
UPDATE kb_articles 
SET 
  content = '## ภาพรวมโปรแกรม {#overview}

โปรแกรมสะสมคะแนน Mobile11 ให้รางวัลเงินคืนสำหรับทุกการซื้อ eSIM รางวัลจะถูกเครดิตเป็น **Mobile11 Money** ในบัญชีของคุณโดยอัตโนมัติ

**สิทธิประโยชน์หลัก:**
- ลงทะเบียนอัตโนมัติเมื่อซื้อครั้งแรก
- เงินคืนเครดิตทันทีหลังสั่งซื้อ
- ระดับไม่มีวันหมดอายุ - มีแต่ขึ้น!
- ใช้ Mobile11 Money ในการซื้อครั้งต่อไป

## ระดับสมาชิก {#tiers}

ระดับของคุณขึ้นอยู่กับ **ยอดใช้จ่ายตลอดอายุการใช้งาน** (ไม่รวมส่วนลดและเครดิตแนะนำเพื่อน):

| ระดับ | อัตราเงินคืน | ยอดใช้จ่ายขั้นต่ำ |
|------|---------------|-------------------|
| 🌍 Traveler | 5% | ระดับเริ่มต้น |
| ✈️ Silver Traveler | 6% | ใช้จ่าย $20 USD |
| 🥇 Gold Traveler | 7% | ใช้จ่าย $70 USD |
| 💎 Platinum Traveler | 10% | ใช้จ่าย $200 USD |

## วิธีการทำงาน {#how-it-works}

1. **ซื้อสินค้า** - ซื้อแพ็กเกจ eSIM ใดก็ได้
2. **รับเงินคืน** - คำนวณอัตโนมัติตามระดับของคุณ
3. **รับ Mobile11 Money** - เครดิตเข้าบัญชีทันที
4. **ใช้งาน** - ใช้ในการซื้อครั้งต่อไป (ต้องมียอดขั้นต่ำ $1.00)

## กฎสำคัญ {#rules}

- **ไม่มีเงินคืนเมื่อใช้ส่วนลด**: หากใช้โค้ดส่วนลดหรือส่วนลดแนะนำเพื่อน จะไม่ได้รับเงินคืนในออเดอร์นั้น
- **การคำนวณระดับ**: อ้างอิงจากยอดสั่งซื้อก่อนหักส่วนลด
- **หมดอายุ**: Mobile11 Money หมดอายุหลังจากไม่มีกิจกรรมในบัญชี 1 ปี
- **การใช้ขั้นต่ำ**: ต้องมียอด $1.00 ขึ้นไปเพื่อใช้ตอนชำระเงิน
- **รีเซ็ต**: การซื้อใหม่จะรีเซ็ตตัวนับ 1 ปีสำหรับยอดคงเหลือทั้งหมด

## ตรวจสอบระดับของคุณ {#check-tier}

1. เข้าสู่ระบบบัญชี Mobile11
2. ไปที่หน้า **โปรไฟล์**
3. ดูระดับปัจจุบันและความคืบหน้าสู่ระดับถัดไป

## คำถามที่พบบ่อย {#faq}

### ฉันจะเข้าร่วมโปรแกรมสะสมคะแนนได้อย่างไร?
คุณลงทะเบียนอัตโนมัติเมื่อสร้างบัญชี การซื้อครั้งแรกกำหนดระดับเริ่มต้น

### ฉันจะเสียระดับได้ไหม?
ไม่! ระดับอ้างอิงจากยอดใช้จ่ายตลอดอายุและไม่มีวันลดลง

### ทำไมฉันไม่ได้รับเงินคืน?
ไม่มีเงินคืนเมื่อใช้โค้ดส่วนลดหรือส่วนลดแนะนำเพื่อน

### Mobile11 Money หมดอายุเมื่อไหร่?
หลังจากไม่มีการซื้อ 1 ปี การสั่งซื้อใหม่จะรีเซ็ตตัวนับสำหรับยอดคงเหลือทั้งหมด',
  description = 'เรียนรู้เกี่ยวกับโปรแกรมสะสมคะแนน Mobile11 ที่มี 4 ระดับ: Traveler (5%), Silver (6%), Gold (7%), และ Platinum (10%) เงินคืน รับ Mobile11 Money ทุกการซื้อ eSIM',
  table_of_contents = '[{"id":"overview","title":"ภาพรวมโปรแกรม"},{"id":"tiers","title":"ระดับสมาชิก"},{"id":"how-it-works","title":"วิธีการทำงาน"},{"id":"rules","title":"กฎสำคัญ"},{"id":"check-tier","title":"ตรวจสอบระดับของคุณ"},{"id":"faq","title":"คำถามที่พบบ่อย"}]'::jsonb,
  updated_at = now()
WHERE slug = 'what-is-loyalty-program' 
  AND category = 'account'
  AND language = 'th';

-- Phase 2: Expand referral-program article (EN)
UPDATE kb_articles 
SET 
  content = '## How the Referral Program Works {#overview}

Share Mobile11 with friends and family. When they make their first purchase, you both earn rewards!

**Your reward:** $5.00 Mobile11 Money
**Friend''s reward:** $5.00 discount on their first order

## How to Get Your Referral Code {#get-code}

1. Log in to your Mobile11 account
2. Go to your **Profile** page
3. Find the **"Refer and Earn"** section
4. Your unique referral code is displayed there
5. Share via email, WhatsApp, Facebook, or copy the link directly

## Earning Rewards {#earning}

You earn **$5.00 Mobile11 Money** when:
- Your friend uses your referral code or link
- They complete their first purchase of **$10 USD or more**
- The reward is credited immediately after their purchase completes

## Terms and Conditions {#terms}

- **Unlimited referrals** - No limit on how many people you can refer
- **Minimum order required** - Friend must spend at least $10 USD
- **Cannot combine discounts** - Referral discount cannot be used with promo codes
- **New customers only** - Friend must be a new Mobile11 customer
- **One-time reward** - You earn the reward only when the referred friend makes their first qualifying purchase

## Where to Find Your Code {#where}

When logged in to Mobile11:
1. Click on your profile icon
2. Navigate to "Refer and Earn" section
3. Copy your unique code or share link directly

## FAQ {#faq}

### Where do I get my referral code?
When you are logged in, find it under "Refer and Earn" in your profile page.

### Is there a limit to how many people I can refer?
No, you can refer unlimited people and earn rewards for each qualifying referral.

### Can my friend combine the referral discount with promo codes?
No, the $5 referral discount cannot be combined with other promotional codes.

### When do I receive my reward?
Your $5.00 Mobile11 Money is credited immediately after your friend completes their first qualifying purchase.

### What if my friend''s order is less than $10?
The referral reward only applies to first orders of $10 USD or more.',
  description = 'Refer friends to Mobile11 and earn $5.00 Mobile11 Money. Your friends get $5.00 off their first eSIM purchase. No limit on referrals!',
  table_of_contents = '[{"id":"overview","title":"How the Referral Program Works"},{"id":"get-code","title":"How to Get Your Referral Code"},{"id":"earning","title":"Earning Rewards"},{"id":"terms","title":"Terms and Conditions"},{"id":"where","title":"Where to Find Your Code"},{"id":"faq","title":"FAQ"}]'::jsonb,
  updated_at = now()
WHERE slug = 'referral-program' 
  AND category = 'account'
  AND language = 'en';

-- Phase 2: Expand referral-program article (TH)
INSERT INTO kb_articles (category, language, slug, title, content, description, table_of_contents, is_published, is_internal, source, display_order)
VALUES (
  'account',
  'th',
  'referral-program',
  'โปรแกรมแนะนำเพื่อน',
  '## โปรแกรมแนะนำเพื่อนทำงานอย่างไร {#overview}

แชร์ Mobile11 กับเพื่อนและครอบครัว เมื่อพวกเขาซื้อครั้งแรก ทั้งคุณและเพื่อนได้รับรางวัล!

**รางวัลของคุณ:** ฿175 Mobile11 Money
**รางวัลของเพื่อน:** ส่วนลด ฿175 สำหรับออเดอร์แรก

## วิธีรับรหัสแนะนำเพื่อน {#get-code}

1. เข้าสู่ระบบบัญชี Mobile11
2. ไปที่หน้า **โปรไฟล์**
3. ค้นหาส่วน **"แนะนำเพื่อนรับเงิน"**
4. รหัสแนะนำเพื่อนเฉพาะของคุณจะแสดงที่นั่น
5. แชร์ผ่านอีเมล, WhatsApp, Facebook หรือคัดลอกลิงก์โดยตรง

## การรับรางวัล {#earning}

คุณได้รับ **฿175 Mobile11 Money** เมื่อ:
- เพื่อนใช้รหัสหรือลิงก์แนะนำของคุณ
- พวกเขาซื้อครั้งแรกมูลค่า **$10 USD ขึ้นไป**
- รางวัลเครดิตทันทีหลังจากการซื้อเสร็จสมบูรณ์

## ข้อกำหนดและเงื่อนไข {#terms}

- **แนะนำได้ไม่จำกัด** - ไม่มีข้อจำกัดจำนวนคนที่คุณแนะนำ
- **ออเดอร์ขั้นต่ำ** - เพื่อนต้องใช้จ่ายอย่างน้อย $10 USD
- **ไม่สามารถรวมส่วนลด** - ส่วนลดแนะนำเพื่อนไม่สามารถใช้กับโค้ดโปรโมชั่น
- **ลูกค้าใหม่เท่านั้น** - เพื่อนต้องเป็นลูกค้าใหม่ของ Mobile11
- **รางวัลครั้งเดียว** - คุณได้รับรางวัลเมื่อเพื่อนซื้อครั้งแรกที่ผ่านเกณฑ์เท่านั้น

## หารหัสของคุณได้ที่ไหน {#where}

เมื่อเข้าสู่ระบบ Mobile11:
1. คลิกที่ไอคอนโปรไฟล์
2. ไปที่ส่วน "แนะนำเพื่อนรับเงิน"
3. คัดลอกรหัสเฉพาะหรือแชร์ลิงก์โดยตรง

## คำถามที่พบบ่อย {#faq}

### ฉันจะหารหัสแนะนำเพื่อนได้ที่ไหน?
เมื่อเข้าสู่ระบบ ค้นหาใต้ "แนะนำเพื่อนรับเงิน" ในหน้าโปรไฟล์

### มีข้อจำกัดจำนวนคนที่แนะนำได้ไหม?
ไม่มี คุณสามารถแนะนำได้ไม่จำกัดและรับรางวัลสำหรับทุกการแนะนำที่ผ่านเกณฑ์

### เพื่อนสามารถรวมส่วนลดแนะนำกับโค้ดโปรโมชั่นได้ไหม?
ไม่ได้ ส่วนลด ฿175 ไม่สามารถใช้ร่วมกับโค้ดโปรโมชั่นอื่น

### ฉันจะได้รับรางวัลเมื่อไหร่?
฿175 Mobile11 Money เครดิตทันทีหลังจากเพื่อนซื้อครั้งแรกที่ผ่านเกณฑ์

### ถ้าออเดอร์ของเพื่อนน้อยกว่า $10 ล่ะ?
รางวัลแนะนำเพื่อนใช้ได้กับออเดอร์แรกที่มีมูลค่า $10 USD ขึ้นไปเท่านั้น',
  'แนะนำเพื่อนมาใช้ Mobile11 รับ ฿175 Mobile11 Money เพื่อนของคุณก็ได้ส่วนลด ฿175 สำหรับการซื้อ eSIM ครั้งแรก แนะนำได้ไม่จำกัด!',
  '[{"id":"overview","title":"โปรแกรมแนะนำเพื่อนทำงานอย่างไร"},{"id":"get-code","title":"วิธีรับรหัสแนะนำเพื่อน"},{"id":"earning","title":"การรับรางวัล"},{"id":"terms","title":"ข้อกำหนดและเงื่อนไข"},{"id":"where","title":"หารหัสของคุณได้ที่ไหน"},{"id":"faq","title":"คำถามที่พบบ่อย"}]'::jsonb,
  true,
  false,
  'both',
  10
)
ON CONFLICT (slug, category, language) 
DO UPDATE SET
  content = EXCLUDED.content,
  description = EXCLUDED.description,
  table_of_contents = EXCLUDED.table_of_contents,
  updated_at = now();

-- Phase 3: Unpublish legacy duplicate articles
UPDATE kb_articles 
SET is_published = false, updated_at = now()
WHERE slug = 'mobile11-loyalty-program' AND category = 'account';

-- Phase 4: Fix navigation paths in trusted-devices (EN) - remove non-existent Settings > Security path
UPDATE kb_articles
SET content = '## Overview {#overview}

Trusted devices are phones, tablets, or computers that you have verified as belonging to you. When you log in from a trusted device, you may not need additional verification.

## What Trusted Devices Do {#what-it-does}

- **Faster logins** - Skip some verification steps on recognized devices
- **Security alerts** - Get notified when someone logs in from an unrecognized device
- **Account protection** - Easily review and remove devices you no longer use

## Managing Trusted Devices {#managing}

Currently, Mobile11 automatically remembers devices you use frequently. When you log in from a new device or location, you will receive an email notification for security purposes.

To improve account security:
1. Always log out from shared or public computers
2. Use strong, unique passwords
3. Monitor login notification emails
4. Contact support if you see unfamiliar login activity

## Removing Device Access {#removing}

If you believe your account was accessed from an unauthorized device:
1. Change your password immediately
2. Contact Mobile11 support
3. Review your recent orders and account activity

## FAQ {#faq}

### How does Mobile11 recognize my device?
Mobile11 uses secure browser cookies and device fingerprinting to recognize returning devices.

### Will I always need to verify on new devices?
You may receive email notifications when logging in from new devices or locations for security purposes.

### What should I do if I see an unfamiliar login?
Change your password immediately and contact Mobile11 support to review your account security.',
updated_at = now()
WHERE slug = 'trusted-devices' AND category = 'account' AND language = 'en';

-- Phase 4: Fix navigation paths in trusted-devices (TH)
UPDATE kb_articles
SET content = '## ภาพรวม {#overview}

อุปกรณ์ที่เชื่อถือคือโทรศัพท์ แท็บเล็ต หรือคอมพิวเตอร์ที่คุณยืนยันว่าเป็นของคุณ เมื่อเข้าสู่ระบบจากอุปกรณ์ที่เชื่อถือ คุณอาจไม่ต้องยืนยันเพิ่มเติม

## อุปกรณ์ที่เชื่อถือทำอะไร {#what-it-does}

- **เข้าสู่ระบบเร็วขึ้น** - ข้ามขั้นตอนยืนยันบางอย่างในอุปกรณ์ที่รู้จัก
- **การแจ้งเตือนความปลอดภัย** - รับการแจ้งเตือนเมื่อมีคนเข้าสู่ระบบจากอุปกรณ์ที่ไม่รู้จัก
- **การป้องกันบัญชี** - ตรวจสอบและลบอุปกรณ์ที่ไม่ใช้แล้วได้ง่าย

## การจัดการอุปกรณ์ที่เชื่อถือ {#managing}

ปัจจุบัน Mobile11 จดจำอุปกรณ์ที่คุณใช้บ่อยโดยอัตโนมัติ เมื่อเข้าสู่ระบบจากอุปกรณ์หรือตำแหน่งใหม่ คุณจะได้รับอีเมลแจ้งเตือนเพื่อความปลอดภัย

เพื่อเพิ่มความปลอดภัยบัญชี:
1. ออกจากระบบจากคอมพิวเตอร์สาธารณะหรือที่ใช้ร่วมกันเสมอ
2. ใช้รหัสผ่านที่แข็งแกร่งและไม่ซ้ำกัน
3. ตรวจสอบอีเมลแจ้งเตือนการเข้าสู่ระบบ
4. ติดต่อฝ่ายสนับสนุนหากเห็นกิจกรรมเข้าสู่ระบบที่ไม่คุ้นเคย

## การลบการเข้าถึงอุปกรณ์ {#removing}

หากคุณเชื่อว่าบัญชีถูกเข้าถึงจากอุปกรณ์ที่ไม่ได้รับอนุญาต:
1. เปลี่ยนรหัสผ่านทันที
2. ติดต่อฝ่ายสนับสนุน Mobile11
3. ตรวจสอบออเดอร์และกิจกรรมบัญชีล่าสุด

## คำถามที่พบบ่อย {#faq}

### Mobile11 จดจำอุปกรณ์ของฉันอย่างไร?
Mobile11 ใช้คุกกี้เบราว์เซอร์ที่ปลอดภัยและการระบุอุปกรณ์เพื่อจดจำอุปกรณ์ที่กลับมา

### ฉันจะต้องยืนยันในอุปกรณ์ใหม่เสมอไหม?
คุณอาจได้รับอีเมลแจ้งเตือนเมื่อเข้าสู่ระบบจากอุปกรณ์หรือตำแหน่งใหม่เพื่อความปลอดภัย

### ฉันควรทำอย่างไรถ้าเห็นการเข้าสู่ระบบที่ไม่คุ้นเคย?
เปลี่ยนรหัสผ่านทันทีและติดต่อฝ่ายสนับสนุน Mobile11 เพื่อตรวจสอบความปลอดภัยบัญชี',
updated_at = now()
WHERE slug = 'trusted-devices' AND category = 'account' AND language = 'th';