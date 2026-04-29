
-- Step 1: Create a temp table with the contact to keep for each email (oldest one)
CREATE TEMP TABLE contacts_to_keep AS
SELECT DISTINCT ON (email) id, email
FROM contacts
WHERE email IS NOT NULL
ORDER BY email, created_at ASC;

-- Step 2: Create a mapping of old contact IDs to the contact we want to keep
CREATE TEMP TABLE contact_mapping AS
SELECT c.id as old_id, k.id as new_id
FROM contacts c
JOIN contacts_to_keep k ON LOWER(c.email) = LOWER(k.email)
WHERE c.id != k.id;

-- Step 3: Update conversations to point to the kept contact
UPDATE conversations
SET contact_id = cm.new_id
FROM contact_mapping cm
WHERE conversations.contact_id = cm.old_id;

-- Step 4: Delete duplicate contacts (keep the oldest one per email)
DELETE FROM contacts
WHERE id IN (SELECT old_id FROM contact_mapping);

-- Step 5: Add unique constraint on email (case-insensitive using lower)
CREATE UNIQUE INDEX IF NOT EXISTS contacts_email_unique_idx ON contacts (LOWER(email)) WHERE email IS NOT NULL;

-- Clean up temp tables
DROP TABLE IF EXISTS contact_mapping;
DROP TABLE IF EXISTS contacts_to_keep;
