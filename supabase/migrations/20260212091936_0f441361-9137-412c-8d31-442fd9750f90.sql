-- Update English article: add "What Does Priority Actually Mean?" section
UPDATE kb_articles SET content = '## Overview {#overview}

Mobile11 offers two service tiers for every eSIM package: **Priority** and **Economy**. Both tiers provide the same data allowance and validity period — the difference is in speed, network priority, and price.

Choosing the right tier depends on your usage needs and budget. Here''s a detailed comparison to help you decide.

## Priority Class {#priority-class}

Priority class is our **premium tier**, designed for travelers who need the best possible connection quality.

### Key Features
- **Highest speed available** — Access to the carrier''s maximum network speed, including 5G where available
- **Best network coverage** — Priority routing on the carrier''s network for more reliable connectivity in congested areas
- **24/7 Priority Support** — Your support requests are handled with top priority
- **Ideal for** — Video calls, live streaming, remote work, uploading large files, or any situation where speed and reliability matter most

### Who Should Choose Priority?
- Business travelers who need reliable video conferencing
- Content creators uploading or streaming on the go
- Travelers visiting crowded tourist areas or events where networks get congested
- Anyone who values the fastest possible connection

## What Does "Priority" Actually Mean? {#what-is-priority}

The word "Priority" refers to how the cell tower (cell site) handles your connection compared to other users.

When a cell tower serves many subscribers at the same time, it assigns a **priority level** to each connection. Subscribers with higher priority are always served first — meaning they get the **fastest available speed** compared to those with lower priority on the same tower.

This is **standard practice among all mobile operators worldwide**. Every carrier assigns priority tiers to their SIM subscriptions. Top-priority SIMs consistently receive:
- The **best speeds**, even when the network is busy
- The **most reliable connections** in crowded areas
- **First access** to available bandwidth during peak hours

In simple terms: Priority class means the network treats your connection as more important, so you always get served before Economy users on the same cell tower. This is especially noticeable in busy tourist spots, airports, concert venues, or any location where many people are using the network at once.

## Economy Class {#economy-class}

Economy class is our **budget-friendly tier**, offering the same data plan at a **30% discount** compared to Priority.

### Key Features
- **Standard network speed** — You still get a solid connection, but without premium network priority
- **Same data allowance** — Identical data quota as Priority (same GB or unlimited plan)
- **Same validity period** — No difference in how long your plan lasts
- **30% cheaper** — Significant savings for price-conscious travelers
- **Ideal for** — Casual browsing, messaging, social media, maps, and general travel use

### Who Should Choose Economy?
- Budget-conscious travelers looking for the best value
- Light data users who primarily need messaging, maps, and social media
- Travelers on longer trips who want to save money
- Anyone who doesn''t need maximum speed for their daily activities

## Side-by-Side Comparison {#comparison-table}

| Feature | Priority Class | Economy Class |
|---|---|---|
| **Price** | Standard price | **30% cheaper** |
| **Network Speed** | Highest available (incl. 5G) | Standard speed |
| **Network Priority** | Premium routing | Standard routing |
| **Data Allowance** | Same | Same |
| **Validity** | Same | Same |
| **Support** | 24/7 Priority | Standard |
| **Best For** | Speed & reliability | Savings & casual use |

## How to Choose Your Tier {#how-to-choose}

1. **Go to the country page** for your destination
2. **Select your preferred package** (Limitless, Day Pass, or Max Speed)
3. **Choose your service tier** using the Priority / Economy toggle at the top of the package selector
4. The price updates automatically — Economy always shows the discounted price

You can also tell our chatbot whether you prefer **quality or savings**, and it will recommend the right tier for you automatically.

## Frequently Asked Questions {#faq}

### Can I switch between Priority and Economy after purchase?
No, the service tier is set at the time of purchase and cannot be changed afterward. Make sure to select your preferred tier before completing checkout.

### Is Economy class slow?
No. Economy class still provides a good connection for everyday use like browsing, messaging, maps, and social media. The difference is most noticeable during peak congestion or for bandwidth-heavy tasks like HD video calls.

### Does Economy have less data?
No. Both tiers offer exactly the same data allowance and validity period. The only differences are speed priority and price.

### How much do I save with Economy?
Economy class is **30% cheaper** than Priority for the same package. For example, if a Priority plan costs $30, the Economy version would be $21.',
table_of_contents = '[{"id":"overview","title":"Overview"},{"id":"priority-class","title":"Priority Class"},{"id":"what-is-priority","title":"What Does Priority Actually Mean?"},{"id":"economy-class","title":"Economy Class"},{"id":"comparison-table","title":"Side-by-Side Comparison"},{"id":"how-to-choose","title":"How to Choose Your Tier"},{"id":"faq","title":"Frequently Asked Questions"}]'::jsonb,
updated_at = now()
WHERE id = 'ce368dde-29e8-4d07-9882-d9c21c270d4a';

-- Update Thai article: add "Priority หมายถึงอะไรกันแน่?" section
UPDATE kb_articles SET content = '## ภาพรวม {#overview}

Mobile11 มีระดับบริการ 2 ระดับสำหรับทุกแพ็กเกจ eSIM: **Priority** และ **Economy** ทั้งสองระดับให้ปริมาณข้อมูลและระยะเวลาใช้งานเท่ากัน — ความแตกต่างอยู่ที่ความเร็ว ลำดับความสำคัญในเครือข่าย และราคา

การเลือกระดับบริการที่เหมาะสมขึ้นอยู่กับความต้องการใช้งานและงบประมาณของคุณ นี่คือการเปรียบเทียบโดยละเอียด

## Priority Class {#priority-class}

Priority class คือ**ระดับพรีเมียม**ของเรา ออกแบบมาสำหรับนักเดินทางที่ต้องการคุณภาพการเชื่อมต่อที่ดีที่สุด

### คุณสมบัติหลัก
- **ความเร็วสูงสุดที่มี** — เข้าถึงความเร็วสูงสุดของเครือข่าย รวมถึง 5G ในพื้นที่ที่รองรับ
- **ครอบคลุมเครือข่ายดีที่สุด** — การเชื่อมต่อแบบ Priority routing บนเครือข่ายเพื่อความเสถียรมากขึ้นในพื้นที่ที่มีผู้ใช้หนาแน่น
- **ซัพพอร์ตลำดับสำคัญ 24/7** — คำขอช่วยเหลือของคุณจะได้รับการดูแลเป็นอันดับแรก
- **เหมาะสำหรับ** — วิดีโอคอล, ไลฟ์สตรีม, ทำงานระยะไกล, อัพโหลดไฟล์ขนาดใหญ่ หรือสถานการณ์ที่ต้องการความเร็วและความเสถียร

### ใครควรเลือก Priority?
- นักเดินทางธุรกิจที่ต้องการประชุมวิดีโอที่เสถียร
- คอนเทนต์ครีเอเตอร์ที่อัพโหลดหรือสตรีมระหว่างเดินทาง
- นักเดินทางที่ไปสถานที่ท่องเที่ยวหนาแน่นหรืองานอีเวนต์
- ทุกคนที่ต้องการการเชื่อมต่อที่เร็วที่สุด

## "Priority" หมายถึงอะไรกันแน่? {#what-is-priority}

คำว่า "Priority" หมายถึงวิธีที่เสาสัญญาณ (Cell Site) จัดการการเชื่อมต่อของคุณเมื่อเทียบกับผู้ใช้คนอื่น

เมื่อเสาสัญญาณให้บริการผู้ใช้หลายคนพร้อมกัน ระบบจะกำหนด**ลำดับความสำคัญ (Priority Level)** ให้แต่ละการเชื่อมต่อ ผู้ใช้ที่มีลำดับความสำคัญสูงกว่าจะได้รับบริการก่อนเสมอ — หมายความว่าจะได้**ความเร็วสูงสุดที่มี**เมื่อเทียบกับผู้ใช้ลำดับต่ำกว่าบนเสาเดียวกัน

นี่เป็น**มาตรฐานปฏิบัติของผู้ให้บริการมือถือทั่วโลก** ทุกค่ายกำหนดระดับ Priority ให้ซิมของตน ซิมที่มี Priority สูงสุดจะได้รับ:
- **ความเร็วดีที่สุด** แม้ในช่วงเวลาที่เครือข่ายหนาแน่น
- **การเชื่อมต่อเสถียรที่สุด** ในพื้นที่ที่มีผู้คนมาก
- **สิทธิ์เข้าถึง bandwidth ก่อน** ในช่วงเวลาพีค

พูดง่ายๆ คือ Priority class หมายความว่าเครือข่ายจัดให้การเชื่อมต่อของคุณสำคัญกว่า คุณจะได้รับบริการก่อนผู้ใช้ Economy บนเสาสัญญาณเดียวกันเสมอ สังเกตได้ชัดเจนในสถานที่ท่องเที่ยวหนาแน่น สนามบิน คอนเสิร์ต หรือที่ไหนก็ตามที่มีคนใช้เครือข่ายพร้อมกันจำนวนมาก

## Economy Class {#economy-class}

Economy class คือ**ระดับประหยัด** ให้แพลนข้อมูลเดียวกันในราคา**ถูกกว่า 30%** เทียบกับ Priority

### คุณสมบัติหลัก
- **ความเร็วเครือข่ายมาตรฐาน** — ยังคงได้รับการเชื่อมต่อที่ดี แต่ไม่มี Premium network priority
- **ปริมาณข้อมูลเท่ากัน** — โควตาข้อมูลเหมือนกับ Priority ทุกประการ (GB เท่ากันหรือ Unlimited เหมือนกัน)
- **ระยะเวลาใช้งานเท่ากัน** — ไม่มีความแตกต่างในระยะเวลาของแพลน
- **ถูกกว่า 30%** — ประหยัดได้มากสำหรับนักเดินทางที่คำนึงถึงราคา
- **เหมาะสำหรับ** — ท่องเว็บทั่วไป, แชท, โซเชียลมีเดีย, แผนที่ และการใช้งานทั่วไป

### ใครควรเลือก Economy?
- นักเดินทางที่คำนึงถึงงบประมาณ ต้องการความคุ้มค่าสูงสุด
- ผู้ใช้ข้อมูลน้อยที่ต้องการแชท แผนที่ และโซเชียลมีเดียเป็นหลัก
- นักเดินทางระยะยาวที่ต้องการประหยัดค่าใช้จ่าย
- ทุกคนที่ไม่ต้องการความเร็วสูงสุดสำหรับกิจกรรมประจำวัน

## เปรียบเทียบแบบเคียงข้างกัน {#comparison-table}

| คุณสมบัติ | Priority Class | Economy Class |
|---|---|---|
| **ราคา** | ราคาปกติ | **ถูกกว่า 30%** |
| **ความเร็วเครือข่าย** | สูงสุดที่มี (รวม 5G) | ความเร็วมาตรฐาน |
| **ลำดับเครือข่าย** | Premium routing | Standard routing |
| **ปริมาณข้อมูล** | เท่ากัน | เท่ากัน |
| **ระยะเวลา** | เท่ากัน | เท่ากัน |
| **ซัพพอร์ต** | 24/7 Priority | มาตรฐาน |
| **เหมาะสำหรับ** | ความเร็ว & ความเสถียร | ประหยัด & ใช้งานทั่วไป |

## วิธีเลือกระดับบริการ {#how-to-choose}

1. **ไปที่หน้าประเทศ**ปลายทางของคุณ
2. **เลือกแพ็กเกจที่ต้องการ** (Limitless, Day Pass หรือ Max Speed)
3. **เลือกระดับบริการ**โดยใช้ปุ่มสลับ Priority / Economy ที่ด้านบนของตัวเลือกแพ็กเกจ
4. ราคาจะอัปเดตอัตโนมัติ — Economy จะแสดงราคาส่วนลดเสมอ

คุณยังสามารถบอกแชทบอทของเราว่าต้องการ**คุณภาพหรือประหยัด** แล้วระบบจะแนะนำระดับบริการที่เหมาะสมให้อัตโนมัติ

## คำถามที่พบบ่อย {#faq}

### เปลี่ยนจาก Priority เป็น Economy หลังซื้อได้ไหม?
ไม่ได้ ระดับบริการจะกำหนดตอนซื้อและไม่สามารถเปลี่ยนแปลงได้ภายหลัง กรุณาเลือกระดับที่ต้องการก่อนชำระเงิน

### Economy class ช้าไหม?
ไม่ช้า Economy class ยังคงให้การเชื่อมต่อที่ดีสำหรับการใช้งานทั่วไป เช่น ท่องเว็บ แชท แผนที่ และโซเชียลมีเดีย ความแตกต่างจะสังเกตได้ชัดเจนที่สุดในช่วงที่มีผู้ใช้หนาแน่นหรือสำหรับงานที่ต้องการแบนด์วิดท์สูง เช่น วิดีโอคอล HD

### Economy มีข้อมูลน้อยกว่าไหม?
ไม่ ทั้งสองระดับให้ปริมาณข้อมูลและระยะเวลาใช้งานเท่ากันทุกประการ ความแตกต่างมีเพียงลำดับความสำคัญของความเร็วและราคาเท่านั้น

### ประหยัดได้เท่าไหร่กับ Economy?
Economy class **ถูกกว่า 30%** เทียบกับ Priority สำหรับแพ็กเกจเดียวกัน เช่น ถ้า Priority ราคา $30 Economy จะราคา $21',
table_of_contents = '[{"id":"overview","title":"ภาพรวม"},{"id":"priority-class","title":"Priority Class"},{"id":"what-is-priority","title":"\"Priority\" หมายถึงอะไรกันแน่?"},{"id":"economy-class","title":"Economy Class"},{"id":"comparison-table","title":"เปรียบเทียบแบบเคียงข้างกัน"},{"id":"how-to-choose","title":"วิธีเลือกระดับบริการ"},{"id":"faq","title":"คำถามที่พบบ่อย"}]'::jsonb,
updated_at = now()
WHERE id = 'c82309bc-2bb8-4a65-817e-36ea2d45587d';