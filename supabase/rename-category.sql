-- Substituição Segura da Categoria 'Design' por 'Artes'
-- Usamos uma transação para garantir que tudo corre bem e respeitar as chaves estrangeiras.

BEGIN;

-- 1. Criar a nova categoria 'Artes' herdando as configurações da antiga (exceto nome e ícone)
-- Se já houver uma coluna banner_url ou outras, elas serão mantidas.
INSERT INTO categories (id, name, icon, color)
SELECT 'arts', 'Artes', 'Brush', color 
FROM categories 
WHERE id = 'design'
ON CONFLICT (id) DO NOTHING;

-- 2. Migrar todos os profissionais para o novo ID 'arts'
-- Fazemos isto ANTES de apagar a categoria antiga para não quebrar a restrição de chave estrangeira (FK)
UPDATE professionals SET category = 'arts' WHERE category = 'design';
UPDATE professionals SET secondary_category_1 = 'arts' WHERE secondary_category_1 = 'design';
UPDATE professionals SET secondary_category_2 = 'arts' WHERE secondary_category_2 = 'design';

-- 3. Agora que nenhum profissional aponta para 'design', podemos apagar a categoria antiga
DELETE FROM categories WHERE id = 'design';

COMMIT;

-- Log de confirmação
DO $$ 
BEGIN 
    RAISE NOTICE 'Migração da categoria Design para Artes concluída com sucesso (FK respeitadas).';
END $$;
