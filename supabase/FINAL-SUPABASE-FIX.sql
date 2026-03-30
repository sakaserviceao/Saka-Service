-- ============================================================
-- SCRIPT DE CORREÇÃO DE ESQUEMA - SAKA SERVICE
-- Este script adiciona as colunas de verificação em falta.
-- ============================================================

-- 1. Criar o tipo de status se não existir
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status') THEN
        CREATE TYPE verification_status AS ENUM ('ativo', 'suspenso', 'removido', 'pending_upload', 'pending_review', 'verified', 'rejected');
    ELSE
        -- Garantir que os novos valores existam se o tipo já existir
        ALTER TYPE verification_status ADD VALUE IF NOT EXISTS 'ativo';
        ALTER TYPE verification_status ADD VALUE IF NOT EXISTS 'suspenso';
        ALTER TYPE verification_status ADD VALUE IF NOT EXISTS 'removido';
        ALTER TYPE verification_status ADD VALUE IF NOT EXISTS 'pending_upload';
        ALTER TYPE verification_status ADD VALUE IF NOT EXISTS 'pending_review';
        ALTER TYPE verification_status ADD VALUE IF NOT EXISTS 'verified';
        ALTER TYPE verification_status ADD VALUE IF NOT EXISTS 'rejected';
    END IF;
EXCEPTION
    WHEN others THEN null;
END $$;

-- 2. Adicionar as colunas necessárias na tabela 'professionals'
ALTER TABLE public.professionals 
ADD COLUMN IF NOT EXISTS verification_status verification_status DEFAULT 'ativo',
ADD COLUMN IF NOT EXISTS id_card_front_url TEXT,
ADD COLUMN IF NOT EXISTS id_card_back_url TEXT,
ADD COLUMN IF NOT EXISTS certificate_url TEXT,
ADD COLUMN IF NOT EXISTS id_number TEXT,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;

-- 3. Garantir que o padrão para novos perfis é 'ativo'
ALTER TABLE public.professionals 
ALTER COLUMN verification_status SET DEFAULT 'ativo';

-- 4. Notificar a API do Supabase (PostgREST) para atualizar o cache do esquema
NOTIFY pgrst, 'reload schema';
