-- Create channel_connections table for storing Facebook/LINE/WhatsApp connections
CREATE TABLE public.channel_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_type TEXT NOT NULL, -- 'facebook', 'line', 'whatsapp'
  external_id TEXT NOT NULL,  -- Page ID, LINE Channel ID, etc.
  name TEXT NOT NULL,         -- Display name (Page name)
  access_token TEXT,          -- Page access token (encrypted at rest by Supabase)
  profile_picture_url TEXT,   -- Page profile picture
  settings JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active', -- 'active', 'disconnected', 'error'
  connected_by UUID REFERENCES auth.users(id),
  connected_at TIMESTAMPTZ DEFAULT now(),
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(channel_type, external_id)
);

-- Create index for faster lookups
CREATE INDEX idx_channel_connections_channel_type ON public.channel_connections(channel_type);
CREATE INDEX idx_channel_connections_status ON public.channel_connections(status);

-- Enable Row Level Security
ALTER TABLE public.channel_connections ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for supervisors and admins
CREATE POLICY "Supervisors and admins can view all channel connections"
  ON public.channel_connections FOR SELECT
  TO authenticated
  USING (public.is_supervisor_or_higher(auth.uid()));

CREATE POLICY "Supervisors and admins can insert channel connections"
  ON public.channel_connections FOR INSERT
  TO authenticated
  WITH CHECK (public.is_supervisor_or_higher(auth.uid()));

CREATE POLICY "Supervisors and admins can update channel connections"
  ON public.channel_connections FOR UPDATE
  TO authenticated
  USING (public.is_supervisor_or_higher(auth.uid()))
  WITH CHECK (public.is_supervisor_or_higher(auth.uid()));

CREATE POLICY "Supervisors and admins can delete channel connections"
  ON public.channel_connections FOR DELETE
  TO authenticated
  USING (public.is_supervisor_or_higher(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_channel_connections_updated_at
  BEFORE UPDATE ON public.channel_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();