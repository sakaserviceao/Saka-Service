-- Políticas de Segurança (Security Policies) para Ativar Inserções

-- Profissionais
CREATE POLICY "Users can insert their own profile" 
ON public.professionals FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid()::text = id);

CREATE POLICY "Users can update their own profile" 
ON public.professionals FOR UPDATE 
TO authenticated 
USING (auth.uid()::text = id);

-- Portfolios
CREATE POLICY "Users can insert their own portfolios" 
ON public.portfolios FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid()::text = professional_id);

CREATE POLICY "Users can update their own portfolios" 
ON public.portfolios FOR UPDATE 
TO authenticated 
USING (auth.uid()::text = professional_id);

CREATE POLICY "Users can delete their own portfolios" 
ON public.portfolios FOR DELETE 
TO authenticated 
USING (auth.uid()::text = professional_id);

-- Teste para permitir avaliações de todos
CREATE POLICY "Anyone can insert reviews" 
ON public.reviews FOR INSERT 
WITH CHECK (true);
