-- Remove non-functional default_currency setting
DELETE FROM system_settings WHERE key = 'default_currency';