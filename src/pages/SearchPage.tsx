import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProfessionalCard from "@/components/ProfessionalCard";
import { searchProfessionals, getCategories } from "@/data/api";

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState("");

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const { data: searchResults = [], isLoading } = useQuery({
    queryKey: ['search', initialQuery],
    queryFn: () => searchProfessionals(initialQuery),
  });

  const results = useMemo(() => {
    let filtered = searchResults;
    if (selectedCategory) {
      filtered = filtered.filter((p: any) => p.category === selectedCategory);
    }
    return filtered;
  }, [searchResults, selectedCategory]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams(query ? { q: query } : {});
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Encontre Profissionais</h1>

        <form onSubmit={handleSearch} className="mt-6 flex overflow-hidden rounded-xl border border-border bg-card shadow-card">
          <div className="flex flex-1 items-center gap-2 px-4">
            <Search className="h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Pesquise por nome, serviço ou localização..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
          <button type="submit" className="bg-gradient-hero px-6 text-sm font-medium text-primary-foreground">
            Buscar
          </button>
        </form>

        {/* Category filters */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory("")}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              !selectedCategory
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-muted"
            }`}
          >
            Todas
          </button>
          {categories.map((cat: any) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id === selectedCategory ? "" : cat.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedCategory === cat.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-muted"
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="mt-6">
          <p className="mb-4 text-sm text-muted-foreground">
            {isLoading ? 'Pesquisando...' : `${results.length} resultado${results.length !== 1 ? "s" : ""} encontrado${results.length !== 1 ? "s" : ""}`}
          </p>
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">Carregando resultados...</div>
          ) : results.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((pro: any, i: number) => (
                <ProfessionalCard key={pro.id} professional={pro} index={i} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <p className="text-muted-foreground">Nenhum profissional corresponde à sua pesquisa. Tente palavras-chave diferentes..</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SearchPage;
