-- Update English payment-methods article
UPDATE kb_articles
SET 
  content = '## Credit & Debit Cards {#credit-debit-cards}

We accept major international credit and debit cards for **USD payments** (processed via Stripe):

**Supported Cards:**
- Visa
- Mastercard
- American Express
- JCB
- UnionPay

**Security:**
- All transactions are encrypted with 256-bit SSL
- We''re PCI DSS compliant
- 3D Secure (Verified by Visa / Mastercard SecureCode) supported
- Card details are never stored on our servers

## Thai Payment Methods {#thai-payment-methods}

For **THB payments**, we offer convenient local payment options via 2C2P:

**PromptPay:**
- Scan QR code to pay instantly
- Works with all Thai banks
- No additional fees
- Payments confirm within seconds

**Thai Bank Cards:**
- SCB (Siam Commercial Bank)
- Kasikornbank (KBank)
- Bangkok Bank (BBL)
- Krungthai Bank (KTB)
- And other major Thai banks

**Mobile Banking Apps:**
- Pay directly through your bank''s mobile app
- Supports all major Thai banking apps
- Secure authentication through your bank

**Note:** Thai payment methods may take a few minutes to process before your eSIM is delivered.

## Mobile11 Money {#mobile11-money}

Use your Mobile11 Money balance for purchases:

**How it works:**
- Earn cashback on purchases through our Loyalty Program
- Balance is automatically applied at checkout
- Can be combined with other payment methods

**Checking your balance:**
1. Log into your account
2. Go to "My Account" > "Mobile11 Money"
3. View your current balance and transaction history

## How Payments Are Processed {#currency-routing}

Mobile11 uses two payment processors to provide the best experience:

**USD Payments (International):**
- Processed via Stripe
- Use credit/debit cards (Visa, Mastercard, Amex, JCB, UnionPay)
- Ideal for international customers

**THB Payments (Thailand):**
- Processed via 2C2P
- Use PromptPay, Thai bank cards, or mobile banking
- Best rates for Thai customers

**Automatic Routing:**
- Select your preferred currency at checkout
- The appropriate payment methods will be shown
- THB → Thai payment options
- USD → International card payments

**No Hidden Fees:**
- The price shown is what you pay
- No additional processing fees from Mobile11',
  table_of_contents = '[{"id":"credit-debit-cards","title":"Credit & Debit Cards"},{"id":"thai-payment-methods","title":"Thai Payment Methods"},{"id":"mobile11-money","title":"Mobile11 Money"},{"id":"currency-routing","title":"How Payments Are Processed"}]'::jsonb,
  updated_at = now()
WHERE slug = 'payment-methods' AND language = 'en';

-- Update Thai payment-methods article
UPDATE kb_articles
SET 
  content = '## บัตรเครดิตและเดบิต {#credit-debit-cards}

เรารับบัตรเครดิตและเดบิตระหว่างประเทศหลักสำหรับ**การชำระเงินเป็น USD** (ผ่าน Stripe):

**บัตรที่รองรับ:**
- Visa
- Mastercard
- American Express
- JCB
- UnionPay

**ความปลอดภัย:**
- ธุรกรรมทั้งหมดเข้ารหัสด้วย SSL 256 บิต
- เราได้รับการรับรอง PCI DSS
- รองรับ 3D Secure (Verified by Visa / Mastercard SecureCode)
- ข้อมูลบัตรไม่ถูกจัดเก็บบนเซิร์ฟเวอร์ของเรา

## วิธีการชำระเงินสำหรับคนไทย {#thai-payment-methods}

สำหรับ**การชำระเงินเป็นบาท (THB)** เรามีตัวเลือกการชำระเงินในประเทศผ่าน 2C2P:

**พร้อมเพย์:**
- สแกน QR code เพื่อชำระเงินทันที
- ใช้ได้กับธนาคารไทยทุกแห่ง
- ไม่มีค่าธรรมเนียมเพิ่มเติม
- ยืนยันการชำระเงินภายในไม่กี่วินาที

**บัตรธนาคารไทย:**
- ธนาคารไทยพาณิชย์ (SCB)
- ธนาคารกสิกรไทย (KBank)
- ธนาคารกรุงเทพ (BBL)
- ธนาคารกรุงไทย (KTB)
- และธนาคารหลักอื่นๆ ในไทย

**แอปโมบายแบงก์กิ้ง:**
- ชำระเงินผ่านแอปธนาคารของคุณโดยตรง
- รองรับแอปธนาคารไทยทุกแห่ง
- ยืนยันตัวตนอย่างปลอดภัยผ่านธนาคารของคุณ

**หมายเหตุ:** วิธีการชำระเงินไทยอาจใช้เวลาสักครู่ในการดำเนินการก่อนที่ eSIM ของคุณจะถูกจัดส่ง

## Mobile11 Money {#mobile11-money}

ใช้ยอดเงิน Mobile11 Money ของคุณสำหรับการซื้อ:

**วิธีการทำงาน:**
- รับเงินคืนจากการซื้อผ่านโปรแกรมสะสมแต้มของเรา
- ยอดเงินจะถูกใช้โดยอัตโนมัติเมื่อชำระเงิน
- สามารถใช้ร่วมกับวิธีการชำระเงินอื่นได้

**ตรวจสอบยอดเงินของคุณ:**
1. เข้าสู่ระบบบัญชีของคุณ
2. ไปที่ "บัญชีของฉัน" > "Mobile11 Money"
3. ดูยอดเงินปัจจุบันและประวัติธุรกรรม

## การประมวลผลการชำระเงิน {#currency-routing}

Mobile11 ใช้ผู้ให้บริการชำระเงินสองรายเพื่อประสบการณ์ที่ดีที่สุด:

**การชำระเงิน USD (ต่างประเทศ):**
- ประมวลผลผ่าน Stripe
- ใช้บัตรเครดิต/เดบิต (Visa, Mastercard, Amex, JCB, UnionPay)
- เหมาะสำหรับลูกค้าต่างประเทศ

**การชำระเงิน THB (ประเทศไทย):**
- ประมวลผลผ่าน 2C2P
- ใช้พร้อมเพย์ บัตรธนาคารไทย หรือโมบายแบงก์กิ้ง
- อัตราที่ดีที่สุดสำหรับลูกค้าไทย

**การเลือกเส้นทางอัตโนมัติ:**
- เลือกสกุลเงินที่ต้องการเมื่อชำระเงิน
- วิธีการชำระเงินที่เหมาะสมจะถูกแสดง
- THB → ตัวเลือกการชำระเงินไทย
- USD → การชำระเงินด้วยบัตรระหว่างประเทศ

**ไม่มีค่าธรรมเนียมแอบแฝง:**
- ราคาที่แสดงคือราคาที่คุณจ่าย
- ไม่มีค่าธรรมเนียมการประมวลผลเพิ่มเติมจาก Mobile11',
  table_of_contents = '[{"id":"credit-debit-cards","title":"บัตรเครดิตและเดบิต"},{"id":"thai-payment-methods","title":"วิธีการชำระเงินสำหรับคนไทย"},{"id":"mobile11-money","title":"Mobile11 Money"},{"id":"currency-routing","title":"การประมวลผลการชำระเงิน"}]'::jsonb,
  updated_at = now()
WHERE slug = 'payment-methods' AND language = 'th';