-- Insert business category if it doesn't exist
INSERT INTO public.ticket_categories (name, description, icon, display_order, is_active)
SELECT 'business', 'Enterprise and business inquiries', 'Briefcase', 1, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.ticket_categories WHERE name = 'business'
);