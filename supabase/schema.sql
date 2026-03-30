-- Remover as tabelas caso já existam para podermos recriar do zero
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.portfolios CASCADE;
DROP TABLE IF EXISTS public.professionals CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;

-- Criar tabela de categorias
CREATE TABLE public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT,
    count INTEGER DEFAULT 0,
    color TEXT
);

-- Criar tabela de profissionais
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
    whatsapp TEXT
);

-- Criar tabela de portfólios associados aos profissionais
CREATE TABLE public.portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id TEXT REFERENCES public.professionals(id) ON DELETE CASCADE,
    image TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT
);

-- Criar tabela de avaliações (reviews) associadas aos profissionais
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id TEXT REFERENCES public.professionals(id) ON DELETE CASCADE,
    author TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    date DATE DEFAULT CURRENT_DATE
);

-- Habilitar RLS (Row Level Security) para segurança
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Criar políticas de leitura pública (qualquer um pode ler os dados)
CREATE POLICY "Public profiles are viewable by everyone." ON public.professionals FOR SELECT USING (true);
CREATE POLICY "Public categories are viewable by everyone." ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public portfolios are viewable by everyone." ON public.portfolios FOR SELECT USING (true);
CREATE POLICY "Public reviews are viewable by everyone." ON public.reviews FOR SELECT USING (true);


-- -------------------------------------------------------------
-- Inserir dados iniciais (Mock Data) para testar
-- -------------------------------------------------------------

INSERT INTO public.categories (id, name, icon, count, color) VALUES
('technology', 'Technology', '💻', 124, '168 60% 38%'),
('design', 'Design', '🎨', 89, '280 65% 55%'),
('marketing', 'Marketing', '📈', 76, '12 80% 60%'),
('construction', 'Construction', '🏗️', 52, '35 85% 50%'),
('education', 'Education', '📚', 67, '210 70% 50%'),
('health', 'Health & Wellness', '🧘', 93, '150 60% 45%'),
('photography', 'Photography', '📷', 41, '0 0% 35%'),
('beauty', 'Beauty', '💅', 58, '330 65% 55%'),
('consulting', 'Consulting', '💼', 45, '220 50% 45%'),
('other', 'Other Services', '⚡', 34, '50 80% 50%');

INSERT INTO public.professionals (id, name, title, description, category, location, rating, review_count, avatar, featured, phone, email, whatsapp) VALUES
('1', 'Ana Silva', 'Full-Stack Developer', 'Experienced developer specializing in React, Node.js, and cloud architectures. I help businesses build scalable web applications with modern technologies.', 'technology', 'São Paulo, SP', 4.9, 127, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face', true, '+55 11 99999-0001', 'ana@example.com', '5511999990001'),
('2', 'Rafael Costa', 'UI/UX Designer', 'Creative designer with 8+ years of experience crafting beautiful, user-centered digital experiences for startups and enterprises.', 'design', 'Rio de Janeiro, RJ', 4.8, 89, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face', true, '+55 21 99999-0002', 'rafael@example.com', '5521999990002'),
('3', 'Camila Oliveira', 'Digital Marketing Strategist', 'Data-driven marketer helping businesses grow through SEO, paid ads, and content marketing strategies that deliver measurable results.', 'marketing', 'Belo Horizonte, MG', 4.7, 64, 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face', true, '+55 31 99999-0003', 'camila@example.com', '5531999990003'),
('4', 'Lucas Santos', 'Civil Engineer & Architect', 'Licensed engineer specializing in residential and commercial construction projects. From planning to execution with excellence.', 'construction', 'Curitiba, PR', 4.9, 42, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face', false, '+55 41 99999-0004', 'lucas@example.com', '5541999990004'),
('5', 'Beatriz Lima', 'Online Tutor & Course Creator', 'Passionate educator creating engaging online courses in mathematics and physics. Making complex subjects simple and fun.', 'education', 'Brasília, DF', 4.8, 156, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face', true, '+55 61 99999-0005', 'beatriz@example.com', '5561999990005'),
('6', 'Diego Ferreira', 'Personal Trainer & Nutritionist', 'Certified fitness professional helping clients achieve their health goals through personalized training and nutrition plans.', 'health', 'Florianópolis, SC', 4.6, 78, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face', false, '+55 48 99999-0006', 'diego@example.com', '5548999990006'),
('7', 'Isabela Mendes', 'Professional Photographer', 'Award-winning photographer specializing in weddings, events, and corporate photography. Capturing your most important moments.', 'photography', 'Porto Alegre, RS', 4.9, 203, 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face', true, '+55 51 99999-0007', 'isabela@example.com', '5551999990007'),
('8', 'Mariana Rocha', 'Makeup Artist & Beauty Consultant', 'Professional makeup artist for weddings, photoshoots, and special occasions. Also offering beauty consulting and workshops.', 'beauty', 'Salvador, BA', 4.7, 91, 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face', false, '+55 71 99999-0008', 'mariana@example.com', '5571999990008');


INSERT INTO public.portfolios (professional_id, image, title, description) VALUES
('1', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop', 'E-commerce Platform', 'Built a full-stack e-commerce solution'),
('1', 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=400&fit=crop', 'SaaS Dashboard', 'Real-time analytics dashboard'),
('2', 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop', 'Mobile App Design', 'Complete redesign of a fintech app'),
('2', 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&h=400&fit=crop', 'Brand Identity', 'Visual identity for tech startup'),
('3', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop', 'SEO Campaign', '300% organic traffic increase'),
('4', 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&h=400&fit=crop', 'Modern Residence', 'Designed and built a contemporary home'),
('5', 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop', 'Online Course', 'Calculus made easy - 10k students'),
('6', 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=400&fit=crop', 'Transformation Program', '12-week body transformation'),
('7', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop', 'Wedding Portfolio', 'Captured 200+ weddings'),
('7', 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&h=400&fit=crop', 'Corporate Events', 'Professional event photography'),
('8', 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop', 'Bridal Makeup', 'Natural and glamorous bridal looks');

INSERT INTO public.reviews (professional_id, author, rating, comment, date) VALUES
('1', 'Carlos M.', 5, 'Ana delivered an incredible project on time. Highly recommended!', '2024-12-15'),
('1', 'Juliana R.', 5, 'Professional, communicative, and talented. Will hire again.', '2024-11-20'),
('2', 'Maria S.', 5, 'Rafael has an amazing eye for design. Transformed our product!', '2024-12-10'),
('3', 'Pedro L.', 5, 'Our leads tripled in 3 months. Incredible work!', '2024-11-30'),
('4', 'Fernanda A.', 5, 'Lucas exceeded our expectations. Beautiful work!', '2024-12-01'),
('5', 'Gabriel T.', 5, 'Best math teacher I''ve ever had. Clear and patient!', '2024-12-12'),
('6', 'Amanda B.', 4, 'Great results! Diego knows what he''s doing.', '2024-11-25'),
('7', 'Ricardo P.', 5, 'Isabela captured our wedding perfectly. Every photo is a masterpiece!', '2024-12-08'),
('8', 'Patricia N.', 5, 'Made me feel like a queen on my wedding day!', '2024-12-05');
