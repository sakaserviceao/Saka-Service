-- 1. Create Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL for global notifications
    type TEXT NOT NULL DEFAULT 'ui', -- 'ui', 'email', 'other'
    level TEXT NOT NULL DEFAULT 'info', -- 'info', 'warning', 'error', 'success'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ DEFAULT (now() + interval '3 days')
);

-- 2. Create Email Templates Table
CREATE TABLE IF NOT EXISTS public.email_templates (
    id TEXT PRIMARY KEY, -- slug: 'welcome_email', 'status_update', etc.
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- 4. Policies for Notifications
CREATE POLICY "Users can view their own notifications or global ones."
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Only admins can insert/update/delete notifications."
    ON public.notifications FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.admins WHERE email = auth.jwt() ->> 'email'
        )
    );

-- 5. Policies for Email Templates
CREATE POLICY "Only admins can view/manage email templates."
    ON public.email_templates FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.admins WHERE email = auth.jwt() ->> 'email'
        )
    );

-- 6. Insert Default Email Templates
INSERT INTO public.email_templates (id, name, subject, body) VALUES
('welcome_email', 'E-mail de Bem-vindo', 'Bem-vindo ao Saka Service!', 'Olá {{name}}, obrigado por se juntar a nós!'),
('verification_success', 'Verificação Concluída', 'O seu perfil foi verificado!', 'Parabéns {{name}}, o seu perfil já está ativo na plataforma.'),
('subscription_warning', 'Assinatura a Expirar', 'A sua assinatura expira em breve', 'Olá {{name}}, a sua assinatura expira em 5 dias. Renove agora para manter a sua visibilidade.')
ON CONFLICT (id) DO NOTHING;
