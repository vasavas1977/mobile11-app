-- Add more spam filter rules to catch keyword variations and suspicious domains

-- Keyword variations for phishing/scam emails
INSERT INTO public.spam_filter_rules (rule_type, value, match_in, description, is_active) VALUES
('keyword', 'permanently suspended', ARRAY['subject', 'body'], 'Account suspension phishing variation', true),
('keyword', '24 hours', ARRAY['subject', 'body'], 'Urgency scam - 24 hour deadline', true),
('keyword', 'may be permanently', ARRAY['body'], 'Account deletion threat variation', true),
('keyword', 'account has been suspended', ARRAY['body'], 'Suspension notification phishing', true),
('keyword', 'without the owner''s consent', ARRAY['body'], 'Unauthorized access phishing', true),
('keyword', 'intellectual property rights', ARRAY['body'], 'IP rights scam', true),
('keyword', 'copyright infringement', ARRAY['body'], 'Copyright scam emails', true),
('keyword', 'file an appeal', ARRAY['body'], 'Appeal urgency scam', true),
('keyword', 'account will be disabled', ARRAY['body'], 'Account disable threat', true),
('keyword', 'verify your identity', ARRAY['subject', 'body'], 'Identity verification phishing', true),
('keyword', 'unusual activity', ARRAY['subject', 'body'], 'Unusual activity phishing', true),
('keyword', 'security alert', ARRAY['subject'], 'Fake security alert', true);

-- Regex patterns for urgency detection
INSERT INTO public.spam_filter_rules (rule_type, value, match_in, description, is_active) VALUES
('regex', '\\d+\\s*hours?\\s*(to|before|left)', ARRAY['body'], 'Time pressure scam pattern', true),
('regex', 'within\\s+\\d+\\s*(hours?|days?)', ARRAY['body'], 'Deadline pressure pattern', true);

-- Block known spam domains
INSERT INTO public.spam_filter_rules (rule_type, value, match_in, description, is_active) VALUES
('regex', '@.*\\.tanmmo\\.com$', ARRAY['sender'], 'Known spam domain tanmmo.com', true),
('regex', '@.*\\.thoimmo\\.com$', ARRAY['sender'], 'Known spam domain thoimmo.com', true),
('regex', '@.*\\.deped\\.gov\\.ph$', ARRAY['sender'], 'Compromised Philippine education domain', true);

-- Block suspicious patterns from compromised institutional domains
INSERT INTO public.spam_filter_rules (rule_type, value, match_in, description, is_active) VALUES
('regex', '@[^@]+\\.(edu|ac|gov)\\.[a-z]{2,3}$', ARRAY['sender'], 'Suspicious edu/gov subdomain pattern', true);