WITH ranked AS (
  SELECT id,
         row_number() OVER (
           PARTITION BY conversation_id, sender_type, content, created_at
           ORDER BY id ASC
         ) AS rn
  FROM public.conversation_messages
  WHERE metadata->>'source' = 'voice'
),
dup_ids AS (
  SELECT id FROM ranked WHERE rn > 1
)
DELETE FROM public.ai_conversation_events
WHERE message_id IN (SELECT id FROM dup_ids);

WITH ranked AS (
  SELECT id,
         row_number() OVER (
           PARTITION BY conversation_id, sender_type, content, created_at
           ORDER BY id ASC
         ) AS rn
  FROM public.conversation_messages
  WHERE metadata->>'source' = 'voice'
)
DELETE FROM public.conversation_messages cm
USING ranked
WHERE cm.id = ranked.id AND ranked.rn > 1;