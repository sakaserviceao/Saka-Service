import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getSiteSettings } from "@/data/api";

const PrivacyPolicy = () => {
  const { data: settings } = useQuery({
    queryKey: ['siteSettings'],
    queryFn: getSiteSettings,
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container max-w-4xl py-20">
        <div className="flex flex-col items-center mb-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="h-10 w-10" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Política de Privacidade</h1>
          <p className="text-muted-foreground">Última atualização: {settings?.privacy_policy_date || "26 de Março de 2026"}</p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none">
          {settings?.privacy_policy_content ? (
            <div className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
              {settings.privacy_policy_content}
            </div>
          ) : (
            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-bold mb-4">1. Introdução</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Respeitamos a sua privacidade e estamos empenhados em proteger os seus dados pessoais. Esta política descreve como recolhemos, utilizamos e protegemos as suas informações ao utilizar a plataforma Sakaservice.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">2. Informações que Recolhemos</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border p-6 bg-secondary/20">
                    <h3 className="font-bold mb-2">Dados do Utilizador</h3>
                    <p className="text-sm text-muted-foreground">Nome, email, telefone e foto de perfil para identificação básica na plataforma.</p>
                  </div>
                  <div className="rounded-xl border p-6 bg-secondary/20">
                    <h3 className="font-bold mb-2">Dados de Verificação</h3>
                    <p className="text-sm text-muted-foreground">Documentos de identidade e certificados profissionais (armazenados de forma segura e privada).</p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">3. Como Utilizamos os seus Dados</h2>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Para fornecer e manter a nossa plataforma;</li>
                  <li>Para verificar a identidade de profissionais e garantir segurança;</li>
                  <li>Para processar pagamentos e facilitar a comunicação entre clientes e prestadores;</li>
                  <li>Para enviar notificações importantes sobre o estado da sua conta.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">4. Segurança dos Dados</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Implementamos medidas de segurança técnicas e organizacionais para proteger as suas informações contra acesso não autorizado, alteração ou destruição. Os documentos de verificação são armazenados em servidores seguros com acesso restrito apenas a administradores autorizados.
                </p>
              </section>
            </div>
          )}

          <section className="mt-12 rounded-2xl border bg-primary/5 p-8 border-primary/20">
            <h2 className="text-xl font-bold mb-4">Dúvidas?</h2>
            <p className="text-muted-foreground mb-4">
              Se tiver alguma questão sobre esta Política de Privacidade, pode contactar-nos através do email:
            </p>
            <p className="text-lg font-bold text-primary">{settings?.privacy_policy_email || "privacidade@sakaservice.com"}</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
