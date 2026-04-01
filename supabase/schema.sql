-- Saka Service: Esquema de Base de Dados (Full Schema with Meta Settings)
-- Remover as tabelas caso já existam para podermos recriar do zero
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.portfolios CASCADE;
DROP TABLE IF EXISTS public.profile_visits CASCADE;
DROP TABLE IF EXISTS public.site_stats CASCADE;
DROP TABLE IF EXISTS public.professionals CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.admins CASCADE;
DROP TABLE IF EXISTS public.site_settings CASCADE;

-- 1. Criar tabela de configurações do site
CREATE TABLE public.site_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Criar tabela de categorias
CREATE TABLE public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT,
    count INTEGER DEFAULT 0,
    color TEXT,
    banner_url TEXT -- Novo campo para banners de categoria
);

-- 3. Criar tabela de profissionais
CREATE TABLE public.professionals (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT REFERENCES public.categories(id),
    location TEXT,
    rating NUMERIC(3, 1) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    avatar TEXT,
    featured BOOLEAN DEFAULT false,
    phone TEXT,
    email TEXT,
    whatsapp TEXT,
    linkedin_url TEXT,
    verification_status TEXT DEFAULT 'ativo',
    total_views INTEGER DEFAULT 0,
    daily_views INTEGER DEFAULT 0,
    monthly_views INTEGER DEFAULT 0,
    yearly_views INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    verified_at TIMESTAMPTZ,
    id_card_front_url TEXT,
    id_card_back_url TEXT,
    certificate_url TEXT,
    id_number TEXT
);

-- 4. Criar tabela de portfólios
CREATE TABLE public.portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id TEXT REFERENCES public.professionals(id) ON DELETE CASCADE,
    image TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT
);

-- 5. Criar tabela de avaliações (reviews)
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id TEXT REFERENCES public.professionals(id) ON DELETE CASCADE,
    author TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    date DATE DEFAULT CURRENT_DATE
);

-- 6. Criar tabela de Logs de Visitas
CREATE TABLE public.profile_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visited_id TEXT REFERENCES public.professionals(id) ON DELETE CASCADE,
  visitor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- 7. Criar tabela de Estatísticas do Site (Dashboard Analytics)
CREATE TABLE public.site_stats (
  id TEXT PRIMARY KEY DEFAULT 'global',
  daily_visits INTEGER DEFAULT 0,
  monthly_visits INTEGER DEFAULT 0,
  yearly_visits INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Criar tabela de Administradores
CREATE TABLE public.admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    added_by TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Políticas de Leitura Pública
CREATE POLICY "Public profiles are viewable by everyone." ON public.professionals FOR SELECT USING (true);
CREATE POLICY "Public categories are viewable by everyone." ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public portfolios are viewable by everyone." ON public.portfolios FOR SELECT USING (true);
CREATE POLICY "Public reviews are viewable by everyone." ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Public stats are viewable by everyone." ON public.site_stats FOR SELECT USING (true);
CREATE POLICY "Public settings are viewable by everyone." ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Public admins are viewable by everyone." ON public.admins FOR SELECT USING (true);

-- Dados Iniciais (Categorias)
INSERT INTO public.categories (id, name, icon, count, color) VALUES
('technology', 'Tecnologia e IT', '💻', 124, '168 60% 38%'),
('design', 'Design e Criatividade', '🎨', 89, '280 65% 55%'),
('marketing', 'Marketing Digital', '📈', 76, '12 80% 60%'),
('construction', 'Artes e Construção', '🏗️', 52, '35 85% 50%'),
('education', 'Educação e Explicações', '📚', 67, '210 70% 50%'),
('health', 'Saúde e Bem-estar', '🧘', 93, '150 60% 45%'),
('photography', 'Fotografia e Vídeo', '📷', 41, '0 0% 35%'),
('beauty', 'Estética e Beleza', '💅', 58, '330 65% 55%'),
('consulting', 'Consultoria e Business', '💼', 45, '220 50% 45%'),
('other', 'Outros Serviços', '⚡', 34, '50 80% 50%');

-- Configurações Iniciais (Métricas e Banners)
INSERT INTO public.site_settings (key, value) VALUES
('stats_active_pros', '2,500+'),
('stats_verified_reviews', '15,000+'),
('stats_completed_projects', '8,200+'),
('banner_topo_url', ''),
('banner_pre_cta_url', '')
ON CONFLICT (key) DO NOTHING;

-- Profissionais de Teste
INSERT INTO public.professionals (id, name, title, description, category, location, rating, review_count, avatar, featured, verification_status) VALUES
('1', 'Ana Silva', 'Full-Stack Developer', 'Especialista em React e Node.js.', 'technology', 'Luanda, AO', 4.9, 127, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face', true, 'ativo'),
('2', 'Rafael Costa', 'UI/UX Designer', 'Designer focado em experiências modernas.', 'design', 'Talatona, AO', 4.8, 89, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face', true, 'ativo');

-- Estatísticas Iniciais
INSERT INTO public.site_stats (id) VALUES ('global') ON CONFLICT DO NOTHING;

-- Administradores
INSERT INTO public.admins (email, added_by) VALUES 
('franciscobeneditomucamba@gmail.com', 'system'),
('sakaservice.ao@gmail.com', 'system')
ON CONFLICT (email) DO NOTHING;
