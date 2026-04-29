-- Update English KB article for plan types with correct FUP messaging
UPDATE kb_articles 
SET content = '## All plans are truly unlimited {#truly-unlimited}

**Every Mobile11 eSIM plan is truly unlimited** — you are never cut off from data connectivity. The three plan types differ in how speeds are managed, not in whether data is unlimited.

**Key benefits across all plans:**
- ✓ Never run out of data
- ✓ Stay connected throughout your trip
- ✓ No surprise charges or data cutoffs
- ✓ Works in 150+ countries

## Day Pass plans {#day-pass}

Day Pass is our most popular plan type, perfect for balanced everyday use.

**How it works:**
- Get a daily high-speed data allowance (e.g., 500MB, 1GB, or 2GB per day)
- Allowance resets every 24 hours
- After daily allowance: speed reduces to 384 Kbps (some premium plans offer 1 Mbps)
- Never cut off — keep browsing, messaging, and navigating

**At 384 Kbps fallback speed, you can:**
- ✓ WhatsApp, LINE, Messenger
- ✓ Email (text-based)
- ✓ Google Maps navigation
- △ Web browsing (slower)
- ✗ Video streaming not recommended

## Max Speed plans {#max-speed}

Max Speed plans give you your full data quota at maximum network speeds.

**How it works:**
- Get total high-speed data (e.g., 5GB, 10GB, 30GB for entire validity)
- Use at maximum network speeds (LTE/5G)
- When data is exhausted, connection stops
- Top up anytime to continue your connectivity

## Limitless plans {#limitless}

Limitless is our premium plan — **unlimited data at maximum speeds**.

**How it works:**
- Unlimited data at maximum network speeds (LTE/5G)
- Full speed throughout your validity period
- Perfect for heavy data users, streaming, and remote work

**Fair Usage Policy:**
If unusual data usage is detected, speed may be reduced to 5 Mbps. Speed resets to maximum within 24 hours. Normal usage is NOT affected — only unusual/excessive consumption triggers FUP.

**With Limitless, you can:**
- ✓ Stream HD/4K video without buffering
- ✓ Video calls (Zoom, Meet, FaceTime)
- ✓ Work remotely with large files
- ✓ Use as hotspot for other devices
- ✓ Download apps and updates
- ✓ Everything, without limits',
updated_at = NOW()
WHERE id = 'e516caf6-1ccb-4861-8eb9-3de356bd755d';

-- Update Thai KB article for plan types with correct FUP messaging
UPDATE kb_articles 
SET content = '## ทุกแพ็คเกจไม่จำกัดจริงๆ {#truly-unlimited}

**ทุกแพ็คเกจ eSIM ของ Mobile11 ไม่จำกัดจริงๆ** — คุณจะไม่ถูกตัดการเชื่อมต่อข้อมูลเลย แพ็คเกจทั้งสามประเภทแตกต่างกันที่วิธีจัดการความเร็ว ไม่ใช่ว่าข้อมูลจำกัดหรือไม่

**ข้อดีหลักของทุกแพ็คเกจ:**
- ✓ ไม่มีวันหมดข้อมูล
- ✓ เชื่อมต่อตลอดการเดินทาง
- ✓ ไม่มีค่าใช้จ่ายแอบแฝง
- ✓ ใช้ได้ใน 150+ ประเทศ

## แพ็คเกจ Day Pass {#day-pass}

Day Pass เป็นแพ็คเกจยอดนิยมที่สุด เหมาะสำหรับการใช้งานทั่วไปอย่างสมดุล

**วิธีการทำงาน:**
- ได้รับโควต้าข้อมูลความเร็วสูงรายวัน (เช่น 500MB, 1GB หรือ 2GB ต่อวัน)
- โควต้ารีเซ็ตทุก 24 ชั่วโมง
- หลังใช้โควต้าหมด: ความเร็วลดลงเหลือ 384 Kbps
- ไม่ถูกตัด — ท่องเว็บ แชท และนำทางได้ต่อ

**ที่ความเร็วสำรอง 384 Kbps คุณสามารถ:**
- ✓ WhatsApp, LINE, Messenger
- ✓ อีเมล (แบบข้อความ)
- ✓ นำทาง Google Maps
- △ ท่องเว็บ (ช้าลง)
- ✗ ไม่แนะนำสตรีมวิดีโอ

## แพ็คเกจ Max Speed {#max-speed}

Max Speed ให้คุณใช้โควต้าเต็มจำนวนด้วยความเร็วสูงสุด

**วิธีการทำงาน:**
- ได้รับข้อมูลความเร็วสูงรวม (เช่น 5GB, 10GB, 30GB สำหรับอายุทั้งหมด)
- ใช้ที่ความเร็วเครือข่ายสูงสุด (LTE/5G)
- เมื่อข้อมูลหมด การเชื่อมต่อจะหยุด
- เติมเน็ตได้ตลอดเวลาเพื่อใช้งานต่อ

## แพ็คเกจ Limitless {#limitless}

Limitless เป็นแพ็คเกจพรีเมียม — **ข้อมูลไม่จำกัดที่ความเร็วสูงสุด**

**วิธีการทำงาน:**
- ข้อมูลไม่จำกัดที่ความเร็วเครือข่ายสูงสุด (LTE/5G)
- ความเร็วเต็มตลอดอายุการใช้งาน
- เหมาะสำหรับผู้ใช้ข้อมูลหนัก สตรีม และทำงานระยะไกล

**Fair Usage Policy:**
หากตรวจพบการใช้งานผิดปกติ ความเร็วอาจถูกปรับลดเหลือ 5 Mbps และจะรีเซ็ตกลับสู่ความเร็วสูงสุดภายใน 24 ชั่วโมง การใช้งานปกติไม่ได้รับผลกระทบ — เฉพาะการใช้งานผิดปกติ/มากเกินไปเท่านั้นที่จะทำให้เกิด FUP

**ด้วย Limitless คุณสามารถ:**
- ✓ สตรีมวิดีโอ HD/4K ไม่มีบัฟเฟอร์
- ✓ วิดีโอคอล (Zoom, Meet, FaceTime)
- ✓ ทำงานระยะไกลกับไฟล์ใหญ่
- ✓ ใช้เป็นฮอตสปอตสำหรับอุปกรณ์อื่น
- ✓ ดาวน์โหลดแอปและอัปเดต
- ✓ ทุกอย่าง ไม่มีข้อจำกัด',
updated_at = NOW()
WHERE id = '976dd44f-2bac-4272-a342-fba70c317018';