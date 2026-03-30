import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";

/**
 * ============================================================
 * HERO SECTION - SAKA SERVICE (BUSCA INTEGRADA)
 * ============================================================
 * Como editar futuramente:
 * 1. TEXTO PRINCIPAL: Procure por "Encontre os melhores profissionais".
 * 2. CORES: Altere as classes 'bg-blue-900' ou 'bg-emerald-400' nas divs de 'Decorative blurred blobs'.
 * 3. TAGS POPULARES: Altere o array no fundo deste ficheiro.
 */

const HeroSection = () => {
  const [query, setQuery] = useState("");
  const { theme } = useTheme();
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.3 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 100, damping: 10 },
    },
  };

  return (
    <section className="relative overflow-hidden bg-gradient-hero px-4 py-24 transition-colors duration-500 md:py-32 lg:py-44">
      {/* 1. Background Decorativo (Blobs Animados) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], x: [0, 50, 0], y: [0, -30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className={`absolute -left-[10%] -top-[10%] h-[400px] w-[400px] rounded-full ${theme === 'dark' ? 'bg-blue-900 opacity-20' : 'bg-emerald-400 opacity-20'} blur-[100px] md:h-[600px] md:w-[600px] md:blur-[120px]`} 
        />
        <motion.div 
          animate={{ scale: [1, 1.3, 1], x: [0, -40, 0], y: [0, 20, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className={`absolute -right-[10%] -bottom-[10%] h-[400px] w-[400px] rounded-full ${theme === 'dark' ? 'bg-emerald-900 opacity-20' : 'bg-blue-500 opacity-20'} blur-[100px] md:h-[600px] md:w-[600px] md:blur-[120px]`} 
        />
      </div>

      {/* 2. Conteúdo Central */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="container relative z-10 mx-auto max-w-4xl text-center"
      >
        {/* Badge superior */}
        <motion.div 
          variants={itemVariants}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-sm shadow-sm"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Qualidade e Confiança em Angola</span>
        </motion.div>

        {/* Título Principal */}
        <motion.h1
          variants={itemVariants}
          className={`text-4xl font-extrabold leading-tight ${theme === 'dark' ? 'text-slate-100' : 'text-white'} sm:text-5xl md:text-6xl lg:text-7xl`}
        >
          Encontre soluções rápidas com <br />
          <span className="bg-gradient-to-r from-accent via-white to-accent bg-clip-text text-transparent">
            profissionais qualificados
          </span>
        </motion.h1>

        {/* Subtítulo */}
        <motion.p
          variants={itemVariants}
          className={`mx-auto mt-6 max-w-2xl text-lg ${theme === 'dark' ? 'text-slate-300' : 'text-primary-foreground/80'} md:text-xl`}
        >
          Conecte-se com especialistas em tecnologia, design, marketing e muito mais.
        </motion.p>

        {/* Barra de Busca (Glassmorphism) */}
        <motion.form
          variants={itemVariants}
          onSubmit={handleSearch}
          className="mx-auto mt-10 flex max-w-2xl overflow-hidden rounded-2xl bg-white/95 p-1.5 shadow-2xl backdrop-blur-md transition-all hover:shadow-primary/20 md:rounded-3xl"
        >
          <div className="flex flex-1 items-center gap-3 px-4 md:px-6">
            <Search className="h-5 w-5 shrink-0 text-primary" />
            <input
              type="text"
              placeholder="Que serviço procura hoje?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent py-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none md:text-lg"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-gradient-hero px-6 py-3 text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] md:rounded-2xl md:px-10 md:text-base"
          >
            Buscar
          </button>
        </motion.form>

        {/* Tags Populares */}
        <motion.div
           variants={itemVariants}
           className={`mt-8 flex flex-wrap justify-center gap-2 text-xs font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-primary-foreground/60'} md:text-sm`}
         >
          <span>Popular:</span>
          {["Desenvolvedor Web", "Fotógrafo", "Designer", "Marketing"].map((t) => (
            <button
              key={t}
              onClick={() => { setQuery(t); navigate(`/search?q=${encodeURIComponent(t)}`); }}
              className={`rounded-full border border-white/20 bg-white/5 px-4 py-1.5 transition-all hover:bg-white/20 hover:text-white backdrop-blur-sm`}
            >
              {t}
            </button>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
