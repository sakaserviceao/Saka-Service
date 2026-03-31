-- SQL Migration: Adicionar status de conta e sincronização automática
-- Execute este script no SQL Editor do Supabase

-- 1. Adicionar o valor ao enum ou criar uma nova coluna
-- Como o enum atual é para verificação profissional, vamos criar uma nova coluna de status da conta.

ALTER TABLE public.professionals 
ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'pending_email_confirmation';

-- 2. Função de Trigger para criar perfil automaticamente no Signup
-- Isto garante que todo o utilizador que se regista tenha uma entrada na tabela professionals (perfil)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.professionals (id, name, email, account_status)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'Utilizador'), 
    new.email, 
    'pending_email_confirmation'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Criar o Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Função para atualizar o status após confirmação de e-mail (Opcional, mas recomendado)
-- O Supabase Auth já lida com o email_confirmed_at, mas podemos sincronizar o status se desejado.
-- No entanto, a verificação no frontend que implementámos já é suficiente.
