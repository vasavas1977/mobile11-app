-- Phase 3: Account & Mobile11 Money - Enhanced Content

-- Article: Loyalty Program (English)
INSERT INTO kb_articles (slug, category, language, title, description, content, table_of_contents, source, is_published, is_internal, display_order)
VALUES (
  'loyalty-program',
  'account',
  'en',
  'Mobile11 Loyalty Program: Earn Rewards on Every Purchase',
  'Learn about the Mobile11 Loyalty Program, how to earn cashback rewards, tier levels, and frequently asked questions about membership benefits.',
  '## What is the Mobile11 Loyalty Program? {#overview}

The Mobile11 Loyalty Program rewards you for every eSIM purchase. It''s our way of saying thank you for choosing Mobile11 for your travel connectivity needs.

When you create a Mobile11 account, you''re automatically enrolled in the Loyalty Program. Every qualifying purchase earns you Mobile11 Money—our in-app currency that can be used toward future purchases.

**Key Benefits:**
- Earn cashback on every eSIM purchase
- Higher tiers unlock better reward rates
- Your tier status is permanent once earned
- Mobile11 Money can be applied at checkout

---

## Loyalty Tiers {#tiers}

The Mobile11 Loyalty Program has four tiers based on your lifetime spending:

| Tier | Spending Required | Cashback Rate |
|------|------------------|---------------|
| **Traveler** | Starting tier | 5% |
| **Silver Traveler** | $20 USD | 6% |
| **Gold Traveler** | $70 USD | 7% |
| **Platinum Traveler** | $200 USD | 10% |

### How tier progression works: {#tier-progression}

- Your tier is determined by your **total lifetime spending** on Mobile11
- Once you reach a tier, **you never lose it**—even if your Mobile11 Money expires
- Spending is calculated in USD; purchases in other currencies are converted
- Tier upgrades happen automatically after each qualifying purchase

---

## How to Earn Mobile11 Money {#earning}

You earn Mobile11 Money as a percentage of your purchase amount:

**Qualifying activities:**
- Purchasing new eSIMs
- Topping up existing eSIMs
- Referral rewards (when friends use your referral code)
- Promotional campaigns and special offers

**Important:** You do **not** earn loyalty rewards when:
- Using a discount or promo code on the purchase
- Using a referral code for the first time (as the referred user)
- Purchases made with 100% Mobile11 Money

---

## Using Your Mobile11 Money {#using}

Mobile11 Money can be applied at checkout to reduce your total:

1. Add an eSIM to your cart
2. Proceed to checkout
3. Under payment options, you''ll see your available Mobile11 Money
4. Choose to apply all or part of your balance
5. Pay the remaining amount (if any)

**Minimum balance requirement:** Your Mobile11 Money balance must be at least **$1.00 USD** to be applied at checkout. Balances below $1.00 cannot be used.

---

## Frequently Asked Questions {#faq}

### Is registration required to join the Loyalty Program?
Yes. You must have a Mobile11 account to participate and earn rewards. Guest purchases do not qualify for loyalty rewards.

### What happens to my tier if my Mobile11 Money expires?
Your tier status is **permanent** and based on lifetime spending. Even if your Mobile11 Money balance expires, your tier (and future earning rate) remains the same.

### Can I use Mobile11 Money for auto-renewals?
Currently, Mobile11 Money cannot be applied to automatic renewal payments. It can only be used for manual purchases.

### How do I check my current tier and balance?
Log in to your Mobile11 account and visit your Profile or Wallet section. You''ll see your current tier and available Mobile11 Money balance.

### Do purchases with Mobile11 Money count toward tier progression?
Only the cash portion of your payment counts toward tier progression. If you pay $8 with Mobile11 Money and $12 with a card, only $12 counts toward your tier.

### Can I transfer Mobile11 Money to another account?
No. Mobile11 Money is non-transferable and can only be used by the account that earned it.

---

## Mobile11 Money Expiration {#expiration}

**Effective February 1, 2025:** Mobile11 Money can expire after **one year of inactivity**.

### How to prevent expiration: {#prevent-expiration}

Each time you make a qualifying purchase, the expiration date resets by one year. This includes:
- Any eSIM purchase (even if paid partially with Mobile11 Money)
- Top-up purchases
- Earning new referral rewards

Simply stay active on Mobile11, and your balance will never expire!

---

## Related Articles {#related}

- [What is Mobile11 Money?](/support/account/what-is-mobile11-money)
- [Refer a Friend Program](/support/account/referral-program)
- [Check Your Account Balance](/support/account/account-balance)',
  '[{"id":"overview","title":"What is the Loyalty Program?"},{"id":"tiers","title":"Loyalty Tiers"},{"id":"tier-progression","title":"Tier Progression"},{"id":"earning","title":"How to Earn"},{"id":"using","title":"Using Mobile11 Money"},{"id":"faq","title":"FAQ"},{"id":"expiration","title":"Expiration Policy"},{"id":"prevent-expiration","title":"Prevent Expiration"},{"id":"related","title":"Related Articles"}]'::jsonb,
  'both',
  true,
  false,
  5
)
ON CONFLICT (slug, category, language) 
DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  content = EXCLUDED.content,
  table_of_contents = EXCLUDED.table_of_contents,
  updated_at = now();

-- Article: Loyalty Program (Thai)
INSERT INTO kb_articles (slug, category, language, title, description, content, table_of_contents, source, is_published, is_internal, display_order)
VALUES (
  'loyalty-program',
  'account',
  'th',
  'โปรแกรมสะสมแต้ม Mobile11: รับรางวัลจากทุกการซื้อ',
  'เรียนรู้เกี่ยวกับโปรแกรมสะสมแต้ม Mobile11 วิธีรับรางวัลเงินคืน ระดับสมาชิก และคำถามที่พบบ่อยเกี่ยวกับสิทธิประโยชน์',
  '## โปรแกรมสะสมแต้ม Mobile11 คืออะไร? {#overview}

โปรแกรมสะสมแต้ม Mobile11 ให้รางวัลคุณจากทุกการซื้อ eSIM เป็นวิธีที่เราขอบคุณที่คุณเลือก Mobile11 สำหรับการเชื่อมต่อในการเดินทาง

เมื่อคุณสร้างบัญชี Mobile11 คุณจะลงทะเบียนในโปรแกรมสะสมแต้มโดยอัตโนมัติ ทุกการซื้อที่มีสิทธิ์จะได้รับ Mobile11 Money—สกุลเงินในแอปที่ใช้สำหรับการซื้อในอนาคต

**สิทธิประโยชน์หลัก:**
- รับเงินคืนจากทุกการซื้อ eSIM
- ระดับที่สูงขึ้นปลดล็อกอัตรารางวัลที่ดีกว่า
- สถานะระดับของคุณถาวรเมื่อได้รับแล้ว
- Mobile11 Money สามารถใช้ได้ที่หน้าชำระเงิน

---

## ระดับสมาชิก {#tiers}

โปรแกรมสะสมแต้ม Mobile11 มีสี่ระดับตามการใช้จ่ายตลอดอายุการใช้งาน:

| ระดับ | การใช้จ่ายที่ต้องการ | อัตราเงินคืน |
|------|------------------|---------------|
| **Traveler** | ระดับเริ่มต้น | 5% |
| **Silver Traveler** | $20 USD | 6% |
| **Gold Traveler** | $70 USD | 7% |
| **Platinum Traveler** | $200 USD | 10% |

### วิธีการเลื่อนระดับ: {#tier-progression}

- ระดับของคุณกำหนดโดย **การใช้จ่ายตลอดอายุการใช้งาน** บน Mobile11
- เมื่อคุณถึงระดับหนึ่งแล้ว **คุณไม่มีวันสูญเสียมัน**—แม้ว่า Mobile11 Money จะหมดอายุ
- การใช้จ่ายคำนวณเป็น USD; การซื้อในสกุลเงินอื่นจะถูกแปลง
- การอัพเกรดระดับเกิดขึ้นโดยอัตโนมัติหลังจากทุกการซื้อที่มีสิทธิ์

---

## วิธีรับ Mobile11 Money {#earning}

คุณได้รับ Mobile11 Money เป็นเปอร์เซ็นต์ของยอดซื้อ:

**กิจกรรมที่มีสิทธิ์:**
- ซื้อ eSIM ใหม่
- เติมเงิน eSIM ที่มีอยู่
- รางวัลการแนะนำ (เมื่อเพื่อนใช้รหัสแนะนำของคุณ)
- แคมเปญโปรโมชั่นและข้อเสนอพิเศษ

**สำคัญ:** คุณ **ไม่** ได้รับรางวัลสะสมแต้มเมื่อ:
- ใช้รหัสส่วนลดหรือโปรโมโค้ดในการซื้อ
- ใช้รหัสแนะนำเป็นครั้งแรก (ในฐานะผู้ถูกแนะนำ)
- การซื้อที่จ่ายด้วย Mobile11 Money 100%

---

## การใช้ Mobile11 Money {#using}

Mobile11 Money สามารถใช้ที่หน้าชำระเงินเพื่อลดยอดรวม:

1. เพิ่ม eSIM ลงในตะกร้า
2. ดำเนินการชำระเงิน
3. ใต้ตัวเลือกการชำระเงิน คุณจะเห็น Mobile11 Money ที่มีอยู่
4. เลือกใช้ทั้งหมดหรือบางส่วนของยอดคงเหลือ
5. ชำระยอดที่เหลือ (ถ้ามี)

**ข้อกำหนดยอดขั้นต่ำ:** ยอด Mobile11 Money ต้องมีอย่างน้อย **$1.00 USD** จึงจะใช้ที่หน้าชำระเงินได้ ยอดที่ต่ำกว่า $1.00 ไม่สามารถใช้ได้

---

## คำถามที่พบบ่อย {#faq}

### ต้องลงทะเบียนเพื่อเข้าร่วมโปรแกรมสะสมแต้มไหม?
ใช่ คุณต้องมีบัญชี Mobile11 เพื่อเข้าร่วมและรับรางวัล การซื้อแบบ Guest ไม่มีสิทธิ์รับรางวัลสะสมแต้ม

### จะเกิดอะไรขึ้นกับระดับของฉันถ้า Mobile11 Money หมดอายุ?
สถานะระดับของคุณ **ถาวร** และขึ้นอยู่กับการใช้จ่ายตลอดอายุการใช้งาน แม้ว่ายอด Mobile11 Money จะหมดอายุ ระดับของคุณ (และอัตราการรับในอนาคต) ยังคงเดิม

### สามารถใช้ Mobile11 Money สำหรับการต่ออายุอัตโนมัติได้ไหม?
ปัจจุบัน Mobile11 Money ไม่สามารถใช้กับการชำระเงินต่ออายุอัตโนมัติได้ สามารถใช้ได้เฉพาะการซื้อแบบ manual

### ฉันจะตรวจสอบระดับและยอดคงเหลือปัจจุบันได้อย่างไร?
เข้าสู่ระบบบัญชี Mobile11 และไปที่ส่วนโปรไฟล์หรือกระเป๋าเงิน คุณจะเห็นระดับปัจจุบันและยอด Mobile11 Money ที่มีอยู่

### การซื้อด้วย Mobile11 Money นับรวมในการเลื่อนระดับไหม?
เฉพาะส่วนเงินสดของการชำระเงินเท่านั้นที่นับรวมในการเลื่อนระดับ หากคุณจ่าย $8 ด้วย Mobile11 Money และ $12 ด้วยบัตร เฉพาะ $12 ที่นับรวมในระดับของคุณ

### สามารถโอน Mobile11 Money ไปยังบัญชีอื่นได้ไหม?
ไม่ได้ Mobile11 Money ไม่สามารถโอนได้และสามารถใช้ได้เฉพาะบัญชีที่ได้รับเท่านั้น

---

## การหมดอายุของ Mobile11 Money {#expiration}

**มีผลตั้งแต่ 1 กุมภาพันธ์ 2025:** Mobile11 Money สามารถหมดอายุหลังจาก **หนึ่งปีที่ไม่มีกิจกรรม**

### วิธีป้องกันการหมดอายุ: {#prevent-expiration}

ทุกครั้งที่คุณซื้อที่มีสิทธิ์ วันหมดอายุจะรีเซ็ตไปอีกหนึ่งปี รวมถึง:
- การซื้อ eSIM ใดๆ (แม้จะจ่ายบางส่วนด้วย Mobile11 Money)
- การซื้อเติมเงิน
- การได้รับรางวัลแนะนำใหม่

เพียงแค่ใช้งาน Mobile11 อยู่เรื่อยๆ และยอดคงเหลือของคุณจะไม่มีวันหมดอายุ!

---

## บทความที่เกี่ยวข้อง {#related}

- [Mobile11 Money คืออะไร?](/support/account/what-is-mobile11-money)
- [โปรแกรมแนะนำเพื่อน](/support/account/referral-program)
- [ตรวจสอบยอดคงเหลือบัญชี](/support/account/account-balance)',
  '[{"id":"overview","title":"โปรแกรมสะสมแต้มคืออะไร?"},{"id":"tiers","title":"ระดับสมาชิก"},{"id":"tier-progression","title":"การเลื่อนระดับ"},{"id":"earning","title":"วิธีรับ"},{"id":"using","title":"การใช้ Mobile11 Money"},{"id":"faq","title":"คำถามที่พบบ่อย"},{"id":"expiration","title":"นโยบายการหมดอายุ"},{"id":"prevent-expiration","title":"ป้องกันการหมดอายุ"},{"id":"related","title":"บทความที่เกี่ยวข้อง"}]'::jsonb,
  'both',
  true,
  false,
  5
)
ON CONFLICT (slug, category, language) 
DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  content = EXCLUDED.content,
  table_of_contents = EXCLUDED.table_of_contents,
  updated_at = now();

-- Article: What is Mobile11 Money (English)
INSERT INTO kb_articles (slug, category, language, title, description, content, table_of_contents, source, is_published, is_internal, display_order)
VALUES (
  'what-is-mobile11-money',
  'account',
  'en',
  'What is Mobile11 Money? Complete Guide',
  'Learn everything about Mobile11 Money: how to earn it, use it, expiration policies, and frequently asked questions about our in-app reward currency.',
  '## What is Mobile11 Money? {#overview}

Mobile11 Money is an in-app reward currency that can be used to pay for future eSIM purchases. Think of it as store credit that you earn through various activities on Mobile11.

**Key features:**
- Earned as a percentage of qualifying purchases
- Applied at checkout to reduce your total
- Pegged to USD (displays in your selected currency)
- Available to all registered Mobile11 users

---

## How to Earn Mobile11 Money {#earning}

You can earn Mobile11 Money through several activities:

### Purchase Rewards
Every time you buy an eSIM or top-up an existing one, you earn a percentage back as Mobile11 Money. The percentage depends on your [Loyalty Program tier](/support/account/loyalty-program):

| Tier | Cashback Rate |
|------|---------------|
| Traveler | 5% |
| Silver Traveler | 6% |
| Gold Traveler | 7% |
| Platinum Traveler | 10% |

### Referral Program
When you refer friends to Mobile11 using your unique referral code:
- You earn Mobile11 Money when they complete their first purchase
- Your friend also receives a welcome bonus
- [Learn more about the Referral Program](/support/account/referral-program)

### Promotional Offers
Occasionally, Mobile11 runs special promotions where you can earn bonus Mobile11 Money on specific purchases or activities.

---

## Can I Always Use My Mobile11 Money? {#usage}

You can use Mobile11 Money for most purchases, but there are some exceptions:

### When you CAN use it:
- Purchasing new eSIMs
- Topping up existing eSIMs
- Combining with other payment methods

### When you CANNOT use it:
- **Minimum balance rule**: If your balance is below **$1.00 USD**, it cannot be applied during checkout
- **Auto-renewals**: Currently cannot be used for automatic subscription renewals
- **Gift purchases**: May not be applicable depending on the promotion

---

## How to Use Mobile11 Money at Checkout {#checkout}

Applying your Mobile11 Money is simple:

1. Add an eSIM package to your cart
2. Proceed to the checkout page
3. You''ll see your available Mobile11 Money balance
4. Toggle the option to apply Mobile11 Money
5. Choose the amount to apply (full balance or partial)
6. Complete payment for any remaining balance

**Tip:** If your purchase total is less than your Mobile11 Money balance, you''ll only use what''s needed and keep the rest.

---

## Can Mobile11 Money Expire? {#expiration}

**Yes, as of February 1, 2025**, Mobile11 Money can expire after **one year of inactivity**.

### What counts as "inactivity"?
Your account is considered inactive if you haven''t made any qualifying transactions for 12 consecutive months. This includes:
- No eSIM purchases
- No top-ups
- No new referral rewards earned

### How to prevent expiration: {#prevent-expiration}

Every qualifying transaction resets your expiration date by one year. To keep your balance active:

- Make any eSIM purchase (even a small one)
- Top-up an existing eSIM
- Earn referral rewards by inviting friends
- Participate in promotional activities

**One purchase per year keeps your Mobile11 Money alive!**

---

## What Happens If I Change My Currency? {#currency}

Mobile11 Money is **pegged to the US Dollar (USD)**. When you view your balance in a different currency:

- The balance converts based on current exchange rates
- The underlying value in USD remains the same
- Exchange rates update periodically
- No fees are charged for currency display conversion

**Example:** If you have $10.00 USD in Mobile11 Money and switch to EUR, you''ll see approximately €9.20 (depending on the exchange rate), but the underlying value is still $10.00 USD.

---

## Frequently Asked Questions {#faq}

### Can I withdraw Mobile11 Money as cash?
No. Mobile11 Money can only be used for purchases within the Mobile11 platform. It cannot be converted to cash or transferred to bank accounts.

### Can I transfer Mobile11 Money to another account?
No. Mobile11 Money is non-transferable and tied to the account that earned it.

### Why is my Mobile11 Money balance not showing?
- Ensure you''re logged into the correct account
- Check if you have a minimum balance of $1.00 USD
- Refresh the page or restart the app
- Contact support if the issue persists

### Do I earn Mobile11 Money on purchases paid with Mobile11 Money?
No. Loyalty rewards are only calculated on the cash portion of your payment. If you pay $5 with Mobile11 Money and $10 with a card, you earn rewards only on the $10.

### Is there a maximum amount I can earn?
There is no cap on Mobile11 Money earnings. The more you purchase, the more you earn!

### Can I use Mobile11 Money for someone else''s account?
No. Mobile11 Money must be used by the account holder who earned it. You can gift an eSIM to someone, but you must make the purchase from your own account.

---

## Related Articles {#related}

- [Mobile11 Loyalty Program](/support/account/loyalty-program)
- [Refer a Friend Program](/support/account/referral-program)
- [Payment Methods](/support/account/payment-methods)',
  '[{"id":"overview","title":"What is Mobile11 Money?"},{"id":"earning","title":"How to Earn"},{"id":"usage","title":"When You Can Use It"},{"id":"checkout","title":"Using at Checkout"},{"id":"expiration","title":"Expiration Policy"},{"id":"prevent-expiration","title":"Prevent Expiration"},{"id":"currency","title":"Currency Conversion"},{"id":"faq","title":"FAQ"},{"id":"related","title":"Related Articles"}]'::jsonb,
  'both',
  true,
  false,
  6
)
ON CONFLICT (slug, category, language) 
DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  content = EXCLUDED.content,
  table_of_contents = EXCLUDED.table_of_contents,
  updated_at = now();

-- Article: What is Mobile11 Money (Thai)
INSERT INTO kb_articles (slug, category, language, title, description, content, table_of_contents, source, is_published, is_internal, display_order)
VALUES (
  'what-is-mobile11-money',
  'account',
  'th',
  'Mobile11 Money คืออะไร? คู่มือฉบับสมบูรณ์',
  'เรียนรู้ทุกอย่างเกี่ยวกับ Mobile11 Money: วิธีรับ ใช้ นโยบายการหมดอายุ และคำถามที่พบบ่อยเกี่ยวกับสกุลเงินรางวัลในแอปของเรา',
  '## Mobile11 Money คืออะไร? {#overview}

Mobile11 Money คือสกุลเงินรางวัลในแอปที่สามารถใช้ชำระเงินสำหรับการซื้อ eSIM ในอนาคต คิดว่ามันเป็นเครดิตร้านค้าที่คุณได้รับจากกิจกรรมต่างๆ บน Mobile11

**คุณสมบัติหลัก:**
- ได้รับเป็นเปอร์เซ็นต์ของการซื้อที่มีสิทธิ์
- ใช้ที่หน้าชำระเงินเพื่อลดยอดรวม
- ผูกกับ USD (แสดงในสกุลเงินที่คุณเลือก)
- มีให้ผู้ใช้ Mobile11 ที่ลงทะเบียนทุกคน

---

## วิธีรับ Mobile11 Money {#earning}

คุณสามารถรับ Mobile11 Money ได้หลายวิธี:

### รางวัลจากการซื้อ
ทุกครั้งที่คุณซื้อ eSIM หรือเติมเงิน eSIM ที่มีอยู่ คุณจะได้รับเปอร์เซ็นต์กลับเป็น Mobile11 Money เปอร์เซ็นต์ขึ้นอยู่กับ[ระดับโปรแกรมสะสมแต้ม](/support/account/loyalty-program):

| ระดับ | อัตราเงินคืน |
|------|---------------|
| Traveler | 5% |
| Silver Traveler | 6% |
| Gold Traveler | 7% |
| Platinum Traveler | 10% |

### โปรแกรมแนะนำ
เมื่อคุณแนะนำเพื่อนมายัง Mobile11 โดยใช้รหัสแนะนำเฉพาะของคุณ:
- คุณได้รับ Mobile11 Money เมื่อพวกเขาซื้อครั้งแรกสำเร็จ
- เพื่อนของคุณก็ได้รับโบนัสต้อนรับด้วย
- [เรียนรู้เพิ่มเติมเกี่ยวกับโปรแกรมแนะนำ](/support/account/referral-program)

### ข้อเสนอโปรโมชั่น
บางครั้ง Mobile11 จัดโปรโมชั่นพิเศษที่คุณสามารถรับ Mobile11 Money โบนัสจากการซื้อหรือกิจกรรมเฉพาะ

---

## ฉันสามารถใช้ Mobile11 Money ได้ตลอดเวลาไหม? {#usage}

คุณสามารถใช้ Mobile11 Money สำหรับการซื้อส่วนใหญ่ แต่มีข้อยกเว้นบางอย่าง:

### เมื่อใช้ได้:
- ซื้อ eSIM ใหม่
- เติมเงิน eSIM ที่มีอยู่
- รวมกับวิธีชำระเงินอื่น

### เมื่อใช้ไม่ได้:
- **กฎยอดขั้นต่ำ**: หากยอดคงเหลือต่ำกว่า **$1.00 USD** ไม่สามารถใช้ที่หน้าชำระเงินได้
- **การต่ออายุอัตโนมัติ**: ปัจจุบันไม่สามารถใช้กับการต่ออายุสมาชิกอัตโนมัติ
- **การซื้อของขวัญ**: อาจใช้ไม่ได้ขึ้นอยู่กับโปรโมชั่น

---

## วิธีใช้ Mobile11 Money ที่หน้าชำระเงิน {#checkout}

การใช้ Mobile11 Money เป็นเรื่องง่าย:

1. เพิ่มแพ็กเกจ eSIM ลงในตะกร้า
2. ดำเนินการไปยังหน้าชำระเงิน
3. คุณจะเห็นยอด Mobile11 Money ที่มีอยู่
4. สลับตัวเลือกเพื่อใช้ Mobile11 Money
5. เลือกจำนวนที่จะใช้ (ยอดทั้งหมดหรือบางส่วน)
6. ชำระเงินสำหรับยอดคงเหลือ

**เคล็ดลับ:** หากยอดซื้อน้อยกว่ายอด Mobile11 Money ของคุณ คุณจะใช้เฉพาะส่วนที่ต้องการและเก็บส่วนที่เหลือไว้

---

## Mobile11 Money หมดอายุได้ไหม? {#expiration}

**ใช่ ตั้งแต่ 1 กุมภาพันธ์ 2025** Mobile11 Money สามารถหมดอายุหลังจาก **หนึ่งปีที่ไม่มีกิจกรรม**

### อะไรนับว่า "ไม่มีกิจกรรม"?
บัญชีของคุณถือว่าไม่มีกิจกรรมหากคุณไม่ได้ทำธุรกรรมที่มีสิทธิ์เป็นเวลา 12 เดือนติดต่อกัน รวมถึง:
- ไม่มีการซื้อ eSIM
- ไม่มีการเติมเงิน
- ไม่มีรางวัลแนะนำใหม่ที่ได้รับ

### วิธีป้องกันการหมดอายุ: {#prevent-expiration}

ทุกธุรกรรมที่มีสิทธิ์จะรีเซ็ตวันหมดอายุของคุณไปอีกหนึ่งปี เพื่อให้ยอดคงเหลือของคุณใช้งานได้:

- ซื้อ eSIM ใดๆ (แม้จะเล็กน้อย)
- เติมเงิน eSIM ที่มีอยู่
- รับรางวัลแนะนำโดยเชิญเพื่อน
- เข้าร่วมกิจกรรมโปรโมชั่น

**การซื้อหนึ่งครั้งต่อปีช่วยให้ Mobile11 Money ของคุณไม่หมดอายุ!**

---

## จะเกิดอะไรขึ้นถ้าฉันเปลี่ยนสกุลเงิน? {#currency}

Mobile11 Money **ผูกกับดอลลาร์สหรัฐ (USD)** เมื่อคุณดูยอดคงเหลือในสกุลเงินอื่น:

- ยอดคงเหลือแปลงตามอัตราแลกเปลี่ยนปัจจุบัน
- มูลค่าพื้นฐานใน USD ยังคงเดิม
- อัตราแลกเปลี่ยนอัปเดตเป็นระยะ
- ไม่มีค่าธรรมเนียมสำหรับการแปลงการแสดงสกุลเงิน

**ตัวอย่าง:** หากคุณมี $10.00 USD ใน Mobile11 Money และเปลี่ยนเป็น EUR คุณจะเห็นประมาณ €9.20 (ขึ้นอยู่กับอัตราแลกเปลี่ยน) แต่มูลค่าพื้นฐานยังคงเป็น $10.00 USD

---

## คำถามที่พบบ่อย {#faq}

### สามารถถอน Mobile11 Money เป็นเงินสดได้ไหม?
ไม่ได้ Mobile11 Money สามารถใช้ได้เฉพาะสำหรับการซื้อภายในแพลตฟอร์ม Mobile11 ไม่สามารถแปลงเป็นเงินสดหรือโอนไปยังบัญชีธนาคาร

### สามารถโอน Mobile11 Money ไปยังบัญชีอื่นได้ไหม?
ไม่ได้ Mobile11 Money ไม่สามารถโอนได้และผูกกับบัญชีที่ได้รับ

### ทำไมยอด Mobile11 Money ไม่แสดง?
- ตรวจสอบว่าคุณเข้าสู่ระบบบัญชีที่ถูกต้อง
- ตรวจสอบว่าคุณมียอดขั้นต่ำ $1.00 USD
- รีเฟรชหน้าหรือรีสตาร์ทแอป
- ติดต่อฝ่ายสนับสนุนหากปัญหายังคงอยู่

### ฉันได้รับ Mobile11 Money จากการซื้อที่จ่ายด้วย Mobile11 Money ไหม?
ไม่ได้ รางวัลสะสมแต้มคำนวณเฉพาะส่วนเงินสดของการชำระเงิน หากคุณจ่าย $5 ด้วย Mobile11 Money และ $10 ด้วยบัตร คุณจะได้รับรางวัลเฉพาะ $10

### มีจำนวนสูงสุดที่สามารถรับได้ไหม?
ไม่มีเพดานสำหรับการรับ Mobile11 Money ยิ่งซื้อมากยิ่งได้รับมาก!

### สามารถใช้ Mobile11 Money สำหรับบัญชีคนอื่นได้ไหม?
ไม่ได้ Mobile11 Money ต้องใช้โดยเจ้าของบัญชีที่ได้รับ คุณสามารถมอบ eSIM เป็นของขวัญให้คนอื่นได้ แต่ต้องซื้อจากบัญชีของคุณเอง

---

## บทความที่เกี่ยวข้อง {#related}

- [โปรแกรมสะสมแต้ม Mobile11](/support/account/loyalty-program)
- [โปรแกรมแนะนำเพื่อน](/support/account/referral-program)
- [วิธีชำระเงิน](/support/account/payment-methods)',
  '[{"id":"overview","title":"Mobile11 Money คืออะไร?"},{"id":"earning","title":"วิธีรับ"},{"id":"usage","title":"เมื่อใช้ได้"},{"id":"checkout","title":"การใช้ที่หน้าชำระเงิน"},{"id":"expiration","title":"นโยบายการหมดอายุ"},{"id":"prevent-expiration","title":"ป้องกันการหมดอายุ"},{"id":"currency","title":"การแปลงสกุลเงิน"},{"id":"faq","title":"คำถามที่พบบ่อย"},{"id":"related","title":"บทความที่เกี่ยวข้อง"}]'::jsonb,
  'both',
  true,
  false,
  6
)
ON CONFLICT (slug, category, language) 
DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  content = EXCLUDED.content,
  table_of_contents = EXCLUDED.table_of_contents,
  updated_at = now();