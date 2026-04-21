-- Migration: Add video verification support
ALTER TABLE professionals 
ADD COLUMN IF NOT EXISTS activity_video_url TEXT;

-- Comment for clarity
COMMENT ON COLUMN professionals.activity_video_url IS 'Link para o vídeo de atividade armazenado no Google Drive como alternativa ao certificado.';
