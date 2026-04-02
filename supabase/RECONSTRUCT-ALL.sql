-- ============================================================
-- SAKA SERVICE: RECONSTRUÇÃO TOTAL DO BANCO DE DADOS
-- Este script recria todas as tabelas, tipos, políticas e dados.
-- Execute tudo no SQL Editor do Supabase (uma única vez).
-- ============================================================

-- 1. LIMPEZA TOTAL (Para evitar conflitos de tipos e tabelas)
-- ------------------------------------------------------------
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.portfolios CASCADE;
DROP TABLE IF EXISTS public.professionals CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.admins CASCADE;
DROP TABLE IF EXISTS public.site_stats CASCADE;
DROP TABLE IF EXISTS public.profile_visits CASCADE;
DROP TYPE IF EXISTS public.verification_status CASCADE;


-- 2. CRIAÇÃO DE TIPOS E ENUMS
-- ------------------------------------------------------------
CREATE TYPE public.verification_status AS ENUM (
    'ativo', 
    'suspenso', 
    'removido', 
    'pending_upload', 
    'pending_review', 
    'verified', 
    'rejected'
);

-- 3. CRIAÇÃO DE TABELAS
-- ------------------------------------------------------------

-- Categorias
CREATE TABLE public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT,
    count INTEGER DEFAULT 0,
    color TEXT,
    banner_url TEXT
);

-- Profissionais
CREATE TABLE public.professionals (
    id TEXT PRIMARY KEY, -- Corresponde ao auth.uid()
    name TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT REFERENCES public.categories(id),
    location TEXT,
    rating NUMERIC(3, 1) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    avatar TEXT,
    featured BOOLEAN DEFAULT false,
    
    -- Contactos
    phone TEXT,
    email TEXT,
    whatsapp TEXT,
    
    -- Verificação de Documentos (Campos que causavam erro)
    verification_status public.verification_status DEFAULT 'ativo',
    id_card_front_url TEXT,
    id_card_back_url TEXT,
    certificate_url TEXT,
    id_number TEXT,
    verification_submitted_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Analytics (Analytics Counters)
    daily_views INTEGER DEFAULT 0,
    monthly_views INTEGER DEFAULT 0,
    yearly_views INTEGER DEFAULT 0,
    total_views INTEGER DEFAULT 0,
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Portfólios
CREATE TABLE public.portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id TEXT REFERENCES public.professionals(id) ON DELETE CASCADE,
    image TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT
);

-- Avaliações (Reviews)
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id TEXT REFERENCES public.professionals(id) ON DELETE CASCADE,
    author TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    date DATE DEFAULT CURRENT_DATE
);

-- Configurações Globais do Site
CREATE TABLE public.site_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Administradores
CREATE TABLE public.admins (
    email TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    added_by TEXT
);

-- Estatísticas Globais do Site
CREATE TABLE public.site_stats (
  id TEXT PRIMARY KEY DEFAULT 'global',
  daily_visits INTEGER DEFAULT 0,
  monthly_visits INTEGER DEFAULT 0,
  yearly_visits INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Logs de Visitas de Perfis
CREATE TABLE public.profile_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visited_id TEXT REFERENCES public.professionals(id) ON DELETE CASCADE,
  visitor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Função para verificar se o utilizador é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admins 
        WHERE email = auth.jwt() ->> 'email'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. SEGURANÇA (RLS - Row Level Security)
-- ------------------------------------------------------------

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_visits ENABLE ROW LEVEL SECURITY;

-- Admins: Apenas admins podem ver e gerir a lista de admins
CREATE POLICY "Admins gerem outros admins" ON public.admins FOR ALL TO authenticated 
USING (public.is_admin());

-- Configurações: Público pode ler
CREATE POLICY "Leitura pública de configurações" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admin gere configurações" ON public.site_settings FOR ALL TO authenticated 
USING (public.is_admin());

-- Políticas de Estatísticas e Visitas
CREATE POLICY "Leitura pública de stats" ON public.site_stats FOR SELECT USING (true);
CREATE POLICY "Admin gere stats" ON public.site_stats FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admin vê logs de visitas" ON public.profile_visits FOR SELECT TO authenticated USING (public.is_admin());

-- Categorias: Público pode ler
CREATE POLICY "Leitura pública de categorias" ON public.categories FOR SELECT USING (true);

-- Profissionais: 
-- 1. Qualquer pessoa pode ler (Select)
-- 2. Utilizadores logados podem inserir seu próprio perfil (Insert)
-- 3. Utilizadores logados podem atualizar seu próprio perfil (Update)
-- 4. Admin dinâmico pode gerir tudo (Update)
CREATE POLICY "Público pode ver profissionais" ON public.professionals FOR SELECT USING (true);
CREATE POLICY "Utilizadores criam seu próprio perfil" ON public.professionals FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = id);
CREATE POLICY "Utilizadores atualizam seu próprio perfil" ON public.professionals FOR UPDATE TO authenticated USING (auth.uid()::text = id) WITH CHECK (auth.uid()::text = id);
CREATE POLICY "Admin pode moderar perfis" ON public.professionals FOR UPDATE TO authenticated 
USING (public.is_admin());

-- Portfólios:
CREATE POLICY "Leitura pública de portfolios" ON public.portfolios FOR SELECT USING (true);
CREATE POLICY "Profissionais gerem seu portfolio" ON public.portfolios FOR ALL TO authenticated USING (auth.uid()::text = professional_id);

-- Avaliações:
CREATE POLICY "Leitura pública de avaliações" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Utilizadores logados podem avaliar" ON public.reviews FOR INSERT TO authenticated WITH CHECK (true);

-- 5. CONFIGURAÇÃO DE STORAGE (Buckets e Políticas)
-- ------------------------------------------------------------

-- Criar os buckets 'uploads' e 'professional-documents'
INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('professional-documents', 'professional-documents', false) ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage
CREATE POLICY "Uploads públicos leitura" ON storage.objects FOR SELECT USING (bucket_id = 'uploads');
CREATE POLICY "Uploads públicos inserção" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'uploads');
CREATE POLICY "Uploads públicos gestão" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'uploads');

CREATE POLICY "Docs privados leitura própria" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'professional-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Docs privados upload próprio" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'professional-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Admin vê documentos" ON storage.objects FOR SELECT TO authenticated USING (public.is_admin());


-- 6. DADOS INICIAIS (Mock Data em Português)
-- ------------------------------------------------------------

-- Categorias
INSERT INTO public.categories (id, name, icon, count, color) VALUES
('technology', 'Tecnologia', '💻', 124, '168 60% 38%'),
('design', 'Design', '🎨', 89, '280 65% 55%'),
('marketing', 'Marketing', '📈', 76, '12 80% 60%'),
('construction', 'Construção', '🏗️', 52, '35 85% 50%'),
('education', 'Educação', '📚', 67, '210 70% 50%'),
('health', 'Saúde e Bem-estar', '🧘', 93, '150 60% 45%'),
('photography', 'Fotografia', '📷', 41, '0 0% 35%'),
('beauty', 'Beleza', '💅', 58, '330 65% 55%'),
('consulting', 'Consultoria', '💼', 45, '220 50% 45%'),
('other', 'Outros Serviços', '⚡', 34, '50 80% 50%');

-- Profissionais de Exemplo (Sincronizados com mockData.ts)
INSERT INTO public.professionals 
(id, name, title, description, category, location, rating, review_count, avatar, featured, verification_status, verified_at, email, phone, whatsapp) 
VALUES
('test-tech', 'João Tech', 'Desenvolvedor React Full-Stack', 'Especialista em construir interfaces modernas e performantes.', 'technology', 'Luanda, Angola', 5.0, 12, 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop', true, 'verified', NOW(), 'joao@saka.com', '+244 923000111', '244923000111'),
('test-design', 'Maria Criativa', 'Designer Gráfico e de Logos', 'Criação de identidades visuais únicas para a sua marca.', 'design', 'Benguela, Angola', 4.9, 8, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop', true, 'verified', NOW(), 'maria@saka.com', '+244 912000222', '244912000222'),
('test-const', 'António Mestre', 'Mestre de Obras e Pedreiro', 'Construção e reabilitação com rigor e profissionalismo.', 'construction', 'Luanda, Angola', 5.0, 24, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop', true, 'verified', NOW(), 'antonio@saka.com', '+244 934000333', '244934000333');

-- Portfólios
INSERT INTO public.portfolios (professional_id, image, title, description) VALUES
('test-tech', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop', 'Portal do Cidadão', 'Desenvolvimento de portal governamental.'),
('test-design', 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&h=400&fit=crop', 'Branding Saka', 'Criação da identidade visual completa.'),
('test-const', 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&h=400&fit=crop', 'Vivenda V3', 'Construção de raiz de moradia familiar.');

-- Administradores Iniciais
INSERT INTO public.admins (email) VALUES
('franciscobeneditomucamba@gmail.com'),
('sakaservice.ao@gmail.com')
ON CONFLICT (email) DO NOTHING;


-- 7. FUNÇÕES E PROCEDIMENTOS (RPC)
-- ------------------------------------------------------------

-- Função record_profile_visit: Regista visitas e incrementa contadores
CREATE OR REPLACE FUNCTION public.record_profile_visit(visited_user_id TEXT, visitor_user_id UUID DEFAULT NULL)
RETURNS void AS $$
DECLARE
  has_recent_visit BOOLEAN;
BEGIN
  -- Cooldown de 5 minutos para evitar spam de visitas do mesmo utilizador
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
    -- 1. Registar Log
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


-- Configurações Iniciais

INSERT INTO public.site_settings (key, value) VALUES
('logo_url', '/logo.png'),
('brand_name', 'Sakaservice'),
('footer_description', 'O marketplace moderno que conecta profissionais e clientes. Encontre o especialista ideal para o seu próximo projeto.'),
('banner_topo_url', '/banners/banner_topo_home.png'),
('banner_pre_cta_url', '/banners/banner_pre_cta_home.png'),
('contact_email', 'contato@sakaservice.com'),
('social_instagram', 'https://instagram.com/sakaservice'),
('social_linkedin', 'https://linkedin.com/company/sakaservice'),
('social_twitter', 'https://twitter.com/sakaservice')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Iniciar estatística global se não existir
INSERT INTO public.site_stats (id) VALUES ('global') ON CONFLICT DO NOTHING;

-- FINALIZAÇÃO: Limpar a Cache do Schema
NOTIFY pgrst, 'reload schema';
