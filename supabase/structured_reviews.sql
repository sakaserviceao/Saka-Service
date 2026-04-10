-- Saka Service: Sistema de Avaliação Estruturada e Gestão de Contratações

-- 1. Criar tabela de contratações (service_hires)
-- Esta tabela regista quando um utilizador clica para "contratar" um profissional,
-- funcionando como prova de que o serviço foi solicitado/prestado.
CREATE TABLE IF NOT EXISTS public.service_hires (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id TEXT REFERENCES public.professionals(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS para contratações
ALTER TABLE public.service_hires ENABLE ROW LEVEL SECURITY;

-- Políticas para service_hires
CREATE POLICY "Utilizadores podem ver as suas próprias contratações" ON public.service_hires
    FOR SELECT USING (auth.uid() = user_id OR professional_id = auth.uid()::text);

CREATE POLICY "Utilizadores podem registar contratações" ON public.service_hires
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 2. Atualizar a tabela de reviews com novos campos estruturados
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS punctuality_rating INTEGER CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
ADD COLUMN IF NOT EXISTS presentation_rating INTEGER CHECK (presentation_rating >= 1 AND presentation_rating <= 5),
ADD COLUMN IF NOT EXISTS technical_rating INTEGER CHECK (technical_rating >= 1 AND technical_rating <= 5),
ADD COLUMN IF NOT EXISTS would_recommend BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS hire_id UUID REFERENCES public.service_hires(id) ON DELETE SET NULL;

-- 3. Atualizar a tabela de profissionais com campos de cache para performance (opcional, mas recomendado)
-- Vamos manter o cálculo dinâmico via API por agora para evitar triggers complexos,
-- mas adicionamos os campos caso queiramos migrar para cache no futuro.
ALTER TABLE public.professionals 
ADD COLUMN IF NOT EXISTS recommendation_percentage INTEGER DEFAULT 100;

-- 4. Função para denúncia de avaliações (Security/Reporting)
CREATE TABLE IF NOT EXISTS public.review_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID REFERENCES public.reviews(id) ON DELETE CASCADE,
    reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.review_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilizadores podem denunciar reviews" ON public.review_reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins podem ver denúncias" ON public.review_reports
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.admins WHERE email = auth.email()));
