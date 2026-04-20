-- Scripts para adicionar links aos banners de categoria
-- 1. Adicionar coluna à tabela
ALTER TABLE categories ADD COLUMN IF NOT EXISTS banner_link TEXT;

-- 2. Garantir que as permissões (RLS) permitem a atualização se necessário
-- (Geralmente as permissões existentes para 'update' já cobrem novas colunas)
