-- ==============================================================
-- FIX ANALYTICS: Correção de Estatísticas e Ranking
-- ==============================================================

-- 1. Garantir que a tabela site_stats está corretamente inicializada
INSERT INTO public.site_stats (id, daily_visits, monthly_visits, yearly_visits)
VALUES ('global', 0, 0, 0)
ON CONFLICT (id) DO NOTHING;

-- 2. Atualizar permissões (RLS) para refletir o sistema de admins do projeto
-- Removemos as políticas antigas que usavam metadados de 'role'
DROP POLICY IF EXISTS "Leitura de visitas para admin" ON public.profile_visits;
DROP POLICY IF EXISTS "Leitura de stats globais para admin" ON public.site_stats;
DROP POLICY IF EXISTS "Public stats are viewable by everyone." ON public.site_stats;

-- Permitir que qualquer pessoa leia as estatísticas globais (necessário para o Dashboard se não for restrito)
-- Mas para segurança total, vamos restringir a Admins e Gestores conforme o resto do projeto
CREATE POLICY "Authorized can view site stats" 
ON public.site_stats FOR SELECT 
TO authenticated 
USING (public.is_authorized_admin_or_manager());

-- Permitir leitura de logs de visitas para admins
CREATE POLICY "Authorized can view profile visits" 
ON public.profile_visits FOR SELECT 
TO authenticated 
USING (public.is_authorized_admin_or_manager());


-- 3. Melhorar a Função de Registo de Visitas (RPC)
-- Adicionamos SECURITY DEFINER para ignorar RLS durante a execução da função
CREATE OR REPLACE FUNCTION record_profile_visit(visited_user_id TEXT, visitor_user_id UUID DEFAULT NULL)
RETURNS void AS $$
DECLARE
  has_recent_visit BOOLEAN;
BEGIN
  -- 1. Verificar cooldown (5 minutos) para evitar spam de visitas do mesmo utilizador
  IF visitor_user_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.profile_visits 
      WHERE visited_id = visited_user_id 
        AND visitor_id = visitor_user_id
        AND timestamp > (now() - interval '5 minutes')
    ) INTO has_recent_visit;
  ELSE
    -- Para anónimos, podemos usar um cooldown baseado em IP (se disponível) ou simplesmente registar
    -- Por agora, registamos sempre para não perder dados de tráfego orgânico
    has_recent_visit := FALSE;
  END IF;

  IF NOT has_recent_visit THEN
    -- A. Inserir log detalhado
    INSERT INTO public.profile_visits (visited_id, visitor_id) 
    VALUES (visited_user_id, visitor_user_id);

    -- B. Incrementar contadores individuais do profissional
    UPDATE public.professionals 
    SET total_views = COALESCE(total_views, 0) + 1,
        daily_views = COALESCE(daily_views, 0) + 1,
        monthly_views = COALESCE(monthly_views, 0) + 1,
        yearly_views = COALESCE(yearly_views, 0) + 1
    WHERE id = visited_user_id;

    -- C. Incrementar estatísticas globais da plataforma
    UPDATE public.site_stats 
    SET daily_visits = COALESCE(daily_visits, 0) + 1,
        monthly_visits = COALESCE(monthly_visits, 0) + 1,
        yearly_visits = COALESCE(yearly_visits, 0) + 1,
        updated_at = now()
    WHERE id = 'global';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Garantir que as colunas existem na tabela professionals (caso o script anterior tenha falhado)
DO $$ 
BEGIN 
    ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS total_views INTEGER DEFAULT 0;
    ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS daily_views INTEGER DEFAULT 0;
    ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS monthly_views INTEGER DEFAULT 0;
    ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS yearly_views INTEGER DEFAULT 0;
EXCEPTION 
    WHEN duplicate_column THEN NULL;
END $$;
