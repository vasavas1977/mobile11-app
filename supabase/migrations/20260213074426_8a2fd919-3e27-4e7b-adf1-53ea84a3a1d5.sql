UPDATE orders 
SET webhook_data = webhook_data || jsonb_build_object(
  'is_referral_order', true,
  'referrer_user_id', '8d4d36e9-1e22-40f1-b02e-bf627e1d2b4e',
  'referral_code_used', 'MOBILEF5EA02'
)
WHERE id = 'a559cb6c-f144-4401-9b19-cb985e7f1171';