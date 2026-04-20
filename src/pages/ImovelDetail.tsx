import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Bed, Phone, MessageCircle, Calendar, Share2, Info } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getImovelById } from "@/data/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

const ImovelDetail = () => {
  const { id } = useParams<{ id: string }>();

  const { data: property, isLoading } = useQuery({
    queryKey: ['imovel', id],
    queryFn: () => getImovelById(id || ""),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center">
          <p className="text-muted-foreground animate-pulse">Carregando detalhes do imóvel...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold">Imóvel não encontrado</h1>
          <Link to="/imoveis" className="text-primary hover:underline mt-4 inline-block">
            Voltar para listagem
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const isAvailable = property.status === "disponivel";

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
    }).format(value);
  };

  const handleWhatsapp = () => {
    const message = `Olá, estou interessado no imóvel ${property.tipologia} em ${property.localizacao} que vi no Saka Imóveis.`;
    const whatsappUrl = `https://wa.me/${property.contacto_telefone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      <Navbar />
      
      <div className="container py-8">
        <Link to="/imoveis" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Voltar para imóveis
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Gallery */}
            <div className="relative group">
              <Carousel className="w-full">
                <CarouselContent>
                  {property.imagens.map((img, index) => (
                    <CarouselItem key={index}>
                      <div className="aspect-video overflow-hidden rounded-3xl border border-border">
                        <img src={img} alt={`Imagem ${index + 1}`} className="w-full h-full object-cover" />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <div className="absolute inset-0 flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <CarouselPrevious className="static translate-y-0" />
                  <CarouselNext className="static translate-y-0" />
                </div>
              </Carousel>
              <div className="absolute top-6 right-6">
                 <Button variant="secondary" size="icon" className="rounded-full bg-white/90 backdrop-blur-sm shadow-lg">
                    <Share2 className="h-4 w-4" />
                 </Button>
              </div>
            </div>

            {/* Title & Info */}
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <Badge className={cn("px-4 py-1.5 uppercase font-black text-[10px] tracking-widest", isAvailable ? "bg-green-500" : "bg-red-500")}>
                  {isAvailable ? "Disponível" : "Arrendado"}
                </Badge>
                <Badge variant="outline" className="px-4 py-1.5 border-primary/20 bg-primary/5 text-primary">
                  {property.tipologia}
                </Badge>
              </div>
              <h1 className="text-3xl font-bold mb-2">{property.tipologia} em {property.localizacao}</h1>
              <div className="flex items-center gap-2 text-muted-foreground mb-6">
                <MapPin className="h-4 w-4" />
                <span>{property.localizacao}</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-3xl bg-secondary/20 border border-secondary">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Preço Mensal</span>
                  <p className="text-xl font-bold text-primary">{formatCurrency(property.preco_mensal)}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Tipologia</span>
                  <p className="text-xl font-bold">{property.tipologia}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Quartos</span>
                  <div className="flex items-center gap-2">
                    <Bed className="h-5 w-5 text-muted-foreground" />
                    <p className="text-xl font-bold">{property.numero_quartos}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Publicado em</span>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <p className="text-sm font-bold">{new Date(property.created_at).toLocaleDateString('pt-AO')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                 <Info className="h-6 w-6 text-primary" /> Descrição
              </h2>
              <div className="prose prose-slate max-w-none text-muted-foreground leading-relaxed">
                {property.descricao}
              </div>
            </div>
          </div>

          {/* Sidebar / Contact */}
          <div className="space-y-6">
            <div className="sticky top-24 p-8 rounded-3xl border border-border bg-card shadow-xl">
              <h3 className="text-xl font-bold mb-6">Contactar Proprietário</h3>
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                    {property.contacto_nome.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{property.contacto_nome}</p>
                    <p className="text-sm text-muted-foreground">Agente / Proprietário Verificado</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={handleWhatsapp}
                  className="w-full h-14 rounded-2xl bg-[#25D366] hover:bg-[#25D366]/90 text-white font-bold gap-3 shadow-lg"
                >
                  <MessageCircle className="h-5 w-5" />
                  Contactar via WhatsApp
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full h-14 rounded-2xl gap-3 border-2"
                  asChild
                >
                   <a href={`tel:${property.contacto_telefone}`}>
                     <Phone className="h-5 w-5" />
                     {property.contacto_telefone}
                   </a>
                </Button>
              </div>

              <p className="mt-6 text-[10px] text-center text-muted-foreground uppercase font-bold tracking-tighter">
                 Ao contactar, mencione que viu o anúncio no Saka Service
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ImovelDetail;
