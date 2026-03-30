-- ============================================================
-- SAKA SERVICE: SEED DE DADOS COMPLETOS
-- Este script popula todas as categorias com pelo menos um profissional.
-- Total: +12 Profissionais com Portfólios e Avaliações.
-- ============================================================

-- 1. Limpar perfis de teste anteriores para evitar duplicados (Opcional)
-- DELETE FROM public.reviews;
-- DELETE FROM public.portfolios;
-- DELETE FROM public.professionals WHERE id LIKE 'test-%';

-- 2. Inserir Profissionais de Exemplo para todas as categorias
INSERT INTO public.professionals 
(id, name, title, description, category, location, rating, review_count, avatar, featured, verification_status, verified_at, email, phone, whatsapp) 
VALUES
-- Tecnologia (Já existe João Tech, vamos adicionar mais um)
('test-tech-2', 'Bento Digital', 'Especialista em Redes e Segurança', 'Montagem de servidores e segurança de redes empresariais.', 'technology', 'Luanda, Angola', 4.8, 5, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop', false, 'verified', NOW(), 'bento@saka.com', '+244 923111222', '244923111222'),

-- Design (Já existe Maria Criativa)
('test-design-2', 'Mauro UX', 'Especialista em Apps Mobile', 'Design focado na experiência do utilizador para iOS e Android.', 'design', 'Benguela, Angola', 4.9, 3, 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop', false, 'verified', NOW(), 'mauro@saka.com', '+244 912333444', '244912333444'),

-- Marketing (Pedro Ads)
('test-mkt-2', 'Sara Content', 'Gestora de Redes Sociais', 'Criação de conteúdo estratégico para Instagram e LinkedIn.', 'marketing', 'Luanda, Angola', 4.7, 18, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop', true, 'verified', NOW(), 'sara@saka.com', '+244 945000999', '244945000999'),

-- Construção (António Mestre)
('test-const-2', 'Gabriel Pinturas', 'Pintura Residencial e Decorativa', 'Aplicação de estuque, texturas e pinturas de alta qualidade.', 'construction', 'Cabinda, Angola', 4.6, 9, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop', false, 'verified', NOW(), 'gabriel@saka.com', '+244 922111000', '244922111000'),

-- Educação
('test-edu-1', 'Prof. Wilson', 'Explicador de Química e Biologia', 'Preparação intensiva para exames e apoio escolar.', 'education', 'Lubango, Angola', 4.9, 12, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop', true, 'verified', NOW(), 'wilson@saka.com', '+244 955333111', '244955333111'),

-- Saúde
('test-health-1', 'Dr. Marcio', 'Nutricionista Clínico', 'Planos alimentares personalizados para perda de peso e saúde.', 'health', 'Luanda, Angola', 4.8, 7, 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop', false, 'verified', NOW(), 'marcio@saka.com', '+244 923999888', '244923999888'),

-- Fotografia
('test-photo-1', 'Lídia Visuals', 'Fotógrafa de Moda e Retrato', 'Sessões fotográficas profissionais em estúdio ou exterior.', 'photography', 'Namibe, Angola', 4.9, 15, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop', true, 'verified', NOW(), 'lidia@saka.com', '+244 921000123', '244921000123'),

-- Beleza
('test-beauty-1', 'Sónia Nails', 'Esteticista de Unhas e Cílios', 'Manicure, pedicure e extensão de pestanas profissional.', 'beauty', 'Luanda, Angola', 4.7, 25, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop', false, 'verified', NOW(), 'sonia@saka.com', '+244 933222111', '244933222111'),

-- Consultoria
('test-consult-1', 'Empresa Forte', 'Consultoria Financeira Familiar', 'Ajudamos a organizar as suas finanças e investimentos.', 'consulting', 'Luanda, Angola', 4.8, 10, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop', true, 'verified', NOW(), 'forte@saka.com', '+244 927111333', '244927111333'),

-- Outros Serviços
('test-other-1', 'Mário Entregas', 'Estafeta e Pequenas Mudanças', 'Entregas rápidas e transporte de mercadorias leves.', 'other', 'Luanda, Angola', 4.5, 50, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop', false, 'verified', NOW(), 'mario@saka.com', '+244 929444555', '244929444555')
ON CONFLICT (id) DO NOTHING;

-- 3. Inserir Portfólios para os Novos Perfis
INSERT INTO public.portfolios (professional_id, image, title, description) VALUES
('test-tech-2', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop', 'Data Center Luanda', 'Instalação completa de bastidores e fibra.'),
('test-design-2', 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&h=400&fit=crop', 'App de Entregas', 'Interface moderna para app local.'),
('test-mkt-2', 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=400&fit=crop', 'Campanha Verão', 'Gestão de anúncios para marca de sumos.'),
('test-const-2', 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop', 'Pintura Vivenda', 'Trabalho de restauro completo de fachadas.'),
('test-photo-1', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop', 'Fashion Week', 'Cobertura completa da semana de moda.');

-- 4. Inserir Avaliações de Exemplo
INSERT INTO public.reviews (professional_id, author, rating, comment, date) VALUES
('test-tech-2', 'Carlos', 5, 'Trabalho de rede impecável.', '2024-12-28'),
('test-edu-1', 'Marta', 5, 'O meu filho melhorou muito as notas com o Prof. Wilson.', '2024-12-25'),
('test-other-1', 'João G.', 4, 'Muito rápido e cuidadoso com a carga.', '2024-12-20'),
('test-beauty-1', 'Ana L.', 5, 'Melhor manicure que já encontrei em Luanda!', '2024-12-15');
