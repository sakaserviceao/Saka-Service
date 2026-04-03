-- ============================================================
-- SCRIPT DE CORREÇÃO DE ESQUEMA - SAKA SERVICE
-- Este script adiciona as colunas de verificação em falta.
-- ============================================================

-- 1. Criar o tipo de status se não existir
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status') THEN
        CREATE TYPE verification_status AS ENUM ('ativo', 'suspenso', 'removido', 'pending_upload', 'pending_review', 'verified', 'rejected');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN others THEN null;
END $$;

-- 2. Adicionar as colunas necessárias na tabela 'professionals'
DO $$ BEGIN
    ALTER TABLE public.professionals 
    ADD COLUMN IF NOT EXISTS verification_status verification_status DEFAULT 'ativo';
EXCEPTION
    WHEN others THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.professionals 
    ADD COLUMN IF NOT EXISTS id_card_front_url TEXT;
EXCEPTION
    WHEN others THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.professionals 
    ADD COLUMN IF NOT EXISTS id_card_back_url TEXT;
EXCEPTION
    WHEN others THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.professionals 
    ADD COLUMN IF NOT EXISTS certificate_url TEXT;
EXCEPTION
    WHEN others THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.professionals 
    ADD COLUMN IF NOT EXISTS id_number TEXT;
EXCEPTION
    WHEN others THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.professionals 
    ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;
EXCEPTION
    WHEN others THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.professionals 
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
EXCEPTION
    WHEN others THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.professionals 
    ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;
EXCEPTION
    WHEN others THEN null;
END $$;

-- 3. Garantir que o padrão para novos perfis é 'ativo'
DO $$ BEGIN
    ALTER TABLE public.professionals 
    ALTER COLUMN verification_status SET DEFAULT 'ativo';
EXCEPTION
    WHEN others THEN null;
END $$;

-- 4. Notificar a API do Supabase (PostgREST) para atualizar o cache do esquema
NOTIFY pgrst, 'reload schema';
