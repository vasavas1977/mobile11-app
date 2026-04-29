-- Clear old cancelled TUGE provider data so re-provisioning treats them as fresh
UPDATE orders 
SET provider_order_id = NULL, 
    provider_status = NULL, 
    status = 'pending',
    updated_at = now()
WHERE id IN ('fc204588-0c54-443e-b2d2-0b063e3989b3', 'cc512927-5568-4d77-b6cb-4879fd33a7d7');
