import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";

const HeroSearch = () => {
  const [query, setQuery] = useState("");
  const { theme } = useTheme();
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-hero px-4 py-24 transition-colors duration-500 md:py-32 lg:py-40">
      {/* Texture Overlay */}
      <div className={`absolute inset-0 bg-grid ${theme === 'dark' ? 'opacity-[0.05]' : 'opacity-[0.08]'} pointer-events-none`} />

      {/* Glow Effect */}
      <div className={`absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,${theme === 'dark' ? '0.1' : '0.15'}),transparent_70%)] pointer-events-none`} />

      {/* Decorative blurred blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -left-[10%] -top-[10%] h-[400px] w-[400px] rounded-full ${theme === 'dark' ? 'bg-blue-900 opacity-20' : 'bg-emerald-400 opacity-20'} blur-[100px] md:h-[600px] md:w-[600px] md:blur-[120px]`} />
        <div className={`absolute -right-[10%] -bottom-[10%] h-[400px] w-[400px] rounded-full ${theme === 'dark' ? 'bg-emerald-900 opacity-20' : 'bg-blue-500 opacity-20'} blur-[100px] md:h-[600px] md:w-[600px] md:blur-[120px]`} />
      </div>

      <div className="container relative z-10 mx-auto max-w-3xl text-center">
        <motion.h1
          className={`text-3xl font-extrabold leading-tight ${theme === 'dark' ? 'text-slate-100' : 'text-white'} md:text-5xl lg:text-6xl flex flex-wrap justify-center md:block`}
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.1, delayChildren: 0.2 },
            },
          }}
        >
          {"Encontre soluções rápidas com".split(" ").map((word, i) => (
            <motion.span
              key={`w1-${i}`}
              className="inline-block mr-[0.25em]"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { type: "spring", damping: 12, stiffness: 200 },
                },
              }}
            >
              {word}
            </motion.span>
          ))}
          <br className="hidden md:block" />
          <motion.span
            className="inline-block mr-[0.25em] text-accent"
            variants={{
              hidden: { opacity: 0, scale: 0.8, rotate: -5 },
              visible: {
                opacity: 1,
                scale: 1,
                rotate: 0,
                transition: { type: "spring", bounce: 0.6, duration: 0.8 },
              },
            }}
          >
            profissionais
          </motion.span>
          {"qualificados e de confiança.".split(" ").map((word, i) => (
            <motion.span
              key={`w2-${i}`}
              className="inline-block mr-[0.25em]"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { type: "spring", damping: 12, stiffness: 200 },
                },
              }}
            >
              {word}
            </motion.span>
          ))}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className={`mx-auto mt-4 max-w-lg text-base ${theme === 'dark' ? 'text-slate-300' : 'text-primary-foreground/70'} md:text-lg`}
        >
          Conecte-se com especialistas em tecnologia, design, marketing e muito mais.
        </motion.p>

        <motion.form
          onSubmit={handleSearch}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mx-auto mt-8 flex max-w-xl overflow-hidden rounded-full bg-primary-foreground shadow-hero"
        >
          <div className="flex flex-1 items-center gap-2 px-5">
            <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar serviços ou profissionais..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent py-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none md:text-base"
            />
          </div>
          <button
            type="submit"
            className={`m-1.5 rounded-full bg-gradient-hero px-6 py-3 text-sm font-semibold ${theme === 'dark' ? 'text-slate-100' : 'text-primary-foreground'} transition-opacity hover:opacity-90 md:px-8`}
          >
            Buscar
          </button>
        </motion.form>

        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.7 }}
           className={`mt-6 flex flex-wrap justify-center gap-2 text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-primary-foreground/60'}`}
         >
          <span>Popular:</span>
          {["Desenvolvedor Web", "Fotógrafo", "Designer", "Marketing"].map((t) => (
            <button
              key={t}
              onClick={() => { setQuery(t); navigate(`/search?q=${encodeURIComponent(t)}`); }}
              className={`rounded-full border ${theme === 'dark' ? 'border-slate-700 hover:bg-slate-800/50 text-slate-300' : 'border-primary-foreground/20 hover:bg-primary-foreground/10 text-primary-foreground'} px-3 py-1 transition-colors`}
            >
              {t}
            </button>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSearch;
