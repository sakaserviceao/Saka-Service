-- Script para implementar o sistema de verificação de profissionais

-- 1. Criar o tipo enum para o status de verificação
DO $$ BEGIN
    CREATE TYPE verification_status AS ENUM ('pending_upload', 'pending_review', 'verified', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Adicionar colunas de verificação na tabela 'professionals'
ALTER TABLE public.professionals 
ADD COLUMN IF NOT EXISTS verification_status verification_status DEFAULT 'pending_upload',
ADD COLUMN IF NOT EXISTS id_card_front_url TEXT,
ADD COLUMN IF NOT EXISTS id_card_back_url TEXT,
ADD COLUMN IF NOT EXISTS certificate_url TEXT,
ADD COLUMN IF NOT EXISTS id_number TEXT,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;

-- 3. Criar bucket para documentos (Privado)
-- Nota: A criação de buckets via SQL requer permissões de admin no schema 'storage'
INSERT INTO storage.buckets (id, name, public)
VALUES ('professional-documents', 'professional-documents', false)
ON CONFLICT (id) DO NOTHING;

-- 4. Políticas de Segurança (RLS) para o bucket de documentos
-- Apenas o próprio profissional e admins podem ver os documentos
CREATE POLICY "Profissionais podem ler seus próprios documentos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'professional-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Profissionais podem fazer upload de seus documentos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'professional-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 5. Atualizar a visualização pública (opcional, mas recomendado)
-- Se houver uma view, ela deve ser atualizada para filtrar apenas verificados.
-- Caso contrário, as queries no frontend devem incluir .eq('verification_status', 'verified')
