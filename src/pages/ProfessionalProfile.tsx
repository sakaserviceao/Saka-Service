import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, Star, MapPin, Phone, Mail, Linkedin, Edit, Send } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getCategories, getProfessionalById, addReview, recordProfileVisit } from "@/data/api";
import { useAuth } from "@/hooks/useAuth";
import { VerificationBadge } from "@/components/VerificationBadge";
import CategoryIcon from "@/components/CategoryIcon";

const ProfessionalProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const { data: pro, isLoading } = useQuery({
    queryKey: ['professional', id],
    queryFn: () => getProfessionalById(id || ""),
    enabled: !!id,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  // Analytics: Record profile visit
  useEffect(() => {
    if (pro && pro.id && user?.id !== pro.id) {
      recordProfileVisit(pro.id, user?.id);
    }
  }, [pro?.id, user?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold text-muted-foreground">Carregando perfil...</h1>
        </div>
        <Footer />
      </div>
    );
  }

  if (!pro) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold">Profissional não encontrado</h1>
          <Link to="/" className="mt-4 inline-block text-primary hover:underline">Voltar ao início</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const category = categories.find((c: any) => c.id === pro.category);
  const isOwner = user?.id === pro.id;
  const canReview = user && !isOwner; // Visitantes não logados também não podem comentar por agora
  const proIdBadge = pro.id ? `PRO-${pro.id.split('-')[0].toUpperCase()}` : 'PRO-000';

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
       toast.error("Deve iniciar sessão para deixar avaliação.");
       return;
    }
    if (!comment.trim()) {
       toast.error("Escreva um comentário, por favor.");
       return;
    }
    
    setSubmittingReview(true);
    try {
       await addReview({
          professional_id: pro.id,
          author: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Cliente Sakaservice',
          rating,
          comment
       });
       toast.success("A sua avaliação foi registada com sucesso!");
       setComment("");
       setRating(5);
       queryClient.invalidateQueries({ queryKey: ['professional', id] });
    } catch (err: any) {
       toast.error("Erro ao enviar avaliação. Tente novamente.");
    } finally {
       setSubmittingReview(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      <Navbar />
      <div className="container max-w-4xl py-8">
        <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        {isOwner && (
          <div className="mb-6 flex justify-end">
            <Button variant="outline" className="gap-2 bg-secondary" asChild>
              <Link to="/edit-profile"><Edit className="h-4 w-4" /> Editar o Meu Perfil</Link>
            </Button>
          </div>
        )}

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card p-6 shadow-card md:p-8"
        >
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            {pro.avatar ? (
              <img
                src={pro.avatar}
                alt={pro.name}
                className="h-20 w-20 rounded-full object-cover ring-4 ring-primary/20 md:h-24 md:w-24"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/20 ring-4 ring-primary/20 md:h-24 md:w-24">
                <span className="text-2xl font-bold text-primary">{pro.name?.charAt(0)}</span>
              </div>
            )}
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="rounded bg-secondary px-2 py-0.5 text-xs font-bold text-secondary-foreground border">
                  ID: {proIdBadge}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-foreground md:text-4xl flex items-center gap-2">
                {pro.name}
                <VerificationBadge verified={pro.verification_status} size="lg" />
              </h1>
              <p className="text-lg text-muted-foreground">{pro.title}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                {category && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary border border-primary/20 shadow-sm">
                    <CategoryIcon name={category.icon} color={category.color} size="sm" className="h-4 w-4 p-0 shadow-none border-0 bg-transparent" />
                    {category.name}
                  </span>
                )}
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" /> {pro.location}
                </span>
                <span className="flex items-center gap-1 text-sm">
                  <Star className="h-4 w-4 fill-accent text-accent" />
                  <span className="font-semibold">{Number(pro.rating || 5.0).toFixed(1)}</span>
                  <span className="text-muted-foreground">({(pro as any).review_count || pro.reviews?.length || 0} avaliações)</span>
                </span>
              </div>
            </div>
          </div>

          <p className="mt-6 leading-relaxed text-muted-foreground">{pro.description}</p>

          {/* Contact buttons */}
          <div className="mt-6 flex flex-wrap gap-3 text-white">
            {pro.phone && (
              <Button size="sm" className="bg-[#FF9500] hover:bg-[#FF9500]/90 text-white gap-2 border-0 shadow-sm" asChild>
                <a href={`tel:${pro.phone}`}>
                  <Phone className="h-4 w-4" /> Telefone
                </a>
              </Button>
            )}
            {pro.whatsapp && (
              <Button size="sm" className="bg-[#25D366] hover:bg-[#25D366]/90 text-white gap-2 border-0 shadow-sm" asChild>
                <a href={`https://wa.me/${pro.whatsapp}`} target="_blank" rel="noopener noreferrer">
                  <Phone className="h-4 w-4" /> WhatsApp
                </a>
              </Button>
            )}
            {pro.email && (
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 border-0 shadow-sm" asChild>
                <a href={`mailto:${pro.email}`}>
                  <Mail className="h-4 w-4" /> Email
                </a>
              </Button>
            )}
            {pro.linkedin_url && (
              <Button size="sm" className="bg-[#0077B5] hover:bg-[#0077B5]/90 text-white gap-2 border-0 shadow-sm" asChild>
                <a href={pro.linkedin_url} target="_blank" rel="noopener noreferrer">
                  <Linkedin className="h-4 w-4" /> LinkedIn
                </a>
              </Button>
            )}
          </div>
        </motion.div>

        {/* Portfolio */}
        {(pro as any).portfolios && (pro as any).portfolios.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6"
          >
            <h2 className="mb-4 text-xl font-bold text-foreground">Portfólio de Trabalhos</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {(pro as any).portfolios.map((item: any, i: number) => (
                <div key={i} className="group overflow-hidden rounded-xl border border-border bg-card shadow-card">
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Avaliações Existentes */}
        {pro.reviews && pro.reviews.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6"
          >
            <h2 className="mb-4 text-xl font-bold text-foreground">
              Avaliações de Clientes ({pro.reviews.length})
            </h2>
            <div className="space-y-3">
              {pro.reviews.map((review: any, i: number) => (
                <div key={i} className="rounded-xl border border-border bg-card p-5 shadow-card">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">{review.author}</span>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, s) => (
                        <Star
                          key={s}
                          className={`h-3.5 w-3.5 ${s < review.rating ? "fill-accent text-accent" : "text-border"}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
                  <span className="mt-2 block text-xs text-muted-foreground">{review.date || 'Recente'}</span>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Formulário para Deixar Avaliação (Apenas visível para não-donos logados) */}
        {canReview && (
          <motion.section
             initial={{ opacity: 0, y: 16 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.4 }}
             className="mt-8 border-t pt-8"
          >
             <h2 className="mb-4 text-xl font-bold text-foreground">Como foi o serviço com {pro.name}?</h2>
             <form onSubmit={handleReviewSubmit} className="bg-card border rounded-xl p-6 shadow-sm">
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">A sua classificação</label>
                  <div className="flex items-center gap-1 cursor-pointer">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="focus:outline-none"
                      >
                        <Star className={`h-6 w-6 ${rating >= star ? 'fill-accent text-accent' : 'text-border'}`} />
                      </button>
                    ))}
                    <span className="ml-2 text-sm text-muted-foreground">{rating} de 5</span>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="comment" className="block text-sm font-medium mb-2">Descreva a sua experiência</label>
                  <Textarea 
                    id="comment" 
                    value={comment} 
                    onChange={(e) => setComment(e.target.value)} 
                    placeholder="Elogie o trabalho feito por este profissional..." 
                    rows={4} 
                  />
                </div>
                
                <Button type="submit" disabled={submittingReview} className="w-full sm:w-auto bg-gradient-hero gap-2 text-primary-foreground">
                  <Send className="h-4 w-4" /> {submittingReview ? "A enviar..." : "Publicar Avaliação"}
                </Button>
             </form>
          </motion.section>
        )}
      </div>
    </div>
  );
};

export default ProfessionalProfile;

