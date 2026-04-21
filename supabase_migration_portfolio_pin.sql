-- Adicionar coluna is_pinned para destacar trabalhos no portfólio
ALTER TABLE portfolios ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN portfolios.is_pinned IS 'Indica se o trabalho deve ser exibido na secção "Grandes Serviços" (Limite de 3 por profissional).';
