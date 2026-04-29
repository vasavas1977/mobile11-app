-- Delete all orders first (due to foreign key constraint)
DELETE FROM public.orders;

-- Then delete all packages
DELETE FROM public.esim_packages;