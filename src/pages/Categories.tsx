import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CategoryCard from "@/components/CategoryCard";
import { getCategories } from "@/data/api";

const Categories = () => {
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
