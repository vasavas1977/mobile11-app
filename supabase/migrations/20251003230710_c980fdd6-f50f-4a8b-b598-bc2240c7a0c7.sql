-- Add environment field to orders table to track test vs production
ALTER TABLE public.orders 
ADD COLUMN environment text NOT NULL DEFAULT 'test' 
CHECK (environment IN ('test', 'production'));