import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Shield, Users, Target, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { getPlatformStats, getSiteSettings } from "@/data/api";

const AboutUs = () => {
  const { data: stats = { activePros: 0 } } = useQuery({
    queryKey: ['platformStats'],
    queryFn: getPlatformStats,
  });

  const { data: settings } = useQuery({
    queryKey: ['siteSettings'],
    queryFn: getSiteSettings,
  });

  const teamMembers = (() => {
    try {
      return settings?.team_members_json ? JSON.parse(settings.team_members_json) : [];
    } catch (e) {
      return [];
    }
  })();

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
              <p className="text-lg text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {settings?.about_us_content || "Nascemos para simplificar a contratação de serviços profissionais em todo o país. A Sakaservice é mais do que uma plataforma; é um ecossistema de confiança onde o talento angolano encontra oportunidades reais."}
              </p>
              
              <div className="pt-8">
                <h2 className="text-3xl font-bold mb-6">Nossa Visão</h2>
                <p className="text-lg text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {settings?.about_us_vision || "Ser a maior plataforma de serviços de Angola, reconhecida pela excelência, segurança e inovação tecnológica, transformando a forma como os angolanos contratam e prestam serviços."}
                </p>
              </div>

              <ul className="space-y-4 pt-6">
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
              {teamMembers.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {teamMembers.map((member: any, i: number) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="group relative aspect-square overflow-hidden rounded-2xl bg-muted shadow-lg"
                    >
                      {member.photo ? (
                        <img 
                          src={member.photo} 
                          alt={member.name} 
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" 
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-indigo-50">
                          <Users className="h-10 w-10 text-indigo-200" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                        <p className="text-white font-bold text-sm leading-tight">{member.name}</p>
                        <p className="text-white/70 text-[10px] uppercase font-semibold tracking-wider">{member.role}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <>
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
                </>
              )}
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
