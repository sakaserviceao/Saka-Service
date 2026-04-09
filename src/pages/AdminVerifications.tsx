import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getPendingVerifications, 
  getAllProfessionals, 
  adminUpdateVerificationStatus, 
  adminUpdateFeaturedStatus, 
  adminRejectVerification,
  deleteProfessional,
  supabase,
  getAdmins,
  addAdmin,
  removeAdmin,
  getSiteStats,
  getTopProfiles,
  getSiteSettings,
  updateSiteSetting,
  updateCategory,
  getCategories,
  getPendingSubscriptions,
  getAllSubscriptions,
  approveSubscription,
  rejectSubscription
} from "@/data/api";
import { Button } from "@/components/ui/button";
import { Check, X, ExternalLink, Shield, ShieldCheck, Users, FileText, ArrowLeft, Search, AlertCircle, Star, Pause, RotateCcw, Settings, Plus, Trash2, Mail, BarChart3, TrendingUp, Calendar, Eye, LayoutGrid, Save, Image as ImageIcon, CreditCard, Receipt, Clock, CheckCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

const AdminVerifications = () => {
  const queryClient = useQueryClient();
  const { user, isLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [viewMode, setViewMode] = useState<'pending' | 'all' | 'settings' | 'analytics' | 'platform' | 'subscriptions'>('pending');
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newManagerEmail, setNewManagerEmail] = useState("");

  // Restricted Access Check
  if (isLoading) return <div className="flex justify-center py-20">Verificando permissões...</div>;

  // Restricted Access Check (Moved below queries)

  const { data: pending = [], isLoading: isLoadingPending, error } = useQuery({
    queryKey: ['pendingVerifications'],
    queryFn: getPendingVerifications,
  });

  const { data: allPros = [], isLoading: isLoadingAll } = useQuery({
    queryKey: ['allProfessionals'],
    queryFn: getAllProfessionals,
  });

  const { data: adminList = [], isLoading: isLoadingAdmins } = useQuery({
    queryKey: ['adminList'],
    queryFn: getAdmins,
  });

  // Check if current user is in the admin list
  const isAdmin = adminList.some((admin: any) => admin.email === user?.email) || 
                  user?.email === 'franciscobeneditomucamba@gmail.com' || 
                  user?.email === 'francisco.mucamba@gmail.com' || 
                  user?.email === 'sakaservice.ao@gmail.com';

  const { data: settings = {}, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['siteSettings'],
    queryFn: getSiteSettings,
  });

  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });
  
  const { data: pendingSubs = [], isLoading: isLoadingPendingSubs } = useQuery({
    queryKey: ['pendingSubscriptions'],
    queryFn: getPendingSubscriptions,
  });

  const { data: allSubs = [], isLoading: isLoadingAllSubs } = useQuery({
    queryKey: ['allSubscriptions'],
    queryFn: getAllSubscriptions,
  });

  const managerList = (settings.manager_emails || "").split(',').filter(Boolean);
  const isManager = managerList.includes(user?.email || "") || 
                    user?.email === 'podosk2010@hotmail.com';

  const isAuthorized = isAdmin || isManager;

  // Restricted Access Check
  if (!isLoadingAdmins && !isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <Shield className="h-16 w-16 text-destructive/20 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Acesso Restrito</h1>
        <p className="text-muted-foreground mb-6">Apenas administradores ou gestores autorizados podem aceder a esta página.</p>
        <Button asChild><Link to="/">Voltar ao Início</Link></Button>
      </div>
    );
  }


  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('professionals')
        .select('*')
        .or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      
      if (error) throw error;
      setSearchResults(data || []);
      if (data?.length === 0) toast.error("Nenhum profissional encontrado.");
    } catch (e: any) {
      toast.error("Erro na busca: " + e.message);
    } finally {
      setSearching(false);
    }
  };

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: 'ativo' | 'suspenso' | 'removido' }) => 
      adminUpdateVerificationStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingVerifications'] });
      queryClient.invalidateQueries({ queryKey: ['allProfessionals'] });
      toast.success("Estado de verificação atualizado!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar estado.");
    }
  });

  const featuredMutation = useMutation({
    mutationFn: ({ id, featured }: { id: string, featured: boolean }) => 
      adminUpdateFeaturedStatus(id, featured),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingVerifications'] });
      queryClient.invalidateQueries({ queryKey: ['allProfessionals'] });
      toast.success("Destaque atualizado!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar destaque.");
    }
  });
  
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProfessional(id),
    onSuccess: (_, deletedId) => {
      // Remover instantaneamente da cache local para feedback imediato
      queryClient.setQueryData(['allProfessionals'], (old: any[] | undefined) => 
        old ? old.filter(p => p.id !== deletedId) : []
      );
      queryClient.setQueryData(['pendingVerifications'], (old: any[] | undefined) => 
        old ? old.filter(p => p.id !== deletedId) : []
      );
      
      // Limpar resultados de pesquisa se existirem
      setSearchResults(prev => prev.filter(p => p.id !== deletedId));
      
      // Re-validar para garantir consistência
      queryClient.invalidateQueries({ queryKey: ['pendingVerifications'] });
      queryClient.invalidateQueries({ queryKey: ['allProfessionals'] });
      
      toast.success("Perfil eliminado permanentemente!");
    },
    onError: (error: any) => {
      // Re-invalidar se falhar para trazer o perfil de volta à vista (pois o setQueryData removeu-o)
      queryClient.invalidateQueries({ queryKey: ['allPros'] });
      queryClient.invalidateQueries({ queryKey: ['allProfessionals'] });
      queryClient.invalidateQueries({ queryKey: ['pendingVerifications'] });
      toast.error(`Falha ao eliminar: ${error.message || "Permissão negada pela base de dados"}`);
    }
  });

  return (
    <div className="min-h-screen bg-background pb-12">
      <Navbar />
      <div className="container mt-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="text-primary" /> Painel de Verificação
            </h1>
            <p className="text-muted-foreground">Analise os documentos e aprove perfis de profissionais.</p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Início</Link>
          </Button>
        </div>

        {/* Manual Search Bar */}
        <div className="mb-8 flex gap-4">
          <div className="flex-1">
            <input 
              type="text" 
              placeholder="Pesquisar por nome ou email (ex: Okusaka)" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full h-12 rounded-xl border bg-card px-4 outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <Button onClick={handleSearch} disabled={searching} className="bg-primary/10 text-primary hover:bg-primary/20">
            {searching ? "A pesquisar..." : "Procurar Manualmente"}
          </Button>
        </div>

        {/* Database Error Messenger */}
        {error && (
          <div className="mb-8 rounded-xl bg-destructive/10 p-6 text-destructive border border-destructive/20">
            <h3 className="font-bold flex items-center gap-2 mb-1"><AlertCircle className="h-4 w-4" /> Erro de Base de Dados</h3>
            <p className="text-sm">O sistema não conseguiu carregar os dados. Verifique se executou o script SQL no painel do Supabase. Erro: {(error as any).message}</p>
          </div>
        )}

        {/* Search Results Section */}
        {searchResults.length > 0 && (
          <div className="mb-12 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Resultados da Pesquisa ({searchResults.length})</h2>
              <Button variant="ghost" size="sm" onClick={() => setSearchResults([])}>Limpar Busca</Button>
            </div>
            <div className="grid gap-6">
              {searchResults.map((pro: any) => (
                <VerificationItem 
                  key={pro.id} 
                  pro={pro} 
                  mutation={mutation} 
                  featuredMutation={featuredMutation}
                  deleteMutation={deleteMutation}
                />
              ))}
            </div>
            <hr className="my-10" />
          </div>
        )}

        {/* View Mode Selector */}
        <div className="flex gap-2 mb-6">
          <Button 
            variant={viewMode === 'pending' ? 'default' : 'outline'} 
            onClick={() => setViewMode('pending')}
            className="rounded-full"
          >
            Pendentes Review ({pending.length})
          </Button>
          <Button 
            variant={viewMode === 'all' ? 'default' : 'outline'} 
            onClick={() => setViewMode('all')}
            className="rounded-full"
          >
            Todos os Perfis ({allPros.length})
          </Button>
          {isAdmin && (
            <>
              <Button 
                variant={viewMode === 'settings' ? 'default' : 'outline'} 
                onClick={() => setViewMode('settings')}
                className="rounded-full flex items-center gap-2"
              >
                <Settings className="h-4 w-4" /> Configurações
              </Button>
              <Button 
                variant={viewMode === 'platform' ? 'default' : 'outline'} 
                onClick={() => setViewMode('platform')}
                className="rounded-full flex items-center gap-2 font-bold bg-primary/5 border-primary/20 text-primary hover:bg-primary/10"
              >
                <LayoutGrid className="h-4 w-4" /> Gestão [Admin]
              </Button>
            </>
          )}
          <Button 
            variant={viewMode === 'subscriptions' ? 'default' : 'outline'} 
            onClick={() => setViewMode('subscriptions')}
            className={`rounded-full flex items-center gap-2 ${pendingSubs.length > 0 ? "border-amber-500 text-amber-600 bg-amber-50" : ""}`}
          >
            <CreditCard className="h-4 w-4" /> Pagamentos 
            {pendingSubs.length > 0 && <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">{pendingSubs.length}</span>}
          </Button>
          <Button 
            variant={viewMode === 'analytics' ? 'default' : 'outline'} 
            onClick={() => setViewMode('analytics')}
            className="rounded-full flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" /> Analítica
          </Button>
        </div>

        {/* Main Content Section */}
        {viewMode === 'pending' ? (
          <>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" /> Perfis que Aguardam Verificação
            </h2>
            {isLoadingPending ? (
              <div className="flex justify-center py-20">A carregar veríficacões pendentes...</div>
            ) : pending.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-20 text-center">
                <Check className="mx-auto h-12 w-12 text-muted-foreground opacity-20 mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">Não há pedidos de verificação pendentes.</h3>
              </div>
            ) : (
              <div className="grid gap-6">
                {pending.map((pro: any) => (
                  <VerificationItem 
                    key={pro.id} 
                    pro={pro} 
                    mutation={mutation} 
                    featuredMutation={featuredMutation}
                    deleteMutation={deleteMutation}
                  />
                ))}
              </div>
            )}
          </>
        ) : viewMode === 'all' ? (
          <>
            <h2 className="text-xl font-bold mb-4">Todos os Profissionais na Plataforma</h2>
            {isLoadingAll ? (
              <div className="flex justify-center py-20">A carregar todos os perfis...</div>
            ) : allPros.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-20 text-center">
                <Search className="mx-auto h-12 w-12 text-muted-foreground opacity-20 mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">Nenhum profissional registado.</h3>
              </div>
            ) : (
              <div className="grid gap-6">
                {allPros.map((pro: any) => (
                  <VerificationItem 
                    key={pro.id} 
                    pro={pro} 
                    mutation={mutation} 
                    featuredMutation={featuredMutation}
                    deleteMutation={deleteMutation}
                  />
                ))}
              </div>
            )}
          </>
        ) : viewMode === 'settings' ? (
          <SettingsPanel 
            adminList={adminList} 
            newEmail={newAdminEmail} 
            setNewEmail={setNewAdminEmail}
            managerList={managerList}
            newManagerEmail={newManagerEmail}
            setNewManagerEmail={setNewManagerEmail}
            onAdd={() => {
              if (!newAdminEmail.includes('@')) return toast.error("E-mail inválido");
              addAdmin(newAdminEmail)
                .then(() => {
                  toast.success("Administrador adicionado!");
                  setNewAdminEmail("");
                  queryClient.invalidateQueries({ queryKey: ['adminList'] });
                })
                .catch(err => toast.error("Erro: " + err.message));
            }}
            onRemove={(email: string) => {
              if (email === user?.email) return toast.error("Não pode remover-se a si mesmo!");
              if (confirm(`Remover ${email} da lista de administradores?`)) {
                removeAdmin(email)
                  .then(() => {
                    toast.success("Administrador removido.");
                    queryClient.invalidateQueries({ queryKey: ['adminList'] });
                  })
                  .catch(err => toast.error("Erro: " + err.message));
              }
            }}
            onAddManager={() => {
              if (!newManagerEmail.includes('@')) return toast.error("E-mail inválido");
              if (managerList.includes(newManagerEmail)) return toast.error("Este e-mail já é um gestor operacional");
              
              const newList = [...managerList, newManagerEmail].join(',');
              updateSiteSetting('manager_emails', newList)
                .then(() => {
                  toast.success("Gestor Operacional adicionado com sucesso!");
                  setNewManagerEmail("");
                  queryClient.invalidateQueries({ queryKey: ['siteSettings'] });
                })
                .catch(err => toast.error("Erro ao adicionar gestor: " + err.message));
            }}
            onRemoveManager={(email: string) => {
              if (confirm(`Remover ${email} das funções de gestor?`)) {
                const newList = managerList.filter((e: string) => e !== email).join(',');
                updateSiteSetting('manager_emails', newList)
                  .then(() => {
                    toast.success("Gestor removido.");
                    queryClient.invalidateQueries({ queryKey: ['siteSettings'] });
                  })
                  .catch(err => toast.error("Erro ao remover gestor: " + err.message));
              }
            }}
          />
        ) : viewMode === 'analytics' ? (
          <AnalyticsPanel />
        ) : viewMode === 'subscriptions' ? (
          <SubscriptionManagementPanel 
            pendingSubs={pendingSubs} 
            allSubs={allSubs} 
            loading={isLoadingPendingSubs || isLoadingAllSubs} 
          />
        ) : (
          <PlatformManagementPanel settings={settings} categories={categories} />
        )}
      </div>
    </div>
  );
};

// Platform Management Panel
const PlatformManagementPanel = ({ settings, categories }: { settings: any, categories: any[] }) => {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const handleUpdateSetting = async (key: string, value: string) => {
    try {
      setLoading(true);
      await updateSiteSetting(key, value);
      toast.success(`Definição "${key}" atualizada.`);
      queryClient.invalidateQueries({ queryKey: ['siteSettings'] });
    } catch (e: any) {
      toast.error(e.message || "Erro ao atualizar definição.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCategoryBanner = async (id: string, bannerUrl: string) => {
    try {
      setLoading(true);
      await updateCategory(id, { banner_url: bannerUrl });
      toast.success("Banner da categoria atualizado.");
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    } catch (e: any) {
      toast.error(e.message || "Erro ao atualizar categoria.");
    } finally {
      setLoading(false);
    }
  };

  if (Object.keys(settings).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground animate-pulse">
        <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
        <p>A carregar as suas configurações...</p>
      </div>
    );
  }

  return (
    <div key={settings.brand_name || 'management-panel'} className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header with Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-primary/5 p-6 rounded-2xl border border-primary/10">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" /> Configurações da Plataforma
          </h3>
          <p className="text-sm text-muted-foreground mt-1">Configure métricas, banners globais e publicidade por categoria.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button 
            variant="outline" 
            asChild 
            className="bg-background border-primary/20 hover:bg-primary/5"
          >
            <a 
              href="https://supabase.com/dashboard/project/zldaauprystajzxfypmc/storage/files" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <ImageIcon className="h-4 w-4" /> Media / Storage
            </a>
          </Button>
          <Button 
            onClick={() => {
              toast.success("Todas as alterações pendentes foram sincronizadas com sucesso!");
              queryClient.invalidateQueries({ queryKey: ['siteSettings'] });
              queryClient.invalidateQueries({ queryKey: ['categories'] });
            }} 
            className="gap-2 shadow-md hover:shadow-lg transition-all"
          >
            <Save className="h-4 w-4" /> Salvar Alterações
          </Button>
        </div>
      </div>

      {/* Subscription Prices Section */}
      <div className="bg-gradient-to-br from-primary/10 to-accent/5 border border-primary/20 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" /> Preços de Assinatura (Akz)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
              Plano Trimestral (Valor Numérico)
            </label>
            <div className="relative">
              <input 
                type="number" 
                placeholder="6500"
                defaultValue={settings.price_trimestral || "6500"} 
                className="w-full h-11 px-4 rounded-xl border bg-background font-bold text-lg"
                onBlur={(e) => handleUpdateSetting('price_trimestral', e.target.value)}
              />
              <span className="absolute right-4 top-2.5 text-muted-foreground font-medium">Kz</span>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
              Plano Semestral (Valor Numérico)
            </label>
            <div className="relative">
              <input 
                type="number" 
                placeholder="12000"
                defaultValue={settings.price_semestral || "12000"} 
                className="w-full h-11 px-4 rounded-xl border bg-background font-bold text-lg"
                onBlur={(e) => handleUpdateSetting('price_semestral', e.target.value)}
              />
              <span className="absolute right-4 top-2.5 text-muted-foreground font-medium">Kz</span>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
              Plano Anual (Valor Numérico)
            </label>
            <div className="relative">
              <input 
                type="number" 
                placeholder="22000"
                defaultValue={settings.price_anual || "22000"} 
                className="w-full h-11 px-4 rounded-xl border bg-background font-bold text-lg"
                onBlur={(e) => handleUpdateSetting('price_anual', e.target.value)}
              />
              <span className="absolute right-4 top-2.5 text-muted-foreground font-medium">Kz</span>
            </div>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-4 italic mb-8">
          * Estes valores serão exibidos automaticamente na página de seleção de planos para novos profissionais.
        </p>

        <h3 className="text-lg font-bold mb-6 flex items-center gap-2 pt-6 border-t border-primary/10">
          <Receipt className="h-5 w-5 text-primary" /> Coordenadas Bancárias e Contactos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground">Nome do Banco</label>
            <input 
              type="text" 
              placeholder="Ex: BAI"
              defaultValue={settings.bank_name || "BAI"} 
              className="w-full h-11 px-4 rounded-xl border bg-background"
              onBlur={(e) => handleUpdateSetting('bank_name', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground">IBAN</label>
            <input 
              type="text" 
              placeholder="AO06..."
              defaultValue={settings.bank_iban || "AO06 0040 0000 1234 5678 9012 3"} 
              className="w-full h-11 px-4 rounded-xl border bg-background"
              onBlur={(e) => handleUpdateSetting('bank_iban', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground">Titular da Conta</label>
            <input 
              type="text" 
              placeholder="Nome da Entidade"
              defaultValue={settings.bank_holder || "Saka Service Lda."} 
              className="w-full h-11 px-4 rounded-xl border bg-background"
              onBlur={(e) => handleUpdateSetting('bank_holder', e.target.value)}
            />
          </div>
          <div className="space-y-2 lg:col-start-1">
            <label className="text-xs font-bold uppercase text-muted-foreground">Nome do Banco 2 (Alternativo)</label>
            <input 
              type="text" 
              placeholder="Ex: BFA"
              defaultValue={settings.bank2_name || ""} 
              className="w-full h-11 px-4 rounded-xl border bg-background"
              onBlur={(e) => handleUpdateSetting('bank2_name', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground">IBAN 2</label>
            <input 
              type="text" 
              placeholder="AO06..."
              defaultValue={settings.bank2_iban || ""} 
              className="w-full h-11 px-4 rounded-xl border bg-background"
              onBlur={(e) => handleUpdateSetting('bank2_iban', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground">Titular da Conta 2</label>
            <input 
              type="text" 
              placeholder="Nome da Entidade 2"
              defaultValue={settings.bank2_holder || ""} 
              className="w-full h-11 px-4 rounded-xl border bg-background"
              onBlur={(e) => handleUpdateSetting('bank2_holder', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground">Número MCX Express</label>
            <input 
              type="text" 
              placeholder="9XXXXXXXX"
              defaultValue={settings.mcx_express_phone || "923 000 000"} 
              className="w-full h-11 px-4 rounded-xl border bg-background font-mono"
              onBlur={(e) => handleUpdateSetting('mcx_express_phone', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground">WhatsApp para Comprovativos</label>
            <input 
              type="text" 
              placeholder="+244..."
              defaultValue={settings.payment_proof_whatsapp || "923 000 000"} 
              className="w-full h-11 px-4 rounded-xl border bg-background font-mono"
              onBlur={(e) => handleUpdateSetting('payment_proof_whatsapp', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground">E-mail de Suporte</label>
            <input 
              type="email" 
              placeholder="pagamentos@sakaser.com"
              defaultValue={settings.payment_proof_email || "pagamentos@sakaserv.com"} 
              className="w-full h-11 px-4 rounded-xl border bg-background"
              onBlur={(e) => handleUpdateSetting('payment_proof_email', e.target.value)}
            />
          </div>
          <div className="space-y-2 md:col-span-2 lg:col-span-3">
            <label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
              Mensagem de Sucesso (Comprovativo)
            </label>
            <textarea 
              placeholder="O seu perfil será ativado assim que validarmos a transferência..."
              defaultValue={settings.payment_success_message || "Recebemos o seu comprovativo. O seu perfil será ativado assim que validarmos a transferência. Se tiver pressa, envie o comprovativo para o WhatsApp."} 
              className="w-full min-h-[100px] p-4 rounded-xl border bg-background resize-y"
              onBlur={(e) => handleUpdateSetting('payment_success_message', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Company Links Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-card border rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-primary" /> Empresa & Links Dinâmicos
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Sobre Nós (Link/URL)</label>
              <input 
                type="text" 
                placeholder="/about-us"
                defaultValue={settings.url_about_us || "/about-us"} 
                className="w-full h-11 px-4 rounded-xl border bg-background"
                onBlur={(e) => handleUpdateSetting('url_about_us', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Política de Privacidade (Link/URL)</label>
              <input 
                type="text" 
                placeholder="/privacy-policy"
                defaultValue={settings.url_privacy_policy || "/privacy-policy"} 
                className="w-full h-11 px-4 rounded-xl border bg-background"
                onBlur={(e) => handleUpdateSetting('url_privacy_policy', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Termos de Serviço (Link/URL)</label>
              <input 
                type="text" 
                placeholder="/terms-of-service"
                defaultValue={settings.url_terms_of_service || "/terms-of-service"} 
                className="w-full h-11 px-4 rounded-xl border bg-background"
                onBlur={(e) => handleUpdateSetting('url_terms_of_service', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Global Banners Section */}
        <div className="bg-card border rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" /> Banners Globais
          </h3>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Banner Topo (URL Imagem)</label>
              <input 
                type="text" 
                placeholder="https://exemplo.com/banner.png"
                defaultValue={settings.banner_topo_url || ""} 
                className="w-full h-11 px-4 rounded-xl border bg-background"
                onBlur={(e) => handleUpdateSetting('banner_topo_url', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Banner Pré-CTA (URL Imagem)</label>
              <input 
                type="text" 
                placeholder="https://exemplo.com/banner2.png"
                defaultValue={settings.banner_pre_cta_url || ""} 
                className="w-full h-11 px-4 rounded-xl border bg-background"
                onBlur={(e) => handleUpdateSetting('banner_pre_cta_url', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Hero Texts Section */}
        <div className="bg-card border rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Textos de Destaque (Hero)
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Badge Superior (Pequeno)</label>
              <input 
                type="text" 
                defaultValue={settings.hero_badge_text || "Qualidade e Confiança em Angola"} 
                className="w-full h-11 px-4 rounded-xl border bg-background"
                onBlur={(e) => handleUpdateSetting('hero_badge_text', e.target.value)}
              />
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Título Principal (Texto Branco)</label>
                <input 
                  type="text" 
                  defaultValue={settings.hero_title_text || "Encontre soluções rápidas com"} 
                  className="w-full h-11 px-4 rounded-xl border bg-background"
                  onBlur={(e) => handleUpdateSetting('hero_title_text', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Texto em Destaque (Com Gradiente)</label>
                <input 
                  type="text" 
                  defaultValue={settings.hero_title_highlight || "profissionais qualificados"} 
                  className="w-full h-11 px-4 rounded-xl border bg-background font-bold text-amber-600"
                  onBlur={(e) => handleUpdateSetting('hero_title_highlight', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Subtítulo / Descrição</label>
              <textarea 
                rows={3}
                defaultValue={settings.hero_subtitle_text || "Conecte-se com especialistas em tecnologia, design, marketing e muito mais."} 
                className="w-full p-4 rounded-xl border bg-background resize-none"
                onBlur={(e) => handleUpdateSetting('hero_subtitle_text', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Brand Identity / Navbar Section */}
        <div className="bg-card border rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" /> Identidade & Navbar
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Nome da Marca (Display Name)</label>
              <input 
                type="text" 
                defaultValue={settings.brand_name || "Sakaservice"} 
                className="w-full h-11 px-4 rounded-xl border bg-background"
                onBlur={(e) => handleUpdateSetting('brand_name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">URL do Logótipo (Navbar/Footer)</label>
              <input 
                type="text" 
                placeholder="https://exemplo.com/logo.png"
                defaultValue={settings.logo_url || ""} 
                className="w-full h-11 px-4 rounded-xl border bg-background"
                onBlur={(e) => handleUpdateSetting('logo_url', e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground italic">Recomendado: Fundo transparente (PNG/SVG) e formato horizontal.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Rodapé & Redes Sociais Section */}
      <div className="bg-card border rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" /> Rodapé & Conectividade
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Descrição Principal do Rodapé</label>
              <textarea 
                rows={3}
                defaultValue={settings.footer_description || "O marketplace moderno que conecta profissionais e clientes."} 
                className="w-full p-4 rounded-xl border bg-background resize-none"
                onBlur={(e) => handleUpdateSetting('footer_description', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Email de Contacto Público</label>
              <input 
                type="email" 
                defaultValue={settings.contact_email || "contato@sakaservice.com"} 
                className="w-full h-11 px-4 rounded-xl border bg-background"
                onBlur={(e) => handleUpdateSetting('contact_email', e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Link do Instagram</label>
              <input 
                type="text" 
                placeholder="https://instagram.com/sakaservice"
                defaultValue={settings.social_instagram || "#"} 
                className="w-full h-11 px-4 rounded-xl border bg-background"
                onBlur={(e) => handleUpdateSetting('social_instagram', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Link do LinkedIn</label>
              <input 
                type="text" 
                placeholder="https://linkedin.com/company/sakaservice"
                defaultValue={settings.social_linkedin || "#"} 
                className="w-full h-11 px-4 rounded-xl border bg-background"
                onBlur={(e) => handleUpdateSetting('social_linkedin', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Link do Twitter / X</label>
              <input 
                type="text" 
                placeholder="https://twitter.com/sakaservice"
                defaultValue={settings.social_twitter || "#"} 
                className="w-full h-11 px-4 rounded-xl border bg-background"
                onBlur={(e) => handleUpdateSetting('social_twitter', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Link do Facebook</label>
              <input 
                type="text" 
                placeholder="https://facebook.com/sakaservice"
                defaultValue={settings.social_facebook || "#"} 
                className="w-full h-11 px-4 rounded-xl border bg-background"
                onBlur={(e) => handleUpdateSetting('social_facebook', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Link do TikTok</label>
              <input 
                type="text" 
                placeholder="https://tiktok.com/@sakaservice"
                defaultValue={settings.social_tiktok || "#"} 
                className="w-full h-11 px-4 rounded-xl border bg-background"
                onBlur={(e) => handleUpdateSetting('social_tiktok', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Terminal de WhatsApp</label>
              <input 
                type="text" 
                placeholder="+244 900 000 000"
                defaultValue={settings.contact_whatsapp || ""} 
                className="w-full h-11 px-4 rounded-xl border bg-background"
                onBlur={(e) => handleUpdateSetting('contact_whatsapp', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Telefone Central</label>
              <input 
                type="text" 
                placeholder="+244 900 000 000"
                defaultValue={settings.contact_phone || ""} 
                className="w-full h-11 px-4 rounded-xl border bg-background"
                onBlur={(e) => handleUpdateSetting('contact_phone', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Categories Banners Section */}
      <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-muted/30">
          <h3 className="font-bold flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-primary" /> Banners por Categoria
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-x divide-y">
          {categories.map((cat: any) => (
            <div key={cat.id} className="p-6 space-y-4 hover:bg-muted/5 transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{cat.icon}</span>
                <h4 className="font-bold">{cat.name}</h4>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">URL do Banner</label>
                <input 
                  type="text" 
                  placeholder="URL da imagem..."
                  defaultValue={cat.banner_url || ""} 
                  className="w-full h-9 px-3 text-xs rounded-lg border bg-background focus:ring-1 focus:ring-primary"
                  onBlur={(e) => handleUpdateCategoryBanner(cat.id, e.target.value)}
                />
              </div>
              {cat.banner_url && (
                <div className="relative h-12 w-full rounded-md overflow-hidden bg-muted">
                  <img src={cat.banner_url} alt={cat.name} className="h-full w-full object-cover opacity-50" />
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-muted-foreground">Preview Ativo</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer Save Button */}
      <div className="flex justify-end pt-8 border-t border-border/50">
        <Button 
          size="lg"
          onClick={() => {
            toast.success("Sincronização completa! Todas as alterações estão online.");
            queryClient.invalidateQueries({ queryKey: ['siteSettings'] });
            queryClient.invalidateQueries({ queryKey: ['categories'] });
          }} 
          className="gap-2 px-8 shadow-hero hover:scale-[1.02] transition-all"
        >
          <Save className="h-5 w-5" /> Finalizar e Salvar Tudo
        </Button>
      </div>
    </div>
  );
};

// Analytics Panel Component
const AnalyticsPanel = () => {
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['siteStats'],
    queryFn: getSiteStats,
  });

  const { data: topProfiles = [], isLoading: loadingTop } = useQuery({
    queryKey: ['topProfiles'],
    queryFn: () => getTopProfiles(10),
  });

  if (loadingStats || loadingTop) return <div className="flex justify-center py-20">A carregar analítica...</div>;

  const statCards = [
    { label: "Visitas Hoje", value: stats?.daily_visits || 0, icon: Eye, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Este Mês", value: stats?.monthly_visits || 0, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50" },
    { label: "Este Ano", value: stats?.yearly_visits || 0, icon: Calendar, color: "text-amber-500", bg: "bg-amber-50" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Global Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((card) => (
          <div key={card.label} className="bg-card border rounded-2xl p-6 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-xl ${card.bg} ${card.color}`}>
              <card.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">{card.label}</p>
              <h3 className="text-2xl font-bold">{card.value.toLocaleString()}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Top Profiles Ranking */}
      <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-muted/30 flex items-center justify-between">
          <h3 className="font-bold flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" /> 
            Ranking: Top 10 Perfis Mais Visitados
          </h3>
          <span className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Total de Visitas</span>
        </div>
        <div className="divide-y">
          {topProfiles.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">Não há dados de visualização disponíveis.</div>
          ) : (
            topProfiles.map((pro: any, index: number) => (
              <div key={pro.id} className="flex items-center justify-between p-4 px-6 hover:bg-muted/5 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    index === 0 ? 'bg-yellow-500 text-white' : 
                    index === 1 ? 'bg-slate-300 text-slate-700' : 
                    index === 2 ? 'bg-amber-600/20 text-amber-700' : 'bg-muted text-muted-foreground'
                  }`}>
                    {index + 1}
                  </div>
                  <img src={pro.avatar} className="h-10 w-10 rounded-full object-cover border" alt={pro.name} />
                  <div>
                    <h4 className="font-bold text-sm leading-none mb-1">{pro.name}</h4>
                    <p className="text-xs text-muted-foreground">{pro.title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Categoria</p>
                    <p className="text-xs font-medium">{pro.category}</p>
                  </div>
                  <div className="bg-primary/5 px-4 py-2 rounded-xl border border-primary/10 text-center min-w-[80px]">
                    <span className="text-lg font-black text-primary leading-none">{(pro as any).total_views || 0}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Settings Panel Component
const SettingsPanel = ({ 
  adminList, newEmail, setNewEmail, onAdd, onRemove,
  managerList, newManagerEmail, setNewManagerEmail, onAddManager, onRemoveManager 
}: any) => (
  <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Administrators Management */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold">Administradores</h2>
        </div>
        
        <div className="bg-card border rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" /> Conceder Admin
          </h3>
          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <input 
                type="email" 
                placeholder="email@exemplo.com" 
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-xl border bg-background outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <Button onClick={onAdd} className="w-full h-11 font-bold">
              Guardar Administrador
            </Button>
          </div>
        </div>

        <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
          <div className="divide-y">
            {adminList.map((admin: any) => (
              <div key={admin.email} className="flex items-center justify-between p-4 px-6 hover:bg-muted/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {admin.email[0].toUpperCase()}
                  </div>
                  <p className="font-medium">{admin.email}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => onRemove(admin.email)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gestores Management */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-emerald-500" />
          <h2 className="text-xl font-bold">Gestores Operacionais</h2>
        </div>

        <div className="bg-card border rounded-2xl p-6 shadow-sm border-l-4 border-l-emerald-500">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Plus className="h-5 w-5 text-emerald-500" /> Adicionar Gestor
          </h3>
          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <input 
                type="email" 
                placeholder="email@exemplo.com" 
                value={newManagerEmail}
                onChange={(e) => setNewManagerEmail(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-xl border bg-background outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <Button onClick={onAddManager} className="w-full h-11 font-bold bg-emerald-500 hover:bg-emerald-600">
              Guardar Gestor
            </Button>
          </div>
        </div>

        <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
          <div className="divide-y">
            {managerList.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-10" />
                <p className="text-xs">Nenhum gestor operacional registado.</p>
              </div>
            ) : (
              managerList.map((email: string) => (
                <div key={email} className="flex items-center justify-between p-4 px-6 hover:bg-muted/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 font-bold">
                      {email[0].toUpperCase()}
                    </div>
                    <p className="font-medium">{email}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => onRemoveManager(email)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);


// Reusable Verification Card Component
const VerificationItem = ({ pro, mutation, featuredMutation, deleteMutation }: { pro: any, mutation: any, featuredMutation: any, deleteMutation: any }) => {
  const [isRejecting, setIsRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const queryClient = useQueryClient();

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string, reason: string }) => 
      adminRejectVerification(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingVerifications'] });
      queryClient.invalidateQueries({ queryKey: ['allProfessionals'] });
      toast.warning("Verificação rejeitada com sucesso.");
      setIsRejecting(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao rejeitar.");
    }
  });

  return (
    <div className="bg-card border rounded-2xl p-6 shadow-sm overflow-hidden relative">
    {pro.featured && (
      <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1 shadow-sm">
        <Star className="h-3 w-3 fill-current" /> TOP PROFISSIONAL
      </div>
    )}
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="flex-1 space-y-4">
        <div className="flex items-center gap-4">
          <img src={pro.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face"} alt={pro.name} className="h-16 w-16 rounded-full object-cover" />
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              {pro.name}
              {pro.verification_status === 'ativo' && <Check className="h-4 w-4 text-green-500" />}
              {pro.featured && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
            </h2>
            <p className="text-sm text-muted-foreground">{pro.title}</p>
            <div className="flex gap-2 mt-1">
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                pro.verification_status === 'ativo' ? 'bg-green-500/10 text-green-600' : 
                pro.verification_status === 'suspenso' ? 'bg-orange-500/10 text-orange-600' : 'bg-red-500/10 text-red-600'
              }`}>
                {pro.verification_status === 'pending_review' ? 'Aguardando Verificação' : 
                 pro.verification_status === 'ativo' ? 'Ativo' : 
                 pro.verification_status === 'suspenso' ? 'Suspenso' : 
                 pro.verification_status === 'removido' ? 'Removido' : 
                 pro.verification_status || 'Incompleto'}
              </span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-secondary text-secondary-foreground">
                Email: {pro.email}
              </span>
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${pro.verified_at ? 'bg-blue-500/10 text-blue-600' : 'bg-muted text-muted-foreground'}`}>
                {pro.verified_at ? `ATIVADO EM: ${new Date(pro.verified_at).toLocaleDateString()}` : 'DATA ATIVAÇÃO: N/A'}
              </span>
              <span className={`text-[10px] uppercase font-black px-1.5 py-0.5 rounded flex items-center gap-1 ${
                pro.subscription_status === 'active' 
                ? (pro.subscription_end_date && Math.ceil((new Date(pro.subscription_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) <= 5 
                   ? 'bg-red-500 text-white animate-pulse' 
                   : 'bg-emerald-500 text-white')
                : 'bg-amber-100 text-amber-700'
              }`}>
                <Clock className="h-3 w-3" />
                {(() => {
                  const finalDate = pro.subscription_end_date || pro.end_date;
                  if (pro.subscription_status === 'active' || finalDate) {
                    if (!finalDate) return 'ATIVO';
                    const diff = new Date(finalDate).getTime() - new Date().getTime();
                    const daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
                    return daysRemaining > 0 ? `${daysRemaining} DIAS` : 'EXPIRA HOJE';
                  }
                  return pro.subscription_status === 'pending' ? 'PAGAMENTO PENDENTE' : 'SEM SUBSCRICAO';
                })()}
              </span>
              {pro.subscription_plan && (
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-primary text-primary-foreground">
                  PLANO: {pro.subscription_plan}
                </span>
              )}
              {pro.featured && (
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-700">
                  Featured Pro
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
              <Shield className="h-3 w-3" /> Bilhete de Identidade
            </p>
            {pro.id_card_front_url ? (
              <a href={pro.id_card_front_url} target="_blank" rel="noopener noreferrer" className="block group relative">
                <div className="h-40 w-full overflow-hidden rounded-xl border bg-muted/20 flex items-center justify-center">
                  {pro.id_card_front_url.toLowerCase().endsWith('.pdf') ? (
                    <div className="text-center">
                      <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                      <span className="text-[10px] font-bold">VER PDF</span>
                    </div>
                  ) : (
                    <img src={pro.id_card_front_url} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  )}
                </div>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl">
                  <ExternalLink className="h-6 w-6 text-white" />
                </div>
              </a>
            ) : <div className="h-40 border border-dashed rounded-xl flex items-center justify-center text-[10px] text-muted-foreground bg-muted/10">DOCUMENTO EM FALTA</div>}
            {pro.id_number && (
              <p className="text-[10px] font-mono mt-1 text-center bg-secondary py-1 rounded">Nº: {pro.id_number}</p>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
              <Check className="h-3 w-3" /> Certificado / Diploma
            </p>
            {pro.certificate_url ? (
              <a href={pro.certificate_url} target="_blank" rel="noopener noreferrer" className="block group relative">
                <div className="h-40 w-full overflow-hidden rounded-xl border bg-muted/20 flex items-center justify-center">
                  {pro.certificate_url.toLowerCase().endsWith('.pdf') ? (
                    <div className="text-center">
                      <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                      <span className="text-[10px] font-bold">VER PDF</span>
                    </div>
                  ) : (
                    <img src={pro.certificate_url} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  )}
                </div>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl">
                  <ExternalLink className="h-6 w-6 text-white" />
                </div>
              </a>
            ) : <div className="h-40 border border-dashed rounded-xl flex items-center justify-center text-[10px] text-muted-foreground bg-muted/10">CERTIFICADO EM FALTA</div>}
          </div>

          <div className="space-y-2 rounded-xl bg-muted/20 p-4 border flex flex-col justify-center">
             <p className="text-xs font-bold uppercase text-muted-foreground mb-3">Resumo da Verificação</p>
             <div className="space-y-3">
               <div className="flex justify-between items-center text-xs">
                 <span>BI carregado:</span>
                 {pro.id_card_front_url ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />}
               </div>
               <div className="flex justify-between items-center text-xs">
                 <span>Certificado:</span>
                 {pro.certificate_url ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />}
               </div>
               <div className="flex justify-between items-center text-xs">
                 <span>Nº Identificação:</span>
                 <span className="font-mono">{pro.id_number ? 'OK' : 'FALTA'}</span>
               </div>
             </div>
          </div>
        </div>
      </div>

      <div className="lg:w-64 flex flex-col justify-center gap-3 border-t lg:border-t-0 lg:border-l lg:pl-8 pt-6 lg:pt-0">
        {pro.verification_status !== 'ativo' && !pro.rejection_reason && (
          <Button 
            className="w-full bg-green-600 hover:bg-green-700 h-11 text-white font-bold" 
            onClick={() => mutation.mutate({ id: pro.id, status: 'ativo' })}
            disabled={mutation.isPending}
          >
            <RotateCcw className="mr-2 h-5 w-5" /> Aprovar e Ativar
          </Button>
        )}

        {(pro.verification_status === 'pending_review' || pro.id_card_front_url) && !pro.rejection_reason && (
          <div className="space-y-2">
            {!isRejecting ? (
              <Button 
                variant="outline"
                className="w-full h-11 font-bold border-destructive text-destructive hover:bg-destructive/5"
                onClick={() => setIsRejecting(true)}
              >
                <X className="mr-2 h-5 w-5" /> Rejeitar Documentos
              </Button>
            ) : (
              <div className="space-y-2 p-3 bg-destructive/5 rounded-xl border border-destructive/20 animate-in zoom-in-95">
                <textarea 
                  placeholder="Motivo da rejeição (ex: BI ilegível)..."
                  className="w-full text-xs p-2 rounded-lg border bg-background h-20 outline-none focus:ring-1 focus:ring-destructive"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    className="flex-1 font-bold"
                    onClick={() => {
                      if (!reason.trim()) return toast.error("Por favor, insira um motivo.");
                      rejectMutation.mutate({ id: pro.id, reason });
                    }}
                    disabled={rejectMutation.isPending}
                  >
                    Confirmar
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="px-2"
                    onClick={() => setIsRejecting(false)}
                  >
                    Sair
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
        
        <Button 
          variant={pro.featured ? "outline" : "secondary"}
          className={`w-full h-11 font-bold ${pro.featured ? "border-yellow-500 text-yellow-600 hover:bg-yellow-50" : "bg-yellow-500 hover:bg-yellow-600 text-white"}`}
          onClick={() => featuredMutation.mutate({ id: pro.id, featured: !pro.featured })}
          disabled={featuredMutation.isPending}
        >
          <Star className={`mr-2 h-5 w-5 ${pro.featured ? "fill-yellow-500" : ""}`} /> 
          {pro.featured ? 'Remover Top' : 'Tornar Top Pro'}
        </Button>

        {pro.verification_status === 'ativo' && (
          <Button 
            variant="outline" 
            className="w-full h-11 font-bold border-orange-500 text-orange-600 hover:bg-orange-50"
            onClick={() => mutation.mutate({ id: pro.id, status: 'suspenso' })}
            disabled={mutation.isPending}
          >
            <Pause className="mr-2 h-5 w-5" /> Suspender
          </Button>
        )}

        <Button 
          variant="destructive" 
          className="w-full h-11 font-bold"
          onClick={() => {
            if (confirm("TEM A CERTEZA? Esta ação é definitiva e removerá todos os dados (fotos, portfólio e avaliações) permanentemente!")) {
              deleteMutation.mutate(pro.id);
            }
          }}
          disabled={deleteMutation.isPending}
        >
          <X className="mr-2 h-5 w-5" /> Eliminar Definitivamente
        </Button>
        <Link to={`/professional/${pro.id}`} className="text-xs text-center text-primary hover:underline italic">
          Ver perfil público →
        </Link>
      </div>
      </div>
    </div>
  );
};

// Subscription Management Panel Component
const SubscriptionManagementPanel = ({ pendingSubs, allSubs, loading }: { pendingSubs: any[], allSubs: any[], loading: boolean }) => {
  const [subView, setSubView] = useState<'pending' | 'all'>('pending');
  
  if (loading) return <div className="flex justify-center py-20 text-muted-foreground">A carregar dados de pagamentos...</div>;

  const currentSubs = subView === 'pending' ? pendingSubs : allSubs;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" /> Gestão de Assinaturas & Receitas
          </h2>
          <p className="text-sm text-muted-foreground">Valide comprovativos de transferência e controle o acesso dos profissionais.</p>
        </div>
        <div className="flex bg-muted p-1 rounded-lg">
          <button 
            onClick={() => setSubView('pending')}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${subView === 'pending' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Pendentes ({pendingSubs.length})
          </button>
          <button 
            onClick={() => setSubView('all')}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${subView === 'all' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Histórico (Total: {allSubs.length})
          </button>
        </div>
      </div>

      <div className="grid gap-6">
        {currentSubs.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-20 text-center bg-card">
            <Receipt className="mx-auto h-12 w-12 text-muted-foreground opacity-10 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">Nenhum registo encontrado nesta vista.</h3>
          </div>
        ) : (
          currentSubs.map((sub: any) => (
            <SubscriptionItem key={sub.id} sub={sub} />
          ))
        )}
      </div>
    </div>
  );
};

const SubscriptionItem = ({ sub }: { sub: any }) => {
  const queryClient = useQueryClient();
  const [approvedPlan, setApprovedPlan] = useState<'trimestral' | 'semestral' | 'anual'>(sub.selected_plan || 'trimestral');
  const pro = sub.professionals;

  const handleApprove = async () => {
    try {
      toast.info("A ativar subscrição...");
      await approveSubscription(sub.id, approvedPlan);
      toast.success(`Pagamento de ${pro?.name} aprovado! Perfil agora está Ativo com plano ${approvedPlan}.`);
      queryClient.invalidateQueries({ queryKey: ['pendingSubscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['allSubscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['allProfessionals'] });
    } catch (e: any) {
      toast.error("Erro ao aprovar: " + e.message);
    }
  };

  const handleReject = async () => {
    if (!confirm("Bloquear este utilizador e rejeitar o pagamento?")) return;
    try {
      await rejectSubscription(sub.id, "Comprovativo inválido");
      toast.warning("Subscrição bloqueada.");
      queryClient.invalidateQueries({ queryKey: ['pendingSubscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['allSubscriptions'] });
    } catch (e: any) {
      toast.error("Erro ao rejeitar.");
    }
  };

  return (
    <div className={`bg-card border rounded-2xl p-6 shadow-sm overflow-hidden border-l-4 ${
      sub.status === 'active' ? 'border-l-green-500' : 
      sub.status === 'pending' ? 'border-l-amber-500' : 'border-l-destructive'
    }`}>
      <div className="flex flex-col lg:flex-row gap-8 items-center">
        {/* Info Profissional */}
        <div className="flex items-center gap-4 flex-1">
          <div className="h-12 w-12 rounded-full overflow-hidden border bg-muted shrink-0">
            <img src={pro?.avatar || ""} className="h-full w-full object-cover" alt={pro?.name || "Profissional"} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold truncate">{pro?.name || "Nome não disponível"}</h4>
            <p className="text-xs text-muted-foreground truncate">{pro?.email || "Sem email"}</p>
            <div className="flex gap-2 mt-1">
              <span className={`text-[10px] uppercase font-black px-1.5 py-0.5 rounded ${
                (sub.approved_plan || sub.selected_plan || sub.plan) === 'trimestral' ? 'bg-primary/10 text-primary' : 'bg-secondary text-secondary-foreground'
              }`}>
                Plano: {sub.approved_plan || sub.selected_plan || sub.plan || 'N/A'}
              </span>
              <span className="text-[10px] text-muted-foreground font-medium">Fatura {sub.id?.split('-')[0].toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* Info Pagamento */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 flex-[3] w-full lg:w-auto bg-muted/30 p-4 rounded-xl border">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Plano Selecionado</p>
            <p className="font-bold text-sm uppercase text-primary">{sub.selected_plan || sub.plan || 'TRIMESTRAL'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Definir Plano Final</p>
            {sub.status === 'pending' ? (
              <select 
                className="text-xs font-bold p-1 rounded border bg-background"
                value={approvedPlan}
                onChange={(e) => setApprovedPlan(e.target.value as any)}
              >
                <option value="trimestral">TRIMESTRAL</option>
                <option value="semestral">SEMESTRAL</option>
                <option value="anual">ANUAL</option>
              </select>
            ) : (
              <p className="font-bold text-sm uppercase">{sub.approved_plan || sub.plan || 'CONCLUÍDO'}</p>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Valor</p>
            <p className="font-bold text-sm">{(Number(sub.amount) || 0).toLocaleString()} Kz</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Método</p>
            <p className="text-xs flex items-center gap-1">
              {sub.payment_method === 'express' ? <CreditCard className="h-3 w-3" /> : <Receipt className="h-3 w-3" />}
              {sub.payment_method === 'express' ? 'MCX Express' : 'Transferência'}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Comprovativo</p>
            {sub.payment_proof_url ? (
              <a 
                href={sub.payment_proof_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary text-xs font-bold flex items-center gap-1 hover:underline"
              >
                <ExternalLink className="h-3 w-3" /> Ver PDF
              </a>
            ) : (
              <span className="text-xs text-muted-foreground italic">Express</span>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Recebido em</p>
            <p className="text-[10px]">{new Date(sub.created_at).toLocaleDateString()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Status</p>
            <span className={`text-[9px] uppercase font-bold px-1 py-0.5 rounded ${
              sub.status === 'active' ? 'bg-green-500 text-white' : 
              sub.status === 'pending' ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'
            }`}>
              {sub.status === 'active' ? 'Ativo' : sub.status === 'pending' ? 'Pendente' : 'Bloqueado'}
            </span>
          </div>
          {sub.status === 'active' && (
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Expira em</p>
              <p className="text-[10px] text-green-600 font-bold">{new Date(sub.end_date).toLocaleDateString()}</p>
            </div>
          )}
          {sub.status === 'blocked' && (
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Bloqueado em</p>
              <p className="text-[10px] text-destructive font-bold">{sub.blocked_at ? new Date(sub.blocked_at).toLocaleDateString() : 'N/A'}</p>
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="flex lg:flex-col gap-2 w-full lg:w-40 pt-4 lg:pt-0 border-t lg:border-t-0">
          {sub.status === 'pending' && (
            <>
              <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold gap-2" onClick={handleApprove}>
                <Check className="h-4 w-4" /> Aprovar
              </Button>
              <Button size="sm" variant="outline" className="flex-1 border-destructive text-destructive hover:bg-destructive/5 font-bold" onClick={handleReject}>
                <X className="h-4 w-4" /> Rejeitar
              </Button>
            </>
          )}
          {sub.status === 'active' && (
            <Button size="sm" variant="ghost" className="w-full text-muted-foreground italic text-[10px]" disabled>
              Ativado em {new Date(sub.start_date).toLocaleDateString()}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminVerifications;
