-- Insert AIS Thailand Local SIM knowledge base articles (English and Thai)
INSERT INTO kb_articles (title, content, category, tags, slug, description, is_published, is_internal, language, source)
VALUES 
-- English version
('AIS Thailand Local SIM Package Details', 
'## AIS Thailand 35GB / 7 Days Package

This is a **local SIM package** that requires KYC (identity verification).

### Package Includes
- **5G Data**: 35GB at high speed, then unlimited at 1 Mbps
- **Voice Calls**: 30 minutes
- **WiFi**: 7 days access

### How to Check Usage
Dial **`*121*32#`** from your phone or use the **AIS app**.

### Important Notes
- **KYC Required**: You must complete identity verification at [https://kyc.cloud.ais.th](https://kyc.cloud.ais.th) before activation
- **No API Tracking**: Usage cannot be tracked in the Mobile11 app. Please use *121*32# or AIS app to check your remaining data.
- This package works on Thailand''s AIS 5G/4G network

### APN Settings
- **APN**: internet
- **Username**: (leave blank)
- **Password**: (leave blank)',
'esim-troubleshooting', 
ARRAY['ais', 'thailand', 'local-sim', 'kyc', 'usage', 'ussd'], 
'ais-thailand-local-sim',
'AIS Thailand 35GB local SIM package with 5G data, calls, and WiFi. Requires KYC verification.',
true, false, 'en', 'both'),

-- Thai version
('รายละเอียดแพ็กเกจ AIS Thailand Local SIM',
'## แพ็กเกจ AIS Thailand 35GB / 7 วัน

นี่คือ **แพ็กเกจ SIM ท้องถิ่น** ที่ต้องยืนยันตัวตน (KYC)

### แพ็กเกจประกอบด้วย
- **5G Data**: 35GB ความเร็วสูงสุด จากนั้นไม่จำกัดที่ 1 Mbps
- **โทรศัพท์**: 30 นาที
- **WiFi**: 7 วัน

### วิธีเช็คยอดใช้งาน
กด **`*121*32#`** จากโทรศัพท์ หรือใช้ **แอป AIS**

### ข้อสำคัญ
- **ต้องยืนยันตัวตน**: คุณต้องยืนยันตัวตนที่ [https://kyc.cloud.ais.th](https://kyc.cloud.ais.th) ก่อนเปิดใช้งาน
- **ไม่สามารถติดตามการใช้งานในแอป Mobile11 ได้**: กรุณาใช้ *121*32# หรือแอป AIS เพื่อเช็คยอดคงเหลือ
- แพ็กเกจนี้ใช้งานบนเครือข่าย AIS 5G/4G ในประเทศไทย

### ตั้งค่า APN
- **APN**: internet
- **Username**: (เว้นว่าง)
- **Password**: (เว้นว่าง)',
'esim-troubleshooting',
ARRAY['ais', 'thailand', 'local-sim', 'kyc', 'usage', 'ussd'],
'ais-thailand-local-sim-th',
'แพ็กเกจ AIS Thailand 35GB local SIM พร้อม 5G data โทรศัพท์ และ WiFi ต้องยืนยันตัวตน',
true, false, 'th', 'both');