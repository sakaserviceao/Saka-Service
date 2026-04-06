-- 1. Whitelisting de perfis legados
-- Define todos os profissionais existentes como 'active' no pagamento e 'ativo' na verificação
UPDATE professionals 
SET 
  subscription_status = 'active',
  verification_status = 'ativo'
WHERE created_at < NOW();

-- 2. Configurações de Preços Iniciais
INSERT INTO site_settings (key, value) 
VALUES 
  ('price_monthly', '2500'),
  ('price_quarterly', '6500')
ON CONFLICT (key) DO NOTHING;
