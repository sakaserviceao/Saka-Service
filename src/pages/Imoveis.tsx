import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import { getImoveis } from "@/data/api";
import { ImovelTipologia } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, Plus } from "lucide-react";
import { Link } from "react-router-dom";

const tipologias: (ImovelTipologia | "Todos")[] = ["Todos", "T1", "T2", "T3", "T4", "T5+"];

const Imoveis = () => {
  const [selectedTipologia, setSelectedTipologia] = useState<ImovelTipologia | "Todos">("Todos");

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['imoveis'],
    queryFn: getImoveis,
  });

  const filteredProperties = (Array.isArray(properties) ? properties : []).filter(p => 
    selectedTipologia === "Todos" || p.tipologia === selectedTipologia
  );

  console.log("Saka Imóveis: Página carregada", { propertiesCount: properties?.length, filteredCount: filteredProperties.length });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Header */}
      <section className="bg-secondary/30 py-16 border-b border-border">
        <div className="container">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl mb-4">
                Explore imóveis para arrendar
              </h1>
              <p className="text-lg text-muted-foreground">
                Encontre o seu próximo lar em Luanda com informação clara e contacto direto com o proprietário ou agente.
              </p>
            </div>
            <Button size="lg" className="rounded-2xl h-14 px-8 text-lg font-bold gap-2 shadow-xl shadow-primary/20 shrink-0" asChild>
              <Link to="/imoveis/anunciar">
                <Plus className="h-5 w-5" /> Anunciar Imóvel
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="container py-12">
        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {tipologias.map((t) => (
              <Button
                key={t}
                variant={selectedTipologia === t ? "default" : "outline"}
                className="rounded-full px-6 whitespace-nowrap"
                onClick={() => setSelectedTipologia(t)}
              >
                {t}
              </Button>
            ))}
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="outline" className="rounded-xl gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filtros
            </Button>
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Pesquisar localização..."
                className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>

        {/* Listing Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
             {[1, 2, 3].map((i) => (
               <div key={i} className="h-[400px] rounded-2xl bg-muted animate-pulse" />
             ))}
          </div>
        ) : filteredProperties.length > 0 ? (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {filteredProperties.map((property, index) => (
                <motion.div
                  key={property.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <PropertyCard property={property} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="py-20 text-center">
            <h3 className="text-xl font-semibold text-foreground mb-2">Nenhum imóvel encontrado</h3>
            <p className="text-muted-foreground">Tente alterar os filtros para encontrar o que procura.</p>
            <Button 
              variant="link" 
              onClick={() => setSelectedTipologia("Todos")}
              className="mt-4"
            >
              Limpar todos os filtros
            </Button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Imoveis;
