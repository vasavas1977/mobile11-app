-- Clear stale cached installation data for TUGE order so the fix can be verified
UPDATE orders 
SET cached_installation = NULL, installation_cached_at = NULL 
WHERE id = '33f2bf3c-f1dd-4164-b680-81aa0a048db9';