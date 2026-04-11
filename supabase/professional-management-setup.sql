-- ==============================================================
-- SETUP GESTÃO DE PROFISSIONAIS E LOGS DE EXPORTAÇÃO
-- ==============================================================

-- 1. Criar Tabela de Logs de Exportação
CREATE TABLE IF NOT EXISTS public.export_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    admin_email TEXT NOT NULL,
    format TEXT NOT NULL, -- 'CSV' ou 'Excel'
    row_count INTEGER DEFAULT 0,
    filters_used JSONB,
    timestamp TIMESTAMPTZ DEFAULT now()
);

-- 2. Habilitar RLS
ALTER TABLE public.export_logs ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de Segurança (Apenas Admins podem ver e criar logs)
DROP POLICY IF EXISTS "Admins podem inserir logs de exportação" ON public.export_logs;
DROP POLICY IF EXISTS "Admins podem ver logs de exportação" ON public.export_logs;

CREATE POLICY "Admins podem inserir logs de exportação" 
ON public.export_logs FOR INSERT 
TO authenticated 
WITH CHECK (public.is_authorized_admin_or_manager());

CREATE POLICY "Admins podem ver logs de exportação" 
ON public.export_logs FOR SELECT 
TO authenticated 
USING (public.is_authorized_admin_or_manager());

-- Nota: A função public.is_authorized_admin_or_manager() já está definida no esquema global do projeto.
