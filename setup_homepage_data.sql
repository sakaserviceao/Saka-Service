-- 1. GARANTIR QUE AS CATEGORIAS EXISTEM
INSERT INTO categories (id, name, icon, color)
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
ON CONFLICT (id) DO NOTHING;

-- 2. HABILITAR ACESSO PÚBLICO (RLS) PARA LEITURA
-- Categorias
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir leitura pública de categorias" ON categories;
CREATE POLICY "Permitir leitura pública de categorias" ON categories 
  FOR SELECT USING (true);

-- Profissionais
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir leitura pública de profissionais" ON professionals;
CREATE POLICY "Permitir leitura pública de profissionais" ON professionals 
  FOR SELECT USING (true);

-- Portfólios (necessário para os cartões)
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir leitura pública de portfolios" ON portfolios;
CREATE POLICY "Permitir leitura pública de portfolios" ON portfolios 
  FOR SELECT USING (true);

-- Reviews (necessário para as estrelas e ratings)
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir leitura pública de reviews" ON reviews;
CREATE POLICY "Permitir leitura pública de reviews" ON reviews 
  FOR SELECT USING (true);

-- 3. AJUSTE DE VISIBILIDADE (Opcional: Garantir que todos são 'ativo' para teste)
UPDATE professionals SET verification_status = 'ativo' WHERE verification_status IS NULL;
