-- Adiciona o campo linkedin_url à tabela de profissionais
ALTER TABLE public.professionals 
ADD COLUMN IF NOT EXISTS linkedin_url TEXT;

-- Comentário para documentação do campo
COMMENT ON COLUMN public.professionals.linkedin_url IS 'URL do perfil do LinkedIn do profissional';

-- Atualiza o cache do schema do PostgREST
NOTIFY pgrst, 'reload schema';
