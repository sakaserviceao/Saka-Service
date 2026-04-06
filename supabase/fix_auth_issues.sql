-- KIT DE EMERGÊNCIA: AUTENTICAÇÃO SAKASERV
-- Este script permite confirmar utilizadores manualmente quando os e-mails de ativação falham.

-- 1. CONFIRMAR UTILIZADOR MANUALMENTE (Pelo E-mail)
-- Execute este bloco substituindo 'exemplo@email.com' pelo e-mail do seu utilizador.
-- Verifique se o e-mail está na tabela auth.users antes de correr.

UPDATE auth.users 
SET 
  email_confirmed_at = NOW(),
  confirmed_at = NOW(),
  last_sign_in_at = NOW()
WHERE email = 'exemplo@email.com'; -- <--- MUDE ISTO


-- 2. VERIFICAR SE O UTILIZADOR EXISTE NO PERFIL DE PROFISSIONAL
-- Se o utilizador foi criado no Auth mas não no perfil público, este script sincroniza.

INSERT INTO professionals (id, name, email, verification_status, subscription_status)
SELECT 
  id, 
  raw_user_meta_data->>'full_name', 
  email, 
  'ativo', -- Marcar como verificado para ultrapassar as novas regras
  'active' -- Marcar como pago para ultrapassar as novas regras
FROM auth.users
WHERE email = 'exemplo@email.com' -- <--- MUDE ISTO
AND NOT EXISTS (SELECT 1 FROM professionals WHERE professionals.id = auth.users.id)
ON CONFLICT (id) DO NOTHING;


-- 3. DIAGNÓSTICO: LISTAR UTILIZADORES NÃO CONFIRMADOS
-- Use isto para ver quem está "preso" sem e-mail.

SELECT 
  id, 
  email, 
  email_confirmed_at, 
  created_at 
FROM auth.users 
WHERE email_confirmed_at IS NULL 
ORDER BY created_at DESC;

-- NOTA: Após correr o Passo 1, o utilizador já pode fazer LOGIN imediato sem precisar de clicar no link do e-mail.
