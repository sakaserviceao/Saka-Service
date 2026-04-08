import * as Icons from "lucide-react";
import { LucideIcon } from "lucide-react";

interface CategoryIconProps {
  name: string;
  className?: string;
  color?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const CategoryIcon = ({ name, className = "", color, size = "md" }: CategoryIconProps) => {
  const fallbackMap: Record<string, string> = {
    "💻": "Laptop",
    "🎨": "Palette",
    "📈": "TrendingUp",
    "🏗️": "Hammer",
    "🏗": "Hammer",
    "📚": "GraduationCap",
    "🧘": "Activity",
    "📷": "Camera",
    "💅": "Sparkles",
    "💼": "Briefcase",
    "⚡": "Zap",
    // In case the name is passed in lowercase
    "laptop": "Laptop",
    "palette": "Palette",
    "trendingup": "TrendingUp",
    "hammer": "Hammer",
    "graduationcap": "GraduationCap",
    "activity": "Activity",
    "camera": "Camera",
    "sparkles": "Sparkles",
    "briefcase": "Briefcase",
    "zap": "Zap",
    // Fallbacks if category name is passed instead of icon
    "tecnologia": "Laptop",
    "technology": "Laptop",
    "design": "Palette",
    "marketing": "TrendingUp",
    "construção": "Hammer",
    "construction": "Hammer",
    "educação": "GraduationCap",
    "education": "GraduationCap",
    "saúde e bem-estar": "Activity",
    "health": "Activity",
    "fotografia": "Camera",
    "photography": "Camera",
    "beleza": "Sparkles",
    "beauty": "Sparkles",
    "consultoria": "Briefcase",
    "consulting": "Briefcase",
    "outros serviços": "Zap",
    "other": "Zap"
  };

  const normalizedName = name ? name.toLowerCase() : "";
  const iconName = fallbackMap[name] || fallbackMap[normalizedName] || name;
  const IconComponent = (Icons as any)[iconName] as LucideIcon || Icons.HelpCircle;

  const sizeClasses = {
    sm: "h-8 w-8 p-1.5 rounded-lg",
    md: "h-12 w-12 p-2.5 rounded-xl",
    lg: "h-16 w-16 p-3.5 rounded-2xl",
    xl: "h-20 w-20 p-4.5 rounded-3xl",
  };

  const bgStyle = color ? { 
    backgroundColor: `hsla(${color}, 0.15)`,
    color: `hsl(${color})`,
    border: `1px solid hsla(${color}, 0.2)`
  } : {};

  return (
    <div 
      className={`flex items-center justify-center transition-all duration-300 shadow-sm ${sizeClasses[size]} ${className}`}
      style={bgStyle}
    >
      <IconComponent strokeWidth={1.5} className="h-full w-full" />
    </div>
  );
};

export default CategoryIcon;
