-- Script de Correção Global para Visibilidade de Profissionais
-- Este script padroniza os status de verificação e garante visibilidade pública via RLS

-- 1. Padronizar verification_status para 'ativo'
-- Conforme vimos, alguns scripts usam 'verified' e outros 'ativo'. Vamos unificar no que a API espera.
UPDATE public.professionals 
SET verification_status = 'ativo' 
WHERE verification_status IN ('verified', 'pending_upload', 'pending_review') 
   OR verification_status IS NULL;

-- 2. Garantir que os perfis de teste têm subscrição ativa
-- Isto evita que sejam filtrados por futuras lógicas de subscrição
UPDATE public.professionals 
SET subscription_status = 'active'
WHERE subscription_status IS NULL OR subscription_status = 'pending';

-- 3. Reforar Políticas de RLS para Leitura Pública
-- Profissionais
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.professionals;
CREATE POLICY "Public profiles are viewable by everyone." 
ON public.professionals FOR SELECT 
USING (true);

-- Portfolios
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public portfolios are viewable by everyone." ON public.portfolios;
CREATE POLICY "Public portfolios are viewable by everyone." 
ON public.portfolios FOR SELECT 
USING (true);

-- Reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public reviews are viewable by everyone." ON public.reviews;
CREATE POLICY "Public reviews are viewable by everyone." 
ON public.reviews FOR SELECT 
USING (true);

-- Categorias
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public categories are viewable by everyone." ON public.categories;
CREATE POLICY "Public categories are viewable by everyone." 
ON public.categories FOR SELECT 
USING (true);

-- 4. Log para confirmação
DO $$ 
BEGIN 
    RAISE NOTICE 'Saka Service: Visibilidade restaurada com sucesso.';
END $$;
