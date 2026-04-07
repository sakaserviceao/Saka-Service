-- Emergency SQL Fix for Saka Service Visibility (v3 - With User Data)
-- This script corrects the database state and inserts verified professionals.

-- 1. ADICIONAR 'ativo' AO ENUM (Caso exista)
DO $$ 
BEGIN 
    ALTER TYPE verification_status ADD VALUE 'ativo'; 
EXCEPTION 
    WHEN duplicate_object THEN null; 
    WHEN undefined_object THEN null; 
END $$;

-- 2. Garantir que as Categorias estão corretas (IDs em inglês conforme o código frontend)
INSERT INTO public.categories (id, name, icon, color)
VALUES 
  ('technology', 'Tecnologia', 'Laptop', '168 60% 38%'),
  ('design', 'Design', 'Palette', '280 65% 55%'),
  ('marketing', 'Marketing', 'TrendingUp', '12 80% 60%'),
  ('construction', 'Construção', 'Hammer', '35 85% 50%'),
  ('education', 'Educação', 'GraduationCap', '210 70% 50%'),
  ('health', 'Saúde e Bem-estar', 'Activity', '150 60% 45%'),
  ('photography', 'Fotografia', 'Camera', '0 0% 35%'),
  ('beauty', 'Beleza', 'Sparkles', '330 65% 55%'),
  ('consulting', 'Consultoria', 'Briefcase', '220 50% 45%'),
  ('other', 'Outros Serviços', 'Zap', '50 80% 50%')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon;

-- 3. Inserir os Profissionais que você forneceu (Garantindo status Verificado e Ativo)
INSERT INTO public.professionals 
(id, name, title, description, category, location, rating, review_count, avatar, featured, verification_status, subscription_status)
VALUES 
('1', 'João Silva', 'Desenvolvedor Full Stack', 'Especialista em React, Node.js e design de sistemas escaláveis.', 'technology', 'São Paulo, SP', 4.9, 124, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face', true, 'verified', 'active'),
('2', 'Mariana Costa', 'Designer Gráfico', 'Criação de identidades visuais impactantes e design original.', 'design', 'Rio de Janeiro, RJ', 4.8, 38, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face', true, 'verified', 'active'),
('3', 'Ricardo Mendes', 'Estrategista de Marketing', 'Foco em crescimento orgânico e campanhas de alta conversão.', 'marketing', 'Belo Horizonte, MG', 4.7, 56, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face', false, 'verified', 'active'),
('4', 'Ana Oliveira', 'Engenheira Civil', 'Gestão de obras residenciais e comerciais com foco em sustentabilidade.', 'construction', 'Curitiba, PR', 5.0, 42, 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face', true, 'verified', 'active'),
('5', 'Beatriz Santos', 'Professora de Inglês', 'Aulas personalizadas para business e conversação fluente.', 'education', 'Florianópolis, SC', 4.9, 89, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face', false, 'verified', 'active')
ON CONFLICT (id) DO UPDATE SET 
  verification_status = 'verified',
  subscription_status = 'active',
  featured = EXCLUDED.featured,
  category = EXCLUDED.category;

-- 4. Garantir RLS aberto para leitura pública
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.professionals;
CREATE POLICY "Public profiles are viewable by everyone." ON public.professionals FOR SELECT USING (true);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public categories are viewable by everyone." ON public.categories;
CREATE POLICY "Public categories are viewable by everyone." ON public.categories FOR SELECT USING (true);
