import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import CategoryIcon from "./CategoryIcon";

interface Props {
  category: { id: string; name: string; icon: string; count: number; color?: string };
  index?: number;
  featured?: boolean;
}

const CategoryCard = ({ category, index = 0, featured = false }: Props) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.05, duration: 0.4 }}
  >
    <Link
      to={`/category/${category.id}`}
      className={`group relative flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-8 text-center shadow-md transition-all duration-300 hover:-translate-y-2 hover:border-primary/50 hover:shadow-xl ${
        featured ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
      }`}
    >
      {featured && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-sm z-10">
          Popular
        </span>
      )}
      
      <CategoryIcon 
        name={category.icon} 
        color={category.color} 
        size="lg" 
        className="group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-hero/10"
      />

      <div className="mt-2">
        <h3 className="text-base font-bold text-foreground transition-colors group-hover:text-primary leading-tight">
          {category.name}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground font-medium">
          {category.count} profissionais
        </p>
      </div>
    </Link>
  </motion.div>
);

export default CategoryCard;
