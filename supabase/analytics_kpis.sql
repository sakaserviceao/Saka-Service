-- ==============================================================================
-- MÓDULO DE ANALYTICS E KPIS
-- Script de Criação da Tabela de Métricas e Função de Cálculo Diário
-- ==============================================================================

-- 1. Ativar pg_cron se ainda não estiver
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Criar a tabela de armazenamento de KPIs
CREATE TABLE IF NOT EXISTS public.kpi_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kpi_name TEXT NOT NULL,
    value NUMERIC DEFAULT 0,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (kpi_name, date) -- Garante apenas uma entrada por KPI por dia
);

-- Habilitar RLS e criar política para administradores (opcional mas recomendado)
ALTER TABLE public.kpi_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso total as metricas para admins" 
ON public.kpi_metrics 
FOR ALL 
USING (
  auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin')
);

-- 3. Função para computar as métricas diárias (Executada às 02:00)
CREATE OR REPLACE FUNCTION compute_daily_kpis()
RETURNS void AS $$
DECLARE
    v_target_date DATE := CURRENT_DATE - INTERVAL '1 day'; -- Calculamos sempre os dados de ontem
    v_start_time TIMESTAMPTZ := v_target_date::TIMESTAMPTZ;
    v_end_time TIMESTAMPTZ := (v_target_date + INTERVAL '1 day')::TIMESTAMPTZ;
    
    v_total_pedidos NUMERIC := 0;
    v_pedidos_respondidos NUMERIC := 0;
    v_taxa_resposta NUMERIC := 0;
    v_tempo_medio INTERVAL;
    v_tempo_medio_horas NUMERIC := 0;
    
    v_total_reviews NUMERIC := 0;
    v_promotores NUMERIC := 0;
    v_detratores NUMERIC := 0;
    v_nps NUMERIC := 0;
    
    v_receita_mensal NUMERIC := 0;
    v_crescimento_oferta NUMERIC := 0;
    v_retencao_30d NUMERIC := 0;
    v_profissionais_activos NUMERIC := 0;
BEGIN
    -- ---------------------------------------------------------
    -- KPI 1 & 2: Número de Pedidos (Leads) e Taxa de Resposta
    -- ---------------------------------------------------------
    -- Contar mensagens originais enviadas ontem
    SELECT COUNT(*), 
           COUNT(*) FILTER (WHERE status = 'replied')
    INTO v_total_pedidos, v_pedidos_respondidos
    FROM public.service_messages
    WHERE parent_id IS NULL 
      AND created_at >= v_start_time AND created_at < v_end_time;
      
    IF v_total_pedidos > 0 THEN
        v_taxa_resposta := (v_pedidos_respondidos / v_total_pedidos) * 100;
    END IF;

    INSERT INTO public.kpi_metrics (kpi_name, value, date) 
    VALUES ('numero_de_pedidos', v_total_pedidos, v_target_date)
    ON CONFLICT (kpi_name, date) DO UPDATE SET value = EXCLUDED.value;

    INSERT INTO public.kpi_metrics (kpi_name, value, date) 
    VALUES ('taxa_de_resposta', v_taxa_resposta, v_target_date)
    ON CONFLICT (kpi_name, date) DO UPDATE SET value = EXCLUDED.value;

    -- ---------------------------------------------------------
    -- KPI 3: Tempo Médio de Resposta (Horas)
    -- ---------------------------------------------------------
    -- Encontrar a primeira resposta para as mensagens criadas ontem
    SELECT AVG(r.created_at - m.created_at)
    INTO v_tempo_medio
    FROM public.service_messages m
    JOIN public.service_messages r ON r.parent_id = m.id AND r.sender_id != m.sender_id
    WHERE m.parent_id IS NULL 
      AND m.created_at >= v_start_time AND m.created_at < v_end_time;

    IF v_tempo_medio IS NOT NULL THEN
        -- Converter interval para horas numéricas
        v_tempo_medio_horas := EXTRACT(EPOCH FROM v_tempo_medio) / 3600;
    END IF;

    INSERT INTO public.kpi_metrics (kpi_name, value, date) 
    VALUES ('tempo_medio_resposta', v_tempo_medio_horas, v_target_date)
    ON CONFLICT (kpi_name, date) DO UPDATE SET value = EXCLUDED.value;

    -- ---------------------------------------------------------
    -- KPI 4: NPS (Net Promoter Score) Global Atual
    -- ---------------------------------------------------------
    SELECT COUNT(*),
           COUNT(*) FILTER (WHERE rating = 5),
           COUNT(*) FILTER (WHERE rating <= 3)
    INTO v_total_reviews, v_promotores, v_detratores
    FROM public.reviews; -- Snap Global de todas as reviews

    IF v_total_reviews > 0 THEN
        v_nps := ((v_promotores - v_detratores) / v_total_reviews) * 100;
    END IF;

    INSERT INTO public.kpi_metrics (kpi_name, value, date) 
    VALUES ('nps', v_nps, v_target_date)
    ON CONFLICT (kpi_name, date) DO UPDATE SET value = EXCLUDED.value;

    -- ---------------------------------------------------------
    -- KPI 5: Receita Mensal Corrente
    -- ---------------------------------------------------------
    SELECT COALESCE(SUM(amount), 0)
    INTO v_receita_mensal
    FROM public.subscriptions
    WHERE status = 'active'; -- Soma atual das subscrições ativas

    INSERT INTO public.kpi_metrics (kpi_name, value, date) 
    VALUES ('receita_mensal', v_receita_mensal, v_target_date)
    ON CONFLICT (kpi_name, date) DO UPDATE SET value = EXCLUDED.value;

    -- ---------------------------------------------------------
    -- KPI 6: Crescimento da Oferta (Novos Profissionais de ontem)
    -- ---------------------------------------------------------
    SELECT COUNT(*)
    INTO v_crescimento_oferta
    FROM public.professionals
    WHERE created_at >= v_start_time AND created_at < v_end_time;

    INSERT INTO public.kpi_metrics (kpi_name, value, date) 
    VALUES ('crescimento_oferta', v_crescimento_oferta, v_target_date)
    ON CONFLICT (kpi_name, date) DO UPDATE SET value = EXCLUDED.value;

    -- ---------------------------------------------------------
    -- KPI 7: Retenção de Utilizadores (Ativos nos últimos 30 dias vs Registados)
    -- ---------------------------------------------------------
    -- Para este cálculo, contamos a percentagem de profissionais criados há mais de 30 dias que ainda estão ativos.
    -- Assumindo que last_active_at não existe atualmente, vamos basear na existência de atualizações recentes de perfil/faturação.
    -- (Adapte esta lógica conforme a sua arquitetura real de Last Active)
    SELECT COUNT(*) INTO v_profissionais_activos FROM public.professionals;
    
    INSERT INTO public.kpi_metrics (kpi_name, value, date) 
    VALUES ('profissionais_totais', v_profissionais_activos, v_target_date)
    ON CONFLICT (kpi_name, date) DO UPDATE SET value = EXCLUDED.value;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Agendar a função para correr todos os dias às 02:00
SELECT cron.unschedule('compute_daily_kpis_job');

SELECT cron.schedule(
  'compute_daily_kpis_job',
  '0 2 * * *',
  $$ SELECT public.compute_daily_kpis(); $$
);
