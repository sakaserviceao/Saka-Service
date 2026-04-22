import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getSiteSettings } from "@/data/api";

const TermsOfService = () => {
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
            <FileText className="h-10 w-10" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Termos de Serviço</h1>
          <p className="text-muted-foreground">Última atualização: {settings?.terms_service_date || "26 de Março de 2026"}</p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none">
          {settings?.terms_service_content ? (
            <div className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
              {settings.terms_service_content}
            </div>
          ) : (
            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-bold mb-4">1. Aceitação dos Termos</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Ao aceder e utilizar a plataforma Sakaservice, concorda em cumprir integralmente estes Termos de Serviço. Se não concordar com qualquer parte destes termos, não deverá utilizar a nossa plataforma.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">2. Elegibilidade e Registo</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Para se registar como profissional, deve ter pelo menos 18 anos e estar legalmente habilitado para prestar os serviços oferecidos. Toda a informação fornecida no registo deve ser verdadeira e mantida atualizada.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">3. Verificação de Profissionais</h2>
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 space-y-4">
                  <p className="text-muted-foreground">
                    A Sakaservice reserva-se o direito de solicitar documentos de identificação e certificados para validade das competências anunciadas. Perfis só serão publicados após aprovação administrativa.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">4. Responsabilidades</h2>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>A Sakaservice atua apenas como facilitadora de conexão entre clientes e profissionais;</li>
                  <li>Não somos responsáveis pela qualidade ou execução final dos serviços prestados por terceiros;</li>
                  <li>O utilizador é responsável por manter a confidencialidade das suas credenciais de acesso.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">5. Taxas e Pagamentos</h2>
                <p className="text-muted-foreground leading-relaxed">
                  A utilização básica da plataforma para pesquisa é gratuita. Taxas de serviço para profissionais serão aplicadas conforme as condições específicas de cada plano ou subscrição, previamente comunicadas.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">6. Modificações na Plataforma</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Podemos alterar estes termos a qualquer momento. O uso continuado da plataforma após tais alterações constitui a sua aceitação dos novos termos.
                </p>
              </section>

              <section className="mt-12 rounded-2xl border bg-primary/5 p-8 border-primary/20">
                <h2 className="text-xl font-bold mb-4">Questões?</h2>
                <p className="text-muted-foreground mb-4">
                  Se tiver alguma questão sobre estes Termos de Serviço, pode contactar-nos através do email:
                </p>
                <p className="text-lg font-bold text-primary">{settings?.terms_service_email || "termos@sakaservice.com"}</p>
              </section>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TermsOfService;
