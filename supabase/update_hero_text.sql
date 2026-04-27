-- ==============================================================================
-- ATUALIZAÇÃO DO TEXTO DA HERO SECTION NO BANCO DE DADOS
-- ==============================================================================

-- 1. Inserir ou atualizar os textos da Hero Section para garantir que refletem as novas mudanças
INSERT INTO public.site_settings (key, value) VALUES 
('hero_badge_text', 'Qualidade e Confiança em Angola'),
('hero_title_text', 'Encontre profissionais confiáveis'),
('hero_title_highlight', '— rápido e sem complicação'),
('hero_subtitle_text', 'Do eletricista ao designer, ligamos você a quem resolve, de forma rápida, segura e perto de si.')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
