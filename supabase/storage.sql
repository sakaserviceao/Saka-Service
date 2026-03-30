-- Script para criar o Bucket de Armazenamento e respetivas Políticas (RLS)

-- 1. Criar o caixote de imagens "uploads" (aberto ao público para leitura)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('uploads', 'uploads', true) 
ON CONFLICT (id) DO NOTHING;

-- 2. Permitir que qualquer pessoa veja as imagens (Select)
CREATE POLICY "Qualquer pessoa pode aceder às fotos" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'uploads');

-- 3. Permitir que apenas utilizadores com login possam carregar (Upload/Insert)
CREATE POLICY "Apenas utilizadores logados podem fazer upload" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'uploads');

-- 4. Opcional: Permitir apagar as suas próprias imagens no futuro
CREATE POLICY "Utilizadores podem apagar/atualizar fotos" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'uploads');

CREATE POLICY "Utilizadores podem apagar fotos" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'uploads');
