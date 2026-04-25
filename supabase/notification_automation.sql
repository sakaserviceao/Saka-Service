-- Criação da fila de eventos de notificação
CREATE TABLE IF NOT EXISTS public.notification_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_name TEXT NOT NULL,
    channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'in_app', 'sms')),
    payload JSONB DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled')),
    scheduled_for TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    error_log TEXT
);

-- Índices para procura rápida pela Edge Function
CREATE INDEX IF NOT EXISTS idx_notification_queue_pending ON public.notification_queue(status, scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_notification_queue_user ON public.notification_queue(user_id);

-- Atualização da tabela professionals para suportar regras de notificação
ALTER TABLE public.professionals 
ADD COLUMN IF NOT EXISTS whatsapp_opt_out BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sms_opt_out BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS daily_whatsapp_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_whatsapp_sent_date DATE DEFAULT CURRENT_DATE;

-- Função para atualizar `updated_at` na fila
CREATE OR REPLACE FUNCTION update_notification_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notification_queue_updated_at ON public.notification_queue;
CREATE TRIGGER trigger_notification_queue_updated_at
BEFORE UPDATE ON public.notification_queue
FOR EACH ROW EXECUTE FUNCTION update_notification_queue_updated_at();

-- ============================================================================
-- EVENT TRIGGERS (INSERÇÃO AUTOMÁTICA NA FILA)
-- ============================================================================

-- 1. Evento: user_registered
-- Gatilho: Quando um profissional cria conta (inserido na tabela professionals)
CREATE OR REPLACE FUNCTION trigger_event_user_registered()
RETURNS TRIGGER AS $$
BEGIN
    -- In-app Imediato
    INSERT INTO public.notification_queue (user_id, event_name, channel, scheduled_for, payload)
    VALUES (NEW.user_id, 'user_registered', 'in_app', NOW(), '{"message": "Bem-vindo. Completa o teu perfil para seres publicado."}'::jsonb);

    -- WhatsApp + 5 minutos
    INSERT INTO public.notification_queue (user_id, event_name, channel, scheduled_for, payload)
    VALUES (NEW.user_id, 'user_registered_5m', 'whatsapp', NOW() + INTERVAL '5 minutes', '{"message": "Falta pouco para ativares o teu perfil. Completa agora."}'::jsonb);

    -- WhatsApp + 24 horas
    INSERT INTO public.notification_queue (user_id, event_name, channel, scheduled_for, payload)
    VALUES (NEW.user_id, 'user_registered_24h', 'whatsapp', NOW() + INTERVAL '24 hours', '{"message": "Já há clientes à procura. Finaliza o teu perfil."}'::jsonb);

    -- WhatsApp + 72 horas
    INSERT INTO public.notification_queue (user_id, event_name, channel, scheduled_for, payload)
    VALUES (NEW.user_id, 'user_registered_72h', 'whatsapp', NOW() + INTERVAL '72 hours', '{"message": "Perfis completos têm prioridade. Conclui aqui."}'::jsonb);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_professional_registered ON public.professionals;
CREATE TRIGGER on_professional_registered
AFTER INSERT ON public.professionals
FOR EACH ROW EXECUTE FUNCTION trigger_event_user_registered();

-- ============================================================================
-- CRON JOB SCHEDULING (Requer pg_cron ativado no Supabase)
-- ============================================================================
-- Este bloco diz ao Postgres para chamar a nossa Edge Function a cada 5 minutos
-- NOTA: Substitua 'SUA_URL_AQUI' e 'SUA_CHAVE_AQUI' após publicar a Edge Function
/*
SELECT cron.schedule(
  'process-notifications-cron',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
      url:='https://SEU_PROJETO.supabase.co/functions/v1/process-notifications',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer SUA_CHAVE_ANON"}'::jsonb,
      body:='{}'::jsonb
  ) as request_id;
  $$
);
*/
