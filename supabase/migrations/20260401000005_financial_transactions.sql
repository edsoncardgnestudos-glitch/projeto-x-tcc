-- ============================================================
-- 05 — Arquitetura Financeira (escrow simulado + carteira)
-- ============================================================

-- 1. ENUM de status de pagamento
CREATE TYPE payment_status AS ENUM (
  'pending',           -- plantão criado, sem pagamento
  'escrow_retained',   -- valor retido em escrow (após publicação)
  'released',          -- pagamento liberado ao profissional
  'refunded'           -- valor devolvido ao gestor
);

-- 2. Colunas financeiras na tabela shifts
ALTER TABLE shifts
  ADD COLUMN IF NOT EXISTS platform_fee  NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS total_charged NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS payment_state payment_status DEFAULT 'pending';

-- 3. Tabela de transações da carteira do profissional
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id  UUID         NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  shift_id         UUID         REFERENCES shifts(id) ON DELETE SET NULL,
  amount           NUMERIC(10,2) NOT NULL,
  type             TEXT         NOT NULL CHECK (type IN ('credit', 'debit')),
  description      TEXT         NOT NULL,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- 4. RLS na tabela wallet_transactions
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Profissional vê apenas as próprias transações
CREATE POLICY "professionals_select_own_wallet" ON wallet_transactions
  FOR SELECT TO authenticated
  USING (professional_id = auth.uid());

-- Gestor pode creditar a carteira do profissional via Server Action
CREATE POLICY "managers_insert_wallet" ON wallet_transactions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id  = auth.uid()
        AND profiles.role = 'manager'
    )
  );

-- 5. Índice para listar extrato rapidamente
CREATE INDEX IF NOT EXISTS wallet_transactions_professional_id_idx
  ON wallet_transactions (professional_id, created_at DESC);
