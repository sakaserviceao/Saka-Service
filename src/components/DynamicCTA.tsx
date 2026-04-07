import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, 
  Sparkles, 
  UserPlus, 
  Layout, 
  Zap, 
  BarChart3, 
  ShieldCheck,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { getProfessionalById } from "@/data/api";
import { useQuery } from "@tanstack/react-query";

interface CTAState {
  title: string;
  subtitle: string;
  buttonText: string;
  link: string;
  icon: any;
  variant: "hero" | "warning" | "success" | "premium" | "stats";
}

const DynamicCTA = () => {
  const { user, isProfessional, isLoading: authLoading } = useAuth();
  
  const { data: pro, isLoading: proLoading } = useQuery({
    queryKey: ['professional-cta', user?.id],
    queryFn: () => getProfessionalById(user?.id || ""),
    enabled: !!user && isProfessional,
  });

  if (authLoading || (user && isProfessional && proLoading)) {
    return (
      <div className="h-48 w-full animate-pulse rounded-3xl bg-muted/20" />
    );
  }

  // Lógica de Estados
  let currentState: CTAState;

  if (!user) {
    currentState = {
      title: "Pronto para expandir seu negócio?",
      subtitle: "Mostre seu talento e alcance novos clientes em toda a Angola.",
      buttonText: "Comece agora",
      link: "/register",
      icon: UserPlus,
      variant: "hero"
    };
  } else if (isProfessional) {
    const isProfileIncomplete = !pro?.description || !pro?.avatar || !pro?.id_number;
    const hasNoServices = !pro?.portfolios || pro.portfolios.length === 0;
    const isActive = pro?.verification_status === 'ativo';

    if (isProfileIncomplete) {
      currentState = {
        title: "Complete o seu perfil e receba clientes",
        subtitle: "Perfis com fotos e descrição detalhada recebem 10x mais contactos.",
        buttonText: "Completar perfil",
        link: "/perfil-editar",
        icon: ShieldCheck,
        variant: "warning"
      };
    } else if (hasNoServices) {
      currentState = {
        title: "Está tudo pronto. Agora é hora de aparecer.",
        subtitle: "Adicione as suas melhores fotos de trabalhos ao seu portfólio.",
        buttonText: "Atualizar Portfólio",
        link: "/perfil-editar",
        icon: Layout,
        variant: "success"
      };
    } else if (isActive) {
      currentState = {
        title: "Quer mais clientes?",
        subtitle: "Destaque o seu perfil no topo das pesquisas e seja um Top Professional.",
        buttonText: "Promover perfil",
        link: "/perfil-editar",
        icon: Star,
        variant: "premium"
      };
    } else {
      currentState = {
        title: "Ver estatísticas do seu desempenho",
        subtitle: "Analise as visualizações e cliques do seu perfil nos últimos 30 dias.",
        buttonText: "Ver estatísticas",
        link: "/perfil-editar",
        icon: BarChart3,
        variant: "stats"
      };
    }
  } else {
    // Utilizador normal (não profissional) logado
    currentState = {
      title: "Tens um talento para partilhar?",
      subtitle: "Torna-te um profissional no Saka Service e aumenta os teus ganhos hoje mesmo.",
      buttonText: "Criar perfil de Pro",
      link: "/tornar-se-pro",
      icon: Zap,
      variant: "hero"
    };
  }

  // Estilos baseados na variante
  const variants = {
    hero: "bg-gradient-hero text-white",
    warning: "bg-gradient-to-r from-orange-500 to-amber-500 text-white",
    success: "bg-gradient-to-r from-emerald-500 to-teal-500 text-white",
    premium: "bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-yellow-500/30 text-white",
    stats: "bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
  };

  const Icon = currentState.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl p-10 md:p-14 shadow-xl text-center ${variants[currentState.variant]}`}
    >
      {/* Background patterns */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-48 w-48 rounded-full bg-black/10 blur-3xl" />
      
      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="space-y-3">
          <div className="flex justify-center mb-2">
             <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
                <Icon className="h-6 w-6 text-white" />
             </div>
          </div>
          <h2 className={`text-2xl md:text-3xl font-bold leading-tight ${currentState.variant === 'hero' ? 'text-white' : ''}`}>
            {currentState.variant === 'hero' ? (
              <>
                Pronto para <span className="bg-gradient-to-r from-accent via-white to-accent bg-clip-text text-transparent">expandir seu negócio?</span>
              </>
            ) : currentState.title}
          </h2>
          <p className="text-white/80 text-sm md:text-base max-w-md mx-auto font-medium">
            {currentState.subtitle}
          </p>
        </div>
        
        <Button 
          asChild
          size="lg"
          className={`h-12 px-8 rounded-full font-bold transition-all hover:scale-105 active:scale-95 ${
            currentState.variant === 'premium' ? "bg-yellow-500 hover:bg-yellow-600 text-slate-900" : "bg-white text-primary hover:bg-slate-50"
          }`}
        >
          <Link to={currentState.link} className="flex items-center gap-2">
            {currentState.buttonText}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Decorative stars for premium */}
      {currentState.variant === 'premium' && (
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute top-10 right-1/4"
        >
          <Sparkles className="h-8 w-8 text-yellow-500/50" />
        </motion.div>
      )}
    </motion.div>
  );
};

export default DynamicCTA;
