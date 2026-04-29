-- Migration: Make created_by nullable on outbound_campaigns for system-seeded records
-- Also add metadata JSONB columns to outbound_campaigns and outbound_journeys

ALTER TABLE public.outbound_campaigns ALTER COLUMN created_by DROP NOT NULL;

ALTER TABLE public.outbound_campaigns ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}';

ALTER TABLE public.outbound_journeys ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}';