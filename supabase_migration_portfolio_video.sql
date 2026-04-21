-- Adicionar coluna video_url para suportar vídeos no portfólio
ALTER TABLE portfolios ADD COLUMN IF NOT EXISTS video_url TEXT;

COMMENT ON COLUMN portfolios.video_url IS 'URL do vídeo de portfólio armazenado no Supabase Storage (Max 10MB).';
