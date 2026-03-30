-- Atualizar o fluxo de publicação para Auto-Publicação + Moderação Posterior

-- 1. ADICIONAR NOVOS STATUS AO ENUM (ativo, suspenso, removido)
-- Postgres não permite remover valores de ENUM facilmente, então adicionamos os novos
DO $$ BEGIN
    ALTER TYPE verification_status ADD VALUE IF NOT EXISTS 'ativo';
    ALTER TYPE verification_status ADD VALUE IF NOT EXISTS 'suspenso';
    ALTER TYPE verification_status ADD VALUE IF NOT EXISTS 'removido';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. RECUPERAR PERFIS (Mudar todos para 'ativo')
-- Isso tornará visível qualquer perfil que estava pendente ou verificado
UPDATE public.professionals 
SET verification_status = 'ativo'
WHERE verification_status IN ('pending_upload', 'pending_review', 'verified', 'rejected') 
   OR verification_status IS NULL;

-- 3. ALTERAR O PADRÃO PARA NOVOS PERFIS
ALTER TABLE public.professionals 
ALTER COLUMN verification_status SET DEFAULT 'ativo';

-- 4. GARANTIR RLS PARA O STATUS 'ativo'
-- (As políticas existentes já devem funcionar, mas garantimos que o admin pode gerir os novos status)
-- O script consolidated-rls anterior já permite que o admin atualize qualquer campo.
