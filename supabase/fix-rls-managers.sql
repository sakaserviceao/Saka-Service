-- ==============================================================
-- FIX RLS FOR MANAGERS (PERMITIR ELIMINAÇÃO E GESTÃO POR GESTORES)
-- ==============================================================

-- 1. Criar Função Auxiliar para verificar se o usuário é Admin ou Gestor
-- Esta função unifica a lógica de permissão para ser usada em várias políticas
CREATE OR REPLACE FUNCTION public.is_authorized_admin_or_manager() 
RETURNS BOOLEAN AS $$
DECLARE
    user_email TEXT;
    manager_emails_list TEXT;
BEGIN
    -- Obter email do JWT
    user_email := auth.jwt() ->> 'email';
    
    -- 1. Verificar se é um Admin hardcoded ou na tabela admins
    IF user_email IN (
        'franciscobeneditomucamba@gmail.com', 
        'francisco.mucamba@gmail.com', 
        'sakaservice.ao@gmail.com'
    ) OR EXISTS (SELECT 1 FROM public.admins WHERE email = user_email) THEN
        RETURN TRUE;
    END IF;

    -- 2. Verificar se o e-mail está na lista de gestores operacionais (site_settings)
    SELECT value INTO manager_emails_list FROM public.site_settings WHERE key = 'manager_emails';
    
    IF manager_emails_list IS NOT NULL AND (
        manager_emails_list ILIKE '%' || user_email || '%' OR user_email = 'podosk2010@hotmail.com'
    ) THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Atualizar Políticas na tabela 'professionals'
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.professionals;
DROP POLICY IF EXISTS "Authorized can update all profiles" ON public.professionals;
DROP POLICY IF EXISTS "Authorized can delete profiles" ON public.professionals;

-- Permitir UPDATE (Alterar status, featured, banner, etc)
CREATE POLICY "Authorized can update all profiles" 
ON public.professionals FOR UPDATE 
TO authenticated 
USING (public.is_authorized_admin_or_manager())
WITH CHECK (public.is_authorized_admin_or_manager());

-- Permitir DELETE (Eliminar perfil definitivamente)
CREATE POLICY "Authorized can delete profiles" 
ON public.professionals FOR DELETE 
TO authenticated 
USING (public.is_authorized_admin_or_manager());


-- 3. Atualizar Políticas de Storage (permitir ver e gerir documentos)
DROP POLICY IF EXISTS "Admins podem ver documentos" ON storage.objects;
DROP POLICY IF EXISTS "Authorized podem gerir documentos" ON storage.objects;

CREATE POLICY "Authorized podem gerir documentos"
ON storage.objects FOR ALL
TO authenticated
USING (
    bucket_id = 'professional-documents' 
    AND public.is_authorized_admin_or_manager()
);

-- Nota: Certifique-se de que a tabela 'site_settings' e 'admins' existam e tenham RLS configurado para leitura.
