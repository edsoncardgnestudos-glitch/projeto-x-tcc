-- =============================================================
-- PROJETO X — Marketplace de Plantões
-- Schema Inicial MVP
-- Execute este script no Supabase SQL Editor
-- =============================================================

-- ----------------------------------------------------------------
-- ENUMS
-- ----------------------------------------------------------------
CREATE TYPE public.user_role AS ENUM ('manager', 'professional');
CREATE TYPE public.shift_status AS ENUM ('open', 'filled', 'completed', 'canceled');

-- ----------------------------------------------------------------
-- 1. HOSPITALS (Empresas / Hospitais)
-- ----------------------------------------------------------------
CREATE TABLE public.hospitals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  cnpj        TEXT NOT NULL UNIQUE,
  address     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------
-- 2. PROFILES (Gestores & Profissionais)
-- Referencia auth.users do Supabase
-- ----------------------------------------------------------------
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        public.user_role NOT NULL,
  full_name   TEXT,
  crm_coren   TEXT,
  bio         TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------
-- 3. SHIFTS (Plantões / Vagas)
-- ----------------------------------------------------------------
CREATE TABLE public.shifts (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id              UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  date                     DATE NOT NULL,
  time_start               TIME NOT NULL,
  time_end                 TIME NOT NULL,
  value                    NUMERIC(10, 2) NOT NULL,
  role_needed              TEXT NOT NULL,
  status                   public.shift_status NOT NULL DEFAULT 'open',
  main_professional_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  backup1_professional_id  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  backup2_professional_id  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------
-- INDEXES
-- ----------------------------------------------------------------
CREATE INDEX idx_shifts_hospital_id ON public.shifts(hospital_id);
CREATE INDEX idx_shifts_status      ON public.shifts(status);
CREATE INDEX idx_shifts_date        ON public.shifts(date);
CREATE INDEX idx_profiles_role      ON public.profiles(role);

-- ----------------------------------------------------------------
-- RLS — Habilitação (após todas as tabelas existirem)
-- ----------------------------------------------------------------
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts    ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------
-- RLS POLICIES — hospitals
-- ----------------------------------------------------------------
CREATE POLICY "Hospitais visíveis para autenticados"
  ON public.hospitals FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Apenas managers podem inserir hospitais"
  ON public.hospitals FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- ----------------------------------------------------------------
-- RLS POLICIES — profiles
-- ----------------------------------------------------------------
CREATE POLICY "Usuário vê seu próprio perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Usuário atualiza seu próprio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Perfis públicos visíveis para autenticados"
  ON public.profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- ----------------------------------------------------------------
-- RLS POLICIES — shifts
-- ----------------------------------------------------------------
CREATE POLICY "Plantões visíveis para autenticados"
  ON public.shifts FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Apenas managers criam plantões"
  ON public.shifts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

CREATE POLICY "Apenas managers atualizam plantões"
  ON public.shifts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- ----------------------------------------------------------------
-- TRIGGER — cria profile automaticamente após signup
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'professional')::public.user_role,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
