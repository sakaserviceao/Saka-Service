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
  rejectSubscription,
  logExportAction,
  getEmailTemplates,
  updateEmailTemplate,
  uploadImage
} from "@/data/api";
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { Button } from "@/components/ui/button";
import { Check, X, ExternalLink, Shield, ShieldCheck, Users, FileText, ArrowLeft, Search, AlertCircle, Star, Pause, RotateCcw, Settings, Plus, Trash2, Mail, BarChart3, TrendingUp, Home, Calendar, Eye, LayoutGrid, Save, Image as ImageIcon, CreditCard, Receipt, Clock, CheckCircle, Sparkles, Bell, Megaphone, Info, FileCode, Target } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import NotificationsManagementPanel from "@/components/NotificationsManagementPanel";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";

const AdminVerifications = () => {
  const queryClient = useQueryClient();
  const { user, isLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const handleUpdateSettingInAdmin = async (key: string, value: string) => {
    try {
      await updateSiteSetting(key, value);
      toast.success(`Definição "${key}" atualizada.`);
      queryClient.invalidateQueries({ queryKey: ['siteSettings'] });
    } catch (e: any) {
      toast.error(e.message || "Erro ao atualizar definição.");
    }
  };
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [viewMode, setViewMode] = useState<'pending' | 'all' | 'settings' | 'analytics' | 'platform' | 'subscriptions' | 'professionalManagement' | 'properties' | 'notifications'>('pending');
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newManagerEmail, setNewManagerEmail] = useState("");
  const location = useLocation();

  // Parse URL parameters for direct navigation/actions
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'notifications') {
      setViewMode('notifications');
    }
  }, [location.search]);

  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);

  // Hooks MUST be evaluated unconditionally before any early returns

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

  const canAccess = (tab: string) => {
    if (isAdmin) return true;
    if (!isManager) return false;
    
    const perms = (settings.manager_permissions || "verifications,properties").split(',');
    
    switch(tab) {
      case 'pending':
      case 'all':
        return perms.includes('verifications');
      case 'subscriptions':
        return perms.includes('subscriptions');
      case 'properties':
        return perms.includes('properties');
      case 'notifications':
        return perms.includes('notifications');
      case 'analytics':
        return perms.includes('analytics');
      default:
        return false;
    }
  };

  // Security: Auto-fallback for non-admins trying to access restricted views
  useEffect(() => {
    if (!isLoading && !isLoadingAdmins && !isAdmin && (viewMode === 'settings' || viewMode === 'platform')) {
      setViewMode('pending');
      toast.error("Acesso restrito a administradores.");
    }
  }, [viewMode, isAdmin, isLoading, isLoadingAdmins]);



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



  // Restricted Access Check
  if (isLoading) return <div className="flex justify-center py-20">Verificando permissões...</div>;

  // Restricted Access Check (Moved below queries)
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

  return (
    <div className="min-h-screen bg-background pb-12">
      <Navbar />
      <div className="container mt-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 items-start">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Shield className="text-primary" /> Painel de Verificação
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">Analise os documentos e aprove perfis de profissionais.</p>
          </div>
          <Button variant="outline" asChild className="w-full md:w-auto">
            <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Início</Link>
          </Button>
        </div>

        {/* Manual Search Bar */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
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
          <Button onClick={handleSearch} disabled={searching} className="bg-primary/10 text-primary hover:bg-primary/20 h-12 sm:w-auto">
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
                  canManage={isAuthorized}
                />
              ))}
            </div>
            <hr className="my-10" />
          </div>
        )}

        {/* View Mode Selector */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-4 scrollbar-none whitespace-nowrap snap-x">
          {canAccess('pending') && (
            <Button 
              variant={viewMode === 'pending' ? 'default' : 'outline'} 
              onClick={() => setViewMode('pending')}
              className="rounded-full"
            >
              Pendentes Review ({pending.length})
            </Button>
          )}
          {canAccess('all') && (
            <Button 
              variant={viewMode === 'all' ? 'default' : 'outline'} 
              onClick={() => setViewMode('all')}
              className="rounded-full"
            >
              Todos os Perfis ({allPros.length})
            </Button>
          )}
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
          {canAccess('subscriptions') && (
            <Button 
              variant={viewMode === 'subscriptions' ? 'default' : 'outline'} 
              onClick={() => setViewMode('subscriptions')}
              className={`rounded-full flex items-center gap-2 ${pendingSubs.length > 0 ? "border-amber-500 text-amber-600 bg-amber-50" : ""}`}
            >
              <CreditCard className="h-4 w-4" /> Pagamentos 
              {pendingSubs.length > 0 && <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">{pendingSubs.length}</span>}
            </Button>
          )}
          {isAdmin && (
            <Button 
              variant={viewMode === 'professionalManagement' ? 'default' : 'outline'} 
              onClick={() => setViewMode('professionalManagement')}
              className={`rounded-full flex items-center gap-2 border-primary text-primary`}
            >
              <Users className="h-4 w-4" /> Gestão de Profissionais
            </Button>
          )}
          {canAccess('analytics') && (
            <Button 
              variant={viewMode === 'analytics' ? 'default' : 'outline'} 
              onClick={() => setViewMode('analytics')}
              className="rounded-full flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" /> Analítica
            </Button>
          )}
          {canAccess('properties') && (
            <Button 
              variant={viewMode === 'properties' ? 'default' : 'outline'} 
              onClick={() => setViewMode('properties')}
              className="rounded-full flex items-center gap-2 border-primary/20 text-primary hover:bg-primary/5"
            >
              <Home className="h-4 w-4" /> Imóveis
            </Button>
          )}
          {canAccess('notifications') && (
            <Button 
              variant={viewMode === 'notifications' ? 'default' : 'outline'} 
              onClick={() => setViewMode('notifications')}
              className={`rounded-full flex items-center gap-2 ${isAdmin ? "border-amber-500 text-amber-600 bg-amber-50 shadow-sm" : ""}`}
            >
              <Bell className="h-4 w-4" /> Notificações
            </Button>
          )}
        </div>

        {/* Main Content Section */}
        {viewMode === 'notifications' ? (
          <NotificationsManagementPanel 
            initialTargetUserId={queryParams.get('replyTo')}
            initialTitle={queryParams.get('notifTitle')}
          />
        ) : viewMode === 'pending' ? (
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
                    canManage={isAuthorized}
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
                    canManage={isAuthorized}
                  />
                ))}
              </div>
            )}
          </>
        ) : viewMode === 'settings' ? (
          isAdmin ? (
            <SettingsPanel 
              adminList={adminList} 
              newEmail={newAdminEmail} 
              setNewEmail={setNewAdminEmail}
              managerList={managerList}
              newManagerEmail={newManagerEmail}
              setNewManagerEmail={setNewManagerEmail}
              settings={settings}
              onUpdateSetting={handleUpdateSettingInAdmin}
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
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Shield className="h-12 w-12 text-destructive/20 mb-4" />
              <h3 className="text-lg font-bold">Acesso Restrito</h3>
              <p className="text-muted-foreground">Esta secção é exclusiva para administradores.</p>
            </div>
          )
        ) : viewMode === 'analytics' ? (
          <AnalyticsPanel />
        ) : viewMode === 'subscriptions' ? (
          <SubscriptionManagementPanel 
            pendingSubs={pendingSubs} 
            allSubs={allSubs} 
            loading={isLoadingPendingSubs || isLoadingAllSubs} 
          />
        ) : viewMode === 'professionalManagement' ? (
          isAdmin ? (
            <ProfessionalManagementPanel 
              allPros={allPros} 
              onExportLog={(format, count, filters) => logExportAction(user?.email || "", format, count, filters)}
            />
          ) : (
             <div className="flex flex-col items-center justify-center py-20 text-center">
              <Shield className="h-12 w-12 text-destructive/20 mb-4" />
              <h3 className="text-lg font-bold">Acesso Restrito</h3>
              <p className="text-muted-foreground">Esta secção é exclusiva para administradores.</p>
            </div>
          )
        ) : viewMode === 'properties' ? (
          <PropertiesApprovalPanel isAdmin={isAdmin} />
        ) : viewMode === 'platform' ? (
          isAdmin ? (
            <PlatformManagementPanel settings={settings} categories={categories} />
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Shield className="h-12 w-12 text-destructive/20 mb-4" />
              <h3 className="text-lg font-bold">Acesso Restrito</h3>
              <p className="text-muted-foreground">Apenas administradores podem configurar o site e categorias.</p>
            </div>
          )
        ) : null}
      </div>
    </div>
  );
};

// Professional Management & Export Panel
function ProfessionalManagementPanel({ allPros, onExportLog }: { allPros: any[], onExportLog: (format: string, count: number, filters: any) => void }) {
  const [filters, setFilters] = useState({
    profession: "all",
    location: "all",
    status: "all",
    date: "all"
  });

  const filteredPros = useMemo(() => {
    return allPros.filter(pro => {
      const matchProfession = filters.profession === "all" || pro.title === filters.profession || pro.category === filters.profession;
      const matchLocation = filters.location === "all" || pro.location?.toLowerCase().includes(filters.location.toLowerCase());
      const matchStatus = filters.status === "all" || pro.verification_status === filters.status;
      
      let matchDate = true;
      if (filters.date !== "all" && pro.created_at) {
        const proDate = new Date(pro.created_at);
        const now = new Date();
        if (filters.date === "today") {
          matchDate = proDate.toDateString() === now.toDateString();
        } else if (filters.date === "week") {
          const weekAgo = new Date();
          weekAgo.setDate(now.getDate() - 7);
          matchDate = proDate >= weekAgo;
        } else if (filters.date === "month") {
          const monthAgo = new Date();
          monthAgo.setMonth(now.getMonth() - 1);
          matchDate = proDate >= monthAgo;
        }
      }

      return matchProfession && matchLocation && matchStatus && matchDate;
    });
  }, [allPros, filters]);

  const uniqueProfessions = useMemo(() => {
    const occupations = allPros.map(p => p.title).filter(Boolean);
    return Array.from(new Set(occupations));
  }, [allPros]);

  const uniqueLocations = useMemo(() => {
    const locs = allPros.map(p => p.location?.split(',')[0]).filter(Boolean);
    return Array.from(new Set(locs));
  }, [allPros]);

  const handleExport = async (format: 'CSV' | 'Excel') => {
    const dataToExport = filteredPros.map(pro => ({
      "Nome Completo": pro.name,
      "Nº BI / Identidade": pro.id_number || "Não informado",
      "Profissão": pro.title || pro.category,
      "Localização": pro.location,
      "Contacto": pro.phone || pro.email || "Sem contacto",
      "Estado": pro.verification_status,
      "Data de Registo": pro.created_at ? new Date(pro.created_at).toLocaleDateString('pt-PT') : "N/A"
    }));

    if (format === 'CSV') {
      const csv = Papa.unparse(dataToExport);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `sakaservice_profissionais_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Profissionais");
      XLSX.writeFile(workbook, `sakaservice_profissionais_${new Date().toISOString().split('T')[0]}.xlsx`);
    }

    onExportLog(format, dataToExport.length, filters);
    toast.success(`Exportação ${format} concluída com sucesso (${dataToExport.length} registos).`);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Gestão Avançada de Profissionais
          </h2>
          <p className="text-sm text-muted-foreground">Controle, filtre e exporte dados para análise externa.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleExport('CSV')} variant="outline" className="gap-2 border-primary/20 hover:bg-primary/5">
            <FileText className="h-4 w-4" /> Exportar CSV
          </Button>
          <Button onClick={() => handleExport('Excel')} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            <Calendar className="h-4 w-4 text-white" /> Exportar Excel
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-card border rounded-2xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase text-muted-foreground">Profissão</label>
          <select 
            className="w-full h-10 px-3 rounded-lg border bg-background text-sm"
            value={filters.profession}
            onChange={(e) => setFilters(prev => ({ ...prev, profession: e.target.value }))}
          >
            <option value="all">Todas as Profissões</option>
            {uniqueProfessions.map(prof => <option key={prof} value={prof}>{prof}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase text-muted-foreground">Localização</label>
          <select 
            className="w-full h-10 px-3 rounded-lg border bg-background text-sm"
            value={filters.location}
            onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
          >
            <option value="all">Todas as Cidades</option>
            {uniqueLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase text-muted-foreground">Estado</label>
          <select 
            className="w-full h-10 px-3 rounded-lg border bg-background text-sm"
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="all">Todos os Estados</option>
            <option value="ativo">Ativo</option>
            <option value="suspenso">Suspenso</option>
            <option value="pending_review">Pendente Review</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase text-muted-foreground">Data de Registo</label>
          <select 
            className="w-full h-10 px-3 rounded-lg border bg-background text-sm"
            value={filters.date}
            onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
          >
            <option value="all">Sempre</option>
            <option value="today">Hoje</option>
            <option value="week">Última Semana</option>
            <option value="month">Último Mês</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b text-[10px] font-black uppercase text-muted-foreground tracking-widest">
              <tr>
                <th className="px-6 py-4">Profissional</th>
                <th className="px-6 py-4">Nº Identidade (BI)</th>
                <th className="px-6 py-4">Profissão</th>
                <th className="px-6 py-4">Localização</th>
                <th className="px-6 py-4">Contacto</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Registado em</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredPros.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center text-muted-foreground">Nenhum profissional encontrado com os filtros atuais.</td>
                </tr>
              ) : (
                filteredPros.map((pro) => (
                  <tr key={pro.id} className="hover:bg-muted/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full overflow-hidden border">
                          <img src={pro.avatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100"} alt="" className="h-full w-full object-cover" />
                        </div>
                        <span className="font-bold">{pro.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">{pro.id_number || "—"}</td>
                    <td className="px-6 py-4">{pro.title || pro.category}</td>
                    <td className="px-6 py-4">{pro.location}</td>
                    <td className="px-6 py-4 flex flex-col">
                      <span className="font-medium">{pro.phone || "—"}</span>
                      <span className="text-[10px] text-muted-foreground">{pro.email}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        pro.verification_status === 'ativo' ? 'bg-green-100 text-green-700' :
                        pro.verification_status === 'suspenso' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {pro.verification_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground font-medium">
                      {pro.created_at ? new Date(pro.created_at).toLocaleDateString() : "N/A"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


// Email Template Management Components
function EmailTemplateManagement() {
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['email_templates'],
    queryFn: getEmailTemplates,
  });

  if (isLoading) return <div className="py-20 text-center text-muted-foreground">A carregar modelos de e-mail...</div>;

  return (
    <div className="grid gap-6">
      {templates.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-background rounded-xl border border-dashed">
          Nenhum modelo de e-mail encontrado na base de dados.
        </div>
      ) : (
        templates.map((template: any) => (
          <EmailTemplateItem key={template.id} template={template} />
        ))
      )}
    </div>
  );
}

function EmailTemplateItem({ template }: { template: any }) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [subject, setSubject] = useState(template.subject);
  const [body, setBody] = useState(template.body);

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateEmailTemplate(template.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email_templates'] });
      toast.success("Modelo de e-mail atualizado!");
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar modelo: " + error.message);
    }
  });

  return (
    <Card className="border-primary/20 transition-all hover:shadow-lg bg-background">
      <CardHeader className="py-5 border-b border-primary/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">{template.name}</CardTitle>
              <CardDescription className="text-xs font-mono uppercase tracking-widest text-primary/60">ID: {template.id}</CardDescription>
            </div>
          </div>
          <Button 
            variant={isEditing ? "ghost" : "outline"}
            size="sm" 
            onClick={() => setIsEditing(!isEditing)}
            className="font-bold flex items-center gap-2 border-primary/20"
          >
            {isEditing ? "Cancelar Edição" : "Editar Modelo"}
          </Button>
        </div>
      </CardHeader>
      
      {isEditing ? (
        <CardContent className="space-y-6 pt-6 bg-primary/5 shadow-inner">
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase text-primary tracking-tighter">Assunto do E-mail</Label>
            <Input 
              value={subject} 
              onChange={(e) => setSubject(e.target.value)} 
              className="h-12 text-lg font-medium border-primary/20"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase text-primary tracking-tighter">Corpo do E-mail (HTML permitido)</Label>
            <Textarea 
              value={body} 
              onChange={(e) => setBody(e.target.value)} 
              className="min-h-[300px] font-mono text-sm leading-relaxed border-primary/20 bg-white"
            />
            <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-100 mt-2">
               <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
               <p className="text-[10px] text-amber-800 leading-tight">
                <strong>Tags Dinâmicas:</strong> Use <code>{"{{name}}"}</code>, <code>{"{{id}}"}</code> ou <code>{"{{status}}"}</code> conforme o e-mail para injetar dados reais do utilizador.
               </p>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button 
              className="font-black gap-2 px-8 py-6 rounded-xl shadow-hero" 
              onClick={() => updateMutation.mutate({ subject, body })}
              disabled={updateMutation.isPending}
            >
              <Save className="h-5 w-5" /> Salvar Alterações
            </Button>
          </div>
        </CardContent>
      ) : (
        <CardContent className="pt-6">
           <div className="rounded-xl bg-muted/30 p-5 border border-dashed space-y-3">
              <div className="pb-3 border-b border-muted">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Assunto Atual</span>
                <p className="font-bold text-sm text-foreground mt-1">{template.subject}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Pré-visualização do Conteúdo</span>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-3 leading-relaxed">
                  {template.body.replace(/<[^>]*>?/gm, '')}
                </p>
              </div>
           </div>
        </CardContent>
      )}
    </Card>
  );
}

// Platform Management Panel
function PlatformManagementPanel({ settings, categories }: { settings: any, categories: any[] }) {
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

  const handleUpdateCategoryLink = async (id: string, bannerLink: string) => {
    try {
      setLoading(true);
      await updateCategory(id, { banner_link: bannerLink });
      toast.success("Link do banner atualizado.");
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    } catch (e: any) {
      toast.error(e.message || "Erro ao atualizar link da categoria.");
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
        <p className="text-[10px] text-muted-foreground mt-4 mb-8">
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
              <label className="text-xs font-bold uppercase text-muted-foreground">Banner Topo (Link de Redirecionamento)</label>
              <input 
                type="text" 
                placeholder="https://saka-service.com/pagina"
                defaultValue={settings.banner_topo_link || ""} 
                className="w-full h-11 px-4 rounded-xl border bg-background border-primary/20"
                onBlur={(e) => handleUpdateSetting('banner_topo_link', e.target.value)}
              />
            </div>
            <hr className="opacity-50" />
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
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Banner Pré-CTA (Link de Redirecionamento)</label>
              <input 
                type="text" 
                placeholder="https://saka-service.com/pagina"
                defaultValue={settings.banner_pre_cta_link || ""} 
                className="w-full h-11 px-4 rounded-xl border bg-background border-primary/20"
                onBlur={(e) => handleUpdateSetting('banner_pre_cta_link', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Gestão Saka Imóveis (Home) Section */}
        <div className="bg-card border rounded-2xl p-6 shadow-sm border-l-4 border-l-primary">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Home className="h-5 w-5 text-primary" /> Gestão Saka Imóveis (Home)
          </h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/10">
              <div className="space-y-1">
                <p className="font-bold">Exibir Secção de Imóveis</p>
                <p className="text-xs text-muted-foreground">Ativa ou desativa a vizualização no Início.</p>
              </div>
              <div className="flex gap-1 bg-background p-1 rounded-lg border">
                <Button 
                  size="sm" 
                  variant={settings.show_imoveis === 'true' ? 'default' : 'ghost'}
                  onClick={() => handleUpdateSetting('show_imoveis', 'true')}
                  className="rounded-md h-8 text-xs px-3"
                >
                  Ativado
                </Button>
                <Button 
                  size="sm" 
                  variant={settings.show_imoveis !== 'true' ? 'destructive' : 'ghost'}
                  onClick={() => handleUpdateSetting('show_imoveis', 'false')}
                  className="rounded-md h-8 text-xs px-3"
                >
                  Desativado
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Badge Texto (Ex: NOVIDADE)</label>
                <input 
                  type="text" 
                  defaultValue={settings.imoveis_badge || "NOVIDADE"} 
                  className="w-full h-11 px-4 rounded-xl border bg-background"
                  onBlur={(e) => handleUpdateSetting('imoveis_badge', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Texto do Botão</label>
                <input 
                  type="text" 
                  defaultValue={settings.imoveis_button_text || "Ver imóveis disponíveis"} 
                  className="w-full h-11 px-4 rounded-xl border bg-background"
                  onBlur={(e) => handleUpdateSetting('imoveis_button_text', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Título Principal</label>
              <input 
                type="text" 
                defaultValue={settings.imoveis_title || "Procura casa para arrendar?"} 
                className="w-full h-11 px-4 rounded-xl border bg-background font-bold"
                onBlur={(e) => handleUpdateSetting('imoveis_title', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Descrição / Subtítulo</label>
              <textarea 
                rows={3}
                defaultValue={settings.imoveis_description || "Explore imóveis disponíveis em Luanda, com informação clara e contacto direto com proprietários ou agentes verificados."} 
                className="w-full p-4 rounded-xl border bg-background resize-none text-sm"
                onBlur={(e) => handleUpdateSetting('imoveis_description', e.target.value)}
              />
            </div>

            <div className="space-y-4 pt-6 border-t mt-6">
              <label className="text-xs font-bold uppercase text-primary font-black">Consulte o Preçário (URL do Preçário)</label>
              <input 
                type="text" 
                placeholder="https://exemplo.com/precario-imoveis.pdf"
                defaultValue={settings.imoveis_pricing_url || ""} 
                className="w-full h-11 px-4 rounded-xl border border-primary/30 bg-primary/5 font-medium text-primary focus:ring-1 focus:ring-primary shadow-sm"
                onBlur={(e) => handleUpdateSetting('imoveis_pricing_url', e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground">URL para o documento PDF ou página que descreve os preços para anunciar. Se preenchido, o botão "Consulte o Preçário" aparecerá na página de anunciar imóvel.</p>
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
              <p className="text-[10px] text-muted-foreground">Recomendado: Fundo transparente (PNG/SVG) e formato horizontal.</p>
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

      {/* Email Templates Section */}
      <div className="bg-card border-2 border-primary/20 rounded-2xl p-6 shadow-md bg-primary/5">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-black flex items-center gap-2 text-primary uppercase tracking-tight">
              <Mail className="h-6 w-6" /> Gestão de Modelos de E-mail
            </h3>
            <p className="text-sm text-muted-foreground mt-1">Configure o assunto e o corpo das comunicações automáticas da plataforma.</p>
          </div>
        </div>
        
        <EmailTemplateManagement />
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
              <div className="space-y-3">
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
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-primary font-black">Link do Banner (Redirecionamento)</label>
                  <input 
                    type="text" 
                    placeholder="https://..."
                    defaultValue={cat.banner_link || ""} 
                    className="w-full h-9 px-3 text-xs rounded-lg border border-primary/30 bg-background focus:ring-1 focus:ring-primary shadow-sm"
                    onBlur={(e) => handleUpdateCategoryLink(cat.id, e.target.value)}
                  />
                </div>
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
}

// Analytics Panel Component
function AnalyticsPanel() {
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
}

// Settings Panel Component
function SettingsPanel({ 
  adminList, newEmail, setNewEmail, onAdd, onRemove,
  managerList, newManagerEmail, setNewManagerEmail, onAddManager, onRemoveManager,
  settings, onUpdateSetting
}: any) {
  const [aboutUs, setAboutUs] = useState(settings.about_us_content || "");
  const [vision, setVision] = useState(settings.about_us_vision || "");
  const [privacy, setPrivacy] = useState(settings.privacy_policy_content || "");
  const [terms, setTerms] = useState(settings.terms_service_content || "");
  const [privacyEmail, setPrivacyEmail] = useState(settings.privacy_policy_email || "privacidade@sakaservice.com");
  const [termsEmail, setTermsEmail] = useState(settings.terms_service_email || "termos@sakaservice.com");
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  useEffect(() => {
    try {
      const savedTeam = settings.team_members_json ? JSON.parse(settings.team_members_json) : [];
      setTeamMembers(savedTeam);
    } catch (e) {
      setTeamMembers([]);
    }
  }, [settings.team_members_json]);

  useEffect(() => {
    setAboutUs(settings.about_us_content || "");
    setVision(settings.about_us_vision || "");
    setPrivacy(settings.privacy_policy_content || "");
    setTerms(settings.terms_service_content || "");
    setPrivacyEmail(settings.privacy_policy_email || "privacidade@sakaservice.com");
    setTermsEmail(settings.terms_service_email || "termos@sakaservice.com");
  }, [settings]);

  const managerPermissions = (settings.manager_permissions || "verifications,properties").split(',');
  const notifDuration = settings.notification_duration_days || "3";

  const togglePermission = (perm: string) => {
    const current = (settings.manager_permissions || "verifications,properties").split(',').filter(Boolean);
    let updated;
    if (current.includes(perm)) {
      updated = current.filter(p => p !== perm);
    } else {
      updated = [...current, perm];
    }
    onUpdateSetting('manager_permissions', updated.join(','));
  };

  const permissions = [
    { id: 'verifications', label: 'Gestão de Verificações' },
    { id: 'subscriptions', label: 'Gestão de Pagamentos' },
    { id: 'properties', label: 'Gestão de Imóveis' },
    { id: 'notifications', label: 'Gestão de Notificações' },
    { id: 'analytics', label: 'Acesso a Analítica' },
  ];

  return (
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
        
        <div className="bg-card border rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Plus className="h-5 w-5 text-emerald-500" /> Adicionar Gestor
          </h3>
          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <input 
                type="email" 
                placeholder="manager@exemplo.com" 
                value={newManagerEmail}
                onChange={(e) => setNewManagerEmail(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-xl border bg-background outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <Button onClick={onAddManager} className="w-full h-11 font-bold bg-emerald-600 hover:bg-emerald-700">
              Conceder Função de Gestor
            </Button>
          </div>
        </div>

        <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
          <div className="divide-y">
            {managerList.map((email: string) => (
              <div key={email} className="flex items-center justify-between p-4 px-6 hover:bg-muted/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                    {email[0].toUpperCase()}
                  </div>
                  <p className="font-medium text-sm">{email}</p>
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
            ))}
            {managerList.length === 0 && (
              <div className="p-8 text-center text-muted-foreground text-sm">
                Nenhum gestor operacional configurado.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Advanced Permissions & Duration Settings */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8 border-t">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-amber-500" />
          <h2 className="text-xl font-bold">Permissões dos Gestores</h2>
        </div>
        <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-4">
          <p className="text-sm text-muted-foreground mb-4">
            Defina o que os Gestores Operacionais podem visualizar e gerir na plataforma.
          </p>
          <div className="grid grid-cols-1 gap-3">
            {permissions.map(perm => (
              <div 
                key={perm.id} 
                className="flex items-center justify-between p-3 rounded-xl border bg-secondary/10 hover:bg-secondary/20 transition-colors cursor-pointer"
                onClick={() => togglePermission(perm.id)}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-4 w-4 rounded border flex items-center justify-center ${managerPermissions.includes(perm.id) ? 'bg-primary border-primary text-white' : 'border-muted-foreground'}`}>
                    {managerPermissions.includes(perm.id) && <Check className="h-3 w-3" />}
                  </div>
                  <span className="text-sm font-medium">{perm.label}</span>
                </div>
                <Badge variant={managerPermissions.includes(perm.id) ? "default" : "outline"} className="text-[10px]">
                  {managerPermissions.includes(perm.id) ? "Ativo" : "Restrito"}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Clock className="h-6 w-6 text-blue-500" />
          <h2 className="text-xl font-bold">Ciclo de Vida do Sistema</h2>
        </div>
        <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-6">
          <div className="space-y-3">
            <Label className="text-sm font-bold">Duração das Notificações (Dias)</Label>
            <div className="flex items-center gap-4">
              <Input 
                type="number" 
                value={notifDuration}
                onChange={(e) => onUpdateSetting('notification_duration_days', e.target.value)}
                className="w-32 h-11 text-lg font-bold"
                min="1"
                max="30"
              />
              <p className="text-xs text-muted-foreground">
                As notificações serão removidas automaticamente após este período. 
                <br />(Recomendado: 3 a 7 dias)
              </p>
            </div>
          </div>
          
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-500 mt-0.5" />
            <p className="text-xs text-blue-800 leading-relaxed">
              <strong>Nota:</strong> Alterar a duração não afeta as notificações já enviadas, apenas as novas a partir de agora.
            </p>
          </div>
        </div>
      </div>
    </div>

    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-6 w-6 text-indigo-500" />
        <h2 className="text-xl font-bold">Gestão da Equipa (About Us)</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {teamMembers.map((member, index) => (
          <Card key={index} className="relative overflow-hidden group">
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-2 right-2 z-10 text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => {
                const updated = [...teamMembers];
                updated.splice(index, 1);
                setTeamMembers(updated);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
              {member.photo ? (
                <img src={member.photo} alt={member.name} className="h-full w-full object-cover" />
              ) : (
                <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
              )}
            </div>
            <CardContent className="p-4 space-y-3">
              <Input 
                value={member.name} 
                placeholder="Nome do colaborador"
                onChange={(e) => {
                  const updated = [...teamMembers];
                  updated[index].name = e.target.value;
                  setTeamMembers(updated);
                }}
                className="h-8 text-sm font-bold"
              />
              <Input 
                value={member.role} 
                placeholder="Função (Ex: CEO)"
                onChange={(e) => {
                  const updated = [...teamMembers];
                  updated[index].role = e.target.value;
                  setTeamMembers(updated);
                }}
                className="h-8 text-xs"
              />
              <div className="flex gap-2">
                <Input 
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id={`team-photo-${index}`}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      toast.info("A carregar foto...");
                      try {
                        const url = await uploadImage(file);
                        if (url) {
                          const updated = [...teamMembers];
                          updated[index].photo = url;
                          setTeamMembers(updated);
                          toast.success("Foto carregada.");
                        }
                      } catch (err) {
                        toast.error("Erro ao carregar imagem.");
                      }
                    }
                  }}
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-[10px] h-7"
                  onClick={() => document.getElementById(`team-photo-${index}`)?.click()}
                >
                  <ImageIcon className="h-3 w-3 mr-1" /> Alterar Foto
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        <button 
          onClick={() => setTeamMembers([...teamMembers, { name: "", role: "", photo: "" }])}
          className="flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl p-8 hover:bg-secondary/5 hover:border-primary/50 transition-all text-muted-foreground hover:text-primary"
        >
          <Plus className="h-8 w-8" />
          <span className="text-sm font-medium">Adicionar Membro</span>
        </button>
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={() => onUpdateSetting('team_members_json', JSON.stringify(teamMembers))}
          disabled={JSON.stringify(teamMembers) === settings.team_members_json}
          className="h-12 px-10 bg-indigo-600 hover:bg-indigo-700 font-bold"
        >
          <Save className="h-4 w-4 mr-2" /> Guardar Toda a Equipa
        </Button>
      </div>
    </div>

    <hr className="border-muted my-10" />

    {/* Content Editor Section */}
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileCode className="h-6 w-6 text-amber-500" />
        <h2 className="text-xl font-bold">Editor de Conteúdo Institucional</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card className="border-amber-200/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Info className="h-4 w-4 text-amber-500" /> Nossa Missão</CardTitle>
            <CardDescription className="text-xs">O propósito da plataforma.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea 
              value={aboutUs}
              placeholder="Descreva a missão..."
              onChange={(e) => setAboutUs(e.target.value)}
              className="min-h-[200px] text-sm resize-none focus:ring-amber-500/20"
            />
            <Button 
              onClick={() => onUpdateSetting('about_us_content', aboutUs)}
              disabled={aboutUs === settings.about_us_content}
              className="w-full h-10 font-bold bg-amber-600 hover:bg-amber-700"
            >
              <Save className="h-4 w-4 mr-2" /> Guardar Missão
            </Button>
          </CardContent>
        </Card>

        <Card className="border-emerald-200/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4 text-emerald-500" /> Nossa Visão</CardTitle>
            <CardDescription className="text-xs">Onde queremos chegar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea 
              value={vision}
              placeholder="Descreva a visão..."
              onChange={(e) => setVision(e.target.value)}
              className="min-h-[200px] text-sm resize-none focus:ring-emerald-500/20"
            />
            <Button 
              onClick={() => onUpdateSetting('about_us_vision', vision)}
              disabled={vision === settings.about_us_vision}
              className="w-full h-10 font-bold bg-emerald-600 hover:bg-emerald-700"
            >
              <Save className="h-4 w-4 mr-2" /> Guardar Visão
            </Button>
          </CardContent>
        </Card>

        <Card className="border-blue-200/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4 text-blue-500" /> Política de Privacidade</CardTitle>
            <CardDescription className="text-xs">Tratamento de dados.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea 
              value={privacy}
              placeholder="Escreva a política..."
              onChange={(e) => setPrivacy(e.target.value)}
              className="min-h-[200px] text-sm resize-none focus:ring-blue-500/20"
            />
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Email de Contacto</Label>
              <Input 
                value={privacyEmail}
                onChange={(e) => setPrivacyEmail(e.target.value)}
                placeholder="Ex: privacidade@sakaservice.com"
                className="h-9 text-xs"
              />
            </div>
            <Button 
              onClick={async () => {
                await onUpdateSetting('privacy_policy_content', privacy);
                await onUpdateSetting('privacy_policy_email', privacyEmail);
              }}
              disabled={privacy === settings.privacy_policy_content && privacyEmail === settings.privacy_policy_email}
              className="w-full h-10 font-bold bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" /> Guardar Privacidade
            </Button>
          </CardContent>
        </Card>

        <Card className="border-slate-200/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4 text-slate-500" /> Termos de Serviço</CardTitle>
            <CardDescription className="text-xs">Regras de uso.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea 
              value={terms}
              placeholder="Escreva os termos..."
              onChange={(e) => setTerms(e.target.value)}
              className="min-h-[200px] text-sm resize-none focus:ring-slate-500/20"
            />
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Email de Contacto</Label>
              <Input 
                value={termsEmail}
                onChange={(e) => setTermsEmail(e.target.value)}
                placeholder="Ex: termos@sakaservice.com"
                className="h-9 text-xs"
              />
            </div>
            <Button 
              onClick={async () => {
                await onUpdateSetting('terms_service_content', terms);
                await onUpdateSetting('terms_service_email', termsEmail);
              }}
              disabled={terms === settings.terms_service_content && termsEmail === settings.terms_service_email}
              className="w-full h-10 font-bold bg-slate-700 hover:bg-slate-800"
            >
              <Save className="h-4 w-4 mr-2" /> Guardar Termos
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800 text-xs flex items-start gap-3">
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          As alterações feitas nestes campos refletem-se instantaneamente nas páginas públicas correspondentes. 
          Pode usar parágrafos simples. A formatação rica (HTML) será renderizada se suportada pelas páginas.
        </p>
      </div>
    </div>
  </div>
  );
}


// Reusable Verification Card Component
function VerificationItem({ pro, mutation, featuredMutation, deleteMutation, canManage }: { pro: any, mutation: any, featuredMutation: any, deleteMutation: any, canManage: boolean }) {
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
    <div className="bg-card border rounded-2xl p-6 shadow-md overflow-hidden relative border-gradient-hero">
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
              <ImageIcon className="h-3 w-3" /> Vídeo / Atividade
            </p>
            {pro.activity_video_url ? (
              <div className="space-y-2">
                <div className="h-40 w-full overflow-hidden rounded-xl border bg-black flex items-center justify-center relative group">
                  {pro.activity_video_url ? (
                    <video 
                      src={pro.activity_video_url.includes('drive.google.com') 
                           ? pro.activity_video_url.replace('view?usp=sharing', 'preview') 
                           : pro.activity_video_url} 
                      className="h-full w-full object-contain"
                      controls
                    />
                  ) : (
                    <div className="text-center text-white">
                      <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <span className="text-[10px] font-bold">FORMATO DRIVE</span>
                    </div>
                  )}
                  <a 
                    href={pro.activity_video_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl z-20"
                  >
                    <ExternalLink className="h-5 w-5 text-white" />
                  </a>
                </div>
              </div>
            ) : <div className="h-40 border border-dashed rounded-xl flex items-center justify-center text-[10px] text-muted-foreground bg-muted/10">VÍDEO NÃO CARREGADO</div>}
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
                 <span>Vídeo Atividade:</span>
                 {pro.activity_video_url ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />}
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
        
        {canManage && (
          <>
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
              variant="outline"
              className="w-full h-11 font-bold border-primary text-primary hover:bg-primary/5 gap-2"
              asChild
            >
              <Link to={`/admin/verifications?tab=notifications&replyTo=${pro.id}&notifTitle=${encodeURIComponent(pro.name)}`}>
                <Mail className="h-4 w-4" /> Contactar Profissional
              </Link>
            </Button>

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
          </>
        )}
        <Link to={`/professional/${pro.id}`} className="text-xs text-center text-primary hover:underline">
          Ver perfil público →
        </Link>
      </div>
      </div>
    </div>
  );
}

// Subscription Management Panel Component
function SubscriptionManagementPanel({ pendingSubs, allSubs, loading }: { pendingSubs: any[], allSubs: any[], loading: boolean }) {
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
}

function SubscriptionItem({ sub }: { sub: any }) {
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
              <span className="text-xs text-muted-foreground">Express</span>
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
            <Button size="sm" variant="ghost" className="w-full text-muted-foreground text-[10px]" disabled>
              Ativado em {new Date(sub.start_date).toLocaleDateString()}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function PropertiesApprovalPanel({ isAdmin }: { isAdmin: boolean }) {
  const queryClient = useQueryClient();
  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['pendingProperties'],
    queryFn: () => import("@/data/api").then(api => api.getPendingProperties()),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => import("@/data/api").then(api => api.updatePropertyStatus(id, 'approved')),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingProperties'] });
      toast.success("Imóvel aprovado e publicado!");
    },
    onError: (err: any) => toast.error("Erro ao aprovar: " + err.message)
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string, reason: string }) => 
      import("@/data/api").then(api => api.updatePropertyStatus(id, 'rejected', reason)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingProperties'] });
      toast.success("Imóvel rejeitado.");
    },
    onError: (err: any) => toast.error("Erro ao rejeitar: " + err.message)
  });

  if (isLoading) return <div className="flex justify-center py-20">A carregar anúncios pendentes...</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Home className="h-6 w-6 text-primary" /> Aprovação de Imóveis
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Analise as fotos, descrição e comprovativo bancário antes de aprovar.
        </p>
      </div>

      {properties.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-20 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground opacity-20 mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">Não há imóveis pendentes de aprovação.</h3>
        </div>
      ) : (
        <div className="grid gap-6">
          {properties.map((prop: any) => (
            <div key={prop.id} className="bg-card border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
              <div className="flex flex-col lg:flex-row">
                {/* Image Gallery Preview */}
                <div className="lg:w-80 h-48 lg:h-auto bg-muted relative shrink-0">
                  {prop.imagens && prop.imagens.length > 0 ? (
                    <img src={prop.imagens[0]} className="w-full h-full object-cover" alt="Property" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">Sem fotos</div>
                  )}
                  <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded-full font-bold">
                    {prop.imagens?.length || 0} fotos
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded uppercase">{prop.tipologia}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> {prop.localizacao}</span>
                      </div>
                      <h4 className="font-bold text-lg">{prop.preco_mensal.toLocaleString()} Kz <span className="text-xs font-normal text-muted-foreground">/mês</span></h4>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Submetido em</p>
                      <p className="text-xs">{new Date(prop.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2">{prop.descricao}</p>

                  <div className="grid grid-cols-2 gap-4 bg-muted/30 p-3 rounded-xl border border-border/50">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Contacto</p>
                      <p className="text-xs font-bold">{prop.contacto_nome}</p>
                      <p className="text-[10px] text-muted-foreground">{prop.contacto_telefone}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Comprovativo</p>
                      {prop.comprovativo_url ? (
                        <a 
                          href={prop.comprovativo_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary text-xs font-bold flex items-center gap-1 hover:underline"
                        >
                          <Receipt className="h-3 w-3" /> Ver Recibo
                        </a>
                      ) : (
                        <span className="text-xs text-destructive font-medium">Não anexado</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 border-t mt-auto">
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700 text-white font-bold gap-2"
                      onClick={() => approveMutation.mutate(prop.id)}
                      disabled={approveMutation.isPending}
                    >
                      <Check className="h-4 w-4" /> Aprovar Anúncio
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-destructive text-destructive hover:bg-destructive/5 font-bold"
                      onClick={() => {
                        const reason = prompt("Razão da rejeição?");
                        if (reason) rejectMutation.mutate({ id: prop.id, reason });
                      }}
                      disabled={rejectMutation.isPending}
                    >
                      <X className="h-4 w-4" /> Rejeitar
                    </Button>
                    <Button variant="ghost" size="sm" asChild className="ml-auto text-muted-foreground h-8 text-xs font-medium">
                        <Link to={`/imoveis/${prop.id}`} target="_blank" className="flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" /> Pré-visualizar
                        </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


export default AdminVerifications;
