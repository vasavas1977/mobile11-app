-- Remove Mobile11 app references from KB articles
-- This updates 14 article records (7 slugs × 2 languages)

-- 1. Update how-to-get-an-esim (EN) - Remove "or open the Mobile11 app"
UPDATE kb_articles 
SET content = REPLACE(content, 'Visit the Mobile11 website or open the Mobile11 app', 'Visit **mobile11.com**'),
    updated_at = now()
WHERE slug = 'how-to-get-an-esim' AND language = 'en';

-- 2. Update how-to-get-an-esim (TH) - Remove app reference
UPDATE kb_articles 
SET content = REPLACE(content, 'เยี่ยมชมเว็บไซต์ Mobile11 หรือเปิดแอป', 'เยี่ยมชมเว็บไซต์ **mobile11.com**'),
    updated_at = now()
WHERE slug = 'how-to-get-an-esim' AND language = 'th';

-- 3. Update install-esim-ios (EN) - Remove "Method 3: Direct Install (App)" section
UPDATE kb_articles 
SET content = REGEXP_REPLACE(
    content, 
    '## Method 3: Direct Install \(App\).*?(?=## |$)', 
    '', 
    'gs'
),
    table_of_contents = (
        SELECT jsonb_agg(item)
        FROM jsonb_array_elements(table_of_contents) AS item
        WHERE item->>'id' != 'direct'
    ),
    updated_at = now()
WHERE slug = 'install-esim-ios' AND language = 'en';

-- 4. Update install-esim-ios (TH) - Remove Thai app section
UPDATE kb_articles 
SET content = REGEXP_REPLACE(
    content, 
    '## วิธีที่ 3: ติดตั้งผ่านแอป.*?(?=## |$)', 
    '', 
    'gs'
),
    table_of_contents = (
        SELECT jsonb_agg(item)
        FROM jsonb_array_elements(table_of_contents) AS item
        WHERE item->>'id' != 'direct'
    ),
    updated_at = now()
WHERE slug = 'install-esim-ios' AND language = 'th';

-- 5. Update install-esim-ios-qr (EN) - Remove app reference (nested REPLACE)
UPDATE kb_articles 
SET content = REPLACE(
    REPLACE(content, 'Open the Mobile11 app or visit mobile11.com', 'Visit **mobile11.com**'),
    'the Mobile11 app or ', ''
),
    updated_at = now()
WHERE slug = 'install-esim-ios-qr' AND language = 'en';

-- 6. Update install-esim-ios-qr (TH) - Remove app reference
UPDATE kb_articles 
SET content = REPLACE(content, 'เปิดแอป Mobile11 หรือเยี่ยมชม mobile11.com', 'เยี่ยมชม **mobile11.com**'),
    updated_at = now()
WHERE slug = 'install-esim-ios-qr' AND language = 'th';

-- 7. Update install-esim-samsung-manual (EN) - Remove app reference (nested REPLACE)
UPDATE kb_articles 
SET content = REPLACE(
    REPLACE(content, 'Open the Mobile11 app or go to mobile11.com', 'Visit **mobile11.com**'),
    'the Mobile11 app or ', ''
),
    updated_at = now()
WHERE slug = 'install-esim-samsung-manual' AND language = 'en';

-- 8. Update install-esim-samsung-manual (TH) - Remove app reference
UPDATE kb_articles 
SET content = REPLACE(content, 'เปิดแอป Mobile11 หรือไปที่ mobile11.com', 'เยี่ยมชม **mobile11.com**'),
    updated_at = now()
WHERE slug = 'install-esim-samsung-manual' AND language = 'th';

-- 9. Update login-timeout-troubleshooting (EN) - Remove app suggestion
UPDATE kb_articles 
SET content = REGEXP_REPLACE(
    content, 
    '\d+\.\s*\*\*Try the Mobile11 app\*\*[^\n]*\n?', 
    '', 
    'g'
),
    updated_at = now()
WHERE slug = 'login-timeout-troubleshooting' AND language = 'en';

-- 10. Update login-timeout-troubleshooting (TH) - Remove app suggestion
UPDATE kb_articles 
SET content = REGEXP_REPLACE(
    content, 
    '\d+\.\s*\*\*ลองใช้แอป Mobile11\*\*[^\n]*\n?', 
    '', 
    'g'
),
    updated_at = now()
WHERE slug = 'login-timeout-troubleshooting' AND language = 'th';

-- 11. Update personal-hotspot-tethering (EN) - Change app reference to website (nested REPLACE)
UPDATE kb_articles 
SET content = REPLACE(
    REPLACE(content, 'in the Mobile11 app', 'in your My eSIMs page on mobile11.com'),
    'Mobile11 app', 'My eSIMs page'
),
    updated_at = now()
WHERE slug = 'personal-hotspot-tethering' AND language = 'en';

-- 12. Update personal-hotspot-tethering (TH) - Change app reference to website (nested REPLACE)
UPDATE kb_articles 
SET content = REPLACE(
    REPLACE(content, 'ในแอป Mobile11', 'ในหน้า eSIM ของฉันบน mobile11.com'),
    'แอป Mobile11', 'หน้า eSIM ของฉัน'
),
    updated_at = now()
WHERE slug = 'personal-hotspot-tethering' AND language = 'th';

-- 13. Update track-data-ios-widgets (EN) - Remove Mobile11 App Widget section and update tips
UPDATE kb_articles 
SET content = REPLACE(
    REGEXP_REPLACE(
        content, 
        '## Mobile11 App Widget.*?(?=## |\Z)', 
        '', 
        'gs'
    ),
    'Our app syncs with provider data', 'Go to My eSIMs to view real-time data'
),
    table_of_contents = (
        SELECT jsonb_agg(item)
        FROM jsonb_array_elements(table_of_contents) AS item
        WHERE item->>'id' != 'm11-widget'
    ),
    updated_at = now()
WHERE slug = 'track-data-ios-widgets' AND language = 'en';

-- 14. Update track-data-ios-widgets (TH) - Remove Mobile11 App Widget section and update tips
UPDATE kb_articles 
SET content = REPLACE(
    REGEXP_REPLACE(
        content, 
        '## วิดเจ็ตแอป Mobile11.*?(?=## |\Z)', 
        '', 
        'gs'
    ),
    'แอปของเราซิงค์กับข้อมูลผู้ให้บริการ', 'ไปที่ eSIM ของฉันเพื่อดูข้อมูลแบบเรียลไทม์'
),
    table_of_contents = (
        SELECT jsonb_agg(item)
        FROM jsonb_array_elements(table_of_contents) AS item
        WHERE item->>'id' != 'm11-widget'
    ),
    updated_at = now()
WHERE slug = 'track-data-ios-widgets' AND language = 'th';