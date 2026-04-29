-- Update Max Speed packages: remove speed_after_limit and update description
UPDATE esim_packages 
SET 
  speed_after_limit = NULL,
  description = REPLACE(
    REPLACE(
      description, 
      'then unlimited at 384 Kbps', 
      'at maximum speeds until exhausted'
    ),
    'Maximum speeds for 30GB, then unlimited at 384 Kbps',
    'Maximum speeds until data is exhausted'
  ),
  updated_at = NOW()
WHERE package_type = 'max_speed';

-- Update English KB article: what-is-the-max-speed-plan
UPDATE kb_articles
SET content = '## What is Max Speed? {#what-is-max-speed}

Max Speed plans give you your full data quota at maximum network speeds (4G/5G). Use all your data at full speed—when your data is fully used, the connection stops.

### How it works

- Get your total high-speed data (e.g., 5GB, 10GB, 30GB for entire validity)
- Use at maximum network speeds (LTE/5G)
- When data is exhausted, connection stops
- Top up anytime to continue your connectivity

### Benefits

✅ Maximum speeds throughout your quota
✅ More affordable than Limitless
✅ Perfect for trips where you know your data needs
✅ No throttling—full speed until the end

### Example

**Max Speed 10GB for 7 days:**
- Get 10GB at full LTE/5G speed
- Use flexibly—all at once or spread across days
- When 10GB is used, data stops
- Top up if you need more

### Who is Max Speed for?

- Users who prefer maximum speed over continuous connectivity
- Budget-conscious travelers who can estimate data needs
- Short trips where you won''t exhaust the quota
- Those who prefer topping up over reduced speeds

### Running low on data?

You can always top up your eSIM with additional data packages. Just go to My eSIMs and select "Top Up" to extend your connectivity.',
    updated_at = NOW()
WHERE id = '2a5510c6-d757-4c7c-b606-64a7fc03663b';

-- Update Thai KB article: max-speed
UPDATE kb_articles
SET content = '## แพ็คเกจ Max Speed {#what-is-max-speed}

Max Speed ให้คุณใช้โควต้าเต็มจำนวนด้วยความเร็วสูงสุด (4G/5G) ใช้ข้อมูลทั้งหมดด้วยความเร็วเต็ม—เมื่อข้อมูลหมด การเชื่อมต่อจะหยุด

### หลักการทำงาน

- ได้รับข้อมูลตามที่ซื้อ (เช่น 5GB, 10GB, 30GB ตลอดอายุใช้งาน)
- ใช้งานด้วยความเร็วสูงสุด (LTE/5G)
- เมื่อข้อมูลหมด การเชื่อมต่อจะหยุด
- เติมเน็ตได้ตลอดเวลาเพื่อใช้งานต่อ

### ข้อดี

✅ ความเร็วสูงสุดตลอดโควต้า
✅ ราคาประหยัดกว่า Limitless
✅ เหมาะกับทริปที่รู้ปริมาณการใช้งาน
✅ ไม่ลดสปีด—ความเร็วเต็มจนหมด

### ตัวอย่าง

**Max Speed 10GB 7 วัน:**
- ได้ 10GB ความเร็ว LTE/5G เต็ม
- ใช้ยืดหยุ่น—ทีเดียวหรือแบ่งใช้หลายวัน
- เมื่อใช้ 10GB หมด ข้อมูลจะหยุด
- เติมเพิ่มได้ถ้าต้องการ

### เหมาะกับใคร?

- ผู้ที่ต้องการความเร็วสูงสุดมากกว่าความต่อเนื่อง
- นักเดินทางที่ประหยัดและประเมินการใช้งานได้
- ทริปสั้นที่ไม่น่าใช้หมดโควต้า
- ผู้ที่ชอบเติมเน็ตมากกว่าใช้ความเร็วต่ำ

### เน็ตใกล้หมด?

คุณสามารถเติมเน็ต eSIM ด้วยแพ็คเกจเพิ่มได้ตลอดเวลา ไปที่ eSIM ของฉัน แล้วเลือก "เติมเน็ต" เพื่อต่อการเชื่อมต่อ',
    updated_at = NOW()
WHERE id = '05bc4021-f400-49f9-8b1c-ad4d402f7db8';

-- Update English KB article: unlimited-data-plans-explained (Max Speed section)
UPDATE kb_articles
SET content = REPLACE(
    content,
    '## Max Speed plans {#max-speed}

Max Speed plans give you high-speed data upfront, then keep you connected at reduced speeds.

**How it works:**
- Get total high-speed data (e.g., 3GB, 5GB, 10GB for entire validity)
- Use at maximum network speeds (LTE/5G)
- After high-speed data used: speed reduces to 384 Kbps
- Never cut off — basic connectivity continues',
    '## Max Speed plans {#max-speed}

Max Speed plans give you your full data quota at maximum network speeds.

**How it works:**
- Get total high-speed data (e.g., 5GB, 10GB, 30GB for entire validity)
- Use at maximum network speeds (LTE/5G)
- When data is exhausted, connection stops
- Top up anytime to continue your connectivity'
),
    updated_at = NOW()
WHERE id = 'e516caf6-1ccb-4861-8eb9-3de356bd755d';