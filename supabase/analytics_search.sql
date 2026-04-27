-- ==============================================================================
-- EXTENSÃO DO SISTEMA DE ANALYTICS: VISITAS TOTAIS E LOGS DE PESQUISA
-- ==============================================================================

-- 1. Atualizar a tabela site_stats para incluir visitas totais
ALTER TABLE public.site_stats 
ADD COLUMN IF NOT EXISTS total_visits INTEGER DEFAULT 0;

-- 2. Criar a tabela de logs de pesquisa
CREATE TABLE IF NOT EXISTS public.search_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query TEXT,
    category_id TEXT,
    location_text TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS para search_logs
ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;

-- Política de leitura apenas para administradores
CREATE POLICY "Leitura de logs de pesquisa para admin" 
ON public.search_logs 
FOR SELECT 
USING (
  auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin')
);

-- Política de inserção pública (para registar as buscas dos utilizadores)
CREATE POLICY "Inserção pública de logs de pesquisa" 
ON public.search_logs 
FOR INSERT 
WITH CHECK (true);

-- 3. Função RPC para registar uma visita à plataforma (não apenas a um perfil)
CREATE OR REPLACE FUNCTION public.record_site_visit()
RETURNS void AS $$
BEGIN
    UPDATE public.site_stats 
    SET daily_visits = daily_visits + 1,
        monthly_visits = monthly_visits + 1,
        yearly_visits = yearly_visits + 1,
        total_visits = total_visits + 1,
        updated_at = now()
    WHERE id = 'global';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Função RPC para registar uma pesquisa
CREATE OR REPLACE FUNCTION public.record_search(query_text TEXT, cat_id TEXT DEFAULT NULL, loc_text TEXT DEFAULT NULL)
RETURNS void AS $$
BEGIN
    INSERT INTO public.search_logs (query, category_id, location_text)
    VALUES (query_text, cat_id, loc_text);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Atualizar a função existente record_profile_visit para também incrementar total_visits
-- (Esta função já existe em analytics.sql, estamos a garantir que o total_visits também é incrementado)
CREATE OR REPLACE FUNCTION public.record_profile_visit(visited_user_id TEXT, visitor_user_id UUID DEFAULT NULL)
RETURNS void AS $$
DECLARE
  has_recent_visit BOOLEAN;
BEGIN
  IF visitor_user_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.profile_visits 
      WHERE visited_id = visited_user_id 
        AND visitor_id = visitor_user_id
        AND timestamp > (now() - interval '5 minutes')
    ) INTO has_recent_visit;
  ELSE
    has_recent_visit := FALSE;
  END IF;

  IF NOT has_recent_visit THEN
    INSERT INTO public.profile_visits (visited_id, visitor_id) 
    VALUES (visited_user_id, visitor_user_id);

    UPDATE public.professionals 
    SET total_views = total_views + 1,
        daily_views = daily_views + 1,
        monthly_views = monthly_views + 1,
        yearly_views = yearly_views + 1
    WHERE id = visited_user_id;

    UPDATE public.site_stats 
    SET daily_visits = daily_visits + 1,
        monthly_visits = monthly_visits + 1,
        yearly_visits = yearly_visits + 1,
        total_visits = COALESCE(total_visits, 0) + 1, -- Incrementa o total aqui também
        updated_at = now()
    WHERE id = 'global';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
