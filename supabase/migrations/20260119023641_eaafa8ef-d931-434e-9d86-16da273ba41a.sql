-- Update English article: "What are the three types of Mobile11 eSIM plans?"
UPDATE kb_articles 
SET content = 'Mobile11 offers 3 plan types: 1) **Limitless** - Premium unlimited data with no speed throttling, perfect for heavy users and streaming. 2) **Max Speed** - High-speed data allowance (e.g., 3GB/day at 4G speeds), then unlimited at 384 Kbps backup speed. 3) **Day Pass** - Daily high-speed data that resets every 24 hours with 384 Kbps backup after daily limit, great for short trips.',
    updated_at = now()
WHERE title = 'What are the three types of Mobile11 eSIM plans?';

-- Update English article: "What is the Max Speed plan?"
UPDATE kb_articles 
SET content = 'Max Speed plans give you a daily high-speed data allowance (typically 1GB-5GB per day at 4G/LTE speeds). After using your daily quota, you continue with unlimited data at 384 Kbps backup speed - enough for messaging and basic browsing. Your high-speed resets every 24 hours.',
    updated_at = now()
WHERE title = 'What is the Max Speed plan?';

-- Update any other articles that might mention 128Kbps or incorrect throttle speeds
UPDATE kb_articles
SET content = REPLACE(content, '128Kbps', '384 Kbps'),
    updated_at = now()
WHERE content LIKE '%128Kbps%';

UPDATE kb_articles
SET content = REPLACE(content, '128 Kbps', '384 Kbps'),
    updated_at = now()
WHERE content LIKE '%128 Kbps%';

UPDATE kb_articles
SET content = REPLACE(content, '512Kbps', '384 Kbps'),
    updated_at = now()
WHERE content LIKE '%512Kbps%';