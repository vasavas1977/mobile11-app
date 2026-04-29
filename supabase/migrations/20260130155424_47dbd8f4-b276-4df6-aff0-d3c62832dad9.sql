-- More articles: Receive SMS/Calls, eSIM Recycling, Trusted Devices, etc.

-- 1. Receive SMS/Calls with Data-Only eSIM
INSERT INTO kb_articles (title, slug, category, language, content, description, source, is_published, is_internal, table_of_contents) VALUES
('How to Receive SMS and Calls with a Data-Only eSIM', 'receive-sms-calls-data-only', 'using-esim', 'en',
'## Overview {#overview}

Mobile11 eSIMs are data-only, meaning they don''t include a phone number for traditional calls or SMS. However, you can still receive calls and texts on your primary number while traveling.

## Method 1: WiFi Calling {#wifi-calling}

Use your primary SIM''s WiFi Calling feature over Mobile11 data:

1. Enable WiFi Calling on your primary SIM
2. Set Mobile11 as your data SIM
3. Calls/SMS will route through your home carrier via data

**Requirements:**
- Your home carrier must support WiFi Calling abroad
- Both SIMs must be active

## Method 2: Call Forwarding {#call-forwarding}

Forward calls to a VoIP number:

1. Before traveling, set up call forwarding on your primary number
2. Forward to a VoIP service (Google Voice, Skype, etc.)
3. Receive calls through the VoIP app using Mobile11 data

## Method 3: Messaging Apps {#messaging-apps}

Use data-based messaging apps:

- **WhatsApp** - Free calls and messages
- **Telegram** - Voice calls and messages
- **LINE** - Popular in Asia
- **Messenger** - Facebook calls/messages
- **iMessage/FaceTime** - For Apple users

## Method 4: Virtual Numbers {#virtual-numbers}

Get a temporary local number:

- **Google Voice** (US numbers)
- **Skype Number** (Multiple countries)
- **TextNow** (Free US/Canada)

## For Bank OTPs {#bank-otp}

If you need SMS for bank verification:

1. Contact your bank before traveling to set up app-based 2FA
2. Use authenticator apps instead of SMS
3. Add trusted devices before leaving
4. Some banks support email OTP as alternative',
'Learn how to receive calls and SMS while using a data-only Mobile11 eSIM.',
'both', true, false,
'[{"id":"overview","title":"Overview"},{"id":"wifi-calling","title":"WiFi Calling"},{"id":"call-forwarding","title":"Call Forwarding"},{"id":"messaging-apps","title":"Messaging Apps"},{"id":"virtual-numbers","title":"Virtual Numbers"},{"id":"bank-otp","title":"For Bank OTPs"}]'::jsonb),

('วิธีรับ SMS และโทรศัพท์ด้วย eSIM ข้อมูลเท่านั้น', 'receive-sms-calls-data-only', 'using-esim', 'th',
'## ภาพรวม {#overview}

Mobile11 eSIM เป็นแบบข้อมูลเท่านั้น หมายความว่าไม่มีหมายเลขโทรศัพท์สำหรับโทรหรือ SMS แบบดั้งเดิม แต่คุณยังสามารถรับสายและข้อความบนหมายเลขหลักขณะเดินทาง

## วิธีที่ 1: WiFi Calling {#wifi-calling}

ใช้ฟีเจอร์ WiFi Calling ของ SIM หลักผ่านข้อมูล Mobile11:

1. เปิด WiFi Calling บน SIM หลัก
2. ตั้ง Mobile11 เป็น SIM ข้อมูล
3. สาย/SMS จะส่งผ่านผู้ให้บริการบ้านผ่านข้อมูล

**ข้อกำหนด:**
- ผู้ให้บริการบ้านต้องรองรับ WiFi Calling ต่างประเทศ
- ทั้งสอง SIM ต้องเปิดใช้งาน

## วิธีที่ 2: โอนสาย {#call-forwarding}

โอนสายไปหมายเลข VoIP:

1. ก่อนเดินทาง ตั้งค่าโอนสายบนหมายเลขหลัก
2. โอนไปบริการ VoIP (Google Voice, Skype, ฯลฯ)
3. รับสายผ่านแอป VoIP โดยใช้ข้อมูล Mobile11

## วิธีที่ 3: แอปส่งข้อความ {#messaging-apps}

ใช้แอปส่งข้อความผ่านข้อมูล:

- **WhatsApp** - โทรและข้อความฟรี
- **Telegram** - โทรเสียงและข้อความ
- **LINE** - ยอดนิยมในเอเชีย
- **Messenger** - โทร/ข้อความ Facebook
- **iMessage/FaceTime** - สำหรับผู้ใช้ Apple

## วิธีที่ 4: หมายเลขเสมือน {#virtual-numbers}

รับหมายเลขท้องถิ่นชั่วคราว:

- **Google Voice** (หมายเลข US)
- **Skype Number** (หลายประเทศ)
- **TextNow** (US/Canada ฟรี)

## สำหรับ OTP ธนาคาร {#bank-otp}

หากคุณต้องการ SMS สำหรับยืนยันธนาคาร:

1. ติดต่อธนาคารก่อนเดินทางเพื่อตั้งค่า 2FA ผ่านแอป
2. ใช้แอป authenticator แทน SMS
3. เพิ่มอุปกรณ์ที่เชื่อถือก่อนออกเดินทาง
4. บางธนาคารรองรับ OTP ทางอีเมลเป็นทางเลือก',
'เรียนรู้วิธีรับสายและ SMS ขณะใช้ Mobile11 eSIM ข้อมูลเท่านั้น',
'both', true, false,
'[{"id":"overview","title":"ภาพรวม"},{"id":"wifi-calling","title":"WiFi Calling"},{"id":"call-forwarding","title":"โอนสาย"},{"id":"messaging-apps","title":"แอปส่งข้อความ"},{"id":"virtual-numbers","title":"หมายเลขเสมือน"},{"id":"bank-otp","title":"สำหรับ OTP ธนาคาร"}]'::jsonb)
ON CONFLICT (slug, category, language) DO UPDATE SET
  content = EXCLUDED.content,
  description = EXCLUDED.description,
  table_of_contents = EXCLUDED.table_of_contents,
  updated_at = now();

-- 2. Trusted Devices
INSERT INTO kb_articles (title, slug, category, language, content, description, source, is_published, is_internal, table_of_contents) VALUES
('What Are Trusted Devices?', 'trusted-devices', 'account', 'en',
'## Overview {#overview}

Trusted devices are phones, tablets, or computers that you''ve verified as belonging to you. When you log in from a trusted device, you may not need additional verification.

## How Trusted Devices Work {#how-it-works}

When you first log in to Mobile11 from a new device:

1. You''ll receive a verification email or SMS
2. After verification, you can mark the device as "trusted"
3. Future logins from this device won''t require verification
4. The device is remembered for 30 days of inactivity

## Adding a Trusted Device {#adding}

1. Log in to your Mobile11 account from the new device
2. Complete the verification process
3. When prompted, select **"Trust this device"**
4. The device is now saved to your account

## Viewing Your Trusted Devices {#viewing}

1. Go to **My Account** → **Security**
2. Click **"Trusted Devices"**
3. View list of all trusted devices with:
   - Device name/type
   - Last login date
   - Location (approximate)

## Removing a Trusted Device {#removing}

If a device is lost, stolen, or no longer used:

1. Go to **My Account** → **Security** → **Trusted Devices**
2. Find the device you want to remove
3. Click **"Remove"** next to it
4. Confirm the removal

The next login from that device will require full verification.

## Security Best Practices {#security}

- Only trust personal devices you control
- Don''t trust public or shared computers
- Regularly review your trusted devices list
- Remove devices you no longer use
- If you suspect unauthorized access, remove all trusted devices',
'Learn about trusted devices and how they enhance your Mobile11 account security.',
'both', true, false,
'[{"id":"overview","title":"Overview"},{"id":"how-it-works","title":"How It Works"},{"id":"adding","title":"Adding a Device"},{"id":"viewing","title":"Viewing Devices"},{"id":"removing","title":"Removing a Device"},{"id":"security","title":"Security Best Practices"}]'::jsonb),

('อุปกรณ์ที่เชื่อถือคืออะไร?', 'trusted-devices', 'account', 'th',
'## ภาพรวม {#overview}

อุปกรณ์ที่เชื่อถือคือโทรศัพท์ แท็บเล็ต หรือคอมพิวเตอร์ที่คุณได้ยืนยันว่าเป็นของคุณ เมื่อคุณเข้าสู่ระบบจากอุปกรณ์ที่เชื่อถือ คุณอาจไม่ต้องยืนยันเพิ่มเติม

## อุปกรณ์ที่เชื่อถือทำงานอย่างไร {#how-it-works}

เมื่อคุณเข้าสู่ระบบ Mobile11 จากอุปกรณ์ใหม่ครั้งแรก:

1. คุณจะได้รับอีเมลหรือ SMS ยืนยัน
2. หลังยืนยัน คุณสามารถทำเครื่องหมายอุปกรณ์ว่า "เชื่อถือ"
3. การเข้าสู่ระบบในอนาคตจากอุปกรณ์นี้ไม่ต้องยืนยัน
4. อุปกรณ์จะถูกจดจำ 30 วันหากไม่มีการใช้งาน

## เพิ่มอุปกรณ์ที่เชื่อถือ {#adding}

1. เข้าสู่ระบบบัญชี Mobile11 จากอุปกรณ์ใหม่
2. ทำขั้นตอนยืนยันให้เสร็จ
3. เมื่อถูกถาม เลือก **"เชื่อถืออุปกรณ์นี้"**
4. อุปกรณ์ถูกบันทึกในบัญชีแล้ว

## ดูอุปกรณ์ที่เชื่อถือ {#viewing}

1. ไปที่ **บัญชีของฉัน** → **ความปลอดภัย**
2. คลิก **"อุปกรณ์ที่เชื่อถือ"**
3. ดูรายการอุปกรณ์ที่เชื่อถือทั้งหมดพร้อม:
   - ชื่อ/ประเภทอุปกรณ์
   - วันที่เข้าสู่ระบบล่าสุด
   - ตำแหน่ง (โดยประมาณ)

## ลบอุปกรณ์ที่เชื่อถือ {#removing}

หากอุปกรณ์หายไป ถูกขโมย หรือไม่ใช้แล้ว:

1. ไปที่ **บัญชีของฉัน** → **ความปลอดภัย** → **อุปกรณ์ที่เชื่อถือ**
2. หาอุปกรณ์ที่ต้องการลบ
3. คลิก **"ลบ"** ข้างๆ
4. ยืนยันการลบ

การเข้าสู่ระบบครั้งต่อไปจากอุปกรณ์นั้นจะต้องยืนยันเต็มรูปแบบ

## แนวปฏิบัติด้านความปลอดภัย {#security}

- เชื่อถือเฉพาะอุปกรณ์ส่วนตัวที่คุณควบคุม
- อย่าเชื่อถือคอมพิวเตอร์สาธารณะหรือใช้ร่วมกัน
- ตรวจสอบรายการอุปกรณ์ที่เชื่อถือเป็นประจำ
- ลบอุปกรณ์ที่ไม่ใช้แล้ว
- หากสงสัยการเข้าถึงโดยไม่ได้รับอนุญาต ให้ลบอุปกรณ์ที่เชื่อถือทั้งหมด',
'เรียนรู้เกี่ยวกับอุปกรณ์ที่เชื่อถือและวิธีเพิ่มความปลอดภัยบัญชี Mobile11',
'both', true, false,
'[{"id":"overview","title":"ภาพรวม"},{"id":"how-it-works","title":"วิธีการทำงาน"},{"id":"adding","title":"เพิ่มอุปกรณ์"},{"id":"viewing","title":"ดูอุปกรณ์"},{"id":"removing","title":"ลบอุปกรณ์"},{"id":"security","title":"แนวปฏิบัติด้านความปลอดภัย"}]'::jsonb)
ON CONFLICT (slug, category, language) DO UPDATE SET
  content = EXCLUDED.content,
  description = EXCLUDED.description,
  table_of_contents = EXCLUDED.table_of_contents,
  updated_at = now();

-- 3. Apple Private Relay Email
INSERT INTO kb_articles (title, slug, category, language, content, description, source, is_published, is_internal, table_of_contents) VALUES
('What is the @privaterelay.appleid.com Email?', 'apple-private-relay-email', 'account', 'en',
'## Overview {#overview}

If you signed up for Mobile11 using "Sign in with Apple" and chose to hide your email, Apple creates a unique private relay address ending in `@privaterelay.appleid.com`.

## How It Works {#how-it-works}

When you use "Hide My Email" with Apple Sign-In:

1. Apple generates a random email like `abc123xyz@privaterelay.appleid.com`
2. Emails sent to this address are forwarded to your real email
3. Your actual email stays hidden from Mobile11
4. You can disable forwarding anytime from your Apple ID settings

## Finding Your Private Relay Email {#finding}

To find which relay email you used for Mobile11:

### On iPhone/iPad
1. Go to **Settings** → **[Your Name]** → **Sign-In & Security**
2. Tap **"Hide My Email"**
3. Find Mobile11 in the list

### On Mac
1. Open **System Preferences** → **Apple ID**
2. Click **"Hide My Email"**
3. Look for Mobile11

### On iCloud.com
1. Go to **icloud.com** → **Account Settings**
2. Find **"Hide My Email"** section

## Troubleshooting {#troubleshooting}

### Not receiving emails from Mobile11?

1. Check your spam/junk folder
2. Verify forwarding is enabled:
   - Go to Apple ID settings → Hide My Email
   - Find Mobile11 and ensure "Forward To" is enabled
3. Check your forwarding destination is correct

### Want to change to your real email?

1. Contact Mobile11 support
2. We can update your account to use your actual email
3. You''ll need to verify the new email address

## Privacy Benefits {#privacy}

- Your real email is never shared with Mobile11
- You can disable the relay to stop emails
- Create unique addresses for different services
- Reduces spam if a service is compromised',
'Learn about Apple''s private relay email addresses used with Sign in with Apple.',
'both', true, false,
'[{"id":"overview","title":"Overview"},{"id":"how-it-works","title":"How It Works"},{"id":"finding","title":"Finding Your Email"},{"id":"troubleshooting","title":"Troubleshooting"},{"id":"privacy","title":"Privacy Benefits"}]'::jsonb),

('อีเมล @privaterelay.appleid.com คืออะไร?', 'apple-private-relay-email', 'account', 'th',
'## ภาพรวม {#overview}

หากคุณสมัคร Mobile11 โดยใช้ "Sign in with Apple" และเลือกซ่อนอีเมล Apple จะสร้างที่อยู่ private relay เฉพาะที่ลงท้ายด้วย `@privaterelay.appleid.com`

## วิธีการทำงาน {#how-it-works}

เมื่อคุณใช้ "Hide My Email" กับ Apple Sign-In:

1. Apple สร้างอีเมลสุ่มเช่น `abc123xyz@privaterelay.appleid.com`
2. อีเมลที่ส่งไปที่อยู่นี้จะถูกส่งต่อไปยังอีเมลจริงของคุณ
3. อีเมลจริงของคุณยังคงซ่อนจาก Mobile11
4. คุณสามารถปิดการส่งต่อได้ทุกเมื่อจากการตั้งค่า Apple ID

## หาอีเมล Private Relay ของคุณ {#finding}

หาอีเมล relay ที่คุณใช้กับ Mobile11:

### บน iPhone/iPad
1. ไปที่ **ตั้งค่า** → **[ชื่อของคุณ]** → **การลงชื่อเข้าใช้และความปลอดภัย**
2. แตะ **"ซ่อนอีเมลของฉัน"**
3. หา Mobile11 ในรายการ

### บน Mac
1. เปิด **การตั้งค่าระบบ** → **Apple ID**
2. คลิก **"ซ่อนอีเมลของฉัน"**
3. มองหา Mobile11

### บน iCloud.com
1. ไปที่ **icloud.com** → **การตั้งค่าบัญชี**
2. หาส่วน **"ซ่อนอีเมลของฉัน"**

## แก้ไขปัญหา {#troubleshooting}

### ไม่ได้รับอีเมลจาก Mobile11?

1. ตรวจสอบโฟลเดอร์สแปม/ขยะ
2. ยืนยันว่าเปิดการส่งต่อ:
   - ไปที่การตั้งค่า Apple ID → ซ่อนอีเมลของฉัน
   - หา Mobile11 และตรวจสอบว่า "ส่งต่อไปยัง" เปิดอยู่
3. ตรวจสอบว่าปลายทางการส่งต่อถูกต้อง

### ต้องการเปลี่ยนเป็นอีเมลจริง?

1. ติดต่อฝ่ายสนับสนุน Mobile11
2. เราสามารถอัปเดตบัญชีให้ใช้อีเมลจริง
3. คุณต้องยืนยันที่อยู่อีเมลใหม่

## ประโยชน์ด้านความเป็นส่วนตัว {#privacy}

- อีเมลจริงของคุณไม่เคยถูกแชร์กับ Mobile11
- คุณสามารถปิด relay เพื่อหยุดอีเมล
- สร้างที่อยู่เฉพาะสำหรับบริการต่างๆ
- ลดสแปมหากบริการถูกเจาะ',
'เรียนรู้เกี่ยวกับที่อยู่อีเมล private relay ของ Apple ที่ใช้กับ Sign in with Apple',
'both', true, false,
'[{"id":"overview","title":"ภาพรวม"},{"id":"how-it-works","title":"วิธีการทำงาน"},{"id":"finding","title":"หาอีเมลของคุณ"},{"id":"troubleshooting","title":"แก้ไขปัญหา"},{"id":"privacy","title":"ประโยชน์ด้านความเป็นส่วนตัว"}]'::jsonb)
ON CONFLICT (slug, category, language) DO UPDATE SET
  content = EXCLUDED.content,
  description = EXCLUDED.description,
  table_of_contents = EXCLUDED.table_of_contents,
  updated_at = now();

-- 4. Remove eSIM from iPad
INSERT INTO kb_articles (title, slug, category, language, content, description, source, is_published, is_internal, table_of_contents) VALUES
('How to Remove an eSIM from iPad', 'remove-esim-ipad', 'using-esim', 'en',
'## Before You Remove {#before}

**Important:** Removing an eSIM is permanent. The eSIM profile will be deleted and cannot be reinstalled (most Mobile11 eSIMs are one-time install only).

Only remove an eSIM if:
- It has expired and you no longer need it
- You want to free up space for new eSIMs
- The eSIM is no longer working

## Remove eSIM on iPad (iPadOS 16+) {#ipad-new}

1. Go to **Settings** → **Cellular Data**
2. Tap on your Mobile11 eSIM
3. Scroll down and tap **"Remove Cellular Plan"**
4. Confirm by tapping **"Remove"**

## Remove eSIM on Older iPadOS {#ipad-old}

1. Go to **Settings** → **Cellular Data**
2. Tap **"Cellular Plans"**
3. Select the Mobile11 eSIM
4. Tap **"Remove Cellular Plan"**
5. Confirm removal

## What Happens After Removal {#after}

- The eSIM profile is completely deleted
- Any remaining data is forfeited
- The slot becomes available for a new eSIM
- You cannot reinstall the same eSIM

## Troubleshooting {#troubleshooting}

### "Remove" option not appearing?

1. Restart your iPad
2. Ensure iPadOS is up to date
3. Try again after restart

### Removed by mistake?

- Contact Mobile11 support immediately
- Provide your order number
- We may be able to issue a replacement in some cases',
'Step-by-step guide to remove an eSIM from your iPad.',
'both', true, false,
'[{"id":"before","title":"Before You Remove"},{"id":"ipad-new","title":"iPad (iPadOS 16+)"},{"id":"ipad-old","title":"Older iPadOS"},{"id":"after","title":"What Happens After"},{"id":"troubleshooting","title":"Troubleshooting"}]'::jsonb),

('วิธีลบ eSIM จาก iPad', 'remove-esim-ipad', 'using-esim', 'th',
'## ก่อนลบ {#before}

**สำคัญ:** การลบ eSIM เป็นการถาวร โปรไฟล์ eSIM จะถูกลบและไม่สามารถติดตั้งใหม่ได้ (Mobile11 eSIM ส่วนใหญ่ติดตั้งได้ครั้งเดียว)

ลบ eSIM เฉพาะเมื่อ:
- หมดอายุและคุณไม่ต้องการอีกแล้ว
- ต้องการเพิ่มพื้นที่สำหรับ eSIM ใหม่
- eSIM ไม่ทำงานแล้ว

## ลบ eSIM บน iPad (iPadOS 16+) {#ipad-new}

1. ไปที่ **ตั้งค่า** → **ข้อมูลเซลลูลาร์**
2. แตะที่ Mobile11 eSIM
3. เลื่อนลงแล้วแตะ **"ลบแผนเซลลูลาร์"**
4. ยืนยันโดยแตะ **"ลบ"**

## ลบ eSIM บน iPadOS รุ่นเก่า {#ipad-old}

1. ไปที่ **ตั้งค่า** → **ข้อมูลเซลลูลาร์**
2. แตะ **"แผนเซลลูลาร์"**
3. เลือก Mobile11 eSIM
4. แตะ **"ลบแผนเซลลูลาร์"**
5. ยืนยันการลบ

## สิ่งที่เกิดขึ้นหลังลบ {#after}

- โปรไฟล์ eSIM ถูกลบทั้งหมด
- ข้อมูลที่เหลือจะสูญเสีย
- ช่องว่างพร้อมสำหรับ eSIM ใหม่
- คุณไม่สามารถติดตั้ง eSIM เดิมใหม่ได้

## แก้ไขปัญหา {#troubleshooting}

### ตัวเลือก "ลบ" ไม่ปรากฏ?

1. รีสตาร์ท iPad
2. ตรวจสอบว่า iPadOS อัปเดตล่าสุด
3. ลองอีกครั้งหลังรีสตาร์ท

### ลบผิดพลาด?

- ติดต่อฝ่ายสนับสนุน Mobile11 ทันที
- ให้หมายเลขคำสั่งซื้อ
- เราอาจสามารถออกแทนได้ในบางกรณี',
'คู่มือขั้นตอนการลบ eSIM จาก iPad',
'both', true, false,
'[{"id":"before","title":"ก่อนลบ"},{"id":"ipad-new","title":"iPad (iPadOS 16+)"},{"id":"ipad-old","title":"iPadOS รุ่นเก่า"},{"id":"after","title":"สิ่งที่เกิดขึ้นหลังลบ"},{"id":"troubleshooting","title":"แก้ไขปัญหา"}]'::jsonb)
ON CONFLICT (slug, category, language) DO UPDATE SET
  content = EXCLUDED.content,
  description = EXCLUDED.description,
  table_of_contents = EXCLUDED.table_of_contents,
  updated_at = now();

-- 5. New Login Notification
INSERT INTO kb_articles (title, slug, category, language, content, description, source, is_published, is_internal, table_of_contents) VALUES
('Why Did I Receive a New Login Email?', 'new-login-notification', 'account', 'en',
'## Overview {#overview}

Mobile11 sends login notification emails whenever your account is accessed from a new device or location. This is a security feature to help you detect unauthorized access.

## What Triggers a Notification {#triggers}

You''ll receive an email when:

- First login from a new device
- Login from a new location (different city/country)
- Login after clearing browser cookies
- Login from a different browser
- Login after a long period of inactivity

## What to Do If It Was You {#if-you}

If you recognize the login:

1. No action needed
2. You can mark the device as trusted (optional)
3. Keep the email for your records

## What to Do If It Wasn''t You {#if-not-you}

If you don''t recognize the login:

1. **Change your password immediately**
   - Go to **Account** → **Security** → **Change Password**

2. **Review trusted devices**
   - Remove any devices you don''t recognize
   - Go to **Account** → **Security** → **Trusted Devices**

3. **Check recent activity**
   - Review any recent orders
   - Check for unauthorized purchases

4. **Enable additional security**
   - Enable two-factor authentication if available
   - Use a unique, strong password

5. **Contact support**
   - If you see unauthorized activity, contact us immediately

## Email Details Explained {#email-details}

The notification email includes:

- **Device**: Type of device (iPhone, Windows PC, etc.)
- **Browser**: Which browser was used
- **Location**: Approximate city/country
- **Time**: When the login occurred
- **IP Address**: Technical identifier

Note: Location is approximate and may not be exact.',
'Learn why you received a new login notification and what actions to take.',
'both', true, false,
'[{"id":"overview","title":"Overview"},{"id":"triggers","title":"What Triggers It"},{"id":"if-you","title":"If It Was You"},{"id":"if-not-you","title":"If It Wasn''t You"},{"id":"email-details","title":"Email Details Explained"}]'::jsonb),

('ทำไมฉันได้รับอีเมลแจ้งเตือนการเข้าสู่ระบบใหม่?', 'new-login-notification', 'account', 'th',
'## ภาพรวม {#overview}

Mobile11 ส่งอีเมลแจ้งเตือนการเข้าสู่ระบบเมื่อบัญชีของคุณถูกเข้าถึงจากอุปกรณ์หรือตำแหน่งใหม่ นี่คือฟีเจอร์ความปลอดภัยเพื่อช่วยตรวจจับการเข้าถึงโดยไม่ได้รับอนุญาต

## สิ่งที่ทำให้เกิดการแจ้งเตือน {#triggers}

คุณจะได้รับอีเมลเมื่อ:

- เข้าสู่ระบบครั้งแรกจากอุปกรณ์ใหม่
- เข้าสู่ระบบจากตำแหน่งใหม่ (เมือง/ประเทศต่าง)
- เข้าสู่ระบบหลังล้างคุกกี้เบราว์เซอร์
- เข้าสู่ระบบจากเบราว์เซอร์ต่าง
- เข้าสู่ระบบหลังไม่ใช้งานนาน

## ทำอย่างไรถ้าเป็นคุณ {#if-you}

หากคุณจำการเข้าสู่ระบบได้:

1. ไม่ต้องดำเนินการใดๆ
2. คุณสามารถทำเครื่องหมายอุปกรณ์ว่าเชื่อถือ (ไม่บังคับ)
3. เก็บอีเมลไว้เป็นบันทึก

## ทำอย่างไรถ้าไม่ใช่คุณ {#if-not-you}

หากคุณไม่จำการเข้าสู่ระบบ:

1. **เปลี่ยนรหัสผ่านทันที**
   - ไปที่ **บัญชี** → **ความปลอดภัย** → **เปลี่ยนรหัสผ่าน**

2. **ตรวจสอบอุปกรณ์ที่เชื่อถือ**
   - ลบอุปกรณ์ที่คุณไม่รู้จัก
   - ไปที่ **บัญชี** → **ความปลอดภัย** → **อุปกรณ์ที่เชื่อถือ**

3. **ตรวจสอบกิจกรรมล่าสุด**
   - ตรวจสอบคำสั่งซื้อล่าสุด
   - ตรวจสอบการซื้อที่ไม่ได้รับอนุญาต

4. **เปิดใช้ความปลอดภัยเพิ่มเติม**
   - เปิดใช้การยืนยันสองขั้นตอนหากมี
   - ใช้รหัสผ่านเฉพาะที่แข็งแกร่ง

5. **ติดต่อฝ่ายสนับสนุน**
   - หากเห็นกิจกรรมที่ไม่ได้รับอนุญาต ติดต่อเราทันที

## อธิบายรายละเอียดอีเมล {#email-details}

อีเมลแจ้งเตือนรวมถึง:

- **อุปกรณ์**: ประเภทอุปกรณ์ (iPhone, Windows PC, ฯลฯ)
- **เบราว์เซอร์**: เบราว์เซอร์ที่ใช้
- **ตำแหน่ง**: เมือง/ประเทศโดยประมาณ
- **เวลา**: เมื่อเข้าสู่ระบบ
- **IP Address**: ตัวระบุทางเทคนิค

หมายเหตุ: ตำแหน่งเป็นค่าประมาณและอาจไม่แม่นยำ',
'เรียนรู้ว่าทำไมคุณได้รับแจ้งเตือนการเข้าสู่ระบบใหม่และควรทำอย่างไร',
'both', true, false,
'[{"id":"overview","title":"ภาพรวม"},{"id":"triggers","title":"สิ่งที่ทำให้เกิด"},{"id":"if-you","title":"ถ้าเป็นคุณ"},{"id":"if-not-you","title":"ถ้าไม่ใช่คุณ"},{"id":"email-details","title":"อธิบายรายละเอียดอีเมล"}]'::jsonb)
ON CONFLICT (slug, category, language) DO UPDATE SET
  content = EXCLUDED.content,
  description = EXCLUDED.description,
  table_of_contents = EXCLUDED.table_of_contents,
  updated_at = now();

-- 6. Login Timeout Troubleshooting
INSERT INTO kb_articles (title, slug, category, language, content, description, source, is_published, is_internal, table_of_contents) VALUES
('How to Resolve the Login Timeout Message', 'login-timeout-troubleshooting', 'account', 'en',
'## Overview {#overview}

A "login timeout" message appears when your login session expires or there''s a connection issue during authentication. Here''s how to resolve it.

## Common Causes {#causes}

- Session expired while filling in credentials
- Poor or unstable internet connection
- Browser cache/cookies issue
- VPN or firewall interference
- Server temporarily unavailable

## Quick Fixes {#quick-fixes}

### 1. Refresh and Try Again
- Close the login page completely
- Open a fresh browser tab
- Go to Mobile11 login page
- Try logging in again

### 2. Check Your Internet
- Ensure stable connection
- Try switching between WiFi and mobile data
- Disable VPN temporarily

### 3. Clear Browser Data
**Chrome:**
1. Settings → Privacy → Clear browsing data
2. Select "Cookies" and "Cached images"
3. Click Clear data

**Safari:**
1. Settings → Safari → Clear History and Website Data

**Firefox:**
1. Settings → Privacy → Clear Data

### 4. Try a Different Browser
- Switch to Chrome, Safari, Firefox, or Edge
- Try an incognito/private window

## If Problem Persists {#persistent}

1. **Wait 15 minutes** - The server may be temporarily busy
2. **Try the Mobile11 app** - Sometimes the app works when web doesn''t
3. **Use a different device** - Rule out device-specific issues
4. **Contact support** - If nothing works, reach out to us

## Prevention Tips {#prevention}

- Keep your browser updated
- Don''t leave the login page idle for too long
- Use a stable internet connection
- Disable overly aggressive ad blockers on our site',
'Step-by-step guide to fix login timeout errors on Mobile11.',
'both', true, false,
'[{"id":"overview","title":"Overview"},{"id":"causes","title":"Common Causes"},{"id":"quick-fixes","title":"Quick Fixes"},{"id":"persistent","title":"If Problem Persists"},{"id":"prevention","title":"Prevention Tips"}]'::jsonb),

('วิธีแก้ไขข้อความหมดเวลาเข้าสู่ระบบ', 'login-timeout-troubleshooting', 'account', 'th',
'## ภาพรวม {#overview}

ข้อความ "หมดเวลาเข้าสู่ระบบ" ปรากฏเมื่อเซสชันการเข้าสู่ระบบหมดอายุหรือมีปัญหาการเชื่อมต่อระหว่างการยืนยันตัวตน นี่คือวิธีแก้ไข

## สาเหตุทั่วไป {#causes}

- เซสชันหมดอายุขณะกรอกข้อมูล
- การเชื่อมต่ออินเทอร์เน็ตไม่ดีหรือไม่เสถียร
- ปัญหาแคช/คุกกี้เบราว์เซอร์
- VPN หรือไฟร์วอลล์รบกวน
- เซิร์ฟเวอร์ไม่พร้อมใช้งานชั่วคราว

## วิธีแก้ไขด่วน {#quick-fixes}

### 1. รีเฟรชและลองอีกครั้ง
- ปิดหน้าเข้าสู่ระบบทั้งหมด
- เปิดแท็บเบราว์เซอร์ใหม่
- ไปที่หน้าเข้าสู่ระบบ Mobile11
- ลองเข้าสู่ระบบอีกครั้ง

### 2. ตรวจสอบอินเทอร์เน็ต
- ตรวจสอบว่าการเชื่อมต่อเสถียร
- ลองสลับระหว่าง WiFi และข้อมูลมือถือ
- ปิด VPN ชั่วคราว

### 3. ล้างข้อมูลเบราว์เซอร์
**Chrome:**
1. ตั้งค่า → ความเป็นส่วนตัว → ล้างข้อมูลการท่องเว็บ
2. เลือก "คุกกี้" และ "รูปภาพที่แคช"
3. คลิกล้างข้อมูล

**Safari:**
1. ตั้งค่า → Safari → ล้างประวัติและข้อมูลเว็บไซต์

**Firefox:**
1. ตั้งค่า → ความเป็นส่วนตัว → ล้างข้อมูล

### 4. ลองเบราว์เซอร์อื่น
- สลับไปใช้ Chrome, Safari, Firefox, หรือ Edge
- ลองหน้าต่าง incognito/ส่วนตัว

## หากปัญหายังคงอยู่ {#persistent}

1. **รอ 15 นาที** - เซิร์ฟเวอร์อาจยุ่งชั่วคราว
2. **ลองแอป Mobile11** - บางครั้งแอปทำงานเมื่อเว็บไม่ทำงาน
3. **ใช้อุปกรณ์อื่น** - ตัดปัญหาเฉพาะอุปกรณ์
4. **ติดต่อฝ่ายสนับสนุน** - หากไม่มีอะไรทำงาน ติดต่อเรา

## เคล็ดลับป้องกัน {#prevention}

- อัปเดตเบราว์เซอร์ให้ทันสมัย
- อย่าปล่อยหน้าเข้าสู่ระบบค้างไว้นานเกินไป
- ใช้การเชื่อมต่ออินเทอร์เน็ตที่เสถียร
- ปิดตัวบล็อกโฆษณาที่รุนแรงเกินไปบนเว็บไซต์เรา',
'คู่มือขั้นตอนแก้ไขข้อผิดพลาดหมดเวลาเข้าสู่ระบบบน Mobile11',
'both', true, false,
'[{"id":"overview","title":"ภาพรวม"},{"id":"causes","title":"สาเหตุทั่วไป"},{"id":"quick-fixes","title":"วิธีแก้ไขด่วน"},{"id":"persistent","title":"หากปัญหายังคงอยู่"},{"id":"prevention","title":"เคล็ดลับป้องกัน"}]'::jsonb)
ON CONFLICT (slug, category, language) DO UPDATE SET
  content = EXCLUDED.content,
  description = EXCLUDED.description,
  table_of_contents = EXCLUDED.table_of_contents,
  updated_at = now();