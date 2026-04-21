import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowRight, Users, Shield, Zap, Search, Clock, Home } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import ProfessionalCard from "@/components/ProfessionalCard";
import CategoryCard from "@/components/CategoryCard";
import HomeBanner from "@/components/HomeBanner";
import DynamicCTA from "@/components/DynamicCTA";
import { getCategories, getFeaturedProfessionals, getPlatformStats } from "@/data/api";
import { useTheme } from "@/hooks/useTheme";
import { useSettings } from "@/hooks/useSettings";

const Index = () => {
  const navigate = useNavigate();
  const { data: featured = [] } = useQuery({
    queryKey: ['featuredProfessionals'],
    queryFn: getFeaturedProfessionals,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const { data: stats = { activePros: 0, verifiedReviews: 0, completedProjects: 0 } } = useQuery({
    queryKey: ['platformStats'],
    queryFn: getPlatformStats,
  });

  const { theme } = useTheme();
  const { getSetting } = useSettings();

  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k+`;
    return num.toString();
  };

  const dynamicStats = [
    { icon: Users, label: "Profissionais Ativos", value: formatNumber(stats.activePros), path: "/search" },
    { icon: Shield, label: "Avaliações Verificadas", value: formatNumber(stats.verifiedReviews), path: "/search?rated=true" },
    { icon: Zap, label: "Projetos Concluídos", value: formatNumber(stats.completedProjects), path: "/search?projects=true" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <HeroSection />

      {/* Stats Section - Made Interactive */}
      <section className="border-b border-border bg-card">
        <div className="container grid grid-cols-3 divide-x divide-border overflow-hidden">
          {dynamicStats.map((s) => (
            <button 
              key={s.label} 
              onClick={() => navigate(s.path)}
              className="flex flex-col items-center gap-1.5 py-8 px-2 text-center transition-all duration-300 hover:bg-primary/5 group"
            >
              <s.icon className="h-6 w-6 text-primary transition-transform duration-300 group-hover:scale-110" />
              <span className="text-xl font-bold text-foreground md:text-3xl transition-colors duration-300 group-hover:text-primary">
                {s.value}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground transition-colors duration-300 group-hover:text-primary/70">
                {s.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Main Banner (banner_topo_home) */}
      <HomeBanner
        id="banner_topo_home"
        imageUrl={getSetting('banner_topo_url', '/banners/banner_topo_home.png')}
        linkUrl={getSetting('banner_topo_link', '#')}
        altText="Publicidade Topo"
        height={200}
        mobileHeight={120}
        maxWidth={1280}
        className="my-8"
      />

      {/* Categories */}
      <section className="py-20">
        <div className="container">
          <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-xl">
              <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">Explorar Categorias de Serviços</h2>
              <p className="mt-2 text-lg text-muted-foreground">Encontre profissionais de confiança em minutos para qualquer necessidade.</p>
            </div>
            <Link to="/categories" className="flex items-center gap-2 text-sm font-semibold text-primary transition-all hover:gap-3">
              Ver todas as categorias <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Search Bar above categories */}
          <div className="mb-10 max-w-2xl">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const q = formData.get('q')?.toString().trim();
                navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
              }}
              className="relative flex items-center overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/5"
            >
              <Search className="ml-4 h-5 w-5 text-muted-foreground shrink-0" />
              <input
                name="q"
                type="text"
                placeholder="Que serviço procura hoje?"
                className="h-14 flex-1 bg-transparent px-3 text-base outline-none"
              />
              <Button type="submit" className="m-1.5 h-11 rounded-xl px-6 font-bold shadow-sm">
                Buscar
              </Button>
            </form>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {categories.slice(0, 10).map((cat, i) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                index={i}
                featured={['technology', 'construction', 'design'].includes(cat.id)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Professionals */}
      <section className="bg-secondary/20 py-20">
        <div className="container">
          <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-xl">
              <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">Profissionais em Destaque</h2>
              <p className="mt-2 text-lg text-muted-foreground">Profissionais de excelência, com confiança comprovada no mercado.</p>
            </div>
            <Link to="/search" className="flex items-center gap-2 text-sm font-semibold text-primary transition-all hover:gap-3">
              Ver todos os profissionais <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:gap-8 lg:grid-cols-3">
            {featured.slice(0, 6).map((pro, i) => (
              <ProfessionalCard key={pro.id} professional={pro} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Secondary Banner (banner_pre_cta_home) */}
      <HomeBanner
        id="banner_pre_cta_home"
        imageUrl={getSetting('banner_pre_cta_url', '/banners/banner_pre_cta_home.png')}
        linkUrl={getSetting('banner_pre_cta_link', '#')}
        altText="Publicidade Pré-CTA"
        height={100}
        mobileHeight={80}
        maxWidth={1280}
        className="mt-10 mb-6"
      />

      {/* Saka Imóveis Section */}
      {getSetting('show_imoveis', 'true') === 'true' && (
        <section className="bg-primary/5 py-20 border-y border-primary/10">
          <div className="container">
            <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold mb-6">
                <Home className="h-4 w-4" /> {getSetting('imoveis_badge', 'NOVIDADE')}
              </div>
              <h2 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl mb-4">
                {getSetting('imoveis_title', 'Procura casa para arrendar?')}
              </h2>
              <p className="text-lg text-muted-foreground mb-10">
                {getSetting('imoveis_description', 'Explore imóveis disponíveis em Luanda, com informação clara e contacto direto com proprietários ou agentes verificados.')}
              </p>
              <Button 
                size="lg" 
                className="rounded-2xl h-14 px-8 text-lg font-bold gap-2 shadow-xl shadow-primary/20"
                onClick={() => navigate("/imoveis")}
              >
                {getSetting('imoveis_button_text', 'Ver imóveis disponíveis')} <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Dynamic CTA - Restored Previous Dimensions */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl">
            <DynamicCTA />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
