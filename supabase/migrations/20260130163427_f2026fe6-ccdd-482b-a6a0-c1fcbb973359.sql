-- Phase 2: Using & Managing eSIMs - Enhanced Content

-- Article: Remove eSIM from iOS (English)
INSERT INTO kb_articles (slug, category, language, title, description, content, table_of_contents, source, is_published, is_internal, display_order)
VALUES (
  'remove-esim-ios',
  'using-esim',
  'en',
  'How to Remove an eSIM from Your iPhone',
  'Learn when it''s safe to remove an eSIM and step-by-step instructions for deleting eSIM profiles from your iPhone.',
  '## When Should You Remove an eSIM? {#when-to-remove}

Before removing an eSIM from your device, it''s important to understand when it''s appropriate to do so. Removing an eSIM with active data could result in losing your remaining balance.

### You can safely remove an eSIM when: {#safe-to-remove}

**There is no longer an active data package**
- Check your Mobile11 account or app to verify your eSIM status
- If the package shows as "Expired" or "Depleted," it''s safe to remove
- Once removed, the eSIM cannot be reinstalled

**You no longer have a use for it**
- If you don''t plan to return to that destination
- Some eSIMs are single-use and cannot be topped up
- Regional eSIMs covering multiple countries may still be useful for future trips

**Your new eSIM is for the same country/region**
- Each Mobile11 purchase provides a new eSIM profile
- You don''t need to keep multiple eSIMs for the same destination
- Remove the old one before or after installing the new one

### Do NOT remove an eSIM when: {#do-not-remove}

- Your data package is still active
- You plan to top-up the eSIM for continued use
- You''re currently traveling and using the eSIM

---

## Step-by-Step: Remove eSIM from iPhone {#steps-iphone}

Follow these steps to remove an eSIM profile from your iPhone:

1. Open the **Settings** app on your iPhone
2. Tap **Cellular** (or **Mobile Data** in some regions)
3. Under "Cellular Plans" or "SIMs," tap on the eSIM you want to remove
4. Scroll down and tap **Delete eSIM** (or **Remove Cellular Plan**)
5. A confirmation popup will appear
6. Tap **Delete eSIM** to confirm

**Important:** This action is permanent. Once deleted, the eSIM profile cannot be recovered or reinstalled.

---

## After Removing the eSIM {#after-removal}

Once the eSIM is removed:

- The eSIM profile is permanently deleted from your device
- Any remaining data balance is forfeited
- You''ll need to purchase a new eSIM for future trips
- Your order history in Mobile11 remains unchanged

---

## Frequently Asked Questions {#faq}

### Can I reinstall a removed eSIM?
No. Once an eSIM is deleted from your device, it cannot be reinstalled. You''ll need to purchase a new eSIM.

### Will I get a refund for unused data?
No. Removing an eSIM with active data forfeits any remaining balance. Always check your usage before removing.

### How many eSIMs can I have on my iPhone?
Most modern iPhones support 8-10 eSIM profiles, but only 1-2 can be active simultaneously. Remove unused eSIMs to free up space.

### I accidentally removed my eSIM. What now?
Contact Mobile11 support immediately. While we cannot restore the deleted eSIM, we may be able to assist with your situation.

---

## Related Articles {#related}

- [Check eSIM Data Usage](/support/using-esim/check-data-usage)
- [Top Up Your eSIM](/support/using-esim/top-up-esim)
- [Install eSIM on iOS](/support/getting-started/install-esim-ios-qr)',
  '[{"id":"when-to-remove","title":"When Should You Remove an eSIM?"},{"id":"safe-to-remove","title":"Safe to Remove"},{"id":"do-not-remove","title":"Do NOT Remove"},{"id":"steps-iphone","title":"Step-by-Step Removal"},{"id":"after-removal","title":"After Removing"},{"id":"faq","title":"FAQ"},{"id":"related","title":"Related Articles"}]'::jsonb,
  'both',
  true,
  false,
  10
)
ON CONFLICT (slug, category, language) 
DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  content = EXCLUDED.content,
  table_of_contents = EXCLUDED.table_of_contents,
  updated_at = now();

-- Article: Remove eSIM from iOS (Thai)
INSERT INTO kb_articles (slug, category, language, title, description, content, table_of_contents, source, is_published, is_internal, display_order)
VALUES (
  'remove-esim-ios',
  'using-esim',
  'th',
  'วิธีลบ eSIM ออกจาก iPhone',
  'เรียนรู้ว่าเมื่อไหร่ที่ปลอดภัยในการลบ eSIM และขั้นตอนการลบโปรไฟล์ eSIM จาก iPhone ของคุณ',
  '## เมื่อไหร่ควรลบ eSIM? {#when-to-remove}

ก่อนลบ eSIM ออกจากอุปกรณ์ สิ่งสำคัญคือต้องเข้าใจว่าเมื่อไหร่ที่เหมาะสม การลบ eSIM ที่ยังมีข้อมูลใช้งานอยู่อาจทำให้สูญเสียยอดคงเหลือ

### คุณสามารถลบ eSIM ได้อย่างปลอดภัยเมื่อ: {#safe-to-remove}

**ไม่มีแพ็กเกจข้อมูลที่ใช้งานอยู่**
- ตรวจสอบบัญชีหรือแอป Mobile11 เพื่อยืนยันสถานะ eSIM
- หากแพ็กเกจแสดงว่า "หมดอายุ" หรือ "ใช้หมดแล้ว" สามารถลบได้อย่างปลอดภัย
- เมื่อลบแล้ว eSIM ไม่สามารถติดตั้งใหม่ได้

**คุณไม่ต้องการใช้งานอีกต่อไป**
- หากคุณไม่มีแผนจะกลับไปยังจุดหมายนั้น
- eSIM บางตัวใช้ได้ครั้งเดียวและไม่สามารถเติมเงินได้
- eSIM ระดับภูมิภาคที่ครอบคลุมหลายประเทศอาจยังเป็นประโยชน์สำหรับการเดินทางในอนาคต

**eSIM ใหม่ของคุณสำหรับประเทศ/ภูมิภาคเดียวกัน**
- การซื้อ Mobile11 แต่ละครั้งจะให้โปรไฟล์ eSIM ใหม่
- คุณไม่จำเป็นต้องเก็บ eSIM หลายตัวสำหรับจุดหมายเดียวกัน
- ลบตัวเก่าก่อนหรือหลังติดตั้งตัวใหม่

### ห้ามลบ eSIM เมื่อ: {#do-not-remove}

- แพ็กเกจข้อมูลยังใช้งานอยู่
- คุณวางแผนจะเติมเงิน eSIM เพื่อใช้งานต่อ
- คุณกำลังเดินทางและใช้ eSIM อยู่

---

## ขั้นตอน: ลบ eSIM จาก iPhone {#steps-iphone}

ทำตามขั้นตอนเหล่านี้เพื่อลบโปรไฟล์ eSIM จาก iPhone:

1. เปิดแอป **ตั้งค่า** บน iPhone
2. แตะ **เซลลูลาร์** (หรือ **ข้อมูลมือถือ**)
3. ใต้ "แผนเซลลูลาร์" หรือ "SIMs" แตะที่ eSIM ที่ต้องการลบ
4. เลื่อนลงและแตะ **ลบ eSIM** (หรือ **ลบแผนเซลลูลาร์**)
5. ป๊อปอัพยืนยันจะปรากฏขึ้น
6. แตะ **ลบ eSIM** เพื่อยืนยัน

**สำคัญ:** การดำเนินการนี้ถาวร เมื่อลบแล้ว โปรไฟล์ eSIM ไม่สามารถกู้คืนหรือติดตั้งใหม่ได้

---

## หลังจากลบ eSIM {#after-removal}

เมื่อ eSIM ถูกลบแล้ว:

- โปรไฟล์ eSIM จะถูกลบออกจากอุปกรณ์อย่างถาวร
- ยอดข้อมูลคงเหลือจะถูกริบ
- คุณต้องซื้อ eSIM ใหม่สำหรับการเดินทางในอนาคต
- ประวัติการสั่งซื้อใน Mobile11 ยังคงเดิม

---

## คำถามที่พบบ่อย {#faq}

### สามารถติดตั้ง eSIM ที่ลบไปแล้วได้ไหม?
ไม่ได้ เมื่อ eSIM ถูกลบจากอุปกรณ์แล้ว ไม่สามารถติดตั้งใหม่ได้ คุณต้องซื้อ eSIM ใหม่

### จะได้รับเงินคืนสำหรับข้อมูลที่ไม่ได้ใช้ไหม?
ไม่ได้ การลบ eSIM ที่มีข้อมูลใช้งานอยู่จะสูญเสียยอดคงเหลือ ตรวจสอบการใช้งานก่อนลบเสมอ

### iPhone รองรับ eSIM ได้กี่ตัว?
iPhone รุ่นใหม่รองรับโปรไฟล์ eSIM 8-10 ตัว แต่ใช้งานพร้อมกันได้เพียง 1-2 ตัว ลบ eSIM ที่ไม่ใช้เพื่อเพิ่มพื้นที่

### ลบ eSIM โดยไม่ตั้งใจ ทำอย่างไร?
ติดต่อฝ่ายสนับสนุน Mobile11 ทันที แม้เราไม่สามารถกู้คืน eSIM ที่ลบไปได้ แต่อาจช่วยเหลือสถานการณ์ของคุณได้

---

## บทความที่เกี่ยวข้อง {#related}

- [ตรวจสอบการใช้ข้อมูล eSIM](/support/using-esim/check-data-usage)
- [เติมเงิน eSIM](/support/using-esim/top-up-esim)
- [ติดตั้ง eSIM บน iOS](/support/getting-started/install-esim-ios-qr)',
  '[{"id":"when-to-remove","title":"เมื่อไหร่ควรลบ eSIM?"},{"id":"safe-to-remove","title":"ปลอดภัยที่จะลบ"},{"id":"do-not-remove","title":"ห้ามลบ"},{"id":"steps-iphone","title":"ขั้นตอนการลบ"},{"id":"after-removal","title":"หลังจากลบ"},{"id":"faq","title":"คำถามที่พบบ่อย"},{"id":"related","title":"บทความที่เกี่ยวข้อง"}]'::jsonb,
  'both',
  true,
  false,
  10
)
ON CONFLICT (slug, category, language) 
DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  content = EXCLUDED.content,
  table_of_contents = EXCLUDED.table_of_contents,
  updated_at = now();

-- Article: Personal Hotspot/Tethering (English)
INSERT INTO kb_articles (slug, category, language, title, description, content, table_of_contents, source, is_published, is_internal, display_order)
VALUES (
  'personal-hotspot-tethering',
  'using-esim',
  'en',
  'Personal Hotspot & Tethering with Your eSIM',
  'Learn how to share your eSIM data connection with other devices using Personal Hotspot (tethering) on iOS and Android.',
  '## Does My eSIM Support Personal Hotspot? {#support}

Personal Hotspot (also called tethering) allows you to share your eSIM''s mobile data connection with other devices like laptops, tablets, or other phones.

**Important:** Not all Mobile11 eSIM packages support Personal Hotspot. This depends on the carrier and data plan.

### How to check if hotspot is supported: {#check-support}

1. Go to your **My eSIMs** page in Mobile11
2. Find the eSIM you want to use
3. Look for the **Hotspot** indicator in the package details
4. If it shows ✓ or "Supported," you can use Personal Hotspot

If hotspot is not supported, attempting to enable it may not share data with connected devices.

---

## Enable Personal Hotspot on iPhone {#iphone-steps}

Follow these steps to share your eSIM data on iPhone:

1. Open **Settings** on your iPhone
2. Tap **Cellular** (or **Mobile Data**)
3. Select your Mobile11 eSIM from the list
4. Tap **Personal Hotspot**
5. Toggle **Allow Others to Join** to ON
6. Note the Wi-Fi password shown (or set your own)
7. On your other device, connect to the hotspot network

### If Personal Hotspot is missing: {#iphone-missing}

- Ensure your eSIM is set as the data line
- Restart your iPhone
- Check that Data Roaming is enabled for the eSIM
- Verify the package supports hotspot

---

## Enable Personal Hotspot on Android {#android-steps}

Steps may vary slightly by manufacturer:

### Samsung Galaxy:
1. Open **Settings**
2. Tap **Connections** > **Mobile Hotspot and Tethering**
3. Tap **Mobile Hotspot**
4. Toggle it ON
5. Configure network name and password
6. Connect your other devices

### Google Pixel / Stock Android:
1. Open **Settings**
2. Tap **Network & internet** > **Hotspot & tethering**
3. Tap **Wi-Fi hotspot**
4. Toggle it ON
5. Connect your devices to the hotspot

---

## Data Usage Warning {#data-warning}

When using Personal Hotspot, be aware:

- **Data consumption increases significantly** when sharing with other devices
- Video streaming, downloads, and updates on connected devices use your eSIM data
- Monitor your data usage frequently in the Mobile11 app
- Consider disabling automatic updates on connected devices

---

## Troubleshooting {#troubleshooting}

### Hotspot enabled but no internet on connected devices:

1. Verify your eSIM has active data remaining
2. Ensure **Data Roaming** is ON for the eSIM
3. Confirm the eSIM is set as your data line
4. Restart both your phone and the connected device
5. Try forgetting and reconnecting to the hotspot network

### Personal Hotspot option is grayed out:

- The eSIM package may not support hotspot
- Your device settings may need a restart
- Check for carrier settings updates

### Connected device shows "No Internet":

- Wait 30 seconds after connecting
- Toggle the hotspot OFF and ON
- Check your eSIM data balance

---

## Frequently Asked Questions {#faq}

### Can I use hotspot while traveling internationally?
Yes, if your eSIM package supports hotspot. The feature works the same way abroad.

### Does hotspot use more data than normal browsing?
Using hotspot itself doesn''t use extra data, but connected devices may consume data quickly through background processes.

### How many devices can connect to my hotspot?
Typically 5-10 devices, depending on your phone model. However, more devices means slower speeds for each.

### Why is my hotspot connection slow?
Multiple factors affect speed: number of connected devices, network congestion, distance from your phone, and the carrier''s network quality.

---

## Related Articles {#related}

- [Check eSIM Data Usage](/support/using-esim/check-data-usage)
- [Enable Data Roaming](/support/using-esim/data-roaming)
- [Troubleshoot Slow Internet](/support/troubleshoot/slow-internet)',
  '[{"id":"support","title":"Does My eSIM Support Hotspot?"},{"id":"check-support","title":"How to Check Support"},{"id":"iphone-steps","title":"Enable on iPhone"},{"id":"android-steps","title":"Enable on Android"},{"id":"data-warning","title":"Data Usage Warning"},{"id":"troubleshooting","title":"Troubleshooting"},{"id":"faq","title":"FAQ"},{"id":"related","title":"Related Articles"}]'::jsonb,
  'both',
  true,
  false,
  15
)
ON CONFLICT (slug, category, language) 
DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  content = EXCLUDED.content,
  table_of_contents = EXCLUDED.table_of_contents,
  updated_at = now();

-- Article: Personal Hotspot/Tethering (Thai)
INSERT INTO kb_articles (slug, category, language, title, description, content, table_of_contents, source, is_published, is_internal, display_order)
VALUES (
  'personal-hotspot-tethering',
  'using-esim',
  'th',
  'ฮอตสปอตส่วนตัวและการแชร์อินเทอร์เน็ตกับ eSIM',
  'เรียนรู้วิธีแชร์การเชื่อมต่อข้อมูล eSIM กับอุปกรณ์อื่นโดยใช้ฮอตสปอตส่วนตัว (tethering) บน iOS และ Android',
  '## eSIM ของฉันรองรับฮอตสปอตส่วนตัวไหม? {#support}

ฮอตสปอตส่วนตัว (เรียกอีกอย่างว่า tethering) ช่วยให้คุณแชร์การเชื่อมต่อข้อมูลมือถือของ eSIM กับอุปกรณ์อื่น เช่น แล็ปท็อป แท็บเล็ต หรือโทรศัพท์เครื่องอื่น

**สำคัญ:** แพ็กเกจ eSIM ของ Mobile11 ไม่ใช่ทุกแพ็กเกจที่รองรับฮอตสปอตส่วนตัว ขึ้นอยู่กับผู้ให้บริการและแผนข้อมูล

### วิธีตรวจสอบว่าฮอตสปอตรองรับหรือไม่: {#check-support}

1. ไปที่หน้า **eSIM ของฉัน** ใน Mobile11
2. ค้นหา eSIM ที่คุณต้องการใช้
3. มองหาตัวบ่งชี้ **Hotspot** ในรายละเอียดแพ็กเกจ
4. หากแสดง ✓ หรือ "รองรับ" คุณสามารถใช้ฮอตสปอตส่วนตัวได้

หากฮอตสปอตไม่รองรับ การเปิดใช้งานอาจไม่แชร์ข้อมูลกับอุปกรณ์ที่เชื่อมต่อ

---

## เปิดใช้ฮอตสปอตส่วนตัวบน iPhone {#iphone-steps}

ทำตามขั้นตอนเหล่านี้เพื่อแชร์ข้อมูล eSIM บน iPhone:

1. เปิด **ตั้งค่า** บน iPhone
2. แตะ **เซลลูลาร์** (หรือ **ข้อมูลมือถือ**)
3. เลือก eSIM ของ Mobile11 จากรายการ
4. แตะ **ฮอตสปอตส่วนตัว**
5. สลับ **อนุญาตให้ผู้อื่นเข้าร่วม** เป็น เปิด
6. จดรหัสผ่าน Wi-Fi ที่แสดง (หรือตั้งรหัสของคุณเอง)
7. บนอุปกรณ์อื่น เชื่อมต่อกับเครือข่ายฮอตสปอต

### หากไม่พบฮอตสปอตส่วนตัว: {#iphone-missing}

- ตรวจสอบว่า eSIM ถูกตั้งเป็นสายข้อมูล
- รีสตาร์ท iPhone
- ตรวจสอบว่าเปิด Data Roaming สำหรับ eSIM แล้ว
- ยืนยันว่าแพ็กเกจรองรับฮอตสปอต

---

## เปิดใช้ฮอตสปอตส่วนตัวบน Android {#android-steps}

ขั้นตอนอาจแตกต่างกันเล็กน้อยตามผู้ผลิต:

### Samsung Galaxy:
1. เปิด **ตั้งค่า**
2. แตะ **การเชื่อมต่อ** > **ฮอตสปอตมือถือและ Tethering**
3. แตะ **ฮอตสปอตมือถือ**
4. สลับเป็น เปิด
5. กำหนดชื่อเครือข่ายและรหัสผ่าน
6. เชื่อมต่ออุปกรณ์อื่นของคุณ

### Google Pixel / Android มาตรฐาน:
1. เปิด **ตั้งค่า**
2. แตะ **เครือข่ายและอินเทอร์เน็ต** > **ฮอตสปอตและ tethering**
3. แตะ **ฮอตสปอต Wi-Fi**
4. สลับเป็น เปิด
5. เชื่อมต่ออุปกรณ์ของคุณกับฮอตสปอต

---

## คำเตือนการใช้ข้อมูล {#data-warning}

เมื่อใช้ฮอตสปอตส่วนตัว โปรดทราบ:

- **การใช้ข้อมูลเพิ่มขึ้นอย่างมาก** เมื่อแชร์กับอุปกรณ์อื่น
- การสตรีมวิดีโอ ดาวน์โหลด และอัปเดตบนอุปกรณ์ที่เชื่อมต่อใช้ข้อมูล eSIM ของคุณ
- ตรวจสอบการใช้ข้อมูลบ่อยๆ ในแอป Mobile11
- พิจารณาปิดการอัปเดตอัตโนมัติบนอุปกรณ์ที่เชื่อมต่อ

---

## การแก้ไขปัญหา {#troubleshooting}

### เปิดฮอตสปอตแล้วแต่อุปกรณ์ที่เชื่อมต่อไม่มีอินเทอร์เน็ต:

1. ตรวจสอบว่า eSIM มีข้อมูลคงเหลือ
2. ตรวจสอบว่า **Data Roaming** เปิดอยู่สำหรับ eSIM
3. ยืนยันว่า eSIM ถูกตั้งเป็นสายข้อมูลของคุณ
4. รีสตาร์ททั้งโทรศัพท์และอุปกรณ์ที่เชื่อมต่อ
5. ลองลืมและเชื่อมต่อเครือข่ายฮอตสปอตใหม่

### ตัวเลือกฮอตสปอตส่วนตัวเป็นสีเทา:

- แพ็กเกจ eSIM อาจไม่รองรับฮอตสปอต
- การตั้งค่าอุปกรณ์อาจต้องรีสตาร์ท
- ตรวจสอบการอัปเดตการตั้งค่าผู้ให้บริการ

### อุปกรณ์ที่เชื่อมต่อแสดง "ไม่มีอินเทอร์เน็ต":

- รอ 30 วินาทีหลังจากเชื่อมต่อ
- สลับฮอตสปอต ปิด และ เปิด
- ตรวจสอบยอดข้อมูล eSIM ของคุณ

---

## คำถามที่พบบ่อย {#faq}

### สามารถใช้ฮอตสปอตขณะเดินทางต่างประเทศได้ไหม?
ได้ หากแพ็กเกจ eSIM ของคุณรองรับฮอตสปอต คุณสมบัตินี้ทำงานเหมือนกันในต่างประเทศ

### ฮอตสปอตใช้ข้อมูลมากกว่าการท่องเว็บปกติไหม?
การใช้ฮอตสปอตเองไม่ใช้ข้อมูลเพิ่ม แต่อุปกรณ์ที่เชื่อมต่ออาจใช้ข้อมูลอย่างรวดเร็วผ่านกระบวนการพื้นหลัง

### อุปกรณ์กี่เครื่องที่เชื่อมต่อฮอตสปอตได้?
โดยทั่วไป 5-10 เครื่อง ขึ้นอยู่กับรุ่นโทรศัพท์ อย่างไรก็ตาม อุปกรณ์มากขึ้นหมายถึงความเร็วช้าลงสำหรับแต่ละเครื่อง

### ทำไมการเชื่อมต่อฮอตสปอตถึงช้า?
หลายปัจจัยส่งผลต่อความเร็ว: จำนวนอุปกรณ์ที่เชื่อมต่อ ความแออัดของเครือข่าย ระยะห่างจากโทรศัพท์ และคุณภาพเครือข่ายของผู้ให้บริการ

---

## บทความที่เกี่ยวข้อง {#related}

- [ตรวจสอบการใช้ข้อมูล eSIM](/support/using-esim/check-data-usage)
- [เปิดใช้ Data Roaming](/support/using-esim/data-roaming)
- [แก้ไขปัญหาอินเทอร์เน็ตช้า](/support/troubleshoot/slow-internet)',
  '[{"id":"support","title":"eSIM รองรับฮอตสปอตไหม?"},{"id":"check-support","title":"วิธีตรวจสอบการรองรับ"},{"id":"iphone-steps","title":"เปิดใช้บน iPhone"},{"id":"android-steps","title":"เปิดใช้บน Android"},{"id":"data-warning","title":"คำเตือนการใช้ข้อมูล"},{"id":"troubleshooting","title":"การแก้ไขปัญหา"},{"id":"faq","title":"คำถามที่พบบ่อย"},{"id":"related","title":"บทความที่เกี่ยวข้อง"}]'::jsonb,
  'both',
  true,
  false,
  15
)
ON CONFLICT (slug, category, language) 
DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  content = EXCLUDED.content,
  table_of_contents = EXCLUDED.table_of_contents,
  updated_at = now();