-- Insert ONLY new Using eSIM articles that don't exist yet
INSERT INTO kb_articles (title, slug, category, language, description, content, table_of_contents, source, is_published, is_internal, display_order)
VALUES 
('Can I use 5G with my eSIM?', '5g-with-esim', 'using-esim', 'en', 'Information about 5G network support for eSIMs',
E'# Can I use 5G with my eSIM?\n\n5G support depends on your device, location, and network coverage.\n\n## Requirements {#requirements}\n\n- 5G-capable device (iPhone 12+ or compatible Android)\n- 5G coverage at destination\n- Network support from local carrier\n\n## How to Enable {#enable}\n\n**iPhone:** Settings > Cellular > Voice & Data > 5G On\n**Android:** Settings > Connections > Mobile Networks > Network mode > 5G',
'[{"id":"requirements","title":"Requirements"},{"id":"enable","title":"How to Enable"}]'::jsonb, 'both', true, false, 15),

('How many eSIMs can I install?', 'how-many-esims-can-install', 'using-esim', 'en', 'Device limits for storing multiple eSIMs',
E'# How many eSIMs can I install?\n\nModern devices store multiple eSIMs.\n\n## iPhone: Up to 8 eSIMs\n## Android: Usually 5-8 eSIMs\n\nYou can switch between them in Settings without deleting.',
'[{"id":"iphone","title":"iPhone Limits"},{"id":"android","title":"Android Limits"}]'::jsonb, 'both', true, false, 16),

('What are renewals and how do they work?', 'renewals-how-they-work', 'using-esim', 'en', 'Understanding eSIM package renewals',
E'# What are renewals?\n\nRenewals extend your eSIM service without a new installation.\n\n## Auto-Renewal\nEnable in My eSIMs to automatically renew before expiration.\n\n## Manual Renewal\nGo to My eSIMs > Select eSIM > Renew.',
'[{"id":"auto","title":"Auto-Renewal"},{"id":"manual","title":"Manual Renewal"}]'::jsonb, 'both', true, false, 17)

ON CONFLICT (slug, category, language) DO NOTHING;