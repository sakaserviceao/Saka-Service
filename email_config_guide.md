# Configuração de Provedor de E-mail Externo (SMTP)

Para remover os limites de envio do Supabase e garantir que os e-mails cheguem à caixa de entrada, deve configurar um provedor SMTP externo.

## 1. Configuração no Painel do Supabase (Produção)

Este passo é o mais importante para o seu projeto que está online.

1.  Aceda ao seu [Dashboard do Supabase](https://supabase.com/dashboard).
2.  Vá a **Settings** > **Authentication** > **SMTP Settings**.
3.  Ative a opção **Enable Custom SMTP**.
4.  Preencha com os dados do seu provedor (veja as tabelas abaixo).
5.  Clique em **Save**.

### Dados para SendGrid
| Campo | Valor |
| :--- | :--- |
| **Sender Email** | O seu e-mail verificado no SendGrid |
| **Sender Name** | Saka Service |
| **SMTP Host** | `smtp.sendgrid.net` |
| **SMTP Port** | `587` |
| **SMTP User** | `apikey` |
| **SMTP Password** | Sua API Key gerada no SendGrid |

---

## 2. Configuração Local (`supabase/config.toml`)

Para que o seu ambiente de desenvolvimento local também use o provedor real (opcional), atualize o ficheiro `supabase/config.toml`:

```toml
[auth.email.smtp]
enabled = true
host = "smtp.sendgrid.net"
port = 587
user = "apikey"
pass = "env(SENDGRID_API_KEY)"
admin_email = "contato@sakaservice.com"
sender_name = "Saka Service"
```

> [!IMPORTANT]
> **Verificação de Domínio**: Em qualquer provedor, terá de verificar o seu domínio ou o endereço de e-mail (Single Sender) para que o envio funcione corretamente.

---

## 3. Aumentar o Rate Limit

Depois de configurar o SMTP, pode voltar à secção **Rate Limits** no Dashboard do Supabase e aumentar o valor de **Emails sent per hour** para **30** ou mais.
