-- SQL Migration: Sistema de Analítica de Visitas (Analytics)
-- Execute este script no SQL Editor do Supabase

-- 1. Adicionar colunas de contadores na tabela professionals
ALTER TABLE public.professionals 
ADD COLUMN IF NOT EXISTS total_views INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS daily_views INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_views INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS yearly_views INTEGER DEFAULT 0;

-- 2. Criar tabela de logs de visitas individuais para auditoria e ranking
CREATE TABLE IF NOT EXISTS public.profile_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visited_id TEXT REFERENCES public.professionals(id) ON DELETE CASCADE,
  visitor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- 3. Criar tabela para estatísticas globais (AdminStats)
CREATE TABLE IF NOT EXISTS public.site_stats (
  id TEXT PRIMARY KEY DEFAULT 'global',
  daily_visits INTEGER DEFAULT 0,
  monthly_visits INTEGER DEFAULT 0,
  yearly_visits INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Iniciar estatísticas globais
INSERT INTO public.site_stats (id) VALUES ('global') ON CONFLICT DO NOTHING;

-- 4. Função RPC para registar visita com regra de 5 minutos (cooldown)
CREATE OR REPLACE FUNCTION record_profile_visit(visited_user_id TEXT, visitor_user_id UUID DEFAULT NULL)
RETURNS void AS $$
DECLARE
  has_recent_visit BOOLEAN;
BEGIN
  -- Verificar se houve uma visita do mesmo utilizador ao mesmo perfil nos últimos 5 minutos
  -- Se o visitante for anónimo (NULL), contamos sempre (ou poderíamos usar IP, mas simplificamos para visitor_id)
  IF visitor_user_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.profile_visits 
      WHERE visited_id = visited_user_id 
        AND visitor_id = visitor_user_id
        AND timestamp > (now() - interval '5 minutes')
    ) INTO has_recent_visit;
  ELSE
    has_recent_visit := FALSE; -- Para anónimos, registamos sempre (ou podes ajustar esta regra)
  END IF;

  -- Se NÃO houve visita recente, registar e incrementar
  IF NOT has_recent_visit THEN
    -- 1. Inserir log
    INSERT INTO public.profile_visits (visited_id, visitor_id) 
    VALUES (visited_user_id, visitor_user_id);

    -- 2. Incrementar contadores do profissional
    UPDATE public.professionals 
    SET total_views = total_views + 1,
        daily_views = daily_views + 1,
        monthly_views = monthly_views + 1,
        yearly_views = yearly_views + 1
    WHERE id = visited_user_id;

    -- 3. Incrementar estatísticas globais
    UPDATE public.site_stats 
    SET daily_visits = daily_visits + 1,
        monthly_visits = monthly_visits + 1,
        yearly_visits = yearly_visits + 1,
        updated_at = now()
    WHERE id = 'global';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Habilitar RLS para as novas tabelas
ALTER TABLE public.profile_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_stats ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Leitura de visitas para admin" ON public.profile_visits FOR SELECT USING (auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'));
CREATE POLICY "Leitura de stats globais para admin" ON public.site_stats FOR SELECT USING (auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'));
