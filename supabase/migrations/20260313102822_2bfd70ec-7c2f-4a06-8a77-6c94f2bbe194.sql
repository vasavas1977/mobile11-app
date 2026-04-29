-- Update English Pricing Guidance article with currency rules
UPDATE kb_articles 
SET content = content || E'\n\n## CURRENCY BY LANGUAGE (CRITICAL)\n- Thai speaker → always show prices in ฿ (THB). Convert: 1 USD = 35 THB, round to whole number.\n- English speaker → always show prices in $ (USD).\n- Other languages → show prices in $ (USD) by default.\n- Examples:\n  - Thai: "Value เริ่มต้นที่ ฿73/วัน"\n  - English: "Value starts from $2.09/day"',
    updated_at = now()
WHERE id = '76937396-0101-419c-b6e0-87704eef6a8a';

-- Update Thai Pricing Guidance article with currency rules
UPDATE kb_articles 
SET content = content || E'\n\n## สกุลเงินตามภาษา (สำคัญมาก)\n- พูดไทย → แสดงราคาเป็น ฿ (บาท) เสมอ แปลง: 1 USD = 35 THB ปัดเป็นจำนวนเต็ม\n- พูดอังกฤษ → แสดงราคาเป็น $ (USD)\n- ภาษาอื่น → แสดงราคาเป็น $ (USD)',
    updated_at = now()
WHERE id = '9309f5b3-a00e-4955-93cf-742890344f28';