import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Shield, Users, Target, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getPlatformStats } from "@/data/api";

const AboutUs = () => {
  const { data: stats = { activePros: 0 } } = useQuery({
    queryKey: ['platformStats'],
    queryFn: getPlatformStats,
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-hero py-20 text-white dark:text-slate-100">
          <div className="container relative z-10 text-center">
            <h1 className="mb-6 text-4xl font-bold md:text-6xl">Sobre a Sakaservice</h1>
            <p className="mx-auto max-w-2xl text-lg opacity-90 md:text-xl">
              Ligamos os melhores profissionais de Angola a quem precisa de soluções rápidas, seguras e de confiança.
            </p>
          </div>
          {/* Abstract background shapes */}
          <div className="absolute left-0 top-0 h-full w-full overflow-hidden pointer-events-none">
            <div className="absolute -left-1/4 -top-1/4 h-[500px] w-[500px] rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-1/4 -right-1/4 h-[500px] w-[500px] rounded-full bg-black/10 blur-3xl" />
          </div>
        </section>

        {/* Vision & Mission */}
        <section className="container py-20">
          <div className="grid gap-12 md:grid-cols-2">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold">Nossa Missão</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Nascemos para simplificar a contratação de serviços profissionais em todo o país. A Sakaservice é mais do que uma plataforma; é um ecossistema de confiança onde o talento angolano encontra oportunidades reais.
              </p>
              <ul className="space-y-4">
                {[
                  "Fomentar o empreendedorismo local",
                  "Garantir segurança em cada transação",
                  "Promover a excelência profissional",
                  "Digitalizar o mercado de serviços em Angola"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="aspect-video overflow-hidden rounded-2xl shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1522071823991-b19c72f7049b?w=800&q=80" 
                  alt="Team work" 
                  className="h-full w-full object-cover" 
                />
              </div>
              <div className="absolute -bottom-6 -left-6 rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
                <p className="text-4xl font-bold text-primary">
                  {stats.activePros >= 1000 ? `${(stats.activePros / 1000).toFixed(1)}k+` : stats.activePros}
                </p>
                <p className="text-sm font-medium text-muted-foreground">Profissionais Ativos</p>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="bg-secondary/30 py-20">
          <div className="container">
            <h2 className="mb-12 text-center text-3xl font-bold">Nossos Valores</h2>
            <div className="grid gap-8 md:grid-cols-3">
              {[
                {
                  icon: Shield,
                  title: "Confiança",
                  desc: "Verificamos rigorosamente cada profissional para garantir a sua paz de espírito."
                },
                {
                  icon: Users,
                  title: "Comunidade",
                  desc: "Acreditamos na força da união e no apoio aos micro e pequenos empreendedores."
                },
                {
                  icon: Target,
                  title: "Inovação",
                  desc: "Usamos a tecnologia para tornar a sua vida mais fácil e eficiente."
                }
              ].map((value, i) => (
                <div key={i} className="rounded-2xl bg-background p-8 shadow-sm transition-transform hover:scale-105">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <value.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold">{value.title}</h3>
                  <p className="text-muted-foreground">{value.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AboutUs;
