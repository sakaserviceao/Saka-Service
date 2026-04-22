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
        className={`group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-3 sm:p-6 shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-xl ${professional.featured ? "ring-1 ring-primary ring-offset-2 ring-offset-background dark:ring-0 dark:ring-offset-0" : ""}`}
      >
        {/* Featured Badge - Repositioned to avoid overlap */}
        {professional.featured && (
          <div className="mb-2 sm:mb-4 flex">
            <div className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 sm:px-3 sm:py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-emerald-600 shadow-sm animate-pulse-subtle">
              ✨ Destaque
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:gap-5">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="relative shrink-0">
              <img
                src={professional.avatar}
                alt={professional.name}
                className="h-10 w-10 sm:h-16 sm:w-16 rounded-full object-cover ring-2 sm:ring-4 ring-secondary/50 transition-all duration-300 group-hover:ring-primary/20"
              />
              <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-background ring-1 sm:ring-2 ring-border">
                <Star className="h-2 w-2 sm:h-3 sm:w-3 fill-accent text-accent" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-[12px] sm:text-lg font-black text-foreground transition-colors group-hover:text-primary leading-tight">
                {professional.name}
                <VerificationBadge verified={professional.verification_status === 'ativo' || professional.subscription_status === 'active'} size="xs" className="ml-1.5 inline-flex translate-y-[-1px]" />
              </h3>
              <p className="text-[9.5px] sm:text-sm font-medium text-muted-foreground mt-0.5 line-clamp-2 uppercase tracking-tighter leading-[1.1]">{professional.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1 rounded-lg bg-secondary/50 px-1.5 py-0.5 sm:px-2 sm:py-1">
              <Star className="h-2.5 w-2.5 sm:h-4 sm:w-4 fill-accent text-accent" />
              <span className="text-[11px] sm:text-sm font-bold text-foreground">{professional.rating}</span>
            </div>
            <span className="text-[9px] sm:text-xs text-muted-foreground truncate">({professional.reviewCount})</span>
          </div>

          <p className="hidden sm:line-clamp-2 sm:block text-sm text-muted-foreground leading-relaxed h-[2.5rem]">
            {professional.description}
          </p>

          <div className="flex flex-wrap items-center justify-between gap-1 sm:gap-3 pt-1 sm:pt-2">
            <div className="flex flex-wrap items-center gap-1 sm:gap-2">
              {category && (
                <span className="inline-flex items-center gap-1 rounded-md bg-primary/5 px-1.5 py-0.5 text-[9px] sm:text-xs font-bold text-primary uppercase tracking-tighter">
                  {category.icon} {category.name}
                </span>
              )}
              <span className="flex items-center gap-1 text-[9px] sm:text-[11px] text-muted-foreground">
                <MapPin className="h-2 w-2 sm:h-3 sm:w-3" />
                {professional.location}
              </span>
            </div>
          </div>

          <button className="mt-1 sm:mt-2 w-full rounded-lg sm:rounded-xl bg-secondary py-2 sm:py-2.5 text-[11px] sm:text-sm font-black uppercase tracking-tighter text-foreground transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
            Ver perfil
          </button>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProfessionalCard;
