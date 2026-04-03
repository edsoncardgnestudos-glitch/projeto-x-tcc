-- =============================================================
-- PROJETO X — Auth Trigger (standalone)
-- Execute no Supabase SQL Editor APENAS se não rodou
-- database_schema.sql completo. Caso já tenha rodado, este
-- trigger já existe e este script pode ser ignorado.
-- =============================================================

-- Função chamada automaticamente ao criar usuário no Supabase Auth
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

-- Remove o trigger antigo se existir, depois recria
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
