-- =============================================================
-- PROJETO X — Migration 02: Vínculo Gestor ↔ Hospital
-- Execute no Supabase SQL Editor
-- =============================================================

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_hospital_id ON public.profiles(hospital_id);
