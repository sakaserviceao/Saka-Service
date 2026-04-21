import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CategoryCard from "@/components/CategoryCard";
import { getCategories } from "@/data/api";

const Categories = () => {
  const navigate = useNavigate();
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-16">
        <div className="mb-12 max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">Explorar Categorias de Serviços</h1>
          <p className="mt-2 text-lg text-muted-foreground">Encontre profissionais de confiança em minutos para qualquer necessidade em nossa gama completa de serviços.</p>
        </div>

        {/* Search Bar */}
        <div className="mb-12 max-w-2xl">
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
          {categories.map((cat, i) => (
            <CategoryCard 
              key={cat.id} 
              category={cat} 
              index={i} 
              featured={['technology', 'construction', 'design'].includes(cat.id)}
            />
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Categories;
