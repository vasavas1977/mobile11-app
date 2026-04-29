-- Create promo_campaigns table
CREATE TABLE public.promo_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  banner_type TEXT DEFAULT 'announcement',
  banner_content JSONB DEFAULT '{}',
  banner_image_url TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  status TEXT DEFAULT 'draft',
  target_audience TEXT DEFAULT 'all',
  display_pages TEXT[] DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create campaign_promo_codes linking table
CREATE TABLE public.campaign_promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.promo_campaigns(id) ON DELETE CASCADE NOT NULL,
  promo_code_id UUID REFERENCES public.promo_codes(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(campaign_id, promo_code_id)
);

-- Create campaign_analytics table
CREATE TABLE public.campaign_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.promo_campaigns(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL,
  user_id UUID,
  session_id TEXT,
  page_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add campaign_id to promo_codes for quick reference
ALTER TABLE public.promo_codes ADD COLUMN campaign_id UUID REFERENCES public.promo_campaigns(id);

-- Create indexes for performance
CREATE INDEX idx_promo_campaigns_status ON public.promo_campaigns(status);
CREATE INDEX idx_promo_campaigns_dates ON public.promo_campaigns(start_date, end_date);
CREATE INDEX idx_campaign_analytics_campaign_id ON public.campaign_analytics(campaign_id);
CREATE INDEX idx_campaign_analytics_event_type ON public.campaign_analytics(event_type);
CREATE INDEX idx_campaign_analytics_created_at ON public.campaign_analytics(created_at);

-- Enable RLS
ALTER TABLE public.promo_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for promo_campaigns
CREATE POLICY "Admins can manage campaigns"
ON public.promo_campaigns
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active campaigns"
ON public.promo_campaigns
FOR SELECT
USING (status = 'active' AND start_date <= now() AND (end_date IS NULL OR end_date >= now()));

-- RLS Policies for campaign_promo_codes
CREATE POLICY "Admins can manage campaign promo codes"
ON public.campaign_promo_codes
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view campaign promo codes"
ON public.campaign_promo_codes
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.promo_campaigns pc 
  WHERE pc.id = campaign_id 
  AND pc.status = 'active'
));

-- RLS Policies for campaign_analytics
CREATE POLICY "Admins can view all analytics"
ON public.campaign_analytics
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can insert analytics"
ON public.campaign_analytics
FOR INSERT
WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_promo_campaigns_updated_at
BEFORE UPDATE ON public.promo_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();