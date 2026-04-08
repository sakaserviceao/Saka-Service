-- Migração para Upgrade do Sistema de Subscrição SakaServ
-- Adiciona campos necessários para o novo fluxo de aprovação e controlo temporal

DO $$ 
BEGIN 
    -- 1. Adicionar selected_plan
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='subscriptions' AND column_name='selected_plan') THEN
        ALTER TABLE public.subscriptions ADD COLUMN selected_plan TEXT CHECK (selected_plan IN ('mensal', 'trimestral'));
    END IF;

    -- 2. Adicionar approved_plan
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='subscriptions' AND column_name='approved_plan') THEN
        ALTER TABLE public.subscriptions ADD COLUMN approved_plan TEXT CHECK (approved_plan IN ('mensal', 'trimestral'));
    END IF;

    -- 3. Adicionar blocked_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='subscriptions' AND column_name='blocked_at') THEN
        ALTER TABLE public.subscriptions ADD COLUMN blocked_at TIMESTAMPTZ;
    END IF;

    -- 4. Migrar dados existentes (opcional, só para não deixar nulo)
    UPDATE public.subscriptions SET selected_plan = plan WHERE selected_plan IS NULL;
    UPDATE public.subscriptions SET approved_plan = plan WHERE approved_plan IS NULL AND status = 'active';

END $$;
