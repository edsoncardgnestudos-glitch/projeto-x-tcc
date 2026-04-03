-- =============================================================
-- PROJETO X — Migration 04: Troca de Plantões (Shift Swaps)
-- Execute no Supabase SQL Editor
-- =============================================================

CREATE TYPE public.swap_status AS ENUM ('pending_manager', 'approved', 'rejected');

CREATE TABLE public.shift_swaps (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id                    UUID NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  original_professional_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_professional_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason                      TEXT NOT NULL,
  status                      public.swap_status NOT NULL DEFAULT 'pending_manager',
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shift_swaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profissionais veem suas trocas"
  ON public.shift_swaps FOR ALL
  USING (auth.uid() = original_professional_id OR auth.uid() = target_professional_id);

CREATE POLICY "Gestor vê trocas do seu hospital"
  ON public.shift_swaps FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.shifts s
      JOIN public.profiles p ON p.hospital_id = s.hospital_id
      WHERE s.id = shift_swaps.shift_id AND p.id = auth.uid()
    )
  );

CREATE INDEX idx_shift_swaps_shift_id    ON public.shift_swaps(shift_id);
CREATE INDEX idx_shift_swaps_status      ON public.shift_swaps(status);
