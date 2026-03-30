-- Script para inserir perfis de exemplo em cada categoria
-- Execute este script no SQL Editor do seu projeto Supabase

-- Garantir que as categorias existem (já devem existir pelo schema.sql, mas por segurança)
INSERT INTO public.categories (id, name, icon, count, color) VALUES
('consulting', 'Consultoria', '💼', 45, '220 50% 45%'),
('other', 'Outros Serviços', '⚡', 34, '50 80% 50%')
ON CONFLICT (id) DO NOTHING;

-- Inserir Profissionais de Exemplo
INSERT INTO public.professionals 
(id, name, title, description, category, location, rating, review_count, avatar, featured, verification_status, verified_at) 
VALUES
('test-tech', 'João Tech', 'Desenvolvedor React Full-Stack', 'Especialista em construir interfaces modernas e performantes.', 'technology', 'Luanda, Angola', 5.0, 12, 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop', true, 'verified', NOW()),
('test-design', 'Maria Criativa', 'Designer Gráfico e de Logos', 'Criação de identidades visuais únicas para a sua marca.', 'design', 'Benguela, Angola', 4.9, 8, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop', true, 'verified', NOW()),
('test-mkt', 'Pedro Ads', 'Gestor de Tráfego Pago', 'Maximizando o retorno do seu investimento em anúncios.', 'marketing', 'Huambo, Angola', 4.8, 15, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop', false, 'verified', NOW()),
('test-const', 'António Mestre', 'Mestre de Obras e Pedreiro', 'Construção e reabilitação com rigor e profissionalismo.', 'construction', 'Luanda, Angola', 5.0, 24, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop', true, 'verified', NOW()),
('test-edu', 'Profª. Sofia', 'Tutora de Matemática e Física', 'Apoio escolar personalizado para todos os níveis.', 'education', 'Lubango, Angola', 4.9, 30, 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop', false, 'verified', NOW()),
('test-health', 'Dra. Helena', 'Fisioterapeuta Especialista', 'Recuperação muscular e bem-estar físico geral.', 'health', 'Luanda, Angola', 4.7, 18, 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop', false, 'verified', NOW()),
('test-photo', 'Bruno Lente', 'Fotógrafo de Eventos e Casamentos', 'Capturando os momentos que duram para sempre.', 'photography', 'Namibe, Angola', 4.8, 10, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop', true, 'verified', NOW()),
('test-beauty', 'Carla Estética', 'Esteticista e Manicure', 'Cuidados de beleza de alta qualidade ao seu alcance.', 'beauty', 'Luanda, Angola', 4.6, 22, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop', false, 'verified', NOW()),
('test-consult', 'Ricardo Gestão', 'Consultor de Negócios e Estratégia', 'Ajudando a sua empresa a atingir o próximo nível.', 'consulting', 'Luanda, Angola', 4.9, 5, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop', true, 'verified', NOW()),
('test-other', 'Sílvia Limpezas', 'Serviços de Limpeza Doméstica', 'Limpeza profunda e organização da sua casa ou escritório.', 'other', 'Luanda, Angola', 4.5, 40, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop', false, 'verified', NOW());

-- Inserir alguns portfólios para os perfis de teste
INSERT INTO public.portfolios (professional_id, image, title, description) VALUES
('test-tech', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop', 'Portal do Cidadão', 'Desenvolvimento de portal governamental.'),
('test-design', 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&h=400&fit=crop', 'Branding Saka', 'Criação da identidade visual completa.'),
('test-const', 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&h=400&fit=crop', 'Vivenda V3', 'Construção de raiz de moradia familiar.');
