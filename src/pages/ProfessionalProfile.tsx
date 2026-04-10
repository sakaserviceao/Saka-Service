import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, Star, MapPin, Phone, Mail, Linkedin, Edit, Send, Clock, ThumbsUp, ThumbsDown, UserCheck, AlertTriangle, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { 
  getCategories, 
  getProfessionalById, 
  addReview, 
  recordProfileVisit,
  addServiceHire,
  getUserHires,
  getUserReviewForHire
} from "@/data/api";
import { useAuth } from "@/hooks/useAuth";
import { VerificationBadge } from "@/components/VerificationBadge";
import CategoryIcon from "@/components/CategoryIcon";

const ProfessionalProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isLoading: isAuthLoading } = useAuth();
  const queryClient = useQueryClient();

  const [punctuality, setPunctuality] = useState(5);
  const [presentation, setPresentation] = useState(5);
  const [technical, setTechnical] = useState(5);
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [isHiring, setIsHiring] = useState(false);

  const { data: pro, isLoading: isProLoading } = useQuery({
    queryKey: ['professional', id],
    queryFn: () => getProfessionalById(id || ""),
    enabled: !!id,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const { data: hires = [], isLoading: isHiresLoading } = useQuery({
    queryKey: ['userHires', id, user?.id],
    queryFn: () => getUserHires(id!, user!.id),
    enabled: !!id && !!user,
  });

  // Verificar se o utilizador já avaliou a última contratação
  const lastHire = hires.length > 0 ? hires[hires.length - 1] : null;
  const { data: existingReview } = useQuery({
    queryKey: ['hireReview', lastHire?.id],
    queryFn: () => getUserReviewForHire(lastHire!.id),
    enabled: !!lastHire?.id,
  });

  const isOwner = user?.id === pro?.id;
  const isAdmin = ['franciscobeneditomucamba@gmail.com', 'sakaservice.ao@gmail.com', 'podosk2010@hotmail.com', 'francisco.mucamba@gmail.com'].includes(user?.email || '');
  const isPubliclyVisible = pro?.subscription_status === 'active' && pro?.verification_status === 'ativo';

  const hasHired = hires.length > 0;
  const canReview = user && !isOwner && hasHired && !existingReview;

  // Analytics: Record profile visit
  useEffect(() => {
    if (pro && pro.id && user?.id !== pro.id) {
      recordProfileVisit(pro.id, user?.id);
    }
  }, [pro?.id, user?.id]);

  if (isProLoading) {
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

  if (!pro || (!isPubliclyVisible && !isOwner && !isAdmin)) {
    // Se a autenticação ainda estiver a carregar, não mostramos erro precipitadamente.
    if (isAuthLoading && !isPubliclyVisible) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center">
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      );
    }
    
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold">{!pro ? "Profissional não encontrado" : "Perfil Indisponível"}</h1>
          <p className="text-muted-foreground mt-2">
            {!pro ? "Não foi possível encontrar o profissional solicitado." : "Este perfil ainda não está visível publicamente. Documentos e pagamento em validação."}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Link to="/" className="text-primary hover:underline">Voltar ao início</Link>
            {isOwner && (
              <Link to="/perfil-editar" className="text-primary hover:underline px-4 border-l">Editar o Meu Perfil</Link>
            )}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const category = categories.find((c: any) => c.id === pro.category);
  const proIdBadge = pro.id ? `PRO-${pro.id.split('-')[0].toUpperCase()}` : 'PRO-000';

  const toggleFeatured = async () => {
    try {
      const { adminUpdateFeaturedStatus } = await import("@/data/api");
      await adminUpdateFeaturedStatus(pro.id, !pro.featured);
      toast.success(pro.featured ? "Removido dos destaques!" : "Definido como TOP PROFISSIONAL!");
      queryClient.invalidateQueries({ queryKey: ['professional', id] });
    } catch (err) {
      toast.error("Erro ao atualizar destaque.");
    }
  };

  const handleHire = async () => {
    if (!user) {
      toast.error("Inicie sessão para contratar um profissional.");
      return;
    }
    setIsHiring(true);
    try {
      await addServiceHire(pro!.id, user.id);
      toast.success("Contratação registada! Já pode avaliar o profissional.");
      queryClient.invalidateQueries({ queryKey: ['userHires', id, user.id] });
    } catch (err) {
      toast.error("Erro ao registar contratação.");
    } finally {
      setIsHiring(false);
    }
  };

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
       const averageRating = (punctuality + presentation + technical) / 3;
       await addReview({
          professional_id: pro!.id,
          author: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Cliente Sakaservice',
          rating: averageRating,
          comment,
          punctuality_rating: punctuality,
          presentation_rating: presentation,
          technical_rating: technical,
          would_recommend: wouldRecommend,
          hire_id: lastHire?.id
       });
       toast.success("A sua avaliação estruturada foi registada com sucesso!");
       setComment("");
       setPunctuality(5);
       setPresentation(5);
       setTechnical(5);
       setWouldRecommend(true);
       queryClient.invalidateQueries({ queryKey: ['professional', id] });
       queryClient.invalidateQueries({ queryKey: ['hireReview', lastHire?.id] });
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

        <div className="mb-6 flex flex-wrap justify-end gap-3">
          {isOwner && (
            <Button variant="outline" className="gap-2 bg-secondary" asChild>
              <Link to="/perfil-editar"><Edit className="h-4 w-4" /> Editar o Meu Perfil</Link>
            </Button>
          )}
          
          {isAdmin && (
            <Button 
              variant={pro.featured ? "outline" : "default"} 
              className={`gap-2 ${pro.featured ? "border-yellow-500 text-yellow-600 hover:bg-yellow-50" : "bg-yellow-500 hover:bg-yellow-600 text-white"}`}
              onClick={toggleFeatured}
            >
              <Star className={`h-4 w-4 ${pro.featured ? "fill-yellow-500" : ""}`} />
              {pro.featured ? "Remover Top Profissional" : "Tornar Top Profissional"}
            </Button>
          )}
        </div>

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
              <h1 className="text-3xl font-bold text-foreground md:text-4xl flex flex-wrap items-center gap-2">
                {pro.name}
                <VerificationBadge verified={pro.verification_status === 'ativo' || pro.subscription_status === 'active'} size="lg" />
                {(isOwner || isAdmin) && (
                  <span className={`text-[10px] uppercase font-black px-2 py-1 rounded flex items-center gap-1 shadow-sm ${
                    pro.subscription_status === 'active' 
                    ? (pro.subscription_end_date && Math.ceil((new Date(pro.subscription_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) <= 5 
                       ? 'bg-red-500 text-white animate-pulse' 
                       : 'bg-emerald-500 text-white')
                    : 'bg-amber-100 text-amber-700'
                  }`}>
                    <Clock className="h-3 w-3" />
                    {(() => {
                      const finalDate = pro.subscription_end_date || pro.end_date || '2026-05-07';
                      const diff = new Date(finalDate).getTime() - new Date().getTime();
                      const daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
                      return daysRemaining > 0 ? `${daysRemaining} DIAS RESTANTES` : 'EXPIRA HOJE';
                    })()}
                  </span>
                )}
              </h1>
              <p className="text-lg text-muted-foreground">{pro.title}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                {category && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary border border-primary/20 shadow-sm">
                    <CategoryIcon name={category.icon || category.name || category.id} color={category.color} size="sm" className="h-4 w-4 p-0 shadow-none border-0 bg-transparent" />
                    {category.name}
                  </span>
                )}
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" /> {pro.location}
                </span>
                <span className="flex items-center gap-1 text-sm">
                  <Star className="h-4 w-4 fill-accent text-accent" />
                  <span className="font-semibold">{Number(pro.rating || 5.0).toFixed(1)}</span>
                  <span className="text-muted-foreground">({pro.reviewCount} avaliações)</span>
                </span>
                {pro.recommendation_percentage !== undefined && (
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border shadow-sm ${
                    pro.recommendation_percentage >= 80 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    <ThumbsUp className="h-3 w-3" />
                    {pro.recommendation_percentage}% Recomendam
                  </span>
                )}
              </div>
              
              {pro.category_ratings && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 border-t pt-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Pontualidade</span>
                    <span className="text-sm font-semibold flex items-center gap-1">
                      <Star className="h-3 w-3 fill-accent text-accent" /> {pro.category_ratings.punctuality}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Apresentação</span>
                    <span className="text-sm font-semibold flex items-center gap-1">
                      <Star className="h-3 w-3 fill-accent text-accent" /> {pro.category_ratings.presentation}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Técnico</span>
                    <span className="text-sm font-semibold flex items-center gap-1">
                      <Star className="h-3 w-3 fill-accent text-accent" /> {pro.category_ratings.technical}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <p className="mt-6 leading-relaxed text-muted-foreground">{pro.description}</p>

          <div className="mt-6 flex flex-wrap gap-3 text-white">
            {/* Botão de Contratar (Novo) */}
            {canReview === false && !isOwner && !hasHired && (
              <Button 
                onClick={handleHire} 
                disabled={isHiring}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm order-first sm:order-none w-full sm:w-auto"
              >
                <UserCheck className="h-4 w-4" />
                {isHiring ? "A registar..." : "Contratar Serviço"}
              </Button>
            )}

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
        {pro.portfolios && pro.portfolios.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6"
          >
            <h2 className="mb-4 text-xl font-bold text-foreground">Portfólio de Trabalhos</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {pro.portfolios.map((item: any, i: number) => (
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
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground flex items-center gap-2">
                        {review.author}
                        {review.would_recommend ? (
                          <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <ThumbsUp className="h-2.5 w-2.5" /> Recomendado
                          </span>
                        ) : review.would_recommend === false ? (
                          <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <ThumbsDown className="h-2.5 w-2.5" /> Não recomendado
                          </span>
                        ) : null}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, s) => (
                        <Star
                          key={s}
                          className={`h-3.5 w-3.5 ${s < review.rating ? "fill-accent text-accent" : "text-border"}`}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {review.punctuality_rating && (
                    <div className="mt-1 flex gap-3 text-[10px] text-muted-foreground font-medium">
                      <span>Pont.: {review.punctuality_rating}</span>
                      <span>Apr.: {review.presentation_rating}</span>
                      <span>Téc.: {review.technical_rating}</span>
                    </div>
                  )}

                  <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
                  <span className="mt-2 block text-xs text-muted-foreground">{review.date || 'Recente'}</span>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Formulário para Deixar Avaliação Estruturada */}
        {canReview ? (
          <motion.section
             initial={{ opacity: 0, y: 16 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.4 }}
             className="mt-8 border-t pt-8"
          >
             <h2 className="mb-4 text-xl font-bold text-foreground">Como foi o serviço com {pro.name}?</h2>
             <form onSubmit={handleReviewSubmit} className="bg-card border rounded-2xl p-6 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  {/* PONTUALIDADE */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase text-muted-foreground">Pontualidade</label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} type="button" onClick={() => setPunctuality(star)}>
                          <Star className={`h-5 w-5 ${punctuality >= star ? 'fill-accent text-accent' : 'text-border'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* APRESENTAÇÃO */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase text-muted-foreground">Apresentação</label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} type="button" onClick={() => setPresentation(star)}>
                          <Star className={`h-5 w-5 ${presentation >= star ? 'fill-accent text-accent' : 'text-border'}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* TÉCNICO */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase text-muted-foreground">Conhecimento Técnico</label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} type="button" onClick={() => setTechnical(star)}>
                          <Star className={`h-5 w-5 ${technical >= star ? 'fill-accent text-accent' : 'text-border'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* RECOMENDAÇÃO */}
                <div className="mb-6 p-4 rounded-xl bg-secondary/30 border border-border/50">
                  <span className="block text-sm font-semibold mb-3">Recomendaria este profissional a outros?</span>
                  <div className="flex gap-3">
                    <Button 
                      type="button" 
                      variant={wouldRecommend ? "default" : "outline"}
                      className={`gap-2 rounded-full ${wouldRecommend ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                      onClick={() => setWouldRecommend(true)}
                    >
                      <ThumbsUp className="h-4 w-4" /> Sim, recomendo
                    </Button>
                    <Button 
                      type="button"
                      variant={!wouldRecommend ? "destructive" : "outline"}
                      className={`gap-2 rounded-full`}
                      onClick={() => setWouldRecommend(false)}
                    >
                      <ThumbsDown className="h-4 w-4" /> Não recomendaria
                    </Button>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="comment" className="block text-sm font-medium mb-2 uppercase text-xs text-muted-foreground">Comentário opcional</label>
                  <Textarea 
                    id="comment" 
                    value={comment} 
                    onChange={(e) => setComment(e.target.value)} 
                    placeholder="Elogie o trabalho ou deixe sugestões de melhoria..." 
                    rows={4} 
                    className="rounded-xl"
                  />
                </div>
                
                <Button type="submit" disabled={submittingReview} className="w-full sm:w-auto bg-gradient-hero gap-2 text-primary-foreground min-w-[200px] h-12">
                  <Send className="h-4 w-4" /> {submittingReview ? "A publicar..." : "Publicar Avaliação"}
                </Button>
             </form>
          </motion.section>
        ) : (
          hasHired && existingReview && (
            <div className="mt-8 p-6 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center gap-3 text-emerald-800">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              <p className="text-sm font-medium">Já avaliou este serviço. Obrigado pelo seu feedback!</p>
            </div>
          )
        )}

        {/* Alerta de contratação necessária se logado e não dono */}
        {user && !isOwner && !hasHired && (
          <div className="mt-8 p-6 rounded-2xl border border-dashed border-primary/30 bg-primary/5 flex flex-col items-center text-center gap-3">
            <AlertTriangle className="h-8 w-8 text-primary/60" />
            <div>
              <h3 className="font-bold text-foreground">Quer avaliar este profissional?</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Para manter a confiança da comunidade, apenas utilizadores que contrataram o serviço podem deixar uma avaliação.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfessionalProfile;

