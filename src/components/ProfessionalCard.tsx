import { Link } from "react-router-dom";
import { Star, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import type { Professional } from "@/data/mockData";
import { getCategories } from "@/data/api";
import { VerificationBadge } from "./VerificationBadge";

interface Props {
  professional: Professional;
  index?: number;
}

const ProfessionalCard = ({ professional, index = 0 }: Props) => {
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: 1000 * 60 * 30, // 30 minutes (categories rarely change)
    gcTime: 1000 * 60 * 60, // 60 minutes
  });
  
  const category = categories.find((c: any) => c.id === professional.category);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
    >
      <Link
        to={`/professional/${professional.id}`}
        className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
      >
        {/* Optional Badge */}
        {professional.featured && (
          <div className="absolute right-4 top-4 z-10 rounded-full bg-primary/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-sm">
            Profissional de Destaque
          </div>
        )}

        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={professional.avatar}
                alt={professional.name}
                className="h-16 w-16 rounded-full object-cover ring-4 ring-secondary/50 transition-all duration-300 group-hover:ring-primary/20"
              />
              <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-background ring-2 ring-border">
                <Star className="h-3 w-3 fill-accent text-accent" />
              </div>
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-foreground transition-colors group-hover:text-primary flex items-center gap-1">
                {professional.name}
                <VerificationBadge verified={professional.verification_status} size="sm" />
              </h3>
              <p className="text-sm font-medium text-muted-foreground">{professional.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg bg-secondary/50 px-2 py-1">
              <Star className="h-4 w-4 fill-accent text-accent" />
              <span className="text-sm font-bold text-foreground">{professional.rating}</span>
            </div>
            <span className="text-xs text-muted-foreground">({professional.reviewCount} avaliações)</span>
          </div>

          <p className="line-clamp-2 text-sm text-muted-foreground leading-relaxed h-[2.5rem]">
            {professional.description}
          </p>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              {category && (
                <span className="inline-flex items-center gap-1 rounded-md bg-primary/5 px-2 py-1 text-xs font-semibold text-primary">
                  {category.icon} {category.name}
                </span>
              )}
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {professional.location}
              </span>
            </div>
          </div>

          <button className="mt-2 w-full rounded-xl bg-secondary py-3 text-sm font-bold text-foreground transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
            Ver perfil
          </button>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProfessionalCard;
