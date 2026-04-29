-- Mark the broken Thailand 1GB packages as inactive since correct versions exist
UPDATE public.esim_packages
SET is_active = false,
    updated_at = now()
WHERE id IN (
  'e80ba021-33e2-4207-bbcb-0e3c53e113fe',  -- Thailand 1Days / 1GB (broken)
  'ec490cf0-aa74-418f-a051-7d4be0039bb1'   -- Thailand 2Days / 1GB (broken)
);