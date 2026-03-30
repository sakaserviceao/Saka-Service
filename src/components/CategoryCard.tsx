import { Link } from "react-router-dom";
import { motion } from "framer-motion";

interface Props {
  category: { id: string; name: string; icon: string; count: number };
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
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-sm">
          Popular
        </span>
      )}
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/50 text-4xl transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/10 group-hover:text-primary">
        {category.icon}
      </div>
      <div>
        <h3 className="text-base font-bold text-foreground transition-colors group-hover:text-primary">
          {category.name}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {category.count} profissionais disponíveis
        </p>
      </div>
    </Link>
  </motion.div>
);

export default CategoryCard;
