-- Insert My Account & Mobile11 Money articles (bilingual)

-- 1. Mobile11 Loyalty Program
INSERT INTO kb_articles (title, slug, category, language, content, description, source, is_published, is_internal, table_of_contents) VALUES
('What is the Mobile11 Loyalty Program?', 'loyalty-program', 'account', 'en', 
'## Overview {#overview}

The Mobile11 Loyalty Program rewards you for being a valued customer. The more you spend, the higher your tier and the more Mobile11 Money cashback you earn on every purchase.

## Loyalty Tiers {#tiers}

### Traveler (Starting Tier)
- **Requirement**: $0 spent
- **Cashback Rate**: 3%
- All new members start here

### Silver
- **Requirement**: $50 total spent
- **Cashback Rate**: 4%
- Unlocked after your first few purchases

### Gold
- **Requirement**: $150 total spent
- **Cashback Rate**: 5%
- For our regular travelers

### Platinum
- **Requirement**: $500 total spent
- **Cashback Rate**: 6%
- Our highest tier with maximum rewards

## How It Works {#how-it-works}

1. **Make a Purchase**: Buy any eSIM package from Mobile11
2. **Earn Cashback**: Receive Mobile11 Money based on your tier
3. **Level Up**: Your total spending accumulates to unlock higher tiers
4. **Use Rewards**: Apply Mobile11 Money to future purchases

## Viewing Your Status {#view-status}

1. Log in to your Mobile11 account
2. Go to **My Account** → **Loyalty & Rewards**
3. View your current tier, total spent, and cashback rate
4. See how much more you need to reach the next tier

## Important Notes {#notes}

- Tiers are based on **lifetime spending** and never reset
- Cashback is credited instantly after each completed purchase
- Mobile11 Money can be used on any future eSIM purchase
- Cashback is calculated on the final purchase amount after any discounts',
'Learn about Mobile11''s 4-tier loyalty program and earn up to 6% cashback on all purchases.', 
'both', true, false, 
'[{"id":"overview","title":"Overview"},{"id":"tiers","title":"Loyalty Tiers"},{"id":"how-it-works","title":"How It Works"},{"id":"view-status","title":"Viewing Your Status"},{"id":"notes","title":"Important Notes"}]'::jsonb),

('โปรแกรมสมาชิก Mobile11 Loyalty คืออะไร?', 'loyalty-program', 'account', 'th',
'## ภาพรวม {#overview}

โปรแกรม Mobile11 Loyalty ให้รางวัลคุณสำหรับการเป็นลูกค้าที่มีคุณค่า ยิ่งคุณใช้จ่ายมากเท่าไหร่ ระดับของคุณก็ยิ่งสูงขึ้น และคุณจะได้รับเงินคืน Mobile11 Money มากขึ้นในทุกการซื้อ

## ระดับสมาชิก {#tiers}

### Traveler (ระดับเริ่มต้น)
- **เงื่อนไข**: ใช้จ่าย $0
- **อัตราเงินคืน**: 3%
- สมาชิกใหม่ทุกคนเริ่มต้นที่นี่

### Silver
- **เงื่อนไข**: ใช้จ่ายรวม $50
- **อัตราเงินคืน**: 4%
- ปลดล็อคหลังจากซื้อไม่กี่ครั้ง

### Gold
- **เงื่อนไข**: ใช้จ่ายรวม $150
- **อัตราเงินคืน**: 5%
- สำหรับนักเดินทางประจำ

### Platinum
- **เงื่อนไข**: ใช้จ่ายรวม $500
- **อัตราเงินคืน**: 6%
- ระดับสูงสุดพร้อมรางวัลสูงสุด

## วิธีการทำงาน {#how-it-works}

1. **ซื้อ**: ซื้อแพ็กเกจ eSIM จาก Mobile11
2. **รับเงินคืน**: รับ Mobile11 Money ตามระดับของคุณ
3. **เลื่อนระดับ**: ยอดใช้จ่ายสะสมเพื่อปลดล็อคระดับที่สูงขึ้น
4. **ใช้รางวัล**: ใช้ Mobile11 Money ในการซื้อครั้งต่อไป

## ดูสถานะของคุณ {#view-status}

1. เข้าสู่ระบบบัญชี Mobile11
2. ไปที่ **บัญชีของฉัน** → **Loyalty & Rewards**
3. ดูระดับปัจจุบัน ยอดใช้จ่าย และอัตราเงินคืน
4. ดูว่าต้องใช้จ่ายอีกเท่าไหร่เพื่อถึงระดับถัดไป

## หมายเหตุสำคัญ {#notes}

- ระดับขึ้นอยู่กับ **ยอดใช้จ่ายตลอดชีพ** และไม่รีเซ็ต
- เงินคืนจะเครดิตทันทีหลังจากการซื้อสำเร็จ
- Mobile11 Money สามารถใช้ในการซื้อ eSIM ครั้งต่อไป
- เงินคืนคำนวณจากยอดซื้อสุดท้ายหลังหักส่วนลด',
'เรียนรู้เกี่ยวกับโปรแกรม Loyalty 4 ระดับของ Mobile11 และรับเงินคืนสูงสุด 6%',
'both', true, false,
'[{"id":"overview","title":"ภาพรวม"},{"id":"tiers","title":"ระดับสมาชิก"},{"id":"how-it-works","title":"วิธีการทำงาน"},{"id":"view-status","title":"ดูสถานะของคุณ"},{"id":"notes","title":"หมายเหตุสำคัญ"}]'::jsonb)
ON CONFLICT (slug, category, language) DO UPDATE SET
  content = EXCLUDED.content,
  description = EXCLUDED.description,
  table_of_contents = EXCLUDED.table_of_contents,
  updated_at = now();

-- 2. What is Mobile11 Money
INSERT INTO kb_articles (title, slug, category, language, content, description, source, is_published, is_internal, table_of_contents) VALUES
('What is Mobile11 Money?', 'what-is-mobile11-money', 'account', 'en',
'## Overview {#overview}

Mobile11 Money is our rewards currency that you can use to pay for eSIM purchases. It works like cash in your Mobile11 wallet.

## How to Earn Mobile11 Money {#earning}

### Loyalty Cashback
- Earn 3-6% cashback on every purchase based on your loyalty tier
- Cashback is credited instantly after purchase completion

### Referral Rewards
- Earn $3 when someone uses your referral code
- They must complete a purchase of $10 or more

### Promotional Offers
- Special campaigns may offer bonus Mobile11 Money
- Check our promotions page for current offers

## How to Use Mobile11 Money {#using}

1. Add items to your cart
2. At checkout, you''ll see your available balance
3. Toggle "Use Mobile11 Money" to apply it
4. Your balance will be deducted from the total

## Checking Your Balance {#balance}

1. Log in to your account
2. Go to **My Account** → **Mobile11 Money**
3. View your current balance and transaction history

## Important Rules {#rules}

- **No Expiration**: Mobile11 Money does not expire
- **No Cash Out**: Cannot be converted to real money
- **Partial Use**: Use any amount up to your balance
- **Instant Credit**: Cashback appears immediately after purchase',
'Learn how to earn and use Mobile11 Money rewards for eSIM purchases.',
'both', true, false,
'[{"id":"overview","title":"Overview"},{"id":"earning","title":"How to Earn"},{"id":"using","title":"How to Use"},{"id":"balance","title":"Checking Your Balance"},{"id":"rules","title":"Important Rules"}]'::jsonb),

('Mobile11 Money คืออะไร?', 'what-is-mobile11-money', 'account', 'th',
'## ภาพรวม {#overview}

Mobile11 Money คือสกุลเงินรางวัลที่คุณสามารถใช้ชำระค่า eSIM ได้ ทำงานเหมือนเงินสดในกระเป๋า Mobile11 ของคุณ

## วิธีรับ Mobile11 Money {#earning}

### เงินคืนจาก Loyalty
- รับเงินคืน 3-6% ในทุกการซื้อตามระดับสมาชิก
- เงินคืนจะเครดิตทันทีหลังการซื้อสำเร็จ

### รางวัลแนะนำเพื่อน
- รับ $3 เมื่อมีคนใช้รหัสแนะนำของคุณ
- พวกเขาต้องซื้ออย่างน้อย $10

### โปรโมชั่นพิเศษ
- แคมเปญพิเศษอาจมี Mobile11 Money โบนัส
- ตรวจสอบหน้าโปรโมชั่นสำหรับข้อเสนอปัจจุบัน

## วิธีใช้ Mobile11 Money {#using}

1. เพิ่มสินค้าลงตะกร้า
2. ที่หน้าชำระเงิน คุณจะเห็นยอดคงเหลือ
3. เปิด "ใช้ Mobile11 Money" เพื่อใช้
4. ยอดคงเหลือจะถูกหักจากยอดรวม

## ตรวจสอบยอดคงเหลือ {#balance}

1. เข้าสู่ระบบบัญชี
2. ไปที่ **บัญชีของฉัน** → **Mobile11 Money**
3. ดูยอดคงเหลือและประวัติธุรกรรม

## กฎสำคัญ {#rules}

- **ไม่หมดอายุ**: Mobile11 Money ไม่มีวันหมดอายุ
- **ไม่สามารถถอนเป็นเงินสด**: ไม่สามารถแปลงเป็นเงินจริง
- **ใช้บางส่วนได้**: ใช้จำนวนใดก็ได้จนถึงยอดคงเหลือ
- **เครดิตทันที**: เงินคืนปรากฏทันทีหลังซื้อ',
'เรียนรู้วิธีรับและใช้ Mobile11 Money สำหรับการซื้อ eSIM',
'both', true, false,
'[{"id":"overview","title":"ภาพรวม"},{"id":"earning","title":"วิธีรับ"},{"id":"using","title":"วิธีใช้"},{"id":"balance","title":"ตรวจสอบยอดคงเหลือ"},{"id":"rules","title":"กฎสำคัญ"}]'::jsonb)
ON CONFLICT (slug, category, language) DO UPDATE SET
  content = EXCLUDED.content,
  description = EXCLUDED.description,
  table_of_contents = EXCLUDED.table_of_contents,
  updated_at = now();

-- 3. Request Account Deletion
INSERT INTO kb_articles (title, slug, category, language, content, description, source, is_published, is_internal, table_of_contents) VALUES
('How to Request Account Deletion & Data Erasure', 'request-account-deletion', 'account', 'en',
'## Overview {#overview}

You have the right to request deletion of your Mobile11 account and all associated personal data. This guide explains the process.

## Before You Delete {#before}

Please note that account deletion:
- Is **permanent** and cannot be undone
- Will remove all your order history
- Will forfeit any remaining Mobile11 Money balance
- Will cancel any active eSIMs

## How to Request Deletion {#how-to}

### Method 1: In-App Request
1. Log in to your Mobile11 account
2. Go to **Settings** → **Account**
3. Scroll to "Delete Account"
4. Confirm your decision
5. Enter your password for verification

### Method 2: Email Request
1. Send an email to **support@mobile11.com**
2. Subject: "Account Deletion Request"
3. Include your registered email address
4. We will verify your identity and process within 30 days

## Data We Delete {#data-deleted}

- Personal information (name, email, phone)
- Order and purchase history
- Payment method details
- Mobile11 Money balance and transaction history
- Chat and support ticket history

## Timeline {#timeline}

- **Verification**: 1-3 business days
- **Processing**: Up to 30 days (as per GDPR/PDPA requirements)
- **Confirmation**: Email notification when complete',
'Learn how to permanently delete your Mobile11 account and request data erasure.',
'both', true, false,
'[{"id":"overview","title":"Overview"},{"id":"before","title":"Before You Delete"},{"id":"how-to","title":"How to Request"},{"id":"data-deleted","title":"Data We Delete"},{"id":"timeline","title":"Timeline"}]'::jsonb),

('วิธีขอลบบัญชีและลบข้อมูล', 'request-account-deletion', 'account', 'th',
'## ภาพรวม {#overview}

คุณมีสิทธิ์ขอลบบัญชี Mobile11 และข้อมูลส่วนบุคคลทั้งหมด คู่มือนี้อธิบายขั้นตอน

## ก่อนลบ {#before}

โปรดทราบว่าการลบบัญชี:
- เป็น **ถาวร** และไม่สามารถยกเลิกได้
- จะลบประวัติคำสั่งซื้อทั้งหมด
- จะสูญเสีย Mobile11 Money ที่เหลือ
- จะยกเลิก eSIM ที่ใช้งานอยู่

## วิธีขอลบ {#how-to}

### วิธีที่ 1: ขอผ่านแอป
1. เข้าสู่ระบบบัญชี Mobile11
2. ไปที่ **ตั้งค่า** → **บัญชี**
3. เลื่อนไปที่ "ลบบัญชี"
4. ยืนยันการตัดสินใจ
5. ป้อนรหัสผ่านเพื่อยืนยัน

### วิธีที่ 2: ขอทางอีเมล
1. ส่งอีเมลไปที่ **support@mobile11.com**
2. หัวข้อ: "Account Deletion Request"
3. ระบุอีเมลที่ลงทะเบียน
4. เราจะตรวจสอบและดำเนินการภายใน 30 วัน

## ข้อมูลที่เราลบ {#data-deleted}

- ข้อมูลส่วนบุคคล (ชื่อ, อีเมล, โทรศัพท์)
- ประวัติคำสั่งซื้อ
- ข้อมูลการชำระเงิน
- ยอด Mobile11 Money และประวัติธุรกรรม
- ประวัติแชทและตั๋วสนับสนุน

## ระยะเวลา {#timeline}

- **ตรวจสอบ**: 1-3 วันทำการ
- **ดำเนินการ**: สูงสุด 30 วัน (ตาม GDPR/PDPA)
- **ยืนยัน**: แจ้งทางอีเมลเมื่อเสร็จ',
'เรียนรู้วิธีลบบัญชี Mobile11 ถาวรและขอลบข้อมูล',
'both', true, false,
'[{"id":"overview","title":"ภาพรวม"},{"id":"before","title":"ก่อนลบ"},{"id":"how-to","title":"วิธีขอลบ"},{"id":"data-deleted","title":"ข้อมูลที่เราลบ"},{"id":"timeline","title":"ระยะเวลา"}]'::jsonb)
ON CONFLICT (slug, category, language) DO UPDATE SET
  content = EXCLUDED.content,
  description = EXCLUDED.description,
  table_of_contents = EXCLUDED.table_of_contents,
  updated_at = now();

-- 4. Redeem Mobile11 Money Voucher
INSERT INTO kb_articles (title, slug, category, language, content, description, source, is_published, is_internal, table_of_contents) VALUES
('How to Apply a Mobile11 Money Voucher', 'redeem-mobile11-money-voucher', 'account', 'en',
'## What is a Mobile11 Money Voucher? {#what-is}

A Mobile11 Money voucher is a code that adds credit to your Mobile11 Money balance. These vouchers are distributed through promotions, partnerships, and special campaigns.

## How to Redeem {#how-to-redeem}

1. Log in to your Mobile11 account
2. Go to **My Account** → **Mobile11 Money**
3. Click **"Redeem Voucher"**
4. Enter your voucher code
5. Click **"Apply"**
6. Your balance will be updated instantly

## Where to Find Voucher Codes {#where-to-find}

- Email promotions from Mobile11
- Partner campaigns
- Social media giveaways
- Influencer collaborations

## Troubleshooting {#troubleshooting}

### "Invalid Code" Error
- Check for typos (codes are case-sensitive)
- Ensure the code hasn''t expired
- Verify it hasn''t been used already

### "Already Redeemed" Error
- Each voucher can only be used once
- Check your transaction history to confirm

## Important Notes {#notes}

- Vouchers have expiration dates - check before redeeming
- Cannot be combined with other vouchers in one transaction
- Mobile11 Money added from vouchers follows standard rules (no cash out)',
'Learn how to redeem Mobile11 Money vouchers and add credit to your account.',
'both', true, false,
'[{"id":"what-is","title":"What is a Voucher?"},{"id":"how-to-redeem","title":"How to Redeem"},{"id":"where-to-find","title":"Where to Find Codes"},{"id":"troubleshooting","title":"Troubleshooting"},{"id":"notes","title":"Important Notes"}]'::jsonb),

('วิธีใช้บัตรกำนัล Mobile11 Money', 'redeem-mobile11-money-voucher', 'account', 'th',
'## บัตรกำนัล Mobile11 Money คืออะไร? {#what-is}

บัตรกำนัล Mobile11 Money คือรหัสที่เพิ่มเครดิตให้ยอด Mobile11 Money ของคุณ บัตรกำนัลเหล่านี้แจกจ่ายผ่านโปรโมชั่น พาร์ทเนอร์ และแคมเปญพิเศษ

## วิธีแลก {#how-to-redeem}

1. เข้าสู่ระบบบัญชี Mobile11
2. ไปที่ **บัญชีของฉัน** → **Mobile11 Money**
3. คลิก **"แลกบัตรกำนัล"**
4. ป้อนรหัสบัตรกำนัล
5. คลิก **"ใช้"**
6. ยอดคงเหลือจะอัปเดตทันที

## หารหัสบัตรกำนัลได้ที่ไหน {#where-to-find}

- โปรโมชั่นทางอีเมลจาก Mobile11
- แคมเปญพาร์ทเนอร์
- แจกรางวัลทางโซเชียลมีเดีย
- ความร่วมมือกับอินฟลูเอนเซอร์

## แก้ไขปัญหา {#troubleshooting}

### ข้อผิดพลาด "รหัสไม่ถูกต้อง"
- ตรวจสอบการพิมพ์ผิด (รหัสต้องตรงตัวพิมพ์)
- ตรวจสอบว่ารหัสไม่หมดอายุ
- ตรวจสอบว่ายังไม่ถูกใช้

### ข้อผิดพลาด "ถูกใช้แล้ว"
- แต่ละบัตรกำนัลใช้ได้ครั้งเดียว
- ตรวจสอบประวัติธุรกรรมเพื่อยืนยัน

## หมายเหตุสำคัญ {#notes}

- บัตรกำนัลมีวันหมดอายุ - ตรวจสอบก่อนแลก
- ไม่สามารถรวมกับบัตรกำนัลอื่นในธุรกรรมเดียว
- Mobile11 Money จากบัตรกำนัลปฏิบัติตามกฎมาตรฐาน (ไม่ถอนเป็นเงินสด)',
'เรียนรู้วิธีแลกบัตรกำนัล Mobile11 Money และเพิ่มเครดิตในบัญชี',
'both', true, false,
'[{"id":"what-is","title":"บัตรกำนัลคืออะไร?"},{"id":"how-to-redeem","title":"วิธีแลก"},{"id":"where-to-find","title":"หารหัสได้ที่ไหน"},{"id":"troubleshooting","title":"แก้ไขปัญหา"},{"id":"notes","title":"หมายเหตุสำคัญ"}]'::jsonb)
ON CONFLICT (slug, category, language) DO UPDATE SET
  content = EXCLUDED.content,
  description = EXCLUDED.description,
  table_of_contents = EXCLUDED.table_of_contents,
  updated_at = now();

-- 5. Supported Currencies
INSERT INTO kb_articles (title, slug, category, language, content, description, source, is_published, is_internal, table_of_contents) VALUES
('What Currencies Does Mobile11 Support?', 'supported-currencies', 'account', 'en',
'## Overview {#overview}

Mobile11 supports multiple currencies to make purchasing eSIMs convenient for travelers worldwide.

## Supported Currencies {#currencies}

| Currency | Code | Symbol |
|----------|------|--------|
| US Dollar | USD | $ |
| Thai Baht | THB | ฿ |
| Euro | EUR | € |
| British Pound | GBP | £ |
| Japanese Yen | JPY | ¥ |
| Australian Dollar | AUD | A$ |
| Singapore Dollar | SGD | S$ |

## How Currency is Determined {#determination}

Your display currency is automatically detected based on:
1. Your device location
2. Your browser language settings
3. Your previous preference (if saved)

## Changing Your Currency {#changing}

1. Look for the currency selector in the header
2. Click on the current currency
3. Select your preferred currency from the dropdown
4. Prices will update immediately

## Payment Currency {#payment}

- You can pay in your local currency via card
- Your bank handles the conversion if different from display currency
- Exchange rates are determined by your payment provider

## Mobile11 Money {#m11-money}

- Mobile11 Money is always stored in USD
- Displayed in your selected currency for convenience
- Conversion happens at checkout using current rates',
'Learn about the currencies supported by Mobile11 for eSIM purchases.',
'both', true, false,
'[{"id":"overview","title":"Overview"},{"id":"currencies","title":"Supported Currencies"},{"id":"determination","title":"How Currency is Determined"},{"id":"changing","title":"Changing Your Currency"},{"id":"payment","title":"Payment Currency"},{"id":"m11-money","title":"Mobile11 Money"}]'::jsonb),

('Mobile11 รองรับสกุลเงินอะไรบ้าง?', 'supported-currencies', 'account', 'th',
'## ภาพรวม {#overview}

Mobile11 รองรับหลายสกุลเงินเพื่อให้การซื้อ eSIM สะดวกสำหรับนักเดินทางทั่วโลก

## สกุลเงินที่รองรับ {#currencies}

| สกุลเงิน | รหัส | สัญลักษณ์ |
|----------|------|--------|
| ดอลลาร์สหรัฐ | USD | $ |
| บาทไทย | THB | ฿ |
| ยูโร | EUR | € |
| ปอนด์อังกฤษ | GBP | £ |
| เยนญี่ปุ่น | JPY | ¥ |
| ดอลลาร์ออสเตรเลีย | AUD | A$ |
| ดอลลาร์สิงคโปร์ | SGD | S$ |

## วิธีกำหนดสกุลเงิน {#determination}

สกุลเงินที่แสดงจะตรวจจับอัตโนมัติจาก:
1. ตำแหน่งอุปกรณ์ของคุณ
2. การตั้งค่าภาษาเบราว์เซอร์
3. ค่าที่คุณเลือกไว้ก่อนหน้า (ถ้าบันทึก)

## เปลี่ยนสกุลเงิน {#changing}

1. มองหาตัวเลือกสกุลเงินในส่วนหัว
2. คลิกที่สกุลเงินปัจจุบัน
3. เลือกสกุลเงินที่ต้องการจากรายการ
4. ราคาจะอัปเดตทันที

## สกุลเงินการชำระ {#payment}

- คุณสามารถชำระด้วยสกุลเงินท้องถิ่นผ่านบัตร
- ธนาคารจัดการการแปลงหากต่างจากสกุลเงินที่แสดง
- อัตราแลกเปลี่ยนกำหนดโดยผู้ให้บริการชำระเงิน

## Mobile11 Money {#m11-money}

- Mobile11 Money เก็บใน USD เสมอ
- แสดงในสกุลเงินที่คุณเลือกเพื่อความสะดวก
- การแปลงเกิดขึ้นที่หน้าชำระเงินด้วยอัตราปัจจุบัน',
'เรียนรู้เกี่ยวกับสกุลเงินที่ Mobile11 รองรับสำหรับการซื้อ eSIM',
'both', true, false,
'[{"id":"overview","title":"ภาพรวม"},{"id":"currencies","title":"สกุลเงินที่รองรับ"},{"id":"determination","title":"วิธีกำหนดสกุลเงิน"},{"id":"changing","title":"เปลี่ยนสกุลเงิน"},{"id":"payment","title":"สกุลเงินการชำระ"},{"id":"m11-money","title":"Mobile11 Money"}]'::jsonb)
ON CONFLICT (slug, category, language) DO UPDATE SET
  content = EXCLUDED.content,
  description = EXCLUDED.description,
  table_of_contents = EXCLUDED.table_of_contents,
  updated_at = now();