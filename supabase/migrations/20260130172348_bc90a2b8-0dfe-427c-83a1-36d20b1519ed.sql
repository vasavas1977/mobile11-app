-- Update English article to show only USD and THB
UPDATE kb_articles 
SET content = '## Overview {#overview}

Mobile11 currently supports two currencies for purchasing eSIMs:

## Supported Currencies {#currencies}

| Currency | Code | Symbol |
|----------|------|--------|
| US Dollar | USD | $ |
| Thai Baht | THB | ฿ |

## How Currency is Determined {#determination}

Your display currency is automatically detected based on:
1. **Your device location** - If you''re in Thailand, THB is selected automatically
2. **Your saved preference** - If you''ve previously selected a currency, it''s remembered

## Changing Your Currency {#changing}

1. Look for the currency selector in the website header
2. Click on the current currency ($ or ฿)
3. Select your preferred currency
4. All prices will update immediately

## Payment Currency {#payment}

- **THB payments**: Available via PromptPay, Thai bank cards, and mobile banking
- **USD payments**: Available via international credit/debit cards
- Your receipt will show the exact amount charged in your payment currency

## Mobile11 Money {#m11-money}

- Mobile11 Money balance is stored in USD
- When displayed, it converts to your selected currency using current exchange rates
- The conversion rate is approximately 1 USD = 35 THB

## Future Currency Support {#future}

We''re working on adding more currencies in the future. Stay tuned for updates!',
    description = 'Learn about USD and THB currency support for Mobile11 eSIM purchases',
    table_of_contents = '[{"id":"overview","title":"Overview"},{"id":"currencies","title":"Supported Currencies"},{"id":"determination","title":"How Currency is Determined"},{"id":"changing","title":"Changing Your Currency"},{"id":"payment","title":"Payment Currency"},{"id":"m11-money","title":"Mobile11 Money"},{"id":"future","title":"Future Currency Support"}]'::jsonb,
    updated_at = now()
WHERE id = 'e8792a8b-adcb-46f6-9e0c-a24232b28391';

-- Update Thai article to show only USD and THB
UPDATE kb_articles 
SET content = '## ภาพรวม {#overview}

Mobile11 รองรับสองสกุลเงินสำหรับการซื้อ eSIM ในขณะนี้:

## สกุลเงินที่รองรับ {#currencies}

| สกุลเงิน | รหัส | สัญลักษณ์ |
|----------|------|--------|
| ดอลลาร์สหรัฐ | USD | $ |
| บาทไทย | THB | ฿ |

## วิธีกำหนดสกุลเงิน {#determination}

สกุลเงินที่แสดงจะตรวจจับอัตโนมัติจาก:
1. **ตำแหน่งอุปกรณ์ของคุณ** - หากคุณอยู่ในประเทศไทย ระบบจะเลือก THB อัตโนมัติ
2. **ค่าที่บันทึกไว้** - หากคุณเคยเลือกสกุลเงินไว้ ระบบจะจดจำ

## เปลี่ยนสกุลเงิน {#changing}

1. มองหาตัวเลือกสกุลเงินในส่วนหัวเว็บไซต์
2. คลิกที่สกุลเงินปัจจุบัน ($ หรือ ฿)
3. เลือกสกุลเงินที่ต้องการ
4. ราคาทั้งหมดจะอัปเดตทันที

## สกุลเงินการชำระเงิน {#payment}

- **ชำระเงินบาท**: ใช้ได้ผ่าน PromptPay บัตรธนาคารไทย และ Mobile Banking
- **ชำระเงินดอลลาร์**: ใช้ได้ผ่านบัตรเครดิต/เดบิตต่างประเทศ
- ใบเสร็จจะแสดงจำนวนเงินที่เรียกเก็บในสกุลเงินที่ชำระ

## Mobile11 Money {#m11-money}

- ยอดคงเหลือ Mobile11 Money เก็บเป็น USD
- เมื่อแสดง จะแปลงเป็นสกุลเงินที่คุณเลือกด้วยอัตราแลกเปลี่ยนปัจจุบัน
- อัตราแลกเปลี่ยนประมาณ 1 USD = 35 บาท

## รองรับสกุลเงินเพิ่มเติมในอนาคต {#future}

เรากำลังดำเนินการเพิ่มสกุลเงินอื่นๆ ในอนาคต โปรดติดตามการอัปเดต!',
    description = 'เรียนรู้เกี่ยวกับการรองรับสกุลเงิน USD และ THB สำหรับการซื้อ eSIM ของ Mobile11',
    table_of_contents = '[{"id":"overview","title":"ภาพรวม"},{"id":"currencies","title":"สกุลเงินที่รองรับ"},{"id":"determination","title":"วิธีกำหนดสกุลเงิน"},{"id":"changing","title":"เปลี่ยนสกุลเงิน"},{"id":"payment","title":"สกุลเงินการชำระเงิน"},{"id":"m11-money","title":"Mobile11 Money"},{"id":"future","title":"รองรับสกุลเงินเพิ่มเติมในอนาคต"}]'::jsonb,
    updated_at = now()
WHERE id = '02350f90-c7af-4b97-bb77-d39d3e780674';