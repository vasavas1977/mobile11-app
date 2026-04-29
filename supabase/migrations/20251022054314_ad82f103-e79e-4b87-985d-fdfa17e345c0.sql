-- Create promo_codes table
CREATE TABLE public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('free', 'percentage', 'fixed_amount')),
  discount_value NUMERIC NOT NULL DEFAULT 0 CHECK (discount_value >= 0),
  max_uses INTEGER CHECK (max_uses IS NULL OR max_uses > 0),
  current_uses INTEGER NOT NULL DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create promo_code_usage table
CREATE TABLE public.promo_code_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  discount_applied NUMERIC NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(promo_code_id, order_id)
);

-- Add columns to orders table
ALTER TABLE public.orders 
ADD COLUMN promo_code_id UUID REFERENCES public.promo_codes(id),
ADD COLUMN discount_amount NUMERIC DEFAULT 0,
ADD COLUMN original_amount NUMERIC;

-- Enable RLS on promo_codes
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- Enable RLS on promo_code_usage
ALTER TABLE public.promo_code_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for promo_codes
CREATE POLICY "Anyone can view active promo codes"
ON public.promo_codes
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage promo codes"
ON public.promo_codes
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for promo_code_usage
CREATE POLICY "Users can view their own usage"
ON public.promo_code_usage
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all usage"
ON public.promo_code_usage
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert usage records"
ON public.promo_code_usage
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add trigger for updated_at on promo_codes
CREATE TRIGGER update_promo_codes_updated_at
BEFORE UPDATE ON public.promo_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_promo_codes_code ON public.promo_codes(LOWER(code));
CREATE INDEX idx_promo_codes_active ON public.promo_codes(is_active);
CREATE INDEX idx_promo_code_usage_user ON public.promo_code_usage(user_id);
CREATE INDEX idx_orders_promo_code ON public.orders(promo_code_id);