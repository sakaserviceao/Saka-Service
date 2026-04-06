-- Permitir que profissionais criem as suas próprias subscrições
CREATE POLICY "Profissionais podem criar assinaturas" 
    ON public.subscriptions 
    FOR INSERT 
    WITH CHECK (
        auth.uid()::text = professional_id OR 
        professional_id = (SELECT id FROM public.professionals WHERE id = auth.uid()::text)
    );
