-- More Using eSIM articles

-- 1. WiFi Calling
INSERT INTO kb_articles (title, slug, category, language, content, description, source, is_published, is_internal, table_of_contents) VALUES
('How to Use WiFi Calling with Your Primary Number', 'wifi-calling-primary-number', 'using-esim', 'en',
'## Overview {#overview}

WiFi Calling lets you make and receive calls on your primary phone number using your Mobile11 eSIM''s data connection. This is perfect when you want to stay reachable on your home number while traveling.

## Requirements {#requirements}

- Your primary carrier must support WiFi Calling
- WiFi Calling enabled on your device
- Active Mobile11 eSIM with data
- Compatible device (most modern smartphones)

## Setup on iPhone {#iphone}

1. Go to **Settings** → **Cellular**
2. Select your **primary SIM** (not Mobile11)
3. Tap **WiFi Calling**
4. Toggle **WiFi Calling on This iPhone** ON
5. Confirm your emergency address if prompted

### Set Mobile11 for Data
1. Go to **Settings** → **Cellular** → **Cellular Data**
2. Select your **Mobile11 eSIM** for data
3. This routes WiFi Calling through Mobile11''s data

## Setup on Android {#android}

1. Go to **Settings** → **Network & Internet** → **Mobile Network**
2. Select your **primary SIM**
3. Tap **WiFi Calling** or **Advanced Calling**
4. Toggle ON
5. Set Mobile11 as your default data SIM

## Troubleshooting {#troubleshooting}

### WiFi Calling Not Working
- Ensure your primary carrier supports WiFi Calling abroad
- Check that Mobile11 data is active and connected
- Restart your device after changing settings

### Poor Call Quality
- Check your Mobile11 data speed
- Move to an area with better coverage
- Disable VPN if using one',
'Learn how to use WiFi Calling on your primary number while using Mobile11 eSIM for data.',
'both', true, false,
'[{"id":"overview","title":"Overview"},{"id":"requirements","title":"Requirements"},{"id":"iphone","title":"Setup on iPhone"},{"id":"android","title":"Setup on Android"},{"id":"troubleshooting","title":"Troubleshooting"}]'::jsonb),

('วิธีใช้ WiFi Calling กับหมายเลขหลักของคุณ', 'wifi-calling-primary-number', 'using-esim', 'th',
'## ภาพรวม {#overview}

WiFi Calling ช่วยให้คุณโทรออกและรับสายบนหมายเลขโทรศัพท์หลักโดยใช้การเชื่อมต่อข้อมูลของ Mobile11 eSIM เหมาะสำหรับเมื่อคุณต้องการติดต่อได้บนหมายเลขบ้านขณะเดินทาง

## ข้อกำหนด {#requirements}

- ผู้ให้บริการหลักต้องรองรับ WiFi Calling
- เปิดใช้ WiFi Calling บนอุปกรณ์
- Mobile11 eSIM ที่ใช้งานพร้อมข้อมูล
- อุปกรณ์ที่รองรับ (สมาร์ทโฟนรุ่นใหม่ส่วนใหญ่)

## ตั้งค่าบน iPhone {#iphone}

1. ไปที่ **ตั้งค่า** → **เซลลูลาร์**
2. เลือก **SIM หลัก** (ไม่ใช่ Mobile11)
3. แตะ **WiFi Calling**
4. เปิด **WiFi Calling บน iPhone นี้**
5. ยืนยันที่อยู่ฉุกเฉินหากถูกถาม

### ตั้ง Mobile11 สำหรับข้อมูล
1. ไปที่ **ตั้งค่า** → **เซลลูลาร์** → **ข้อมูลเซลลูลาร์**
2. เลือก **Mobile11 eSIM** สำหรับข้อมูล
3. นี่จะส่ง WiFi Calling ผ่านข้อมูลของ Mobile11

## ตั้งค่าบน Android {#android}

1. ไปที่ **ตั้งค่า** → **เครือข่ายและอินเทอร์เน็ต** → **เครือข่ายมือถือ**
2. เลือก **SIM หลัก**
3. แตะ **WiFi Calling** หรือ **Advanced Calling**
4. เปิด
5. ตั้ง Mobile11 เป็น SIM ข้อมูลเริ่มต้น

## แก้ไขปัญหา {#troubleshooting}

### WiFi Calling ไม่ทำงาน
- ตรวจสอบว่าผู้ให้บริการหลักรองรับ WiFi Calling ต่างประเทศ
- ตรวจสอบว่าข้อมูล Mobile11 เปิดใช้และเชื่อมต่อ
- รีสตาร์ทอุปกรณ์หลังเปลี่ยนการตั้งค่า

### คุณภาพเสียงไม่ดี
- ตรวจสอบความเร็วข้อมูล Mobile11
- ย้ายไปพื้นที่ที่มีสัญญาณดีกว่า
- ปิด VPN หากใช้อยู่',
'เรียนรู้วิธีใช้ WiFi Calling บนหมายเลขหลักขณะใช้ Mobile11 eSIM สำหรับข้อมูล',
'both', true, false,
'[{"id":"overview","title":"ภาพรวม"},{"id":"requirements","title":"ข้อกำหนด"},{"id":"iphone","title":"ตั้งค่าบน iPhone"},{"id":"android","title":"ตั้งค่าบน Android"},{"id":"troubleshooting","title":"แก้ไขปัญหา"}]'::jsonb)
ON CONFLICT (slug, category, language) DO UPDATE SET
  content = EXCLUDED.content,
  description = EXCLUDED.description,
  table_of_contents = EXCLUDED.table_of_contents,
  updated_at = now();

-- 2. Change eSIM Label
INSERT INTO kb_articles (title, slug, category, language, content, description, source, is_published, is_internal, table_of_contents) VALUES
('How to Change Your eSIM Label', 'change-esim-label', 'using-esim', 'en',
'## Overview {#overview}

When you have multiple eSIMs installed, giving them custom labels helps you identify which eSIM is for which country or purpose.

## Change Label on iPhone {#iphone}

1. Go to **Settings** → **Cellular**
2. Tap on the eSIM you want to rename
3. Tap **Cellular Plan Label**
4. Choose from preset options:
   - Primary / Secondary
   - Personal / Business
   - Travel
5. Or tap **Custom Label** to enter your own name (e.g., "Thailand Trip", "Japan 2024")
6. Tap **Done**

## Change Label on Android {#android}

### Samsung Galaxy
1. Go to **Settings** → **Connections** → **SIM Manager**
2. Tap on the eSIM you want to rename
3. Tap the **name** at the top
4. Enter your custom name
5. Tap **Save**

### Google Pixel / Stock Android
1. Go to **Settings** → **Network & Internet** → **SIMs**
2. Select the eSIM
3. Tap the **pencil icon** next to the name
4. Enter your custom label
5. Tap **OK**

## Tips for Naming {#tips}

- Use the destination country: "Thailand", "Japan"
- Add dates for trips: "Europe 2024"
- Use purpose: "Business Travel", "Vacation"
- Keep it short for easy reading in status bar',
'Learn how to rename your eSIM with a custom label for easy identification.',
'both', true, false,
'[{"id":"overview","title":"Overview"},{"id":"iphone","title":"On iPhone"},{"id":"android","title":"On Android"},{"id":"tips","title":"Naming Tips"}]'::jsonb),

('วิธีเปลี่ยนชื่อ eSIM', 'change-esim-label', 'using-esim', 'th',
'## ภาพรวม {#overview}

เมื่อคุณติดตั้ง eSIM หลายตัว การตั้งชื่อเฉพาะช่วยให้คุณระบุได้ว่า eSIM ตัวไหนสำหรับประเทศหรือวัตถุประสงค์ใด

## เปลี่ยนชื่อบน iPhone {#iphone}

1. ไปที่ **ตั้งค่า** → **เซลลูลาร์**
2. แตะที่ eSIM ที่ต้องการเปลี่ยนชื่อ
3. แตะ **ป้ายกำกับแผน**
4. เลือกจากตัวเลือกที่มี:
   - หลัก / รอง
   - ส่วนตัว / ธุรกิจ
   - เดินทาง
5. หรือแตะ **ป้ายกำกับที่กำหนดเอง** เพื่อป้อนชื่อเอง (เช่น "ทริปไทย", "ญี่ปุ่น 2024")
6. แตะ **เสร็จ**

## เปลี่ยนชื่อบน Android {#android}

### Samsung Galaxy
1. ไปที่ **ตั้งค่า** → **การเชื่อมต่อ** → **ตัวจัดการ SIM**
2. แตะที่ eSIM ที่ต้องการเปลี่ยนชื่อ
3. แตะ **ชื่อ** ที่ด้านบน
4. ป้อนชื่อที่กำหนดเอง
5. แตะ **บันทึก**

### Google Pixel / Android แท้
1. ไปที่ **ตั้งค่า** → **เครือข่ายและอินเทอร์เน็ต** → **SIM**
2. เลือก eSIM
3. แตะ **ไอคอนดินสอ** ข้างชื่อ
4. ป้อนป้ายกำกับที่กำหนดเอง
5. แตะ **ตกลง**

## เคล็ดลับการตั้งชื่อ {#tips}

- ใช้ประเทศปลายทาง: "ไทย", "ญี่ปุ่น"
- เพิ่มวันที่ทริป: "ยุโรป 2024"
- ใช้วัตถุประสงค์: "เดินทางธุรกิจ", "พักร้อน"
- ตั้งสั้นๆ เพื่อให้อ่านง่ายในแถบสถานะ',
'เรียนรู้วิธีเปลี่ยนชื่อ eSIM ด้วยป้ายกำกับที่กำหนดเองเพื่อระบุง่าย',
'both', true, false,
'[{"id":"overview","title":"ภาพรวม"},{"id":"iphone","title":"บน iPhone"},{"id":"android","title":"บน Android"},{"id":"tips","title":"เคล็ดลับการตั้งชื่อ"}]'::jsonb)
ON CONFLICT (slug, category, language) DO UPDATE SET
  content = EXCLUDED.content,
  description = EXCLUDED.description,
  table_of_contents = EXCLUDED.table_of_contents,
  updated_at = now();

-- 3. Optimize Data Usage
INSERT INTO kb_articles (title, slug, category, language, content, description, source, is_published, is_internal, table_of_contents) VALUES
('How to Optimize Your eSIM Data Usage', 'optimize-data-usage', 'using-esim', 'en',
'## Overview {#overview}

Make your Mobile11 eSIM data last longer with these optimization tips. Whether you have a limited data plan or want to extend your validity period, these settings help.

## Disable Background App Refresh {#background}

### iPhone
1. Go to **Settings** → **General** → **Background App Refresh**
2. Toggle OFF entirely, or
3. Select **Wi-Fi** only to disable on cellular

### Android
1. Go to **Settings** → **Apps**
2. Select each app → **Mobile data & Wi-Fi**
3. Toggle OFF **Background data**

## Reduce Streaming Quality {#streaming}

### YouTube
1. Tap profile → **Settings** → **Video quality preferences**
2. Select **Data saver** for mobile networks

### Netflix
1. Tap profile → **App Settings** → **Cellular Data Usage**
2. Select **Low** or **Save Data**

### Spotify
1. Go to **Settings** → **Audio Quality**
2. Set **Cellular streaming** to **Low**

## Disable Auto-Updates {#updates}

### iPhone
1. **Settings** → **App Store**
2. Toggle OFF **App Downloads** under Cellular Data

### Android
1. Open **Play Store** → **Settings**
2. **Network preferences** → **Auto-update apps**
3. Select **Over Wi-Fi only**

## Use Offline Mode {#offline}

- Download maps offline (Google Maps, Apple Maps)
- Download music playlists on Wi-Fi
- Download Netflix shows before traveling
- Save articles for offline reading

## Monitor Usage {#monitor}

1. Check your Mobile11 order page for real-time data usage
2. Set data warnings in your phone settings
3. Use iOS Screen Time or Android Digital Wellbeing',
'Tips to reduce data consumption and make your Mobile11 eSIM last longer.',
'both', true, false,
'[{"id":"overview","title":"Overview"},{"id":"background","title":"Disable Background Refresh"},{"id":"streaming","title":"Reduce Streaming Quality"},{"id":"updates","title":"Disable Auto-Updates"},{"id":"offline","title":"Use Offline Mode"},{"id":"monitor","title":"Monitor Usage"}]'::jsonb),

('วิธีเพิ่มประสิทธิภาพการใช้ข้อมูล eSIM', 'optimize-data-usage', 'using-esim', 'th',
'## ภาพรวม {#overview}

ทำให้ข้อมูล Mobile11 eSIM อยู่นานขึ้นด้วยเคล็ดลับการเพิ่มประสิทธิภาพเหล่านี้ ไม่ว่าคุณจะมีแผนข้อมูลจำกัดหรือต้องการยืดระยะเวลาใช้งาน

## ปิดการรีเฟรชแอปพื้นหลัง {#background}

### iPhone
1. ไปที่ **ตั้งค่า** → **ทั่วไป** → **การรีเฟรชแอปพื้นหลัง**
2. ปิดทั้งหมด หรือ
3. เลือก **Wi-Fi เท่านั้น** เพื่อปิดบนเซลลูลาร์

### Android
1. ไปที่ **ตั้งค่า** → **แอป**
2. เลือกแต่ละแอป → **ข้อมูลมือถือและ Wi-Fi**
3. ปิด **ข้อมูลพื้นหลัง**

## ลดคุณภาพสตรีมมิ่ง {#streaming}

### YouTube
1. แตะโปรไฟล์ → **ตั้งค่า** → **ตั้งค่าคุณภาพวิดีโอ**
2. เลือก **ประหยัดข้อมูล** สำหรับเครือข่ายมือถือ

### Netflix
1. แตะโปรไฟล์ → **ตั้งค่าแอป** → **การใช้ข้อมูลเซลลูลาร์**
2. เลือก **ต่ำ** หรือ **ประหยัดข้อมูล**

### Spotify
1. ไปที่ **ตั้งค่า** → **คุณภาพเสียง**
2. ตั้ง **สตรีมมิ่งเซลลูลาร์** เป็น **ต่ำ**

## ปิดการอัปเดตอัตโนมัติ {#updates}

### iPhone
1. **ตั้งค่า** → **App Store**
2. ปิด **ดาวน์โหลดแอป** ภายใต้ข้อมูลเซลลูลาร์

### Android
1. เปิด **Play Store** → **ตั้งค่า**
2. **ตั้งค่าเครือข่าย** → **อัปเดตแอปอัตโนมัติ**
3. เลือก **ผ่าน Wi-Fi เท่านั้น**

## ใช้โหมดออฟไลน์ {#offline}

- ดาวน์โหลดแผนที่ออฟไลน์ (Google Maps, Apple Maps)
- ดาวน์โหลดเพลย์ลิสต์เพลงบน Wi-Fi
- ดาวน์โหลดรายการ Netflix ก่อนเดินทาง
- บันทึกบทความสำหรับอ่านออฟไลน์

## ติดตามการใช้งาน {#monitor}

1. ตรวจสอบหน้าคำสั่งซื้อ Mobile11 สำหรับการใช้ข้อมูลแบบเรียลไทม์
2. ตั้งการแจ้งเตือนข้อมูลในการตั้งค่าโทรศัพท์
3. ใช้ Screen Time บน iOS หรือ Digital Wellbeing บน Android',
'เคล็ดลับลดการใช้ข้อมูลและทำให้ Mobile11 eSIM อยู่นานขึ้น',
'both', true, false,
'[{"id":"overview","title":"ภาพรวม"},{"id":"background","title":"ปิดการรีเฟรชพื้นหลัง"},{"id":"streaming","title":"ลดคุณภาพสตรีมมิ่ง"},{"id":"updates","title":"ปิดอัปเดตอัตโนมัติ"},{"id":"offline","title":"ใช้โหมดออฟไลน์"},{"id":"monitor","title":"ติดตามการใช้งาน"}]'::jsonb)
ON CONFLICT (slug, category, language) DO UPDATE SET
  content = EXCLUDED.content,
  description = EXCLUDED.description,
  table_of_contents = EXCLUDED.table_of_contents,
  updated_at = now();

-- 4. Set Data Limit on Android
INSERT INTO kb_articles (title, slug, category, language, content, description, source, is_published, is_internal, table_of_contents) VALUES
('How to Set a Data Limit on Android', 'set-data-limit-android', 'using-esim', 'en',
'## Overview {#overview}

Setting a data limit on Android helps you avoid exceeding your Mobile11 eSIM data allowance. Your phone can warn you or automatically cut off data when you reach your limit.

## Set Data Warning {#warning}

A data warning notifies you when you''re approaching your limit.

1. Go to **Settings** → **Network & Internet** → **Mobile Network**
2. Select your **Mobile11 eSIM**
3. Tap **Data warning & limit**
4. Toggle ON **Set data warning**
5. Tap **Data warning** and enter your threshold (e.g., 800 MB for a 1GB plan)

## Set Data Limit {#limit}

A data limit automatically disables mobile data when reached.

1. Follow steps 1-3 above
2. Toggle ON **Set data limit**
3. Tap **Data limit** and enter your plan size (e.g., 1 GB)
4. When reached, mobile data will be disabled automatically

## Reset Cycle {#reset}

Set when your data usage counter resets:

1. In **Data warning & limit** settings
2. Tap **App data usage cycle**
3. Set the date your Mobile11 validity starts

## Samsung Specific {#samsung}

1. Go to **Settings** → **Connections** → **Data usage**
2. Tap **Mobile data usage**
3. Tap the **gear icon** ⚙️
4. Toggle **Limit mobile data usage**
5. Set your warning and limit values

## Important Notes {#notes}

- Android data tracking may differ slightly from Mobile11''s actual usage
- Check your Mobile11 order page for accurate data remaining
- Data limits apply per billing cycle you set',
'Learn how to set data warnings and limits on Android to control your eSIM usage.',
'both', true, false,
'[{"id":"overview","title":"Overview"},{"id":"warning","title":"Set Data Warning"},{"id":"limit","title":"Set Data Limit"},{"id":"reset","title":"Reset Cycle"},{"id":"samsung","title":"Samsung Specific"},{"id":"notes","title":"Important Notes"}]'::jsonb),

('วิธีตั้งขีดจำกัดข้อมูลบน Android', 'set-data-limit-android', 'using-esim', 'th',
'## ภาพรวม {#overview}

การตั้งขีดจำกัดข้อมูลบน Android ช่วยให้คุณหลีกเลี่ยงการใช้เกินปริมาณข้อมูล Mobile11 eSIM โทรศัพท์สามารถแจ้งเตือนหรือตัดข้อมูลอัตโนมัติเมื่อถึงขีดจำกัด

## ตั้งการแจ้งเตือนข้อมูล {#warning}

การแจ้งเตือนข้อมูลจะแจ้งคุณเมื่อใกล้ถึงขีดจำกัด

1. ไปที่ **ตั้งค่า** → **เครือข่ายและอินเทอร์เน็ต** → **เครือข่ายมือถือ**
2. เลือก **Mobile11 eSIM**
3. แตะ **การแจ้งเตือนและขีดจำกัดข้อมูล**
4. เปิด **ตั้งการแจ้งเตือนข้อมูล**
5. แตะ **การแจ้งเตือนข้อมูล** และป้อนเกณฑ์ (เช่น 800 MB สำหรับแผน 1GB)

## ตั้งขีดจำกัดข้อมูล {#limit}

ขีดจำกัดข้อมูลจะปิดข้อมูลมือถืออัตโนมัติเมื่อถึง

1. ทำตามขั้นตอน 1-3 ข้างต้น
2. เปิด **ตั้งขีดจำกัดข้อมูล**
3. แตะ **ขีดจำกัดข้อมูล** และป้อนขนาดแผน (เช่น 1 GB)
4. เมื่อถึง ข้อมูลมือถือจะถูกปิดอัตโนมัติ

## รีเซ็ตรอบ {#reset}

ตั้งเมื่อตัวนับการใช้ข้อมูลรีเซ็ต:

1. ในการตั้งค่า **การแจ้งเตือนและขีดจำกัดข้อมูล**
2. แตะ **รอบการใช้ข้อมูลแอป**
3. ตั้งวันที่ที่ Mobile11 เริ่มใช้งาน

## Samsung เฉพาะ {#samsung}

1. ไปที่ **ตั้งค่า** → **การเชื่อมต่อ** → **การใช้ข้อมูล**
2. แตะ **การใช้ข้อมูลมือถือ**
3. แตะ **ไอคอนเกียร์** ⚙️
4. เปิด **จำกัดการใช้ข้อมูลมือถือ**
5. ตั้งค่าเตือนและขีดจำกัด

## หมายเหตุสำคัญ {#notes}

- การติดตามข้อมูล Android อาจแตกต่างเล็กน้อยจากการใช้งานจริงของ Mobile11
- ตรวจสอบหน้าคำสั่งซื้อ Mobile11 สำหรับข้อมูลคงเหลือที่แม่นยำ
- ขีดจำกัดข้อมูลใช้ต่อรอบการเรียกเก็บเงินที่คุณตั้ง',
'เรียนรู้วิธีตั้งการแจ้งเตือนและขีดจำกัดข้อมูลบน Android เพื่อควบคุมการใช้ eSIM',
'both', true, false,
'[{"id":"overview","title":"ภาพรวม"},{"id":"warning","title":"ตั้งการแจ้งเตือนข้อมูล"},{"id":"limit","title":"ตั้งขีดจำกัดข้อมูล"},{"id":"reset","title":"รีเซ็ตรอบ"},{"id":"samsung","title":"Samsung เฉพาะ"},{"id":"notes","title":"หมายเหตุสำคัญ"}]'::jsonb)
ON CONFLICT (slug, category, language) DO UPDATE SET
  content = EXCLUDED.content,
  description = EXCLUDED.description,
  table_of_contents = EXCLUDED.table_of_contents,
  updated_at = now();

-- 5. Track Data with iOS Widgets
INSERT INTO kb_articles (title, slug, category, language, content, description, source, is_published, is_internal, table_of_contents) VALUES
('How to Track Data Usage with iOS Widgets', 'track-data-ios-widgets', 'using-esim', 'en',
'## Overview {#overview}

Use iOS widgets to quickly check your Mobile11 eSIM data usage directly from your home screen.

## Built-in Cellular Widget {#cellular}

iOS has a built-in widget showing cellular data usage:

1. Long-press on your home screen
2. Tap the **+** button (top left)
3. Search for **"Cellular"**
4. Select the widget size you prefer
5. Tap **Add Widget**

Note: This shows device-tracked data, which may differ slightly from actual provider usage.

## Mobile11 App Widget {#m11-widget}

If you''ve installed our app, you can add a data tracking widget:

1. Long-press on your home screen
2. Tap **+** to add widgets
3. Search for **"Mobile11"**
4. Choose widget size (small or medium)
5. Add to home screen

Widget shows:
- Current data remaining
- Days until expiration
- Quick link to top-up

## Check Usage in Settings {#settings}

For detailed breakdown:

1. Go to **Settings** → **Cellular**
2. Scroll down to see usage by app
3. Find your Mobile11 eSIM section
4. Tap **Cellular Data Usage** for more details

## Reset Statistics {#reset}

To reset the built-in counter:

1. Go to **Settings** → **Cellular**
2. Scroll to the very bottom
3. Tap **Reset Statistics**
4. Note: This resets ALL usage data

## Pro Tip {#tips}

For the most accurate data remaining:
- Check your Mobile11 order page
- Our app syncs with provider data
- Built-in iOS tracking is estimated only',
'Learn how to add iOS widgets to monitor your Mobile11 eSIM data usage.',
'both', true, false,
'[{"id":"overview","title":"Overview"},{"id":"cellular","title":"Built-in Cellular Widget"},{"id":"m11-widget","title":"Mobile11 App Widget"},{"id":"settings","title":"Check in Settings"},{"id":"reset","title":"Reset Statistics"},{"id":"tips","title":"Pro Tip"}]'::jsonb),

('วิธีติดตามการใช้ข้อมูลด้วย iOS Widgets', 'track-data-ios-widgets', 'using-esim', 'th',
'## ภาพรวม {#overview}

ใช้ iOS widgets เพื่อตรวจสอบการใช้ข้อมูล Mobile11 eSIM อย่างรวดเร็วจากหน้าจอหลัก

## วิดเจ็ตเซลลูลาร์ในตัว {#cellular}

iOS มีวิดเจ็ตในตัวแสดงการใช้ข้อมูลเซลลูลาร์:

1. กดค้างบนหน้าจอหลัก
2. แตะปุ่ม **+** (ซ้ายบน)
3. ค้นหา **"Cellular"**
4. เลือกขนาดวิดเจ็ตที่ต้องการ
5. แตะ **เพิ่มวิดเจ็ต**

หมายเหตุ: นี่แสดงข้อมูลที่อุปกรณ์ติดตาม อาจแตกต่างเล็กน้อยจากการใช้งานจริง

## วิดเจ็ตแอป Mobile11 {#m11-widget}

หากคุณติดตั้งแอปของเรา คุณสามารถเพิ่มวิดเจ็ตติดตามข้อมูล:

1. กดค้างบนหน้าจอหลัก
2. แตะ **+** เพื่อเพิ่มวิดเจ็ต
3. ค้นหา **"Mobile11"**
4. เลือกขนาดวิดเจ็ต (เล็กหรือกลาง)
5. เพิ่มไปยังหน้าจอหลัก

วิดเจ็ตแสดง:
- ข้อมูลคงเหลือปัจจุบัน
- วันจนกว่าจะหมดอายุ
- ลิงก์ด่วนไปเติมเงิน

## ตรวจสอบการใช้งานในตั้งค่า {#settings}

สำหรับรายละเอียด:

1. ไปที่ **ตั้งค่า** → **เซลลูลาร์**
2. เลื่อนลงเพื่อดูการใช้งานตามแอป
3. หาส่วน Mobile11 eSIM
4. แตะ **การใช้ข้อมูลเซลลูลาร์** สำหรับรายละเอียดเพิ่มเติม

## รีเซ็ตสถิติ {#reset}

เพื่อรีเซ็ตตัวนับในตัว:

1. ไปที่ **ตั้งค่า** → **เซลลูลาร์**
2. เลื่อนลงสุด
3. แตะ **รีเซ็ตสถิติ**
4. หมายเหตุ: นี่จะรีเซ็ตข้อมูลการใช้งานทั้งหมด

## เคล็ดลับ {#tips}

สำหรับข้อมูลคงเหลือที่แม่นยำที่สุด:
- ตรวจสอบหน้าคำสั่งซื้อ Mobile11
- แอปของเราซิงค์กับข้อมูลผู้ให้บริการ
- การติดตาม iOS ในตัวเป็นการประมาณเท่านั้น',
'เรียนรู้วิธีเพิ่ม iOS widgets เพื่อติดตามการใช้ข้อมูล Mobile11 eSIM',
'both', true, false,
'[{"id":"overview","title":"ภาพรวม"},{"id":"cellular","title":"วิดเจ็ตเซลลูลาร์ในตัว"},{"id":"m11-widget","title":"วิดเจ็ตแอป Mobile11"},{"id":"settings","title":"ตรวจสอบในตั้งค่า"},{"id":"reset","title":"รีเซ็ตสถิติ"},{"id":"tips","title":"เคล็ดลับ"}]'::jsonb)
ON CONFLICT (slug, category, language) DO UPDATE SET
  content = EXCLUDED.content,
  description = EXCLUDED.description,
  table_of_contents = EXCLUDED.table_of_contents,
  updated_at = now();

-- 6. Find eSIM ICCID
INSERT INTO kb_articles (title, slug, category, language, content, description, source, is_published, is_internal, table_of_contents) VALUES
('Where Can I Find My eSIM''s ICCID Number?', 'find-esim-iccid', 'using-esim', 'en',
'## What is ICCID? {#what-is}

ICCID (Integrated Circuit Card Identifier) is a unique 19-20 digit number that identifies your eSIM. You may need this for support requests or troubleshooting.

## Find ICCID on iPhone {#iphone}

1. Go to **Settings** → **General** → **About**
2. Scroll down to the SIM section
3. Look for **ICCID** under your Mobile11 eSIM
4. Long-press to copy the number

Alternative method:
1. **Settings** → **Cellular**
2. Tap on your Mobile11 eSIM
3. Look for **ICCID** in the details

## Find ICCID on Android {#android}

### Samsung
1. Go to **Settings** → **About phone** → **Status information**
2. Tap **SIM card status**
3. Find **ICCID**

### Google Pixel
1. Go to **Settings** → **About phone**
2. Tap **SIM status**
3. Look for **ICCID**

## Find in Mobile11 Account {#account}

1. Log in to your Mobile11 account
2. Go to **My eSIMs**
3. Click on the eSIM order
4. View eSIM details including ICCID

## When You Need ICCID {#when-needed}

- Contacting customer support
- Troubleshooting connectivity issues
- Verifying eSIM installation
- Provider-level support requests',
'Learn where to find your eSIM ICCID number on iPhone, Android, or in your account.',
'both', true, false,
'[{"id":"what-is","title":"What is ICCID?"},{"id":"iphone","title":"Find on iPhone"},{"id":"android","title":"Find on Android"},{"id":"account","title":"Find in Account"},{"id":"when-needed","title":"When You Need It"}]'::jsonb),

('หมายเลข ICCID ของ eSIM อยู่ที่ไหน?', 'find-esim-iccid', 'using-esim', 'th',
'## ICCID คืออะไร? {#what-is}

ICCID (Integrated Circuit Card Identifier) คือหมายเลข 19-20 หลักที่ไม่ซ้ำกันซึ่งระบุ eSIM ของคุณ คุณอาจต้องใช้สำหรับคำขอสนับสนุนหรือแก้ไขปัญหา

## หา ICCID บน iPhone {#iphone}

1. ไปที่ **ตั้งค่า** → **ทั่วไป** → **เกี่ยวกับ**
2. เลื่อนลงไปที่ส่วน SIM
3. มองหา **ICCID** ภายใต้ Mobile11 eSIM
4. กดค้างเพื่อคัดลอกหมายเลข

วิธีอื่น:
1. **ตั้งค่า** → **เซลลูลาร์**
2. แตะที่ Mobile11 eSIM
3. มองหา **ICCID** ในรายละเอียด

## หา ICCID บน Android {#android}

### Samsung
1. ไปที่ **ตั้งค่า** → **เกี่ยวกับโทรศัพท์** → **ข้อมูลสถานะ**
2. แตะ **สถานะซิมการ์ด**
3. หา **ICCID**

### Google Pixel
1. ไปที่ **ตั้งค่า** → **เกี่ยวกับโทรศัพท์**
2. แตะ **สถานะ SIM**
3. มองหา **ICCID**

## หาในบัญชี Mobile11 {#account}

1. เข้าสู่ระบบบัญชี Mobile11
2. ไปที่ **eSIM ของฉัน**
3. คลิกที่คำสั่งซื้อ eSIM
4. ดูรายละเอียด eSIM รวมถึง ICCID

## เมื่อต้องใช้ ICCID {#when-needed}

- ติดต่อฝ่ายสนับสนุนลูกค้า
- แก้ไขปัญหาการเชื่อมต่อ
- ยืนยันการติดตั้ง eSIM
- คำขอสนับสนุนระดับผู้ให้บริการ',
'เรียนรู้วิธีหาหมายเลข ICCID ของ eSIM บน iPhone, Android, หรือในบัญชี',
'both', true, false,
'[{"id":"what-is","title":"ICCID คืออะไร?"},{"id":"iphone","title":"หาบน iPhone"},{"id":"android","title":"หาบน Android"},{"id":"account","title":"หาในบัญชี"},{"id":"when-needed","title":"เมื่อต้องใช้"}]'::jsonb)
ON CONFLICT (slug, category, language) DO UPDATE SET
  content = EXCLUDED.content,
  description = EXCLUDED.description,
  table_of_contents = EXCLUDED.table_of_contents,
  updated_at = now();