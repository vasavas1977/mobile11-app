-- Phase 1 Continued: Thai Versions of Getting Started Articles

-- Article 1: Install eSIM via QR Code on iOS (Thai)
INSERT INTO kb_articles (slug, category, language, title, content, description, table_of_contents, display_order, source, is_published, is_internal)
VALUES (
  'install-esim-ios-qr',
  'getting-started',
  'th',
  'วิธีติดตั้ง eSIM บน iPhone (สแกน QR Code)',
  '## ก่อนเริ่มต้น {#before-you-begin}

ก่อนติดตั้ง eSIM จาก Mobile11 กรุณาตรวจสอบ:

- **อุปกรณ์รองรับ eSIM**: iPhone XS ขึ้นไปรองรับ eSIM
- **เครื่องปลดล็อคจากค่าย**: ติดต่อค่ายมือถือหากไม่แน่ใจ
- **มีการเชื่อมต่ออินเทอร์เน็ต**: ต้องใช้ WiFi หรือข้อมูลมือถือ
- **เข้าถึงบัญชี Mobile11 ได้**: เพื่อดูรายละเอียดการติดตั้ง

## หาข้อมูลการติดตั้ง eSIM ได้ที่ไหน {#find-details}

หลังจากซื้อ eSIM จาก Mobile11:

1. เปิด **แอป Mobile11** หรือเข้า **mobile11.com**
2. ไปที่ **eSIM ของฉัน** ในบัญชี
3. เลือก eSIM ที่ต้องการติดตั้ง
4. แตะ **ดูรายละเอียดการติดตั้ง**
5. คุณจะเห็น **QR code** และรายละเอียดการติดตั้งแบบ manual

### ทำไมหาคำแนะนำการติดตั้งไม่เจอ?

รายละเอียดการติดตั้งจะแสดงหลังซื้อเสร็จสมบูรณ์เท่านั้น หากไม่เห็น:
- ตรวจสอบว่าชำระเงินสำเร็จแล้ว
- ดูในอีเมลเพื่อยืนยันการซื้อ
- ติดต่อฝ่ายสนับสนุน Mobile11 หากยังมีปัญหา

## ขั้นตอนการติดตั้ง {#installation-steps}

### ขั้นตอนที่ 1: เปิดการตั้งค่า
ไปที่ **ตั้งค่า (Settings)** บน iPhone

### ขั้นตอนที่ 2: ไปยังการตั้งค่า eSIM
- **iOS 17.4+**: แตะ **เซลลูลาร์** หรือ **ข้อมูลมือถือ** → **เพิ่ม eSIM**
- **iOS 16 และก่อนหน้า**: แตะ **เซลลูลาร์** → **เพิ่มแผนบริการเซลลูลาร์**

### ขั้นตอนที่ 3: สแกน QR Code
เลือก **ใช้ QR Code** และเล็งกล้องไปที่ QR code ในบัญชี Mobile11

### ขั้นตอนที่ 4: รอการตรวจจับ eSIM
iPhone จะตรวจจับและดาวน์โหลด eSIM อาจใช้เวลา 1-2 นาที

### ขั้นตอนที่ 5: ตั้งชื่อ eSIM
ตั้งชื่อที่จำง่าย เช่น "Mobile11 Travel" หรือชื่อประเทศปลายทาง

### ขั้นตอนที่ 6: ตั้งค่าสายเริ่มต้น
เมื่อได้รับแจ้ง ให้ตั้งค่าดังนี้:

- **สายเริ่มต้น**: เก็บ SIM หลักไว้สำหรับโทร/SMS
- **iMessage & FaceTime**: เก็บ SIM หลัก
- **ข้อมูลเซลลูลาร์**: เลือก **Mobile11 eSIM**

### ขั้นตอนที่ 7: ปิดการสลับข้อมูล
เมื่อถูกถามเรื่องการสลับข้อมูลเซลลูลาร์ เลือก **ปิด** เพื่อหลีกเลี่ยงค่าใช้จ่ายเพิ่มเติมจาก SIM หลัก

### ขั้นตอนที่ 8: เสร็จสิ้นการตั้งค่า
แตะ **เสร็จสิ้น** eSIM ของคุณติดตั้งเรียบร้อยแล้ว!

## วิธีเชื่อมต่อข้อมูลมือถือ {#connect-data}

eSIM จะไม่เชื่อมต่ออัตโนมัติ—คุณต้องเปิดใช้งานเมื่อถึงปลายทาง:

1. ไปที่ **ตั้งค่า** → **เซลลูลาร์/ข้อมูลมือถือ**
2. ตรวจสอบว่า **ข้อมูลเซลลูลาร์** เปิดอยู่
3. เลือก **Mobile11 eSIM** เป็นสายข้อมูล
4. เปิด **Data Roaming** สำหรับสาย eSIM
5. รอ 30 วินาที ถึง 2 นาทีเพื่อเชื่อมต่อ

### แก้ไขปัญหาการเชื่อมต่อ

หากไม่เชื่อมต่อทันที:
- เปิด-ปิดโหมดเครื่องบิน
- รีสตาร์ทอุปกรณ์
- ตรวจสอบว่า Data Roaming เปิดสำหรับ eSIM
- ตรวจสอบว่าอยู่ในพื้นที่ครอบคลุม

## ต้องการวิธีติดตั้งอื่น? {#alternative-methods}

หากสแกน QR code ไม่ได้ คุณสามารถ:
- [ติดตั้งแบบ manual ใช้ activation code](/support/getting-started/install-esim-ios-manual)
- [ติดตั้งโดยตรงจากแอป Mobile11](/support/getting-started/install-esim-app-ios)

## คำถามที่พบบ่อย {#faq}

### ติดตั้ง eSIM ก่อนเดินทางได้ไหม?
ได้! eSIM ส่วนใหญ่สามารถติดตั้งได้ทุกเมื่อ แพ็กเกจข้อมูลจะเริ่มทำงานเมื่อเชื่อมต่อเครือข่ายที่ปลายทางครั้งแรก

### QR code สแกนไม่ได้ทำอย่างไร?
ลองเพิ่มความสว่างหน้าจอ หรือใช้วิธีติดตั้งแบบ manual แทน

### ใช้ eSIM กับหลายอุปกรณ์ได้ไหม?
ไม่ได้ eSIM แต่ละตัวติดตั้งได้เพียงอุปกรณ์เดียว หากเปลี่ยนอุปกรณ์ต้องซื้อ eSIM ใหม่',
  'คู่มือฉบับสมบูรณ์สำหรับติดตั้ง eSIM จาก Mobile11 บน iPhone โดยใช้การสแกน QR code พร้อมการตั้งค่าสายเริ่มต้นและคำแนะนำการเชื่อมต่อ',
  '[{"id":"before-you-begin","title":"ก่อนเริ่มต้น"},{"id":"find-details","title":"หาข้อมูลการติดตั้ง"},{"id":"installation-steps","title":"ขั้นตอนการติดตั้ง"},{"id":"connect-data","title":"วิธีเชื่อมต่อข้อมูล"},{"id":"alternative-methods","title":"วิธีอื่น"},{"id":"faq","title":"คำถามที่พบบ่อย"}]',
  1,
  'both',
  true,
  false
)
ON CONFLICT (slug, category, language)
DO UPDATE SET
  content = EXCLUDED.content,
  description = EXCLUDED.description,
  table_of_contents = EXCLUDED.table_of_contents,
  updated_at = now();

-- Article 2: Install eSIM Manually on iOS (Thai)
INSERT INTO kb_articles (slug, category, language, title, content, description, table_of_contents, display_order, source, is_published, is_internal)
VALUES (
  'install-esim-ios-manual',
  'getting-started',
  'th',
  'วิธีติดตั้ง eSIM บน iPhone (Manual / Activation Code)',
  '## เมื่อไหร่ควรใช้การติดตั้งแบบ Manual {#when-to-use}

การติดตั้งแบบ manual เหมาะสำหรับ:
- กล้องไม่สามารถสแกน QR code ได้
- ตั้งค่าบนอุปกรณ์เดียวกับที่แสดง code
- ต้องการกรอกข้อมูลโดยตรง

## หารายละเอียด Activation {#find-details}

1. เข้าสู่ระบบ **บัญชี Mobile11**
2. ไปที่ **eSIM ของฉัน**
3. เลือก eSIM ที่ซื้อไว้
4. แตะ **รายละเอียดการติดตั้ง** → **ติดตั้งแบบ Manual**
5. คุณจะเห็น:
   - **SM-DP+ Address** (ที่อยู่เซิร์ฟเวอร์)
   - **Activation Code** (รหัสเฉพาะ)

### SM-DP+ Address คืออะไร?

SM-DP+ (Subscription Manager Data Preparation) address คือเซิร์ฟเวอร์ที่อุปกรณ์จะดาวน์โหลดโปรไฟล์ eSIM มีลักษณะเช่น: `smdp.io` หรือคล้ายกัน

## ขั้นตอนการติดตั้งแบบ Manual {#installation-steps}

### ขั้นตอนที่ 1: เปิดการตั้งค่า
ไปที่ **ตั้งค่า** บน iPhone

### ขั้นตอนที่ 2: ไปยังการตั้งค่า eSIM
- **iOS 17.4+**: แตะ **เซลลูลาร์** → **เพิ่ม eSIM** → **ใช้ QR Code** → **กรอกรายละเอียดด้วยตนเอง**
- **iOS 16 และก่อนหน้า**: แตะ **เซลลูลาร์** → **เพิ่มแผนบริการเซลลูลาร์** → **กรอกรายละเอียดด้วยตนเอง**

### ขั้นตอนที่ 3: กรอก SM-DP+ Address
คัดลอกและวาง SM-DP+ address จากบัญชี Mobile11 ในช่องแรก

### ขั้นตอนที่ 4: กรอก Activation Code
คัดลอกและวาง activation code ในช่องที่สอง รหัสนี้แยกแยะตัวพิมพ์เล็ก-ใหญ่

### ขั้นตอนที่ 5: ดาวน์โหลดโปรไฟล์ eSIM
แตะ **ถัดไป** หรือ **ดำเนินการต่อ** iPhone จะดาวน์โหลดโปรไฟล์ eSIM

### ขั้นตอนที่ 6: ตั้งชื่อ eSIM
เลือกชื่อเช่น "Mobile11 Travel" เพื่อให้จำง่าย

### ขั้นตอนที่ 7: ตั้งค่าสายเริ่มต้น

**สายเสียงเริ่มต้น**: เก็บ SIM หลัก
**iMessage & FaceTime**: เก็บ SIM หลัก  
**ข้อมูลเซลลูลาร์**: เลือก **Mobile11 eSIM**
**อนุญาตให้สลับข้อมูลเซลลูลาร์**: **ปิด**

### ขั้นตอนที่ 8: เสร็จสิ้นการตั้งค่า
แตะ **เสร็จสิ้น** eSIM ติดตั้งพร้อมใช้งานแล้ว!

## เชื่อมต่อข้อมูลมือถือ {#connect-data}

เมื่อถึงปลายทาง:

1. **ตั้งค่า** → **เซลลูลาร์/ข้อมูลมือถือ**
2. เปิด **ข้อมูลเซลลูลาร์**
3. เลือก Mobile11 eSIM เป็นสายข้อมูล
4. เปิด **Data Roaming** สำหรับ eSIM
5. รอการเชื่อมต่อเครือข่าย (สูงสุด 2 นาที)

## ปัญหาที่พบบ่อย {#troubleshooting}

### "ไม่สามารถเพิ่มแผนเซลลูลาร์"
- ตรวจสอบว่ามีการเชื่อมต่อ WiFi หรือข้อมูลมือถือ
- ตรวจสอบว่า code คัดลอกถูกต้องไม่มีช่องว่างเกิน
- ยืนยันว่าอุปกรณ์ปลดล็อคจากค่ายแล้ว

### "ติดตั้ง eSIM แล้ว"
eSIM แต่ละตัวติดตั้งได้ครั้งเดียว หากลบไปแล้ว อาจต้องซื้อใหม่

### Activation Code ใช้ไม่ได้
- ตรวจสอบว่าไม่มีช่องว่างก่อน/หลัง code
- รหัสแยกแยะตัวพิมพ์เล็ก-ใหญ่
- ตรวจสอบว่า eSIM ถูก activate ไปแล้วหรือไม่

## คำถามที่พบบ่อย {#faq}

### ติดตั้ง eSIM โดยไม่มีอินเทอร์เน็ตได้ไหม?
ไม่ได้ อุปกรณ์ต้องมี WiFi หรือข้อมูลมือถือเพื่อดาวน์โหลดโปรไฟล์ eSIM

### Activation code มีอายุนานแค่ไหน?
Activation code ไม่หมดอายุ แต่ใช้ได้ครั้งเดียวเท่านั้น

### คัดลอก-วาง code ได้ไหม?
ได้! แนะนำให้คัดลอกเพื่อหลีกเลี่ยงการพิมพ์ผิด กดค้างเพื่อวางบน iPhone',
  'คู่มือขั้นตอนการติดตั้ง eSIM แบบ manual บน iPhone โดยใช้ SM-DP+ address และ activation code',
  '[{"id":"when-to-use","title":"เมื่อไหร่ควรใช้ Manual"},{"id":"find-details","title":"หารายละเอียด Activation"},{"id":"installation-steps","title":"ขั้นตอนการติดตั้ง"},{"id":"connect-data","title":"เชื่อมต่อข้อมูลมือถือ"},{"id":"troubleshooting","title":"แก้ไขปัญหา"},{"id":"faq","title":"คำถามที่พบบ่อย"}]',
  2,
  'both',
  true,
  false
)
ON CONFLICT (slug, category, language)
DO UPDATE SET
  content = EXCLUDED.content,
  description = EXCLUDED.description,
  table_of_contents = EXCLUDED.table_of_contents,
  updated_at = now();

-- Article 3: Install eSIM on Samsung Galaxy (Thai)
INSERT INTO kb_articles (slug, category, language, title, content, description, table_of_contents, display_order, source, is_published, is_internal)
VALUES (
  'install-esim-samsung-manual',
  'getting-started',
  'th',
  'วิธีติดตั้ง eSIM บน Samsung Galaxy',
  '## ก่อนเริ่มต้น {#before-you-begin}

ตรวจสอบว่า Samsung Galaxy ของคุณ:
- **รองรับ eSIM**: Galaxy S20 ขึ้นไป, Z Flip/Fold series
- **ปลดล็อคจากค่าย**: จำเป็นสำหรับ eSIM จากบุคคลที่สาม
- **มีอินเทอร์เน็ตเสถียร**: ต้องใช้ WiFi หรือข้อมูลมือถือ
- **อัปเดตล่าสุด**: แนะนำซอฟต์แวร์เวอร์ชันล่าสุด

### Samsung รุ่นใดรองรับ eSIM?

- Galaxy S20, S21, S22, S23, S24 series
- Galaxy Z Flip และ Z Fold series (ทุกรุ่น)
- Galaxy Note 20 series
- Galaxy A series บางรุ่น (ขึ้นอยู่กับภูมิภาค)

## หารายละเอียด eSIM {#find-details}

1. เปิด **แอป Mobile11** หรือไปที่ **mobile11.com**
2. ไปที่ **eSIM ของฉัน**
3. เลือก eSIM ที่ซื้อไว้
4. แตะ **ดูรายละเอียดการติดตั้ง**
5. คัดลอก **Activation Code** (ต้องใช้)

## ขั้นตอนการติดตั้ง {#installation-steps}

### ขั้นตอนที่ 1: เปิดการตั้งค่า
แตะแอป **ตั้งค่า** บน Samsung

### ขั้นตอนที่ 2: ไปยัง SIM Manager
ไปที่: **ตั้งค่า** → **การเชื่อมต่อ** → **ตัวจัดการ SIM** (หรือ **SIM Card Manager**)

### ขั้นตอนที่ 3: เพิ่ม eSIM
แตะ **เพิ่ม eSIM** หรือ **เพิ่มแผนมือถือ**

### ขั้นตอนที่ 4: เลือกวิธีติดตั้ง

**ตัวเลือก A - QR Code:**
- เลือก **สแกน QR code จากผู้ให้บริการ**
- เล็งกล้องไปที่ QR code ในบัญชี Mobile11

**ตัวเลือก B - Manual/Activation Code:**
- เลือก **กรอก activation code แทน**
- วาง activation code จาก Mobile11

### ขั้นตอนที่ 5: ดาวน์โหลด eSIM
Samsung จะดาวน์โหลดและติดตั้งโปรไฟล์ eSIM ใช้เวลา 1-2 นาที

### ขั้นตอนที่ 6: ตั้งชื่อ eSIM
ตั้งชื่อที่จำง่าย เช่น "Mobile11" หรือชื่อประเทศ

### ขั้นตอนที่ 7: ตั้งค่าข้อมูล
เมื่อได้รับแจ้ง:
- **ข้อมูลมือถือ**: เลือก Mobile11 eSIM
- **โทร**: เก็บ SIM หลัก
- **SMS**: เก็บ SIM หลัก

### ขั้นตอนที่ 8: เสร็จสิ้นการตั้งค่า
แตะ **เสร็จสิ้น** eSIM ติดตั้งเรียบร้อยแล้ว!

## เชื่อมต่อข้อมูลมือถือ {#connect-data}

เมื่อถึงปลายทาง:

1. ไปที่ **ตั้งค่า** → **การเชื่อมต่อ** → **ตัวจัดการ SIM**
2. ภายใต้ **ข้อมูลมือถือ** เลือก **Mobile11 eSIM**
3. ไปที่ **ตั้งค่า** → **การเชื่อมต่อ** → **เครือข่ายมือถือ**
4. เปิด **Data roaming**
5. ปิด-เปิด **ข้อมูลมือถือ** เพื่อรีเฟรชการเชื่อมต่อ
6. รอ 30 วินาที ถึง 2 นาทีเพื่อเชื่อมต่อ

### วิธีสลับด่วน

1. ปัดลงเพื่อเปิด Quick Panel
2. กดค้างที่ **ข้อมูลมือถือ**
3. เลือก Mobile11 eSIM
4. เปิด Data Roaming

## แก้ไขปัญหา {#troubleshooting}

### eSIM ไม่เชื่อมต่อ

1. ตรวจสอบว่าอยู่ในพื้นที่ครอบคลุม
2. ยืนยันว่า **Data Roaming** เปิดสำหรับ eSIM
3. ลองเปิด-ปิด **โหมดเครื่องบิน**
4. รีสตาร์ทอุปกรณ์
5. เลือกเครือข่ายด้วยตนเองใน **ตั้งค่า** → **การเชื่อมต่อ** → **เครือข่ายมือถือ** → **ผู้ให้บริการเครือข่าย**

### "ไม่สามารถเพิ่ม eSIM"

- ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต
- ยืนยัน activation code ถูกต้อง
- ตรวจสอบว่าอุปกรณ์ปลดล็อคจากค่าย
- ติดต่อฝ่ายสนับสนุน Mobile11 หากยังมีปัญหา

### ความแตกต่างของ One UI

เส้นทางเมนูอาจต่างกันเล็กน้อยระหว่างเวอร์ชัน One UI:
- **One UI 5+**: ตั้งค่า → การเชื่อมต่อ → ตัวจัดการ SIM
- **One UI 4**: ตั้งค่า → การเชื่อมต่อ → SIM Card Manager
- **เวอร์ชันเก่า**: ตั้งค่า → การเชื่อมต่อ → SIM Card Manager → เพิ่มแผนมือถือ

## คำถามที่พบบ่อย {#faq}

### ใช้ dual SIM กับ eSIM บน Samsung ได้ไหม?
ได้! Samsung Galaxy รองรับการใช้ SIM จริงและ eSIM พร้อมกัน

### ต้องถอด SIM จริงออกไหม?
ไม่ต้อง ใช้ทั้งสองได้พร้อมกัน แค่ตั้งค่าว่าจะใช้ SIM ไหนสำหรับข้อมูล โทร และข้อความ

### เปลี่ยน SIM สำหรับข้อมูลอย่างไร?
ไปที่ **ตั้งค่า** → **การเชื่อมต่อ** → **ตัวจัดการ SIM** → **ข้อมูลมือถือ** แล้วเลือก SIM ที่ต้องการ',
  'คู่มือติดตั้ง Mobile11 eSIM บน Samsung Galaxy ครบทั้งวิธี QR code และ manual activation',
  '[{"id":"before-you-begin","title":"ก่อนเริ่มต้น"},{"id":"find-details","title":"หารายละเอียด eSIM"},{"id":"installation-steps","title":"ขั้นตอนการติดตั้ง"},{"id":"connect-data","title":"เชื่อมต่อข้อมูลมือถือ"},{"id":"troubleshooting","title":"แก้ไขปัญหา"},{"id":"faq","title":"คำถามที่พบบ่อย"}]',
  3,
  'both',
  true,
  false
)
ON CONFLICT (slug, category, language)
DO UPDATE SET
  content = EXCLUDED.content,
  description = EXCLUDED.description,
  table_of_contents = EXCLUDED.table_of_contents,
  updated_at = now();