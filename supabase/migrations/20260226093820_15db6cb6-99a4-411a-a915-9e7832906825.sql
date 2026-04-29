
-- Visitor sessions table
CREATE TABLE public.visitor_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  session_id text NOT NULL,
  landing_page text,
  exit_page text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  device_type text,
  total_duration_seconds integer DEFAULT 0,
  total_pages_viewed integer DEFAULT 0,
  outcome text DEFAULT 'active',
  converted_at timestamptz,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz
);

-- Page events table
CREATE TABLE public.page_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  page_path text,
  page_title text,
  event_type text NOT NULL DEFAULT 'page_view',
  event_detail text,
  entered_at timestamptz DEFAULT now(),
  left_at timestamptz,
  duration_seconds integer,
  scroll_depth_percent integer
);

-- Indexes
CREATE INDEX idx_visitor_sessions_session_id ON public.visitor_sessions(session_id);
CREATE INDEX idx_visitor_sessions_started_at ON public.visitor_sessions(started_at DESC);
CREATE INDEX idx_visitor_sessions_outcome ON public.visitor_sessions(outcome);
CREATE INDEX idx_page_events_session_id ON public.page_events(session_id);
CREATE INDEX idx_page_events_event_type ON public.page_events(event_type);
CREATE INDEX idx_page_events_entered_at ON public.page_events(entered_at DESC);

-- Enable RLS
ALTER TABLE public.visitor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_events ENABLE ROW LEVEL SECURITY;

-- Public insert (anonymous tracking)
CREATE POLICY "Anyone can insert visitor sessions"
  ON public.visitor_sessions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update their own session"
  ON public.visitor_sessions FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can insert page events"
  ON public.page_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Admin-only read
CREATE POLICY "Admins can read visitor sessions"
  ON public.visitor_sessions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can read page events"
  ON public.page_events FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
