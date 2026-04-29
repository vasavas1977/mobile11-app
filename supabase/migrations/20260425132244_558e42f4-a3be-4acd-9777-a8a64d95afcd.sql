-- =========================================================
-- Phase 2: Voice Bridge Settings (control plane, DB-only)
-- Bridge code is untouched; values here are NOT yet read by the bridge.
-- =========================================================

-- Ensure pgcrypto is available for digest()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------- Tables ----------

CREATE TABLE public.voice_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  gemini_voice text NOT NULL,
  voice_sms_enabled boolean NOT NULL,
  voice_rating_enabled boolean NOT NULL,
  voice_memory_enabled boolean NOT NULL,
  voice_silence_probe_guard_enabled boolean NOT NULL,
  voice_rating_window_ms int NOT NULL CHECK (voice_rating_window_ms > 0),
  voice_silence_probe_guard_ms int NOT NULL CHECK (voice_silence_probe_guard_ms > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  config_hash text NOT NULL DEFAULT ''
);

CREATE TABLE public.voice_settings_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  changed_at timestamptz NOT NULL DEFAULT now(),
  changed_by uuid,
  change_type text NOT NULL CHECK (change_type IN ('create', 'update')),
  snapshot jsonb,
  new_snapshot jsonb NOT NULL,
  config_hash text NOT NULL,
  reason text
);

CREATE INDEX voice_settings_history_changed_at_idx
  ON public.voice_settings_history (changed_at DESC);

-- ---------- Canonical hash function ----------

CREATE OR REPLACE FUNCTION public.compute_voice_settings_hash(s public.voice_settings)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  canonical jsonb;
BEGIN
  canonical := jsonb_build_object(
    'gemini_voice', s.gemini_voice,
    'voice_sms_enabled', s.voice_sms_enabled,
    'voice_rating_enabled', s.voice_rating_enabled,
    'voice_memory_enabled', s.voice_memory_enabled,
    'voice_silence_probe_guard_enabled', s.voice_silence_probe_guard_enabled,
    'voice_rating_window_ms', s.voice_rating_window_ms,
    'voice_silence_probe_guard_ms', s.voice_silence_probe_guard_ms
  );
  RETURN encode(extensions.digest(canonical::text, 'sha256'), 'hex');
END;
$$;

-- ---------- Audit trigger ----------

CREATE OR REPLACE FUNCTION public.voice_settings_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reason_text text;
BEGIN
  -- Compute hash and stamp updated_at on the row itself
  NEW.config_hash := public.compute_voice_settings_hash(NEW);
  NEW.updated_at := now();

  -- Optional reason carried via session-local GUC
  BEGIN
    reason_text := current_setting('app.voice_settings_change_reason', true);
  EXCEPTION WHEN OTHERS THEN
    reason_text := NULL;
  END;
  IF reason_text = '' THEN
    reason_text := NULL;
  END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.voice_settings_history
      (changed_by, change_type, snapshot, new_snapshot, config_hash, reason)
    VALUES
      (NEW.updated_by, 'create', NULL, to_jsonb(NEW), NEW.config_hash, reason_text);
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.voice_settings_history
      (changed_by, change_type, snapshot, new_snapshot, config_hash, reason)
    VALUES
      (NEW.updated_by, 'update', to_jsonb(OLD), to_jsonb(NEW), NEW.config_hash, reason_text);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER voice_settings_audit_trigger
  BEFORE INSERT OR UPDATE ON public.voice_settings
  FOR EACH ROW EXECUTE FUNCTION public.voice_settings_audit();

-- ---------- RLS ----------

ALTER TABLE public.voice_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_settings_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY voice_settings_admin_select
  ON public.voice_settings
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY voice_settings_admin_update
  ON public.voice_settings
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY voice_settings_history_admin_select
  ON public.voice_settings_history
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- (no INSERT/UPDATE/DELETE policies on history — only the SECURITY DEFINER trigger writes)

-- ---------- Seed (verified EC2 baseline) ----------

INSERT INTO public.voice_settings (
  id,
  gemini_voice,
  voice_sms_enabled,
  voice_rating_enabled,
  voice_memory_enabled,
  voice_silence_probe_guard_enabled,
  voice_rating_window_ms,
  voice_silence_probe_guard_ms,
  updated_by
) VALUES (
  1,
  'Aoede',
  false,
  false,
  false,
  false,
  60000,
  5000,
  NULL
);
-- Trigger auto-creates the 'create' history row with computed config_hash.