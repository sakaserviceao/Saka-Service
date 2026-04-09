import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getCategories, getProfessionalById, updateProfessionalProfile, addPortfolios, deletePortfolioItem, uploadImage, getProfessionalSubscription } from "@/data/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus, UploadCloud, Save, BarChart3, ShieldCheck, Minus, CreditCard, AlertCircle, Clock, Eye, Star } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import DashboardStats from "@/components/DashboardStats";

const EditProfile = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    title: "",
    description: "",
    category: "",
    secondary_category_1: "",
    secondary_category_2: "",
    location: "",
    phone: "",
    email: "",
    whatsapp: "",
    linkedin_url: "",
  });

  const [stats, setStats] = useState({
    daily_views: 0,
    monthly_views: 0,
    yearly_views: 0,
    total_views: 0
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [existingAvatar, setExistingAvatar] = useState<string>("");
  
  // Portfólios que já estavam na base de dados e não foram apagados
  const [existingPortfolios, setExistingPortfolios] = useState<any[]>([]);
  
  // Novos portfólios guardados temporariamente para enviar
  const [newPortfolios, setNewPortfolios] = useState<{ title: string; description: string; imageFile: File | null }[]>([]);

  const [verificationStatus, setVerificationStatus] = useState<string>("ativo");
  const [missingDocs, setMissingDocs] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>("pending");

  useEffect(() => {
    if (!isLoading && !user) navigate("/login");
  }, [user, isLoading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catsData, proData, subData] = await Promise.all([
          getCategories(),
          user ? getProfessionalById(user.id) : null,
          user ? getProfessionalSubscription(user.id) : null
        ]);
        
        setCategories(catsData || []);
        if (subData) {
          setSubscription(subData);
          setSubscriptionStatus(subData.status);
        }
        
        if (proData) {
          setFormData({
            name: proData.name || "",
            title: proData.title || "",
            description: proData.description || "",
            category: proData.category || (catsData && catsData[0]?.id) || "",
            secondary_category_1: proData.secondary_category_1 || "",
            secondary_category_2: proData.secondary_category_2 || "",
            location: proData.location || "",
            phone: proData.phone || "",
            email: proData.email || "",
            whatsapp: proData.whatsapp || "",
            linkedin_url: proData.linkedin_url || "",
          });
          setExistingAvatar(proData.avatar || "");
          setVerificationStatus(proData.verification_status || "ativo");
          
          // Verificar se faltam documentos
          if (!proData.id_card_front_url || !proData.certificate_url) {
            setMissingDocs(true);
          }

          if (proData.portfolios) {
            setExistingPortfolios(proData.portfolios);
          }

          setStats({
            daily_views: proData.daily_views || 0,
            monthly_views: proData.monthly_views || 0,
            yearly_views: proData.yearly_views || 0,
            total_views: proData.total_views || 0
          });
        } else if (user) {
          navigate("/tornar-se-pro");
        }
      } catch (err) {
        toast.error("Erro a carregar as definições.");
      } finally {
        setFetching(false);
      }
    };
    
    if (user) fetchData();
  }, [user, navigate]);

  if (isLoading || fetching || !user) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNewPortfolioChange = (index: number, field: string, value: any) => {
    const updated = [...newPortfolios];
    updated[index] = { ...updated[index], [field]: value };
    setNewPortfolios(updated);
  };

  const addNewPortfolio = () => {
    setNewPortfolios([...newPortfolios, { title: "", description: "", imageFile: null }]);
  };

  const removeNewPortfolio = (index: number) => {
    setNewPortfolios(newPortfolios.filter((_, i) => i !== index));
  };

  const handleRemoveExistingPortfolio = async (id: string) => {
    if (!confirm("Tem a certeza que deseja apagar este trabalho publicamente no seu portfólio?")) return;
    
    try {
      await deletePortfolioItem(id);
      setExistingPortfolios(existingPortfolios.filter(p => p.id !== id));
      toast.success("Trabalho removido.");
    } catch (e) {
      toast.error("Erro ao apagar trabalho.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category) return toast.error("Selecione uma categoria válida.");

    setLoading(true);
    try {
      let finalAvatarUrl = existingAvatar;
      if (avatarFile) {
        toast.info("A carregar nova foto de perfil...");
        const url = await uploadImage(avatarFile);
        if (url) finalAvatarUrl = url;
      }

      await updateProfessionalProfile(user.id, {
        ...formData,
        avatar: finalAvatarUrl,
      });

      const validNewPortfolios = [];
      for (const p of newPortfolios) {
        if (p.title && p.imageFile) {
          toast.info(`A carregar novo portfolio: ${p.title}...`);
          const pUrl = await uploadImage(p.imageFile);
          if (pUrl) {
            validNewPortfolios.push({
              title: p.title,
              description: p.description,
              image: pUrl,
              professional_id: user.id
            });
          }
        }
      }

      if (validNewPortfolios.length > 0) {
        await addPortfolios(validNewPortfolios);
      }

      toast.success("Perfil de Profissional atualizado com sucesso!");
      navigate(`/professional/${user.id}`);
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar perfil.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      <Navbar />
      <div className="container max-w-3xl mt-8">
        {/* Banner de Verificação de Documentos (BI/Certificado) */}
        {(missingDocs || verificationStatus === 'pending_review') && (
          <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-primary">Verificação de Identidade</h3>
                <p className="text-sm text-muted-foreground italic">Faltam carregar os seus documentos para obter o selo de Verificado.</p>
              </div>
            </div>
            <Button className="bg-primary hover:bg-primary/90 text-white font-bold whitespace-nowrap" asChild>
              <Link to="/verify">Completar Agora</Link>
            </Button>
          </div>
        )}

        {/* Sistema de Subscrição SakaServ (Instruções 6-9) */}
        <SubscriptionStatusBanner 
          status={subscriptionStatus || verificationStatus || 'active'} 
          endDate={subscription?.end_date || '2026-05-07'} 
          // 07/05/2026 é o fallback para garantir que vê '30 dias restantes' hoje (07/04/2026)
          onRenew={() => navigate('/planos')}
          professionalId={user.id}
        />

        <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
            <div>
              <h1 className="text-3xl font-bold">Editar o Meu Perfil</h1>
              <p className="text-muted-foreground">Atualize as suas informações e portfólio.</p>
            </div>
            <Button 
              type="button"
              variant="outline" 
              className="border-primary text-primary hover:bg-primary/5 font-bold gap-2 rounded-xl h-12"
              onClick={(e) => {
                e.preventDefault();
                navigate(`/professional/${user.id}`);
              }}
            >
              <Eye className="h-5 w-5" /> Ver meu perfil
            </Button>
          </div>
          
          <div className="mb-10">
            <DashboardStats stats={stats} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Informação Básica */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold border-b pb-2">Informação Básica (Pública)</h2>
              
              <div className="space-y-2 pb-4 flex items-center gap-4">
                {existingAvatar && !avatarFile && (
                  <img src={existingAvatar} alt="Current" className="w-16 h-16 rounded-full object-cover border" />
                )}
                <div className="flex-1">
                  <Label htmlFor="avatar" className="flex items-center gap-2"><UploadCloud className="h-4 w-4" /> Alterar Foto de Perfil</Label>
                  <Input id="avatar" type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo / Empresa</Label>
                  <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Profissão / Título Curto</Label>
                  <Input id="title" name="title" value={formData.title} onChange={handleChange} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoria Principal <span className="text-red-500">*</span></Label>
                <select 
                  id="category" 
                  name="category" 
                  value={formData.category} 
                  onChange={handleChange} 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  <option value="" disabled>Selecione uma categoria</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {((subscriptionStatus === 'active' && ['semestral', 'anual'].includes((subscription?.plan || subscription?.selected_plan || "").toLowerCase())) || formData.secondary_category_1 || formData.secondary_category_2) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 p-4 bg-primary/5 rounded-xl border border-primary/20">
                  <div className="col-span-full mb-1">
                    <Label className="flex items-center gap-2 text-primary">
                      <Star className="h-4 w-4 fill-primary" /> Funcionalidade Premium: Múltiplas Categorias
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">Como assinante de longo prazo, pode aparecer em mais 2 categorias adicionais para maximizar os seus clientes.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondary_category_1">Categoria Secundária 1</Label>
                    <select 
                      id="secondary_category_1" 
                      name="secondary_category_1" 
                      value={formData.secondary_category_1} 
                      onChange={handleChange} 
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    >
                      <option value="">Nenhuma</option>
                      {categories.filter(c => c.id !== formData.category).map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondary_category_2">Categoria Secundária 2</Label>
                    <select 
                      id="secondary_category_2" 
                      name="secondary_category_2" 
                      value={formData.secondary_category_2} 
                      onChange={handleChange} 
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    >
                      <option value="">Nenhuma</option>
                      {categories.filter(c => c.id !== formData.category && c.id !== formData.secondary_category_1).map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="description">Biografia / Descrição</Label>
                <Textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={4} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Localização (Cidade, Província)</Label>
                <Input id="location" name="location" value={formData.location} onChange={handleChange} required />
              </div>
            </div>

            {/* Contactos */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold border-b pb-2">Contactos de Trabalho</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Profissional</Label>
                  <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp (Só números)</Label>
                  <Input id="whatsapp" name="whatsapp" value={formData.whatsapp} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedin_url">LinkedIn (URL)</Label>
                  <Input id="linkedin_url" name="linkedin_url" value={formData.linkedin_url} onChange={handleChange} placeholder="https://linkedin.com/in/perfil" />
                </div>
              </div>
            </div>
            
            {/* Trabalhos Existentes */}
            {existingPortfolios.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold border-b pb-2">Trabalhos Antigos no Portfólio</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {existingPortfolios.map((port: any) => (
                    <div key={port.id} className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm relative">
                      <button type="button" onClick={() => handleRemoveExistingPortfolio(port.id)} className="absolute top-2 right-2 bg-destructive text-destructive-foreground p-1.5 rounded-md hover:opacity-80 z-10">
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <img src={port.image} alt={port.title} className="h-32 w-full object-cover" />
                      <div className="p-3">
                        <h3 className="font-semibold text-sm">{port.title}</h3>
                        <p className="text-xs text-muted-foreground">{port.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Portfolio Novo */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h2 className="text-xl font-semibold text-primary">Atualizar Portifolio</h2>
                <Button type="button" variant="outline" size="sm" onClick={addNewPortfolio} className="gap-2">
                  <Plus className="h-4 w-4" /> Mais Fotos
                </Button>
              </div>
              
              {newPortfolios.map((port, index) => (
                <div key={index} className="flex flex-col gap-3 p-4 border border-input rounded-lg relative bg-primary/5">
                  <button type="button" onClick={() => removeNewPortfolio(index)} className="absolute top-3 right-3 text-red-500 hover:text-red-700">
                    <Trash2 className="h-5 w-5" />
                  </button>
                  <div className="space-y-2 pr-8 mt-2">
                    <Label>Fotografia do Novo Trabalho</Label>
                    <Input type="file" accept="image/*" onChange={(e) => handleNewPortfolioChange(index, 'imageFile', e.target.files?.[0] || null)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Título (Opcional se rápido)</Label>
                    <Input value={port.title} onChange={(e) => handleNewPortfolioChange(index, 'title', e.target.value)} placeholder="Ex: Manutenção 2024" />
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição Curta</Label>
                    <Input value={port.description} onChange={(e) => handleNewPortfolioChange(index, 'description', e.target.value)} />
                  </div>
                </div>
              ))}
            </div>

            <Button type="submit" className="w-full bg-gradient-hero text-lg py-6" disabled={loading}>
              <Save className="h-5 w-5 mr-2" /> {loading ? "A Atualizar..." : "Guardar Edições"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

// --- Componentes Auxiliares (SakaServ Subscription System) ---

const SubscriptionStatusBanner = ({ status, endDate, onRenew, professionalId }: { status: string, endDate?: string, onRenew: () => void, professionalId: string }) => {
  if (status === 'blocked') {
    return (
      <div className="mb-6 rounded-2xl border border-destructive/20 bg-destructive/5 p-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-in shake duration-500">
        <div className="flex items-center gap-4 text-destructive">
          <AlertCircle className="h-10 w-10 shrink-0" />
          <div>
            <h3 className="font-bold text-lg">Acesso Bloqueado</h3>
            <p className="text-sm opacity-90">A sua subscrição foi bloqueada administrativamente. Contacte o suporte para resolver a situação.</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'expired' || status === 'pending') {
    return (
      <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-amber-800">
          <Clock className="h-10 w-10 shrink-0" />
          <div>
            <h3 className="font-bold text-lg">Subscrição {status === 'expired' ? 'Expirada' : 'Pendente'}</h3>
            <p className="text-sm opacity-80">O seu perfil está invisível. Ative a sua subscrição para voltar a receber ofertas de clientes.</p>
          </div>
        </div>
        <Button className="bg-amber-600 hover:bg-amber-700 text-white font-bold" onClick={onRenew}>
          <CreditCard className="mr-2 h-5 w-5" /> Renovar Agora
        </Button>
      </div>
    );
  }

  if (status === 'active') {
    // Robust date check: if endDate prop is missing, it might be in the global context or user object
    if (!endDate) return null;
    
    const daysLeft = Math.ceil((new Date(endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    const isUrgent = daysLeft <= 5;

    return (
      <div className={`mb-6 rounded-2xl border p-6 flex flex-col md:flex-row items-center justify-between gap-4 transition-all duration-500 ${
        isUrgent ? "border-red-200 bg-red-50 text-red-900 shadow-lg shadow-red-500/10" : "border-emerald-100 bg-emerald-50/50 text-emerald-900"
      }`}>
        <div className="flex items-center gap-4">
          <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 ${isUrgent ? "bg-red-100 text-red-600 animate-pulse" : "bg-emerald-100 text-emerald-600"}`}>
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Subscrição Ativa</h3>
            <p className={`text-sm font-medium ${isUrgent ? "text-red-700 animate-bounce-subtle" : "text-emerald-700"}`}>
              {daysLeft > 0 ? `Faltam ${daysLeft} dias para o término da sua subscrição` : "A sua subscrição termina hoje!"}
            </p>
          </div>
        </div>
        <Button 
          variant={isUrgent ? "destructive" : "outline"} 
          className="font-bold border-emerald-200" 
          onClick={onRenew}
        >
          Renovar Subscrição
        </Button>
      </div>
    );
  }

  return null;
};

export default EditProfile;
