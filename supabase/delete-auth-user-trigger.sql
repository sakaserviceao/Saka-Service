-- SCRIPT PARA ELIMINAR O UTILIZADOR DO SUPABASE AUTH AUTOMATICAMENTE
-- Instruções: Execute este script no SQL Editor do seu Dashboard do Supabase.

-- 1. Criar a função que lida com a remoção
CREATE OR REPLACE FUNCTION public.handle_delete_user_auth()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER -- Permite que a função apague da tabela auth.users mesmo sem permissões diretas do cliente
SET search_path = public, auth
AS $$
BEGIN
  -- Tenta apagar o utilizador da tabela auth.users
  -- Usamos OLD.id que corresponde ao ID do profissional que está a ser apagado
  DELETE FROM auth.users WHERE id = OLD.id::uuid;
  
  RETURN OLD;
EXCEPTION
  WHEN OTHERS THEN
    -- Em caso de erro, apenas retornamos o registo para não bloquear a eliminação na tabela pública
    RETURN OLD;
END;
$$;

-- 2. Criar o Gatilho (Trigger) na tabela de profissionais
-- Este gatilho corre DEPOIS de o registo ser removido da tabela professionals
DROP TRIGGER IF EXISTS on_professional_deleted_auth ON public.professionals;
CREATE TRIGGER on_professional_deleted_auth
  AFTER DELETE ON public.professionals
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_delete_user_auth();

-- NOTA: Este script garante que ao apagar o perfil no painel de admin, 
-- a conta de e-mail (Login) também desaparece.
