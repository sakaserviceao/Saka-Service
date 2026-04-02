import { Link } from "react-router-dom";
import { ArrowRight, Users, Shield, Zap, Search } from "lucide-react";
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

  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k+`;
    return num.toString();
  };

  const dynamicStats = [
    { icon: Users, label: "Profissionais Ativos", value: formatNumber(stats.activePros) },
    { icon: Shield, label: "Avaliações Verificadas", value: formatNumber(stats.verifiedReviews) },
    { icon: Zap, label: "Projetos Concluídos", value: formatNumber(stats.completedProjects) },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <HeroSection />

      {/* Stats */}
      <section className="border-b border-border bg-card">
        <div className="container grid grid-cols-3 divide-x divide-border py-8">
          {dynamicStats.map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-1 px-2 text-center">
              <s.icon className="h-5 w-5 text-primary" />
              <span className="text-lg font-bold text-foreground md:text-2xl">{s.value}</span>
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Main Banner (banner_topo_home) */}
      <HomeBanner
        id="banner_topo_home"
        imageUrl={getSetting('banner_topo_url', '/banners/banner_topo_home.png')}
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
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Que serviço procura hoje?"
                className="h-14 w-full rounded-2xl border border-border bg-card pl-12 pr-4 text-base shadow-sm outline-none transition-all focus:border-primary/50 focus:ring-4 focus:ring-primary/5"
              />
            </div>
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
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
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
        altText="Publicidade Pré-CTA"
        height={100}
        mobileHeight={80}
        maxWidth={1280}
        className="mt-10 mb-6"
      />

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
