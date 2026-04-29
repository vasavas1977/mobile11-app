-- Create spam_filter_rules table
CREATE TABLE public.spam_filter_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_type TEXT NOT NULL CHECK (rule_type IN ('keyword', 'domain', 'email', 'regex')),
  value TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  match_in TEXT[] DEFAULT ARRAY['subject', 'body'],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create spam_log table
CREATE TABLE public.spam_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_email TEXT NOT NULL,
  to_email TEXT,
  subject TEXT,
  message_preview TEXT,
  matched_rules TEXT[],
  raw_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.spam_filter_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spam_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for spam_filter_rules
CREATE POLICY "Admins can manage spam rules"
  ON public.spam_filter_rules FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Edge functions can read spam rules"
  ON public.spam_filter_rules FOR SELECT
  USING (true);

-- RLS policies for spam_log
CREATE POLICY "Admins can view spam log"
  ON public.spam_log FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert spam log"
  ON public.spam_log FOR INSERT
  WITH CHECK (true);

-- Create updated_at trigger
CREATE TRIGGER update_spam_filter_rules_updated_at
  BEFORE UPDATE ON public.spam_filter_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial spam rules based on observed phishing patterns
INSERT INTO public.spam_filter_rules (rule_type, value, description, match_in) VALUES
-- Meta/Facebook phishing
('keyword', 'Meta Alert', 'Facebook/Meta phishing - alert keyword', ARRAY['subject']),
('keyword', 'verify your Meta account', 'Meta account verification scam', ARRAY['subject', 'body']),
('keyword', 'Facebook access restricted', 'Facebook restriction scam', ARRAY['subject', 'body']),
('keyword', 'advertising account', 'Advertising account phishing', ARRAY['subject', 'body']),
('keyword', 'Meta Business Suite', 'Meta business suite phishing', ARRAY['subject']),

-- Urgency scams
('keyword', 'Immediate Action Required', 'Urgency scam - immediate action', ARRAY['subject']),
('keyword', 'within 48 hours', 'Urgency scam - time limit', ARRAY['subject', 'body']),
('keyword', 'account will be suspended', 'Account suspension threat', ARRAY['subject', 'body']),
('keyword', 'permanently deleted', 'Deletion threat scam', ARRAY['subject', 'body']),
('keyword', 'suspended in 24 hours', 'Suspension threat', ARRAY['subject', 'body']),

-- Copyright/Policy scams
('keyword', 'copyright compliance', 'Copyright compliance scam', ARRAY['subject', 'body']),
('keyword', 'policy violation', 'Policy violation scam', ARRAY['subject', 'body']),
('keyword', 'brand content without prior permission', 'Brand content scam', ARRAY['body']),
('keyword', 'community standards violation', 'Standards violation scam', ARRAY['subject', 'body']),

-- Generic phishing
('keyword', 'verify your identity immediately', 'Identity verification scam', ARRAY['subject', 'body']),
('keyword', 'confirm your account information', 'Account confirmation scam', ARRAY['body']),
('keyword', 'click here to restore access', 'Restore access phishing', ARRAY['body']),

-- Suspicious domain patterns
('regex', 'support-[a-z0-9]+\\.com$', 'Suspicious support domain pattern', ARRAY['from']),
('regex', 'meta-[a-z]+\\.com$', 'Fake Meta domain pattern', ARRAY['from']),
('regex', 'facebook-[a-z]+\\.com$', 'Fake Facebook domain pattern', ARRAY['from']);