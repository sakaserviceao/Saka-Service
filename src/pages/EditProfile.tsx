import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  getCategories,
  getProfessionalById,
  updateProfessionalProfile,
  addPortfolios,
  updatePortfolioItem,
  deletePortfolioItem,
  uploadImage,
  getProfessionalSubscription,
  getSiteSettings,
  getProfessionalMessages,
  replyToServiceMessage,
  getUnreadMessagesCount
} from "@/data/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import SupportDialog from "@/components/SupportDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Trash2, Plus, UploadCloud, Save, ShieldCheck,
  CreditCard, AlertCircle, Clock, Eye, Star,
  MessageSquare, Send, ExternalLink, User, History, Image as ImageIcon,
  Headphones, Lock, EyeOff, Shield
} from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import DashboardStats from "@/components/DashboardStats";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { supabase } from "@/lib/supabase";

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

  const [existingPortfolios, setExistingPortfolios] = useState<any[]>([]);
  const [newPortfolios, setNewPortfolios] = useState<{ title: string; description: string; imageFile: File | null; videoFile: File | null; is_pinned: boolean }[]>([]);

  const [verificationStatus, setVerificationStatus] = useState<string>("ativo");
  const [missingDocs, setMissingDocs] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>("pending");
  const [settings, setSettings] = useState<any>({});

  const [messages, setMessages] = useState<any[]>([]);
  const [isFetchingMessages, setIsFetchingMessages] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [supportOpen, setSupportOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'messages') {
      setActiveTab('messages');
    }
  }, [location]);

  useEffect(() => {
    if (!isLoading && !user) navigate("/login");
  }, [user, isLoading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catsData, proData, subData, settingsData, countData] = await Promise.all([
          getCategories(),
          user ? getProfessionalById(user.id) : null,
          user ? getProfessionalSubscription(user.id) : null,
          getSiteSettings(),
          user ? getUnreadMessagesCount(user.id) : 0
        ]);

        setCategories(catsData || []);
        setSettings(settingsData || {});
        setUnreadCount(countData);
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

          if (!proData.id_card_front_url || (!proData.certificate_url && !proData.activity_video_url)) {
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

  useEffect(() => {
    const fetchMessages = async () => {
      if (!user) return;
      setIsFetchingMessages(true);
      try {
        const data = await getProfessionalMessages(user.id);
        setMessages(data || []);
      } catch (err) {
        console.error("Error fetching messages:", err);
      } finally {
        setIsFetchingMessages(false);
      }
    };

    if (user && activeTab === "messages") {
      fetchMessages();
    }
  }, [user, activeTab]);

  const handleReply = async (parentId: string) => {
    if (!replyText.trim() || !user) return;

    setIsSubmittingReply(true);
    try {
      const originalMsg = messages.find(m => m.id === parentId);
      if (!originalMsg) return;

      await replyToServiceMessage(parentId, {
        sender_id: user.id,
        receiver_id: originalMsg.sender_id,
        professional_id: user.id,
        content: replyText
      });

      toast.success("Resposta enviada com sucesso!");
      setReplyText("");
      setReplyingTo(null);
      const updatedMessages = await getProfessionalMessages(user.id);
      setMessages(updatedMessages || []);
    } catch (err) {
      toast.error("Erro ao enviar resposta.");
    } finally {
      setIsSubmittingReply(false);
    }
  };

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
    setNewPortfolios([...newPortfolios, { title: "", description: "", imageFile: null, videoFile: null, is_pinned: false }]);
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

  const handleTogglePinExisting = async (id: string, currentPin: boolean) => {
    const pinnedCount = existingPortfolios.filter(p => p.is_pinned).length + newPortfolios.filter(p => p.is_pinned).length;
    
    if (!currentPin && pinnedCount >= 3) {
      toast.error("Só pode afixar até 3 grandes serviços.");
      return;
    }

    try {
      await updatePortfolioItem(id, { is_pinned: !currentPin });
      setExistingPortfolios(existingPortfolios.map(p => p.id === id ? { ...p, is_pinned: !currentPin } : p));
      toast.success(!currentPin ? "Serviço afixado!" : "Serviço desafixado.");
    } catch (e) {
      toast.error("Erro ao atualizar destaque.");
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
      const totalVideos = existingPortfolios.filter(p => p.video_url).length;
      let newVideosCount = 0;

      for (const p of newPortfolios) {
        if (p.title && (p.imageFile || p.videoFile)) {
          if (p.videoFile) newVideosCount++;
        }
      }

      if (totalVideos + newVideosCount > 1) {
        setLoading(false);
        return toast.error("Só é permitido carregar 1 vídeo no portfólio.");
      }

      for (const p of newPortfolios) {
        if (p.title && (p.imageFile || p.videoFile)) {
          toast.info(`A carregar novo portfolio: ${p.title}...`);
          
          let mediaUrl = "";
          let isVideo = false;

          if (p.videoFile) {
            mediaUrl = await uploadImage(p.videoFile) || "";
            isVideo = true;
          } else if (p.imageFile) {
            mediaUrl = await uploadImage(p.imageFile) || "";
          }

          if (mediaUrl) {
            validNewPortfolios.push({
              title: p.title,
              description: p.description,
              image: isVideo ? "" : mediaUrl,
              video_url: isVideo ? mediaUrl : "",
              is_pinned: p.is_pinned,
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

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("A palavra-passe deve ter pelo menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("As palavras-passe não coincidem.");
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Palavra-passe atualizada com sucesso!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar palavra-passe.");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      <Navbar />
      <div className="container max-w-3xl mt-8">
        <SubscriptionStatusBanner
          status={subscriptionStatus || verificationStatus || 'active'}
          endDate={subscription?.end_date || '2026-05-07'}
          onRenew={() => navigate('/planos')}
          professionalId={user.id}
          settings={settings}
          hasSubscription={!!subscription}
        />

        <div className="bg-card border border-border rounded-xl p-0 shadow-sm overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="bg-secondary/20 border-b px-8 pt-6">
              <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold">Painel do Profissional</h1>
                  <p className="text-muted-foreground text-sm">Gerencie o seu perfil e responda aos seus clientes.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-primary text-primary hover:bg-primary/5 font-bold gap-2 rounded-xl h-10"
                    onClick={() => setSupportOpen(true)}
                  >
                    <Headphones className="h-4 w-4" /> Suporte
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-primary text-primary hover:bg-primary/5 font-bold gap-2 rounded-xl h-10"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(`/professional/${user.id}`);
                    }}
                  >
                    <Eye className="h-4 w-4" /> Ver perfil público
                  </Button>
                </div>
              </div>

              <TabsList className="bg-transparent border-b-0 h-auto p-0 gap-8">
                <TabsTrigger
                  value="profile"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent bg-transparent px-0 py-3 font-bold text-sm transition-all"
                >
                  <User className="h-4 w-4 mr-2" /> Editar Dados
                </TabsTrigger>
                <TabsTrigger
                  value="messages"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent bg-transparent px-0 py-3 font-bold text-sm transition-all relative"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Mensagens
                  {unreadCount > 0 && (
                    <Badge className="ml-2 bg-primary h-5 w-5 flex items-center justify-center p-0 text-[10px] animate-pulse">
                      {unreadCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="security"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent bg-transparent px-0 py-3 font-bold text-sm transition-all"
                >
                  <Lock className="h-4 w-4 mr-2" /> Segurança
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="profile" className="p-8 mt-0 border-none outline-none">
              <div className="mb-10">
                <DashboardStats stats={stats} />
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
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

                {existingPortfolios.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold border-b pb-2">Trabalhos Antigos no Portfólio</h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {existingPortfolios.map((port: any) => (
                        <div key={port.id} className={`group overflow-hidden rounded-xl border border-border bg-card shadow-sm relative transition-all ${port.is_pinned ? 'border-primary ring-1 ring-primary/20 bg-primary/5' : 'border-gradient-hero'}`}>
                          <div className="absolute top-2 right-2 flex gap-1 z-10">
                            <button 
                              type="button" 
                              onClick={() => handleTogglePinExisting(port.id, port.is_pinned)} 
                              className={`p-1.5 rounded-md hover:opacity-80 shadow-sm ${port.is_pinned ? 'bg-primary text-white' : 'bg-background border text-muted-foreground'}`}
                              title={port.is_pinned ? "Desafixar" : "Afixar como Grande Serviço"}
                            >
                              <Plus className={`h-4 w-4 transition-transform ${port.is_pinned ? 'rotate-45' : ''}`} />
                            </button>
                            <button 
                              type="button" 
                              onClick={() => handleRemoveExistingPortfolio(port.id)} 
                              className="bg-destructive text-destructive-foreground p-1.5 rounded-md hover:opacity-80"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          
                          {port.video_url ? (
                            <div className="h-32 w-full bg-black flex items-center justify-center">
                              <UploadCloud className="h-8 w-8 text-white/40" />
                            </div>
                          ) : (
                            <img src={port.image} alt={port.title} className="h-32 w-full object-cover" />
                          )}
                          
                          <div className="p-3">
                            <h3 className="font-semibold text-sm flex items-center gap-2">
                              {port.title}
                              {port.is_pinned && <Badge variant="secondary" className="text-[8px] h-4">DESTAQUE</Badge>}
                            </h3>
                            <p className="text-xs text-muted-foreground line-clamp-1">{port.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h2 className="text-xl font-semibold text-primary">Atualizar Portifolio</h2>
                    <Button type="button" variant="outline" size="sm" onClick={addNewPortfolio} className="gap-2">
                      <Plus className="h-4 w-4" /> Mais Fotos
                    </Button>
                  </div>

                  {newPortfolios.map((port, index) => (
                    <div key={index} className={`flex flex-col gap-3 p-4 border rounded-lg relative bg-primary/5 transition-all ${port.is_pinned ? 'border-primary ring-1 ring-primary/20' : 'border-input border-gradient-hero'}`}>
                      <div className="absolute top-3 right-3 flex gap-2">
                         <button 
                            type="button" 
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold shadow-sm transition-all ${port.is_pinned ? 'bg-primary text-white' : 'bg-background border text-muted-foreground'}`}
                            onClick={() => {
                              const pinnedCount = existingPortfolios.filter(p => p.is_pinned).length + newPortfolios.filter(p => p.is_pinned).length;
                              if (!port.is_pinned && pinnedCount >= 3) {
                                toast.error("Só pode afixar até 3 grandes serviços.");
                                return;
                              }
                              handleNewPortfolioChange(index, 'is_pinned', !port.is_pinned);
                            }}
                          >
                            <Plus className={`h-3 w-3 ${port.is_pinned ? 'rotate-45' : ''}`} />
                            {port.is_pinned ? "AFIXADO" : "AFIXAR"}
                          </button>
                        <button type="button" onClick={() => removeNewPortfolio(index)} className="text-red-500 hover:text-red-700 bg-background/80 p-1 rounded-md border shadow-sm">
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <ImageIcon className="h-4 w-4" /> Foto do Trabalho
                          </Label>
                          <Input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              handleNewPortfolioChange(index, 'imageFile', file);
                              if (file) handleNewPortfolioChange(index, 'videoFile', null);
                            }} 
                            disabled={port.videoFile !== null}
                          />
                        </div>

                        <div className="space-y-2 relative">
                          <Label className="flex items-center gap-2">
                            <UploadCloud className="h-4 w-4" /> Vídeo (Max 10MB)
                          </Label>
                          <Input 
                            type="file" 
                            accept="video/*" 
                            onChange={(e) => {
                              const hasExistingVideo = existingPortfolios.some(p => p.video_url);
                              const hasOtherNewVideo = newPortfolios.some((p, idx) => p.videoFile && idx !== index);
                              
                              if (hasExistingVideo || hasOtherNewVideo) {
                                toast.error("Limite atingido: Cada profissional pode ter apenas 1 vídeo no portfólio.");
                                e.target.value = "";
                                return;
                              }

                              const file = e.target.files?.[0] || null;
                              if (file && file.size > 10 * 1024 * 1024) {
                                toast.error("O vídeo excede o limite de 10MB.");
                                e.target.value = "";
                                return;
                              }
                              handleNewPortfolioChange(index, 'videoFile', file);
                              if (file) handleNewPortfolioChange(index, 'imageFile', null);
                            }} 
                            disabled={port.imageFile !== null || existingPortfolios.some(p => p.video_url) || newPortfolios.some((p, idx) => p.videoFile && idx !== index)}
                          />
                          {(existingPortfolios.some(p => p.video_url) || newPortfolios.some((p, idx) => p.videoFile && idx !== index)) && (
                            <p className="text-[9px] text-orange-600 mt-1 font-medium">Já existe um vídeo carregado no seu portfólio.</p>
                          )}
                        </div>
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

                {(missingDocs || verificationStatus === 'pending_review' || verificationStatus === 'rejeitado') && (
                  <div className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className={`h-10 w-10 ${verificationStatus === "ativo" ? "text-green-500" : "text-orange-500 hover:animate-pulse"}`} />
                      <div>
                        <h3 className="font-bold text-lg">
                          Estado de Verificação: {verificationStatus === "ativo" ? (
                            <span className="text-green-600">Verificado</span>
                          ) : verificationStatus === "rejeitado" ? (
                            <span className="text-red-500">Rejeitado</span>
                          ) : (
                            <span className="text-orange-600">Pendente</span>
                          )}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {verificationStatus === "ativo" 
                            ? "O seu perfil está verificado e transmite confiança total aos clientes."
                            : verificationStatus === "rejeitado"
                              ? "Os seus documentos foram rejeitados. Por favor, submeta novamente documentos válidos."
                              : missingDocs 
                                ? (settings.msg_verification_pending || "Faltam carregar os seus documentos para obter o selo de Verificado")
                                : "Os seus documentos estão a ser analisados manualmente pela nossa equipa."
                          }
                        </p>
                      </div>
                    </div>
                    {verificationStatus === 'pending_review' && !missingDocs ? (
                      <Button className="bg-muted text-muted-foreground font-bold whitespace-nowrap cursor-not-allowed" disabled>
                         Aguarde...
                      </Button>
                    ) : (
                      <Button className="bg-primary hover:bg-primary/90 text-white font-bold whitespace-nowrap" asChild>
                        <Link to="/verify">
                          {verificationStatus === 'rejeitado' ? "Corrigir Agora" : "Completar Agora"}
                        </Link>
                      </Button>
                    )}
                  </div>
                )}
              </form>
            </TabsContent>

            <TabsContent value="messages" className="p-8 mt-0 border-none outline-none min-h-[600px]">
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Inbox de Pedidos</h2>
                    <p className="text-sm text-muted-foreground">Mensagens diretas de clientes interessados nos seus serviços.</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab("messages")} className="gap-2">
                    <History className="h-4 w-4" /> Atualizar
                  </Button>
                </div>

                {isFetchingMessages ? (
                  <div className="flex items-center justify-center py-20 text-muted-foreground">
                    <Clock className="h-5 w-5 mr-2 animate-spin" /> A carregar mensagens...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-20 bg-secondary/5 rounded-2xl border border-dashed flex flex-col items-center gap-4">
                    <div className="h-16 w-16 bg-primary/5 rounded-full flex items-center justify-center text-primary/20">
                      <MessageSquare className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="font-bold">Sem mensagens ainda</h3>
                      <p className="text-sm text-muted-foreground">Quando um cliente o contratar, o pedido aparecerá aqui.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`rounded-2xl border transition-all border-gradient-hero ${msg.status === 'unread' ? 'border-primary/30 bg-primary/5 shadow-md shadow-primary/5' : 'border-border bg-card'
                          }`}
                      >
                        <div className="p-6">
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div className="flex items-start gap-4">
                              <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground shrink-0 border shadow-sm">
                                <User className="h-6 w-6" />
                              </div>
                              <div>
                                <div className="flex items-center gap-3 mb-1">
                                  <h4 className="font-bold text-lg">{msg.sender_name || 'Cliente Sakaservice'}</h4>
                                  <Badge variant={msg.status === 'replied' ? 'success' : 'outline'} className="capitalize text-[10px]">
                                    {msg.status === 'replied' ? 'Respondido' : 'Pendente'}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3 font-medium">
                                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {format(new Date(msg.created_at), "dd MMM, HH:mm", { locale: pt })}</span>
                                </div>

                                <div className="bg-white/80 dark:bg-black/20 p-4 rounded-xl border border-border/50 text-foreground shadow-inner">
                                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                </div>

                                {msg.attachment_url && (
                                  <div className="mt-4">
                                    <a
                                      href={msg.attachment_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-2 p-2 px-4 rounded-lg bg-primary/10 border border-primary/20 text-xs font-bold text-primary hover:bg-primary/20 transition-colors"
                                    >
                                      <ImageIcon className="h-4 w-4" /> Ver Anexo Enviado Pelo Cliente
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex md:flex-col gap-2 shrink-0">
                              {msg.status !== 'replied' && replyingTo !== msg.id && (
                                <Button
                                  size="sm"
                                  className="bg-primary hover:bg-primary/90 gap-2 font-bold shadow-sm"
                                  onClick={() => setReplyingTo(msg.id)}
                                >
                                  <Send className="h-4 w-4 text-[10px]" /> Responder
                                </Button>
                              )}
                            </div>
                          </div>

                          {replyingTo === msg.id && (
                            <div className="mt-6 pt-6 border-t animate-in fade-in slide-in-from-top-2 duration-300">
                              <div className="space-y-4">
                                <Label className="text-sm font-bold flex items-center gap-2">
                                  <Send className="h-4 w-4 text-primary" /> Escrever Resposta
                                </Label>
                                <Textarea
                                  placeholder="Explique o seu orçamento, disponibilidade ou peça mais detalhes..."
                                  className="min-h-[100px] rounded-xl border-primary/20 focus-visible:ring-primary"
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                />
                                <div className="flex justify-end gap-3">
                                  <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)} className="font-bold">
                                    Cancelar
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="bg-emerald-600 hover:bg-emerald-700 font-bold gap-2 shadow-sm"
                                    onClick={() => handleReply(msg.id)}
                                    disabled={isSubmittingReply || !replyText.trim()}
                                  >
                                    {isSubmittingReply ? "A enviar..." : "Enviar Resposta"} <Send className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="security" className="p-8 mt-0 border-none outline-none min-h-[500px]">
              <div className="max-w-md mx-auto py-8">
                <div className="text-center mb-8">
                  <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-4">
                    <Shield className="h-8 w-8" />
                  </div>
                  <h2 className="text-2xl font-bold">Segurança da Conta</h2>
                  <p className="text-sm text-muted-foreground">Atualize a sua palavra-passe para manter a sua conta segura.</p>
                </div>

                <form onSubmit={handlePasswordUpdate} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-password">Nova Palavra-passe</Label>
                      <div className="relative">
                        <Input 
                          id="new-password" 
                          type={showNewPassword ? "text" : "password"} 
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Mínimo 6 caracteres"
                          className="pr-10 h-12 rounded-xl"
                          required
                        />
                        <button 
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirmar Nova Palavra-passe</Label>
                      <Input 
                        id="confirm-password" 
                        type={showNewPassword ? "text" : "password"} 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repita a palavra-passe"
                        className="h-12 rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-hero py-6 h-auto font-bold text-lg rounded-xl shadow-lg shadow-primary/20"
                    disabled={passwordLoading}
                  >
                    {passwordLoading ? "A atualizar..." : "Atualizar Palavra-passe"}
                  </Button>
                </form>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <div className="h-20" />
      <SupportDialog open={supportOpen} onOpenChange={setSupportOpen} />
    </div>
  );
};

function SubscriptionStatusBanner({ status, endDate, onRenew, professionalId, settings, hasSubscription }: { status: string, endDate?: string, onRenew: () => void, professionalId: string, settings: any, hasSubscription: boolean }) {
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
            <p className="text-sm opacity-80">{settings.msg_subscription_pending || "O seu perfil está invisível. Ative a sua subscrição para voltar a receber ofertas de clientes."}</p>
          </div>
        </div>
        <Button 
          className="w-full bg-gradient-hero text-lg py-6 group"
          onClick={onRenew}
        >
          <CreditCard className={`mr-2 h-5 w-5 ${!hasSubscription ? "text-[#00ffd5]" : ""}`} /> 
          <span className={!hasSubscription ? "text-[#00ffd5] drop-shadow-[0_0_8px_rgba(0,255,213,0.4)]" : "text-white"}>
            {hasSubscription ? "Renovar Agora" : "Ative a subscrição"}
          </span>
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
      <div className={`mb-6 rounded-2xl border p-6 flex flex-col md:flex-row items-center justify-between gap-4 transition-all duration-500 ${isUrgent ? "border-red-200 bg-red-50 text-red-900 shadow-lg shadow-red-500/10" : "border-emerald-100 bg-emerald-50/50 text-emerald-900"
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
