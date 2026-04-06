-- Saka Service: Adicionar sistema de assinaturas e pagamentos

-- 1. Nova Tabela de Assinaturas
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id TEXT REFERENCES public.professionals(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'blocked')),
    plan TEXT NOT NULL CHECK (plan IN ('mensal', 'trimestral')),
    amount NUMERIC,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    payment_method TEXT,
    payment_proof_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS na tabela de assinaturas
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para assinaturas
CREATE POLICY "Profissionais podem ver as suas próprias assinaturas" ON public.subscriptions 
    FOR SELECT USING (auth.uid()::text = professional_id OR professional_id = (SELECT id FROM public.professionals WHERE id = auth.uid()::text));

CREATE POLICY "Administradores podem ver todas as assinaturas" ON public.subscriptions 
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.admins WHERE email = auth.email()));

CREATE POLICY "Administradores podem atualizar assinaturas" ON public.subscriptions 
    FOR UPDATE USING (EXISTS (SELECT 1 FROM public.admins WHERE email = auth.email()));

CREATE POLICY "Profissionais podem criar assinaturas" 
    ON public.subscriptions 
    FOR INSERT 
    WITH CHECK (auth.uid()::text = professional_id OR professional_id = (SELECT id FROM public.professionals WHERE id = auth.uid()::text));

-- 2. Adicionar campo de status de subscrição na tabela de profissionais para acesso rápido
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='professionals' AND column_name='subscription_status') THEN
        ALTER TABLE public.professionals ADD COLUMN subscription_status TEXT DEFAULT 'pending' CHECK (subscription_status IN ('pending', 'active', 'expired', 'blocked'));
    END IF;
END $$;

-- 3. Função para atualizar automaticamente o status no perfil do profissional quando a subscrição muda
CREATE OR REPLACE FUNCTION public.sync_subscription_status() 
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.professionals 
    SET subscription_status = NEW.status
    WHERE id = NEW.professional_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_subscription_status_change
AFTER INSERT OR UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.sync_subscription_status();

-- 4. Função para marcar subscrições expiradas (pode ser chamada via cron ou periodicamente)
CREATE OR REPLACE FUNCTION public.check_expired_subscriptions()
RETURNS void AS $$
BEGIN
    UPDATE public.subscriptions
    SET status = 'expired'
    WHERE end_date < now() AND status = 'active';
END;
$$ LANGUAGE plpgsql;

-- 5. Atualizar os profissionais existentes para 'active' se quisermos dar um tempo de cortesia,
-- ou 'pending' para forçar pagamento. Vou deixar como 'pending' (default) conforme as instruções.
-- Mas para não quebrar o site agora, se for necessário, podemos forçar ativos.
-- Instrução diz: "status = active" após pagamento. Então mantemos pending.
