export interface Professional {
  id: string;
  name: string;
  title: string;
  description: string;
  category: string;
  location: string;
  rating: number;
  reviewCount: number;
  avatar: string;
  verification_status?: 'ativo' | 'suspenso' | 'removido' | 'pending_upload' | 'pending_review' | 'verified' | 'rejected' | string;
  id_card_front_url?: string;
  id_card_back_url?: string;
  certificate_url?: string;
  id_number?: string;
  verified_at?: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  featured?: boolean;
  portfolio?: any[];
  reviews?: any[];
  linkedin_url?: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  count?: number;
  color?: string;
  banner_url?: string;
}

export interface SiteSetting {
  key: string;
  value: string;
}

export const categories = [
  { id: "technology", name: "Tecnologia", icon: "Laptop", count: 124, color: "168 60% 38%", banner_url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1580&h=170&fit=crop" },
  { id: "design", name: "Design", icon: "Palette", count: 89, color: "280 65% 55%", banner_url: "https://images.unsplash.com/photo-1558655146-d09347e92766?w=1580&h=170&fit=crop" },
  { id: "marketing", name: "Marketing", icon: "TrendingUp", count: 76, color: "12 80% 60%", banner_url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1580&h=170&fit=crop" },
  { id: "construction", name: "Construção", icon: "Hammer", count: 52, color: "35 85% 50%", banner_url: "https://images.unsplash.com/photo-1504307651254-35680f3365d1?w=1580&h=170&fit=crop" },
  { id: "education", name: "Educação", icon: "GraduationCap", count: 67, color: "210 70% 50%", banner_url: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1580&h=170&fit=crop" },
  { id: "health", name: "Saúde e Bem-estar", icon: "Activity", count: 93, color: "150 60% 45%" },
  { id: "photography", name: "Fotografia", icon: "Camera", count: 41, color: "0 0% 35%" },
  { id: "beauty", name: "Beleza", icon: "Sparkles", count: 58, color: "330 65% 55%" },
  { id: "consulting", name: "Consultoria", icon: "Briefcase", count: 45, color: "220 50% 45%" },
  { id: "other", name: "Outros Serviços", icon: "Zap", count: 34, color: "50 80% 50%" },
];

const avatars = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face",
];

const portfolioImages = [
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop",
];

export const professionals: Professional[] = [
  {
    id: "1",
    name: "João Silva",
    title: "Desenvolvedor Full Stack",
    description: "Especialista em React, Node.js e design de sistemas escaláveis.",
    category: "technology",
    location: "São Paulo, SP",
    rating: 4.9,
    reviewCount: 124,
    avatar: avatars[0],
    featured: true,
    portfolio: [
      { id: "p1", image: portfolioImages[0], title: "E-commerce Platform", description: "A full e-commerce solution." },
      { id: "p2", image: portfolioImages[1], title: "Dashboard UI", description: "Modern admin dashboard." }
    ],
    linkedin_url: "https://linkedin.com/in/joaosilvadev"
  },
  {
    id: "2",
    name: "Mariana Costa",
    title: "Designer Gráfico",
    description: "Criação de identidades visuais impactantes e design original.",
    category: "design",
    location: "Rio de Janeiro, RJ",
    rating: 4.8,
    reviewCount: 38,
    avatar: avatars[1],
    featured: true,
    portfolio: [
      { id: "p3", image: portfolioImages[2], title: "Logo Set", description: "Collection of logos." }
    ],
    linkedin_url: "https://linkedin.com/in/marianacostadesign"
  },
  {
    id: "3",
    name: "Ricardo Mendes",
    title: "Estrategista de Marketing",
    description: "Foco em crescimento orgânico e campanhas de alta conversão.",
    category: "marketing",
    location: "Belo Horizonte, MG",
    rating: 4.7,
    reviewCount: 56,
    avatar: avatars[2],
    featured: false
  },
  {
    id: "4",
    name: "Ana Oliveira",
    title: "Engenheira Civil",
    description: "Gestão de obras residenciais e comerciais com foco em sustentabilidade.",
    category: "construction",
    location: "Curitiba, PR",
    rating: 5.0,
    reviewCount: 42,
    avatar: avatars[3],
    featured: true
  },
  {
    id: "5",
    name: "Beatriz Santos",
    title: "Professora de Inglês",
    description: "Aulas personalizadas para business e conversação fluente.",
    category: "education",
    location: "Florianópolis, SC",
    rating: 4.9,
    reviewCount: 89,
    avatar: avatars[4],
    featured: false
  },
  {
    id: "6",
    name: "Carlos Eduardo",
    title: "Personal Trainer",
    description: "Especialista em emagrecimento e ganho de massa muscular.",
    category: "health",
    location: "Fortaleza, CE",
    rating: 4.6,
    reviewCount: 22,
    avatar: avatars[5],
    featured: false
  },
  {
    id: "7",
    name: "Luana Martins",
    title: "Fotógrafa Profissional",
    description: "Ensaios artísticos, eventos corporativos e casamentos.",
    category: "photography",
    location: "Salvador, BA",
    rating: 4.8,
    reviewCount: 65,
    avatar: avatars[6],
    featured: false
  },
  {
    id: "8",
    name: "Fernanda Lima",
    title: "Maquiadora e Esteticista",
    description: "Serviços de beleza premium para todas as ocasiões.",
    category: "beauty",
    location: "Porto Alegre, RS",
    rating: 4.7,
    reviewCount: 47,
    avatar: avatars[7],
    featured: false
  }
];
