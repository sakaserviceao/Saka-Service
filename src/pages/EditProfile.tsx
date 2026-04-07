import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getCategories, getProfessionalById, updateProfessionalProfile, addPortfolios, deletePortfolioItem, uploadImage, getProfessionalSubscription } from "@/data/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus, UploadCloud, Save, BarChart3, ShieldCheck, Minus, CreditCard, AlertCircle, Clock } from "lucide-react";
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
        {/* Banner de Verificação Pendente ou Falta de Docs */}
        {(missingDocs || verificationStatus === 'pending_review') && (
          <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-primary">Conta sem Verificação Completa</h3>
                <p className="text-sm text-muted-foreground">O seu perfil não possui documentos de identificação ou o certificado carregado. Complete o envio para ser um Profissional Verificado.</p>
              </div>
            </div>
            <Button className="bg-primary hover:bg-primary/90 text-white font-bold whitespace-nowrap" asChild>
              <Link to="/verify">Completar Verificação</Link>
            </Button>
          </div>
        )}

        {/* Banner de Subscrição */}
        {subscriptionStatus !== 'active' && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-amber-900">
                  Subscrição: {subscriptionStatus === 'pending' ? 'Pagamento Pendente' : subscriptionStatus === 'expired' ? 'Expirada' : 'Bloqueada'}
                </h3>
                <p className="text-sm text-amber-800/80">O seu perfil não está visível publicamente no site. Ative ou renove a sua subscrição para voltar a receber ofertas.</p>
              </div>
            </div>
            <Button className="bg-amber-600 hover:bg-amber-700 text-white font-bold whitespace-nowrap" onClick={() => navigate('/planos')}>
              Ativar / Renovar Agora
            </Button>
          </div>
        )}

        {/* Aviso de Expiração Próxima */}
        {subscriptionStatus === 'active' && subscription?.end_date && (
          (() => {
            const daysLeft = Math.ceil((new Date(subscription.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            if (daysLeft <= 5) {
              return (
                <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                      <Clock className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-red-900">A sua subscrição termina em {daysLeft} dias!</h3>
                      <p className="text-sm text-red-800/80">Renove hoje para garantir que o seu perfil continua visível no SakaService.</p>
                    </div>
                  </div>
                  <Button className="bg-red-600 hover:bg-red-700 text-white font-bold whitespace-nowrap" onClick={() => navigate('/planos')}>
                    Renovar Agora
                  </Button>
                </div>
              );
            }
            return null;
          })()
        )}

        <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
          <div className="mb-4">
            <h1 className="text-3xl font-bold">Editar o Meu Perfil</h1>
            <p className="text-muted-foreground mb-6">Atualize as suas informações ou acrescente trabalhos fotográficos recentes!</p>
            
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
                <Label htmlFor="category">Categoria</Label>
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

export default EditProfile;
