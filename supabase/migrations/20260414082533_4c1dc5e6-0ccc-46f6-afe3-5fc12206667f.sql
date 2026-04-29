UPDATE public.orders
SET 
  status = 'needs_attention',
  updated_at = now(),
  webhook_data = webhook_data || jsonb_build_object(
    'escalated_at', now()::text,
    'escalation_reason', 'Zombie order cleanup: stuck in processing since before 2026 with no QR code'
  )
WHERE status = 'processing'
  AND qr_code IS NULL
  AND created_at < '2026-01-01T00:00:00Z'
  AND webhook_data IS NOT NULL;