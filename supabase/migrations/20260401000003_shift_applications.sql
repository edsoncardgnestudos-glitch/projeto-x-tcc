-- =============================================================
-- PROJETO X — Migration 03: Tabela de Candidaturas
-- Execute no Supabase SQL Editor
-- =============================================================

CREATE TYPE public.application_status AS ENUM (
  'pending',
  'accepted_titular',
  'accepted_reserva1',
  'accepted_reserva2',
  'rejected'
);

CREATE TABLE public.shift_applications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id        UUID NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status          public.application_status NOT NULL DEFAULT 'pending',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(shift_id, professional_id)
);

ALTER TABLE public.shift_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profissional gerencia suas aplicações"
  ON public.shift_applications FOR ALL
  USING (auth.uid() = professional_id);

CREATE POLICY "Gestor vê aplicações da sua vaga"
  ON public.shift_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.shifts s
      JOIN public.profiles p ON p.hospital_id = s.hospital_id
      WHERE s.id = shift_applications.shift_id AND p.id = auth.uid()
    )
  );

CREATE INDEX idx_shift_applications_shift_id    ON public.shift_applications(shift_id);
CREATE INDEX idx_shift_applications_professional ON public.shift_applications(professional_id);
