import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProfessionalCard from "@/components/ProfessionalCard";
import { getCategories, getProfessionalsByCategory } from "@/data/api";
import CategoryIcon from "@/components/CategoryIcon";

const CategoryDetail = () => {
  const { id } = useParams<{ id: string }>();

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const { data: pros = [], isLoading } = useQuery({
    queryKey: ['professionals', id],
    queryFn: () => getProfessionalsByCategory(id || ""),
    enabled: !!id,
  });

  const category = categories.find((c: any) => c.id === id);

  if (!category && !isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold">Categoria não encontrada</h1>
          <Link to="/categories" className="mt-4 inline-block text-primary hover:underline">Voltar para categorias</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-12">
        <Link to="/categories" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Todas as categorias
        </Link>
        {category && (
          <div className="mb-8 flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <CategoryIcon name={category.icon || category.name || category.id} color={category.color} size="xl" />
              <div>
                <h1 className="text-4xl font-bold text-foreground tracking-tight">{category.name}</h1>
                <p className="text-muted-foreground mt-1">
                  {pros.length} {pros.length === 1 ? "profissional disponível" : "profissionais disponíveis"}
                </p>
              </div>
            </div>

            {/* Premium Advertising Banner (1580x170 recommended) */}
            {category.banner_url && (
              <div className="w-full min-h-[170px] max-h-[170px] rounded-xl overflow-hidden shadow-sm border border-border bg-secondary/50 flex items-center justify-center relative group">
                {category.banner_link ? (
                  <a 
                    href={category.banner_link} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="w-full h-full block cursor-pointer"
                  >
                    <img 
                      src={category.banner_url} 
                      alt={`Banner de publicidade em ${category.name}`}
                      className="w-full h-full object-cover hover:scale-[1.01] transition-transform duration-500"
                    />
                  </a>
                ) : (
                  <img 
                    src={category.banner_url} 
                    alt={`Banner de publicidade em ${category.name}`}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute top-2 right-2 bg-background/80 backdrop-blur text-[10px] text-muted-foreground px-2 py-0.5 rounded border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  Publicidade Patrocinada {category.banner_link && "• Clique para abrir"}
                </div>
              </div>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground">Carregando profissionais...</div>
        ) : pros.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pros.map((p: any, i: number) => (
              <ProfessionalCard key={p.id} professional={p} index={i} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <p className="text-muted-foreground">Nenhum profissional encontrado nesta categoria.</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default CategoryDetail;
