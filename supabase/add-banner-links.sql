-- Adicionar configurações de links para os banners da Homepage
INSERT INTO site_settings (key, value)
VALUES 
  ('banner_topo_link', 'https://saka-service.com/search'),
  ('banner_pre_cta_link', 'https://saka-service.com/become-pro')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Para verificar se foram inseridos:
-- SELECT * FROM site_settings WHERE key LIKE 'banner_%_link';
