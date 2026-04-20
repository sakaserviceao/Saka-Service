import { Link } from "react-router-dom";
import { MapPin, Bed, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Imovel } from "@/data/mockData";
import { cn } from "@/lib/utils";

interface PropertyCardProps {
  property: Imovel;
}

const PropertyCard = ({ property }: PropertyCardProps) => {
  const isAvailable = property.status === "disponivel";

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
    }).format(value);
  };

  const handleContact = (e: React.MouseEvent) => {
    e.preventDefault();
    const message = `Olá, estou interessado no imóvel ${property.tipologia} em ${property.localizacao} que vi no Saka Imóveis.`;
    const whatsappUrl = `https://wa.me/${property.contacto_telefone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="group overflow-hidden rounded-2xl border border-border bg-card transition-all hover:shadow-lg">
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={property.imagens?.[0] || "/placeholder.svg"}
          alt={property.localizacao}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute left-4 top-4">
          <Badge
            className={cn(
              "font-bold uppercase tracking-wider",
              isAvailable 
                ? "bg-green-500 hover:bg-green-600 text-white" 
                : "bg-red-500 hover:bg-red-600 text-white"
            )}
          >
            {isAvailable ? "Disponível" : "Arrendado"}
          </Badge>
        </div>
        <div className="absolute bottom-4 left-4">
          <Badge variant="secondary" className="bg-white/90 text-foreground backdrop-blur-sm">
            {property.tipologia}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xl font-bold text-primary">
            {formatCurrency(property.preco_mensal)}
            <span className="text-sm font-normal text-muted-foreground"> /mês</span>
          </span>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Bed className="h-4 w-4" />
            <span>{property.numero_quartos} {property.numero_quartos === 1 ? 'Quarto' : 'Quartos'}</span>
          </div>
        </div>

        <div className="mb-4 flex items-start gap-1 text-muted-foreground">
          <MapPin className="mt-1 h-4 w-4 shrink-0" />
          <span className="text-sm line-clamp-1">{property.localizacao}</span>
        </div>

        <div className="flex gap-2">
          <Button asChild variant="outline" className="flex-1 rounded-xl">
            <Link to={`/imoveis/${property.id}`}>Ver detalhes</Link>
          </Button>
          <Button 
            onClick={handleContact}
            className="flex-1 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold"
          >
            Contactar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
