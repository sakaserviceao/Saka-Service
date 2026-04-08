import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import CategoryIcon from "./CategoryIcon";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
  category: { 
    id: string; 
    name: string; 
    icon: string; 
    count: number; 
    color?: string;
    professions_preview?: string[];
  };
  index?: number;
  featured?: boolean;
}

const CategoryCard = ({ category, index = 0, featured = false }: Props) => {
  const professions = category.professions_preview || [];
  const hasTooMany = professions.length > 4;
  const tooltipContent = hasTooMany 
    ? professions.slice(0, 3).join(", ") + " e mais" 
    : professions.join(", ");

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.05, duration: 0.4 }}
      >
        <div className="group relative">
          {/* Tooltip Info Icon */}
          <div className="absolute top-4 right-4 z-20">
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  className="rounded-full p-1 text-muted-foreground/80 hover:text-primary hover:bg-primary/10 transition-all duration-200 focus:outline-none"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <Info className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent 
                className="bg-slate-900 text-slate-50 border-slate-800 rounded-[8px] max-w-[220px] p-3 shadow-2xl"
                side="top"
              >
                <div className="space-y-1.5">
                  <p className="font-semibold text-[11px] text-slate-300 border-b border-slate-800 pb-1.5 mb-1.5">
                    Disponíveis profissionais como:
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    {professions.length > 0 
                      ? tooltipContent 
                      : `Vários serviços de ${category.name.toLowerCase()} disponíveis.`}
                  </p>
                  <p className="text-[10px] text-slate-500 pt-1.5 mt-1.5 border-t border-slate-800 italic">
                    Encontre o especialista certo para o seu serviço.
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>

          <Link
            to={`/category/${category.id}`}
            className={`flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-8 text-center shadow-md transition-all duration-300 hover:-translate-y-2 hover:border-primary/50 hover:shadow-xl ${
              featured ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
            }`}
          >
            {featured && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-sm z-10">
                Popular
              </span>
            )}
            
            <div className="relative">
              <CategoryIcon 
                name={category.icon || category.name || category.id} 
                color={category.color} 
                size="lg" 
                className="group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-hero/10"
              />
              {category.count > 0 && (
                <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-lg border-2 border-background animate-in zoom-in duration-300">
                  {category.count}
                </span>
              )}
            </div>

            <div className="mt-2 text-center w-full">
              <h3 className="text-base font-bold text-foreground transition-colors group-hover:text-primary leading-tight">
                {category.name}
              </h3>
              <p className="mt-1 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                {category.count > 0 
                  ? `${category.count} ${category.count === 1 ? 'Especialista' : 'Especialistas'}`
                  : "Em breve"}
              </p>
            </div>
          </Link>
        </div>
      </motion.div>
    </TooltipProvider>
  );
};

export default CategoryCard;
