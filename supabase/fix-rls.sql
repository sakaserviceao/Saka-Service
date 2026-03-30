-- Script Consolidado para Corrigir o Ambiente (Buckets, Colunas e RLS)
-- Este script resolve:
-- 1. Erro "Bucket not found"
-- 2. Erro "Could not find column ... in schema cache"
-- 3. Erro "new row violates row-level security policy"
-- 4. Impede Administradores de aprovar perfis (RLS update)

-- ==========================================
-- 1. GARANTIR COLUNAS NECESSÁRIAS EM 'professionals'
-- ==========================================

DO $$ BEGIN
    CREATE TYPE verification_status AS ENUM ('pending_upload', 'pending_review', 'verified', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE public.professionals 
ADD COLUMN IF NOT EXISTS verification_status verification_status DEFAULT 'pending_upload',
ADD COLUMN IF NOT EXISTS id_card_front_url TEXT,
ADD COLUMN IF NOT EXISTS id_card_back_url TEXT,
ADD COLUMN IF NOT EXISTS certificate_url TEXT,
ADD COLUMN IF NOT EXISTS id_number TEXT,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();


-- ==========================================
-- 2. CRIAR BUCKETS DE ARMAZENAMENTO
-- ==========================================

INSERT INTO storage.buckets (id, name, public) 
VALUES ('uploads', 'uploads', true) 
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('professional-documents', 'professional-documents', false)
ON CONFLICT (id) DO NOTHING;


-- ==========================================
-- 3. POLÍTICAS PARA STORAGE (storage.objects)
-- ==========================================

DROP POLICY IF EXISTS "Acesso público leitura para uploads" ON storage.objects;
DROP POLICY IF EXISTS "Upload permitido para autenticados em uploads" ON storage.objects;
DROP POLICY IF EXISTS "Gestão de fotos própria em uploads" ON storage.objects;
DROP POLICY IF EXISTS "Leitura de documentos próprios" ON storage.objects;
DROP POLICY IF EXISTS "Upload de documentos próprios" ON storage.objects;
DROP POLICY IF EXISTS "Admins podem gerir documentos" ON storage.objects;

CREATE POLICY "Acesso público leitura para uploads" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'uploads');

CREATE POLICY "Upload permitido para autenticados em uploads" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'uploads');

CREATE POLICY "Gestão de fotos própria em uploads" 
ON storage.objects FOR ALL 
TO authenticated 
USING (bucket_id = 'uploads');

CREATE POLICY "Leitura de documentos próprios"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'professional-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Upload de documentos próprios"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'professional-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Permitir que o admin veja os documentos para verificação
CREATE POLICY "Admins podem ver documentos"
ON storage.objects FOR SELECT
TO authenticated
USING (auth.jwt() ->> 'email' = 'franciscobeneditomucamba@gmail.com');


-- ==========================================
-- 4. POLÍTICAS PARA TABELA 'professionals'
-- ==========================================

DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.professionals;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.professionals;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.professionals;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.professionals;

ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone." 
ON public.professionals FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.professionals FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid()::text = id);

CREATE POLICY "Users can update their own profile" 
ON public.professionals FOR UPDATE 
TO authenticated 
USING (auth.uid()::text = id)
WITH CHECK (auth.uid()::text = id);

-- Política para Administrador Aprovar Perfis
CREATE POLICY "Admins can update all profiles" 
ON public.professionals FOR UPDATE 
TO authenticated 
USING (auth.jwt() ->> 'email' = 'franciscobeneditomucamba@gmail.com')
WITH CHECK (auth.jwt() ->> 'email' = 'franciscobeneditomucamba@gmail.com');


-- ==========================================
-- 5. POLÍTICAS PARA TABELA 'portfolios'
-- ==========================================

DROP POLICY IF EXISTS "Public portfolios are viewable by everyone." ON public.portfolios;
DROP POLICY IF EXISTS "Users can insert their own portfolios" ON public.portfolios;
DROP POLICY IF EXISTS "Users can update their own portfolios" ON public.portfolios;
DROP POLICY IF EXISTS "Users can delete their own portfolios" ON public.portfolios;

ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public portfolios are viewable by everyone." 
ON public.portfolios FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own portfolios" 
ON public.portfolios FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid()::text = professional_id);

CREATE POLICY "Users can update their own portfolios" 
ON public.portfolios FOR UPDATE 
TO authenticated 
USING (auth.uid()::text = professional_id)
WITH CHECK (auth.uid()::text = professional_id);

CREATE POLICY "Users can delete their own portfolios" 
ON public.portfolios FOR DELETE 
TO authenticated 
USING (auth.uid()::text = professional_id);


-- ==========================================
-- 6. POLÍTICAS PARA TABELA 'categories'
-- ==========================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public categories are viewable by everyone." ON public.categories;
CREATE POLICY "Public categories are viewable by everyone." ON public.categories FOR SELECT USING (true);
