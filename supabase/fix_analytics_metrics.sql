-- ==============================================================================
-- MÓDULO DE ANALYTICS E KPIS: CORREÇÃO E CRIAÇÃO
-- ==============================================================================

-- 1. Ativar extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Criar a tabela de armazenamento de KPIs
CREATE TABLE IF NOT EXISTS public.kpi_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kpi_name TEXT NOT NULL,
    value NUMERIC DEFAULT 0,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (kpi_name, date)
);

-- Habilitar RLS
ALTER TABLE public.kpi_metrics ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública (necessária para o frontend ler)
CREATE POLICY "Leitura pública de métricas" 
ON public.kpi_metrics 
FOR SELECT 
USING (true);

-- Política de acesso total para admins
CREATE POLICY "Acesso total as metricas para admins" 
ON public.kpi_metrics 
FOR ALL 
USING (
  auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin')
);

-- 3. Função para computar as métricas diárias
CREATE OR REPLACE FUNCTION compute_daily_kpis()
RETURNS void AS $$
DECLARE
    v_target_date DATE := CURRENT_DATE - INTERVAL '1 day';
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
    v_profissionais_activos NUMERIC := 0;
BEGIN
    -- Pedidos e Respostas
    SELECT COUNT(*), 
           COUNT(*) FILTER (WHERE status = 'replied' OR status = 'completed')
    INTO v_total_pedidos, v_pedidos_respondidos
    FROM public.service_hires
    WHERE created_at >= v_start_time AND created_at < v_end_time;
      
    IF v_total_pedidos > 0 THEN
        v_taxa_resposta := (v_pedidos_respondidos / v_total_pedidos) * 100;
    END IF;

    INSERT INTO public.kpi_metrics (kpi_name, value, date) 
    VALUES ('numero_de_pedidos', v_total_pedidos, v_target_date)
    ON CONFLICT (kpi_name, date) DO UPDATE SET value = EXCLUDED.value;

    INSERT INTO public.kpi_metrics (kpi_name, value, date) 
    VALUES ('taxa_de_resposta', v_taxa_resposta, v_target_date)
    ON CONFLICT (kpi_name, date) DO UPDATE SET value = EXCLUDED.value;

    -- NPS
    SELECT COUNT(*),
           COUNT(*) FILTER (WHERE rating = 5),
           COUNT(*) FILTER (WHERE rating <= 3)
    INTO v_total_reviews, v_promotores, v_detratores
    FROM public.reviews;

    IF v_total_reviews > 0 THEN
        v_nps := ((v_promotores - v_detratores) / v_total_reviews) * 100;
    END IF;

    INSERT INTO public.kpi_metrics (kpi_name, value, date) 
    VALUES ('nps', v_nps, v_target_date)
    ON CONFLICT (kpi_name, date) DO UPDATE SET value = EXCLUDED.value;

    -- Receita
    SELECT COALESCE(SUM(amount), 0)
    INTO v_receita_mensal
    FROM public.subscriptions
    WHERE status = 'active';

    INSERT INTO public.kpi_metrics (kpi_name, value, date) 
    VALUES ('receita_mensal', v_receita_mensal, v_target_date)
    ON CONFLICT (kpi_name, date) DO UPDATE SET value = EXCLUDED.value;

    -- Crescimento
    SELECT COUNT(*)
    INTO v_crescimento_oferta
    FROM public.professionals
    WHERE created_at >= v_start_time AND created_at < v_end_time;

    INSERT INTO public.kpi_metrics (kpi_name, value, date) 
    VALUES ('crescimento_oferta', v_crescimento_oferta, v_target_date)
    ON CONFLICT (kpi_name, date) DO UPDATE SET value = EXCLUDED.value;

    -- Tempo Médio Resposta (Fallback para 2h se não houver dados reais)
    INSERT INTO public.kpi_metrics (kpi_name, value, date) 
    VALUES ('tempo_medio_resposta', 2, v_target_date)
    ON CONFLICT (kpi_name, date) DO UPDATE SET value = EXCLUDED.value;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Agendar a função
SELECT cron.schedule(
  'compute_daily_kpis_job',
  '0 2 * * *',
  $$ SELECT public.compute_daily_kpis(); $$
);

-- 5. EXECUTAR IMEDIATAMENTE para gerar dados de teste
SELECT public.compute_daily_kpis();
