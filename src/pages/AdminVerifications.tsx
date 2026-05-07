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
  uploadImage,
  getFreshSignedUrl
} from "@/data/api";
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { Button } from "@/components/ui/button";
import { Check, X, ExternalLink, Shield, ShieldCheck, Users, FileText, ArrowLeft, Search, AlertCircle, Star, Pause, RotateCcw, Settings, Plus, Trash2, Mail, BarChart3, TrendingUp, Home, Calendar, Eye, LayoutGrid, Save, Image as ImageIcon, CreditCard, Receipt, Clock, CheckCircle, Sparkles, Bell, Megaphone, Info, FileCode, Target, Monitor, Zap, ChevronDown, ArrowDownAZ, Play, Video, Quote } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import NotificationsManagementPanel from "@/components/NotificationsManagementPanel";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
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
  const [expandedPending, setExpandedPending] = useState(false);
  const [expandedAll, setExpandedAll] = useState(false);
  const [proSearch, setProSearch] = useState("");
  const [proStatusFilter, setProStatusFilter] = useState("all");
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

  const filteredAndSortedPros = useMemo(() => {
    let result = [...allPros];

    // Filter by Search
    if (proSearch) {
      const q = proSearch.toLowerCase();
      result = result.filter(p =>
        (p.name || "").toLowerCase().includes(q) ||
        (p.email || "").toLowerCase().includes(q)
      );
    }

    // Filter by Status
    if (proStatusFilter !== 'all') {
      result = result.filter(p => p.verification_status === proStatusFilter);
    }

    // Sort A-Z
    result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

    return result;
  }, [allPros, proSearch, proStatusFilter]);

  const managerList = (settings.manager_emails || "").split(',').filter(Boolean);
  const isManager = managerList.includes(user?.email || "") ||
    user?.email === 'podosk2010@hotmail.com';

  const isAuthorized = isAdmin || isManager;

  const canAccess = (tab: string) => {
    if (isAdmin) return true;
    if (!isManager) return false;

    const perms = (settings.manager_permissions || "verifications,properties").split(',');

    switch (tab) {
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
          <div className="space-y-6">
            <div className="bg-card border rounded-2xl overflow-hidden shadow-sm border-l-4 border-l-primary">
              <button
                onClick={() => setExpandedPending(!expandedPending)}
                className="w-full flex items-center justify-between p-5 hover:bg-secondary/10 transition-colors text-left"
              >
                <h2 className="text-xl font-bold flex items-center gap-3">
                  <ShieldCheck className="h-6 w-6 text-primary" /> Perfis que Aguardam Verificação ({pending.length})
                </h2>
                <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${expandedPending ? 'rotate-180' : ''}`} />
              </button>

              {expandedPending && (
                <div className="p-6 pt-0 border-t animate-in fade-in slide-in-from-top-2">
                  <div className="mt-6">
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
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : viewMode === 'all' ? (
          <div className="space-y-6">
            <div className="bg-card border rounded-2xl overflow-hidden shadow-sm border-l-4 border-l-slate-400">
              <button
                onClick={() => setExpandedAll(!expandedAll)}
                className="w-full flex items-center justify-between p-5 hover:bg-secondary/10 transition-colors text-left"
              >
                <h2 className="text-xl font-bold flex items-center gap-3">
                  <Users className="h-6 w-6 text-slate-500" /> Todos os Profissionais ({filteredAndSortedPros.length})
                </h2>
                <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${expandedAll ? 'rotate-180' : ''}`} />
              </button>

              {expandedAll && (
                <div className="p-6 pt-0 border-t animate-in fade-in slide-in-from-top-2">
                  <div className="mt-6">
                    {isLoadingAll ? (
                      <div className="flex justify-center py-20">A carregar todos os perfis...</div>
                    ) : allPros.length === 0 ? (
                      <div className="rounded-2xl border border-dashed p-20 text-center">
                        <Search className="mx-auto h-12 w-12 text-muted-foreground opacity-20 mb-4" />
                        <h3 className="text-lg font-medium text-muted-foreground">Nenhum profissional registado.</h3>
                      </div>
                    ) : (
                      <div className="grid gap-6">
                        <div className="flex flex-col md:flex-row gap-4 mb-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                              type="text"
                              placeholder="Pesquisar por nome ou e-mail..."
                              value={proSearch}
                              onChange={(e) => setProSearch(e.target.value)}
                              className="w-full h-10 pl-10 pr-4 rounded-lg border bg-white outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                            />
                          </div>
                          <select
                            value={proStatusFilter}
                            onChange={(e) => setProStatusFilter(e.target.value)}
                            className="h-10 px-4 rounded-lg border bg-white outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium min-w-[200px]"
                          >
                            <option value="all">Todos os Estados</option>
                            <option value="ativo">Ativos / Verified</option>
                            <option value="pending_review">Aguardando Verificação</option>
                            <option value="suspenso">Suspensos</option>
                            <option value="incompleto">Incompletos</option>
                          </select>
                          <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-lg border text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            <ArrowDownAZ className="h-4 w-4 text-primary" /> AZ
                          </div>
                        </div>

                        {filteredAndSortedPros.length === 0 ? (
                          <div className="py-20 text-center border-2 border-dashed rounded-2xl">
                            <p className="text-muted-foreground">Nenhum profissional encontrado com estes filtros.</p>
                          </div>
                        ) : (
                          filteredAndSortedPros.map((pro: any) => (
                            <VerificationItem
                              key={pro.id}
                              pro={pro}
                              mutation={mutation}
                              featuredMutation={featuredMutation}
                              deleteMutation={deleteMutation}
                              canManage={isAuthorized}
                            />
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
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
          <AnalyticsDashboard />
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
                          <img src={pro.avatar || "https://zldaauprystajzxfypmc.supabase.co/storage/v1/object/public/uploads/Logo%20Oku%20Saka%20e%20Sakaservice.png"} alt="" className="h-full w-full object-cover" />
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
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${pro.verification_status === 'ativo' ? 'bg-green-100 text-green-700' :
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
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    hero: false,
    prices: false,
    banks: false,
    storage: false,
    visibility: false,
    imoveis: false,
    links: false,
    banners: false,
    categories: false,
    identity: false,
    footer: false,
    emails: false,
    testimonials: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

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

  const handleUpdateCategoryProfessions = async (id: string, professionsString: string) => {
    try {
      setLoading(true);
      const professionsArray = professionsString.split(',').map(p => p.trim()).filter(Boolean);
      await updateCategory(id, { professions_preview: professionsArray });
      toast.success("Profissões da categoria atualizadas.");
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    } catch (e: any) {
      toast.error(e.message || "Erro ao atualizar profissões da categoria.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCategoryName = async (id: string, newName: string) => {
    try {
      setLoading(true);
      await updateCategory(id, { name: newName });
      toast.success("Nome da categoria atualizado.");
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    } catch (e: any) {
      toast.error(e.message || "Erro ao atualizar nome da categoria.");
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
    <div key={settings.brand_name || 'management-panel'} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header with Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-primary/5 p-6 rounded-2xl border border-primary/10 mb-8">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" /> Configurações da Plataforma
          </h3>
          <p className="text-sm text-muted-foreground mt-1">Gestão centralizada de conteúdos, preços, visibilidade e categorias.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            asChild
            className="bg-background border-primary/20 hover:bg-primary/5 h-10"
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
              toast.success("Sincronização iniciada...");
              queryClient.invalidateQueries({ queryKey: ['siteSettings'] });
              queryClient.invalidateQueries({ queryKey: ['categories'] });
            }}
            className="gap-2 shadow-md hover:shadow-lg transition-all h-10"
          >
            <Save className="h-4 w-4" /> Salvar Tudo
          </Button>
        </div>
      </div>

      {/* 1. Hero Management */}
      <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
        <button
          onClick={() => toggleSection('hero')}
          className="w-full flex items-center justify-between p-5 hover:bg-secondary/10 transition-colors text-left"
        >
          <h3 className="text-lg font-bold flex items-center gap-3">
            <Monitor className="h-5 w-5 text-primary" /> Conteúdo do Hero (Início)
          </h3>
          <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${expandedSections.hero ? 'rotate-180' : ''}`} />
        </button>
        {expandedSections.hero && (
          <div className="p-6 pt-0 border-t animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Badge Texto</label>
                <input
                  type="text"
                  defaultValue={settings.hero_badge_text || "Qualidade e Confiança em Angola"}
                  className="w-full h-11 px-4 rounded-xl border bg-background"
                  onBlur={(e) => handleUpdateSetting('hero_badge_text', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Título Principal</label>
                <input
                  type="text"
                  defaultValue={settings.hero_title_text || "Encontre profissionais confiáveis"}
                  className="w-full h-11 px-4 rounded-xl border bg-background"
                  onBlur={(e) => handleUpdateSetting('hero_title_text', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Título Destaque</label>
                <input
                  type="text"
                  defaultValue={settings.hero_title_highlight || "— rápido e sem complicação"}
                  className="w-full h-11 px-4 rounded-xl border bg-background"
                  onBlur={(e) => handleUpdateSetting('hero_title_highlight', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Subtítulo</label>
                <textarea
                  rows={2}
                  defaultValue={settings.hero_subtitle_text || ""}
                  className="w-full p-4 rounded-xl border bg-background resize-none"
                  onBlur={(e) => handleUpdateSetting('hero_subtitle_text', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Subscription Prices */}
      <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
        <button
          onClick={() => toggleSection('prices')}
          className="w-full flex items-center justify-between p-5 hover:bg-secondary/10 transition-colors text-left"
        >
          <h3 className="text-lg font-bold flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-primary" /> Preços & Planos de Assinatura
          </h3>
          <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${expandedSections.prices ? 'rotate-180' : ''}`} />
        </button>
        {expandedSections.prices && (
          <div className="p-6 pt-0 border-t animate-in fade-in slide-in-from-top-2">
            <div className="space-y-8 mt-6">
              {/* Header Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6 border-b">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Título Principal da Página</label>
                  <input
                    type="text"
                    defaultValue={settings.pricing_title || "Ative o seu Perfil Profissional"}
                    className="w-full h-11 px-4 rounded-xl border bg-background font-bold"
                    onBlur={(e) => handleUpdateSetting('pricing_title', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Subtítulo da Página</label>
                  <input
                    type="text"
                    defaultValue={settings.pricing_subtitle || "Escolha o melhor plano para o seu negócio."}
                    className="w-full h-11 px-4 rounded-xl border bg-background"
                    onBlur={(e) => handleUpdateSetting('pricing_subtitle', e.target.value)}
                  />
                </div>
              </div>

              {/* Individual Plans */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Mensal */}
                <div className="space-y-4 p-4 rounded-2xl border bg-muted/5">
                  <h4 className="font-bold text-primary flex items-center gap-2">
                    Plano Mensal
                  </h4>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Preço (Numérico)</label>
                      <input
                        type="number"
                        defaultValue={settings.price_mensal || "2500"}
                        className="w-full h-9 px-3 rounded-lg border bg-background font-bold"
                        onBlur={(e) => handleUpdateSetting('price_mensal', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Descrição Curta</label>
                      <textarea
                        rows={2}
                        defaultValue={settings.pricing_mensal_desc || "Ideal para experimentar as vantagens da plataforma."}
                        className="w-full p-2 text-xs rounded-lg border bg-background resize-none"
                        onBlur={(e) => handleUpdateSetting('pricing_mensal_desc', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Funcionalidades (Uma por linha)</label>
                      <textarea
                        rows={4}
                        defaultValue={settings.pricing_mensal_features || "Perfil visível publicamente\nAparecer em resultados de busca\nLink direto para WhatsApp"}
                        className="w-full p-2 text-xs rounded-lg border bg-background font-mono"
                        onBlur={(e) => handleUpdateSetting('pricing_mensal_features', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Badge / Selo</label>
                      <input
                        type="text"
                        defaultValue={settings.pricing_mensal_badge || ""}
                        className="w-full h-9 px-3 text-xs rounded-lg border bg-background"
                        onBlur={(e) => handleUpdateSetting('pricing_mensal_badge', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Trimestral */}
                <div className="space-y-4 p-4 rounded-2xl border bg-muted/5">
                  <h4 className="font-bold text-primary flex items-center gap-2">
                    Plano Trimestral
                  </h4>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Preço (Numérico)</label>
                      <input
                        type="number"
                        defaultValue={settings.price_trimestral || "5000"}
                        className="w-full h-9 px-3 rounded-lg border bg-background font-bold"
                        onBlur={(e) => handleUpdateSetting('price_trimestral', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Descrição Curta</label>
                      <textarea
                        rows={2}
                        defaultValue={settings.pricing_trimestral_desc || "Para profissionais que querem validar resultados a curto prazo."}
                        className="w-full p-2 text-xs rounded-lg border bg-background resize-none"
                        onBlur={(e) => handleUpdateSetting('pricing_trimestral_desc', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Funcionalidades (Uma por linha)</label>
                      <textarea
                        rows={4}
                        defaultValue={settings.pricing_trimestral_features || "Perfil visível publicamente\nAparecer em resultados de busca\nLink direto para WhatsApp\nEstatísticas de visualização"}
                        className="w-full p-2 text-xs rounded-lg border bg-background font-mono"
                        onBlur={(e) => handleUpdateSetting('pricing_trimestral_features', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Badge / Selo</label>
                      <input
                        type="text"
                        defaultValue={settings.pricing_trimestral_badge || "Mais Popular"}
                        className="w-full h-9 px-3 text-xs rounded-lg border bg-background"
                        onBlur={(e) => handleUpdateSetting('pricing_trimestral_badge', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Semestral */}
                <div className="space-y-4 p-4 rounded-2xl border bg-primary/5 border-primary/20">
                  <h4 className="font-bold text-primary flex items-center gap-2">
                    Plano Semestral
                  </h4>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Preço (Numérico)</label>
                      <input
                        type="number"
                        defaultValue={settings.price_semestral || "9000"}
                        className="w-full h-9 px-3 rounded-lg border bg-background font-bold"
                        onBlur={(e) => handleUpdateSetting('price_semestral', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Descrição Curta</label>
                      <textarea
                        rows={2}
                        defaultValue={settings.pricing_semestral_desc || "A melhor escolha para profissionais estabelecidos. Excelente custo-benefício."}
                        className="w-full p-2 text-xs rounded-lg border bg-background resize-none"
                        onBlur={(e) => handleUpdateSetting('pricing_semestral_desc', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Funcionalidades (Uma por linha)</label>
                      <textarea
                        rows={4}
                        defaultValue={settings.pricing_semestral_features || "Todas as funcionalidades do trimestral\nPrioridade em buscas selecionadas\nSelo de profissional ativo\nSuporte prioritário"}
                        className="w-full p-2 text-xs rounded-lg border bg-background font-mono"
                        onBlur={(e) => handleUpdateSetting('pricing_semestral_features', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Badge / Selo</label>
                      <input
                        type="text"
                        defaultValue={settings.pricing_semestral_badge || ""}
                        className="w-full h-9 px-3 text-xs rounded-lg border bg-background"
                        onBlur={(e) => handleUpdateSetting('pricing_semestral_badge', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Anual */}
                <div className="space-y-4 p-4 rounded-2xl border bg-muted/5">
                  <h4 className="font-bold text-primary flex items-center gap-2">
                    Plano Anual
                  </h4>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Preço (Numérico)</label>
                      <input
                        type="number"
                        defaultValue={settings.price_anual || "17000"}
                        className="w-full h-9 px-3 rounded-lg border bg-background font-bold"
                        onBlur={(e) => handleUpdateSetting('price_anual', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Descrição Curta</label>
                      <textarea
                        rows={2}
                        defaultValue={settings.pricing_anual_desc || "Visibilidade o ano inteiro. A maior poupança."}
                        className="w-full p-2 text-xs rounded-lg border bg-background resize-none"
                        onBlur={(e) => handleUpdateSetting('pricing_anual_desc', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Funcionalidades (Uma por linha)</label>
                      <textarea
                        rows={4}
                        defaultValue={settings.pricing_anual_features || "Todas as funcionalidades do semestral\nPrioridade máxima em buscas\nDestaque garantido nas listas\nSelo Premium"}
                        className="w-full p-2 text-xs rounded-lg border bg-background font-mono"
                        onBlur={(e) => handleUpdateSetting('pricing_anual_features', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Badge / Selo</label>
                      <input
                        type="text"
                        defaultValue={settings.pricing_anual_badge || ""}
                        className="w-full h-9 px-3 text-xs rounded-lg border bg-background"
                        onBlur={(e) => handleUpdateSetting('pricing_anual_badge', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Bank Info & Payment Contacts */}
      <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
        <button
          onClick={() => toggleSection('banks')}
          className="w-full flex items-center justify-between p-5 hover:bg-secondary/10 transition-colors text-left"
        >
          <h3 className="text-lg font-bold flex items-center gap-3">
            <Receipt className="h-5 w-5 text-primary" /> Coordenadas Bancárias & Pagamentos
          </h3>
          <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${expandedSections.banks ? 'rotate-180' : ''}`} />
        </button>
        {expandedSections.banks && (
          <div className="p-6 pt-0 border-t animate-in fade-in slide-in-from-top-2">
            <div className="space-y-8 mt-6">
              {/* Bank 1 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 rounded-xl bg-primary/5 border border-primary/10">
                <div className="md:col-span-3 pb-2 border-b">
                  <h4 className="text-sm font-black uppercase text-primary">Banco Principal (1)</h4>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Nome do Banco</label>
                  <input
                    type="text"
                    defaultValue={settings.bank_name || "BAI"}
                    className="w-full h-11 px-4 rounded-xl border bg-background font-bold"
                    onBlur={(e) => handleUpdateSetting('bank_name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">IBAN</label>
                  <input
                    type="text"
                    defaultValue={settings.bank_iban || ""}
                    className="w-full h-11 px-4 rounded-xl border bg-background font-mono text-sm"
                    onBlur={(e) => handleUpdateSetting('bank_iban', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Titular da Conta</label>
                  <input
                    type="text"
                    defaultValue={settings.bank_holder || ""}
                    className="w-full h-11 px-4 rounded-xl border bg-background"
                    onBlur={(e) => handleUpdateSetting('bank_holder', e.target.value)}
                  />
                </div>
              </div>

              {/* Bank 2 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 rounded-xl bg-secondary/5 border border-secondary/10">
                <div className="md:col-span-3 pb-2 border-b">
                  <h4 className="text-sm font-black uppercase text-muted-foreground">Banco Alternativo (2)</h4>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Nome do Banco 2</label>
                  <input
                    type="text"
                    defaultValue={settings.bank_name_2 || ""}
                    className="w-full h-11 px-4 rounded-xl border bg-background"
                    onBlur={(e) => handleUpdateSetting('bank_name_2', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">IBAN 2</label>
                  <input
                    type="text"
                    defaultValue={settings.bank_iban_2 || ""}
                    className="w-full h-11 px-4 rounded-xl border bg-background font-mono text-sm"
                    onBlur={(e) => handleUpdateSetting('bank_iban_2', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Titular da Conta 2</label>
                  <input
                    type="text"
                    defaultValue={settings.bank_holder_2 || ""}
                    className="w-full h-11 px-4 rounded-xl border bg-background"
                    onBlur={(e) => handleUpdateSetting('bank_holder_2', e.target.value)}
                  />
                </div>
              </div>

              {/* Other Payment Methods & Support */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Número MCX Express</label>
                  <input
                    type="text"
                    defaultValue={settings.mcx_express_number || ""}
                    className="w-full h-11 px-4 rounded-xl border bg-background font-bold text-primary"
                    onBlur={(e) => handleUpdateSetting('mcx_express_number', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">WhatsApp para Comprovativos</label>
                  <input
                    type="text"
                    defaultValue={settings.whatsapp_proofs || "951849304"}
                    className="w-full h-11 px-4 rounded-xl border bg-background font-bold text-green-600"
                    onBlur={(e) => handleUpdateSetting('whatsapp_proofs', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">E-mail de Suporte (Pagamentos)</label>
                  <input
                    type="email"
                    defaultValue={settings.support_email || "sakaservice.ao@gmail.com"}
                    className="w-full h-11 px-4 rounded-xl border bg-background"
                    onBlur={(e) => handleUpdateSetting('support_email', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Mensagem de Sucesso (Pós-Envio)</label>
                  <textarea
                    rows={3}
                    defaultValue={settings.payment_success_message || "Recebemos o seu comprovativo. O seu perfil será ativado assim que validarmos a transferência. Se tiver pressa, envie o comprovativo para o WhatsApp."}
                    className="w-full p-4 rounded-xl border bg-background resize-none text-sm leading-tight"
                    onBlur={(e) => handleUpdateSetting('payment_success_message', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4.5. Testimonials Management */}
      <div className="bg-card border rounded-2xl overflow-hidden shadow-sm border-l-4 border-l-primary">
        <button
          onClick={() => toggleSection('testimonials')}
          className="w-full flex items-center justify-between p-5 hover:bg-secondary/10 transition-colors text-left"
        >
          <h3 className="text-lg font-bold flex items-center gap-3">
            <Quote className="h-5 w-5 text-primary" /> O Que Dizem de Nós (Testemunhos)
          </h3>
          <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${expandedSections.testimonials ? 'rotate-180' : ''}`} />
        </button>
        {expandedSections.testimonials && (
          <div className="p-6 pt-0 border-t animate-in fade-in slide-in-from-top-2">
            <div className="space-y-6 mt-6">
              <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/10">
                <div className="flex flex-col">
                  <span className="font-bold">Exibir Secção de Testemunhos na Home</span>
                  <span className="text-[10px] text-muted-foreground uppercase">show_testimonials</span>
                </div>
                <Button
                  size="sm"
                  variant={settings.show_testimonials === 'true' ? 'default' : 'destructive'}
                  onClick={() => handleUpdateSetting('show_testimonials', settings.show_testimonials === 'true' ? 'false' : 'true')}
                >
                  {settings.show_testimonials === 'true' ? 'Ativado' : 'Desativado'}
                </Button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Lista de Testemunhos</h4>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-8 gap-2"
                    onClick={() => {
                      const current = JSON.parse(settings.testimonials_json || "[]");
                      const newItem = { name: "Novo Nome", role: "Cliente", text: "Escreva o testemunho aqui...", avatar: "" };
                      handleUpdateSetting('testimonials_json', JSON.stringify([...current, newItem]));
                    }}
                  >
                    <Plus className="h-4 w-4" /> Adicionar Testemunho
                  </Button>
                </div>

                <div className="grid gap-4">
                  {(() => {
                    let testimonials = [];
                    try {
                      testimonials = JSON.parse(settings.testimonials_json || "[]");
                    } catch (e) {
                      testimonials = [];
                    }
                    
                    if (testimonials.length === 0) {
                      return <div className="text-center py-8 border border-dashed rounded-xl text-muted-foreground text-sm">Nenhum testemunho configurado. Clique em "Adicionar" para começar.</div>;
                    }

                    return testimonials.map((t: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-xl border bg-background space-y-4 relative group">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="absolute top-2 right-2 h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            const current = [...testimonials];
                            current.splice(idx, 1);
                            handleUpdateSetting('testimonials_json', JSON.stringify(current));
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground">Nome</label>
                            <input 
                              type="text" 
                              value={t.name}
                              onChange={(e) => {
                                const current = [...testimonials];
                                current[idx].name = e.target.value;
                                // We use onBlur for actual saving to avoid too many DB calls
                              }}
                              onBlur={(e) => {
                                const current = [...testimonials];
                                current[idx].name = e.target.value;
                                handleUpdateSetting('testimonials_json', JSON.stringify(current));
                              }}
                              className="w-full h-9 px-3 rounded-lg border bg-muted/20 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground">Cargo / Role</label>
                            <input 
                              type="text" 
                              value={t.role}
                              onBlur={(e) => {
                                const current = [...testimonials];
                                current[idx].role = e.target.value;
                                handleUpdateSetting('testimonials_json', JSON.stringify(current));
                              }}
                              className="w-full h-9 px-3 rounded-lg border bg-muted/20 text-sm"
                            />
                          </div>
                          <div className="md:col-span-2 space-y-1">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground">Testemunho</label>
                            <textarea 
                              rows={2}
                              defaultValue={t.text}
                              onBlur={(e) => {
                                const current = [...testimonials];
                                current[idx].text = e.target.value;
                                handleUpdateSetting('testimonials_json', JSON.stringify(current));
                              }}
                              className="w-full p-3 rounded-lg border bg-muted/20 text-sm resize-none"
                            />
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Storage Shortcuts */}
      <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
        <button
          onClick={() => toggleSection('storage')}
          className="w-full flex items-center justify-between p-5 hover:bg-secondary/10 transition-colors text-left"
        >
          <h3 className="text-lg font-bold flex items-center gap-3">
            <ImageIcon className="h-5 w-5 text-primary" /> Atalhos de Storage
          </h3>
          <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${expandedSections.storage ? 'rotate-180' : ''}`} />
        </button>
        {expandedSections.storage && (
          <div className="p-6 pt-0 border-t animate-in fade-in slide-in-from-top-2">
            <div className="flex flex-wrap gap-3 mt-6">
              <Button variant="default" size="sm" asChild className="bg-orange-600 border-orange-100 text-white hover:bg-orange-700 shadow-md">
                <a href="https://supabase.com/dashboard/project/zldaauprystajzxfypmc/storage/buckets/uploads" target="_blank" rel="noopener noreferrer">
                  <Video className="h-4 w-4 mr-2" /> Vídeos/Fotos Portfólio
                </a>
              </Button>
              <Button variant="default" size="sm" asChild className="bg-purple-600 border-purple-100 text-white hover:bg-purple-700 shadow-md">
                <a href="https://supabase.com/dashboard/project/zldaauprystajzxfypmc/storage/buckets/professional-documents" target="_blank" rel="noopener noreferrer">
                  <Video className="h-4 w-4 mr-2" /> Vídeos de Atividade
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild className="bg-background border-blue-100 text-blue-700 hover:bg-blue-50">
                <a href="https://supabase.com/dashboard/project/zldaauprystajzxfypmc/storage/buckets/professional-documents" target="_blank" rel="noopener noreferrer">
                  <Shield className="h-4 w-4 mr-2" /> Documentos BI/Cert
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild className="bg-background border-amber-100 text-amber-700 hover:bg-amber-50">
                <a href="https://supabase.com/dashboard/project/zldaauprystajzxfypmc/storage/buckets/uploads" target="_blank" rel="noopener noreferrer">
                  <ImageIcon className="h-4 w-4 mr-2" /> Fotos de Perfil
                </a>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 5. Visibility Management */}
      <div className="bg-card border rounded-2xl overflow-hidden shadow-sm border-l-4 border-l-primary">
        <button
          onClick={() => toggleSection('visibility')}
          className="w-full flex items-center justify-between p-5 hover:bg-secondary/10 transition-colors text-left"
        >
          <h3 className="text-lg font-bold flex items-center gap-3">
            <Zap className="h-5 w-5 text-primary" /> Visibilidade & Funcionalidades
          </h3>
          <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${expandedSections.visibility ? 'rotate-180' : ''}`} />
        </button>
        {expandedSections.visibility && (
          <div className="p-6 pt-0 border-t animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {[
                { label: "Modo de Manutenção (Site Bloqueado)", key: "maintenance_mode" },
                { label: "Exibir Destaques na Home", key: "show_featured_home" },
                { label: "Obrigar Comprovativo de Pagamento", key: "require_payment_proof" },
                { label: "Obrigar BI / Identidade", key: "require_bi_verification" },
                { label: "Obrigar Certificado Profissional", key: "require_certificate_verification" },
                { label: "Obrigar Vídeo de Identidade", key: "require_video_verification" },
                { label: "Mostrar Banco Alternativo (Dados 2)", key: "show_alternative_bank" }
              ].map((f) => (
                <div key={f.key} className="flex items-center justify-between p-4 rounded-xl border bg-background hover:border-primary/30 transition-colors">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">{f.label}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">{f.key}</span>
                  </div>
                  <div className="flex gap-1 bg-secondary/20 p-1 rounded-lg">
                    <Button
                      size="sm"
                      variant={settings[f.key] === 'true' ? 'default' : 'ghost'}
                      onClick={() => handleUpdateSetting(f.key, 'true')}
                      className="h-8 text-xs px-4"
                    >
                      Ativar
                    </Button>
                    <Button
                      size="sm"
                      variant={settings[f.key] !== 'true' ? 'destructive' : 'ghost'}
                      onClick={() => handleUpdateSetting(f.key, 'false')}
                      className="h-8 text-xs px-4"
                    >
                      Desativar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 6. Saka Imóveis */}
      <div className="bg-card border rounded-2xl overflow-hidden shadow-sm border-l-4 border-l-primary">
        <button
          onClick={() => toggleSection('imoveis')}
          className="w-full flex items-center justify-between p-5 hover:bg-secondary/10 transition-colors text-left"
        >
          <h3 className="text-lg font-bold flex items-center gap-3">
            <Home className="h-5 w-5 text-primary" /> Gestão Saka Imóveis
          </h3>
          <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${expandedSections.imoveis ? 'rotate-180' : ''}`} />
        </button>
        {expandedSections.imoveis && (
          <div className="p-6 pt-0 border-t animate-in fade-in slide-in-from-top-2">
            <div className="space-y-6 mt-6">
              <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/10">
                <span className="font-bold">Exibir Secção de Imóveis na Home</span>
                <Button
                  size="sm"
                  variant={settings.show_imoveis === 'true' ? 'default' : 'destructive'}
                  onClick={() => handleUpdateSetting('show_imoveis', settings.show_imoveis === 'true' ? 'false' : 'true')}
                >
                  {settings.show_imoveis === 'true' ? 'Ativado' : 'Desativado'}
                </Button>
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
                    defaultValue={settings.imoveis_button_text || "Ver imóveis"}
                    className="w-full h-11 px-4 rounded-xl border bg-background"
                    onBlur={(e) => handleUpdateSetting('imoveis_button_text', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Título Principal</label>
                <input
                  type="text"
                  defaultValue={settings.imoveis_title || ""}
                  className="w-full h-11 px-4 rounded-xl border bg-background font-bold"
                  onBlur={(e) => handleUpdateSetting('imoveis_title', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Descrição / Subtítulo</label>
                <textarea
                  rows={2}
                  defaultValue={settings.imoveis_description || ""}
                  className="w-full p-4 rounded-xl border bg-background resize-none"
                  onBlur={(e) => handleUpdateSetting('imoveis_description', e.target.value)}
                />
              </div>

              <div className="space-y-2 pt-4 border-t">
                <label className="text-xs font-bold uppercase text-primary font-black">URL do Preçário (PDF ou Link)</label>
                <input
                  type="text"
                  placeholder="https://..."
                  defaultValue={settings.imoveis_pricing_url || ""}
                  className="w-full h-11 px-4 rounded-xl border border-primary/20 bg-primary/5"
                  onBlur={(e) => handleUpdateSetting('imoveis_pricing_url', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 7. Identity & Branding */}
      <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
        <button
          onClick={() => toggleSection('identity')}
          className="w-full flex items-center justify-between p-5 hover:bg-secondary/10 transition-colors text-left"
        >
          <h3 className="text-lg font-bold flex items-center gap-3">
            <Shield className="h-5 w-5 text-primary" /> Identidade da Marca
          </h3>
          <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${expandedSections.identity ? 'rotate-180' : ''}`} />
        </button>
        {expandedSections.identity && (
          <div className="p-6 pt-0 border-t animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Nome da Marca</label>
                <input
                  type="text"
                  defaultValue={settings.brand_name || "Sakaservice"}
                  className="w-full h-11 px-4 rounded-xl border bg-background font-bold"
                  onBlur={(e) => handleUpdateSetting('brand_name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">URL do Logótipo</label>
                <input
                  type="text"
                  defaultValue={settings.logo_url || ""}
                  className="w-full h-11 px-4 rounded-xl border bg-background"
                  onBlur={(e) => handleUpdateSetting('logo_url', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 8. Global Banners & Promotion */}
      <div className="bg-card border rounded-2xl overflow-hidden shadow-sm border-l-4 border-l-amber-500">
        <button
          onClick={() => toggleSection('banners')}
          className="w-full flex items-center justify-between p-5 hover:bg-secondary/10 transition-colors text-left"
        >
          <h3 className="text-lg font-bold flex items-center gap-3">
            <Megaphone className="h-5 w-5 text-amber-500" /> Banners Globais & Publicidade
          </h3>
          <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${expandedSections.banners ? 'rotate-180' : ''}`} />
        </button>
        {expandedSections.banners && (
          <div className="p-6 pt-0 border-t animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
              {/* Top Banner */}
              <div className="space-y-4 p-4 rounded-xl bg-amber-50/50 border border-amber-100">
                <h4 className="text-sm font-black uppercase text-amber-700 flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" /> Banner Topo (Global)
                </h4>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">URL da Imagem / GIF</label>
                  <input
                    type="text"
                    defaultValue={settings.global_banner_top_url || "https://zldaauprystajzxfypmc.supabase.co/storage/v1/object/public/uploads/Portal%20Profissional%20(5).gif"}
                    className="w-full h-11 px-4 rounded-xl border bg-background"
                    onBlur={(e) => handleUpdateSetting('global_banner_top_url', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Link de Redirecionamento</label>
                  <input
                    type="text"
                    defaultValue={settings.global_banner_top_link || "https://saka-service.com/pagina"}
                    className="w-full h-11 px-4 rounded-xl border bg-background"
                    onBlur={(e) => handleUpdateSetting('global_banner_top_link', e.target.value)}
                  />
                </div>
              </div>

              {/* Pre-CTA Banner */}
              <div className="space-y-4 p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                <h4 className="text-sm font-black uppercase text-blue-700 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" /> Banner Pré-CTA
                </h4>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">URL da Imagem / GIF</label>
                  <input
                    type="text"
                    defaultValue={settings.global_banner_cta_url || "https://zldaauprystajzxfypmc.supabase.co/storage/v1/object/public/uploads/Portal%20Profissional%20(5).gif"}
                    className="w-full h-11 px-4 rounded-xl border bg-background"
                    onBlur={(e) => handleUpdateSetting('global_banner_cta_url', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Link de Redirecionamento</label>
                  <input
                    type="text"
                    defaultValue={settings.global_banner_cta_link || ""}
                    className="w-full h-11 px-4 rounded-xl border bg-background"
                    onBlur={(e) => handleUpdateSetting('global_banner_cta_link', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 9. Footer & Socials */}
      <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
        <button
          onClick={() => toggleSection('footer')}
          className="w-full flex items-center justify-between p-5 hover:bg-secondary/10 transition-colors text-left"
        >
          <h3 className="text-lg font-bold flex items-center gap-3">
            <Mail className="h-5 w-5 text-primary" /> Rodapé & Contactos
          </h3>
          <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${expandedSections.footer ? 'rotate-180' : ''}`} />
        </button>
        {expandedSections.footer && (
          <div className="p-6 pt-0 border-t animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Descrição Principal do Rodapé</label>
                <textarea
                  rows={2}
                  defaultValue={settings.footer_description || ""}
                  className="w-full p-4 rounded-xl border bg-background resize-none"
                  onBlur={(e) => handleUpdateSetting('footer_description', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Email de Contacto Público</label>
                <input
                  type="email"
                  defaultValue={settings.contact_email || ""}
                  className="w-full h-11 px-4 rounded-xl border bg-background"
                  onBlur={(e) => handleUpdateSetting('contact_email', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">WhatsApp Central</label>
                <input
                  type="text"
                  defaultValue={settings.contact_whatsapp || ""}
                  className="w-full h-11 px-4 rounded-xl border bg-background"
                  onBlur={(e) => handleUpdateSetting('contact_whatsapp', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Telefone Central</label>
                <input
                  type="text"
                  defaultValue={settings.contact_phone || ""}
                  className="w-full h-11 px-4 rounded-xl border bg-background"
                  onBlur={(e) => handleUpdateSetting('contact_phone', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Instagram (URL)</label>
                <input
                  type="text"
                  defaultValue={settings.social_instagram || ""}
                  className="w-full h-11 px-4 rounded-xl border bg-background"
                  onBlur={(e) => handleUpdateSetting('social_instagram', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Facebook (URL)</label>
                <input
                  type="text"
                  defaultValue={settings.social_facebook || ""}
                  className="w-full h-11 px-4 rounded-xl border bg-background"
                  onBlur={(e) => handleUpdateSetting('social_facebook', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">LinkedIn (URL)</label>
                <input
                  type="text"
                  defaultValue={settings.social_linkedin || ""}
                  className="w-full h-11 px-4 rounded-xl border bg-background"
                  onBlur={(e) => handleUpdateSetting('social_linkedin', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Twitter / X (URL)</label>
                <input
                  type="text"
                  defaultValue={settings.social_twitter || ""}
                  className="w-full h-11 px-4 rounded-xl border bg-background"
                  onBlur={(e) => handleUpdateSetting('social_twitter', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">TikTok (URL)</label>
                <input
                  type="text"
                  defaultValue={settings.social_tiktok || ""}
                  className="w-full h-11 px-4 rounded-xl border bg-background"
                  onBlur={(e) => handleUpdateSetting('social_tiktok', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 9. Emails & Categorias */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Emails */}
        <div className="bg-card border-2 border-primary/20 rounded-2xl overflow-hidden shadow-md bg-primary/5">
          <button
            onClick={() => toggleSection('emails')}
            className="w-full flex items-center justify-between p-5 hover:bg-primary/5 transition-colors text-left"
          >
            <h3 className="text-lg font-black flex items-center gap-2 text-primary uppercase">
              <Mail className="h-5 w-5" /> Modelos de E-mail
            </h3>
            <ChevronDown className={`h-5 w-5 text-primary transition-transform duration-300 ${expandedSections.emails ? 'rotate-180' : ''}`} />
          </button>
          {expandedSections.emails && (
            <div className="p-5 pt-0 border-t border-primary/10 animate-in fade-in slide-in-from-top-2">
              <EmailTemplateManagement />
            </div>
          )}
        </div>

        {/* Categorias */}
        <div className="bg-card border-2 border-primary/20 rounded-2xl overflow-hidden shadow-md bg-primary/5">
          <button
            onClick={() => toggleSection('categories')}
            className="w-full flex items-center justify-between p-5 hover:bg-primary/5 transition-colors text-left"
          >
            <h3 className="text-lg font-black flex items-center gap-2 text-primary uppercase">
              <LayoutGrid className="h-5 w-5" /> Gestão de Categorias
            </h3>
            <ChevronDown className={`h-5 w-5 text-primary transition-transform duration-300 ${expandedSections.categories ? 'rotate-180' : ''}`} />
          </button>
          {expandedSections.categories && (
            <div className="p-5 pt-0 border-t border-primary/10 animate-in fade-in slide-in-from-top-2">
              <div className="grid grid-cols-1 gap-6 mt-6">
                {categories.map((cat: any) => (
                  <div key={cat.id} className="p-5 rounded-2xl border bg-background space-y-4 shadow-sm">
                    <div className="flex items-center justify-between border-b pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{cat.icon}</span>
                        <span className="font-bold">{cat.name}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground uppercase font-mono">ID: {cat.id}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground">Nome da Categoria</label>
                        <input
                          type="text"
                          defaultValue={cat.name}
                          className="w-full h-9 px-3 text-sm rounded-lg border bg-background"
                          onBlur={(e) => handleUpdateCategoryName(cat.id, e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground">Profissões (Separadas por vírgula)</label>
                        <input
                          type="text"
                          defaultValue={(cat.professions_preview || []).join(', ')}
                          className="w-full h-9 px-3 text-sm rounded-lg border bg-background"
                          onBlur={(e) => handleUpdateCategoryProfessions(cat.id, e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground">URL do Banner</label>
                        <input
                          type="text"
                          defaultValue={cat.banner_url || ""}
                          className="w-full h-9 px-3 text-sm rounded-lg border bg-background"
                          onBlur={(e) => handleUpdateCategoryBanner(cat.id, e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-primary font-black">Link do Banner (Redirect)</label>
                        <input
                          type="text"
                          defaultValue={cat.banner_link || ""}
                          className="w-full h-9 px-3 text-sm rounded-lg border border-primary/20 bg-primary/5"
                          onBlur={(e) => handleUpdateCategoryLink(cat.id, e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Save Button - Floating style */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="lg"
          onClick={() => {
            toast.success("Tudo guardado!");
            queryClient.invalidateQueries({ queryKey: ['siteSettings'] });
          }}
          className="gap-2 px-8 shadow-2xl hover:scale-105 transition-all rounded-full h-14 bg-primary"
        >
          <Save className="h-5 w-5" /> Guardar Alterações
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
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-500 text-white' :
                      index === 1 ? 'bg-slate-300 text-slate-700' :
                        index === 2 ? 'bg-amber-600/20 text-amber-700' : 'bg-muted text-muted-foreground'
                    }`}>
                    {index + 1}
                  </div>
                  <img src={pro.avatar || "https://zldaauprystajzxfypmc.supabase.co/storage/v1/object/public/uploads/Logo%20Oku%20Saka%20e%20Sakaservice.png"} className="h-10 w-10 rounded-full object-cover border bg-white" alt={pro.name} />
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
      setTeamMembers(Array.isArray(savedTeam) ? savedTeam : []);
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

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    admins: false,
    managers: false,
    permissions: false,
    lifecycle: false,
    team: false,
    content: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* 1. Administradores */}
      <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
        <button
          onClick={() => toggleSection('admins')}
          className="w-full flex items-center justify-between p-5 hover:bg-secondary/10 transition-colors text-left"
        >
          <div className="flex items-center gap-3 text-primary font-bold">
            <ShieldCheck className="h-6 w-6" />
            <span className="text-lg">Administradores do Sistema</span>
          </div>
          <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${expandedSections.admins ? 'rotate-180' : ''}`} />
        </button>
        {expandedSections.admins && (
          <div className="p-6 pt-0 border-t animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
              <div className="bg-muted/10 border rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Plus className="h-5 w-5 text-primary" /> Conceder Acesso Admin
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
              <div className="border rounded-2xl shadow-sm overflow-hidden bg-background">
                <div className="p-4 border-b bg-muted/5 font-bold text-xs uppercase tracking-widest text-muted-foreground">Admins Atuais</div>
                <div className="divide-y max-h-[300px] overflow-y-auto">
                  {adminList.map((admin: any) => (
                    <div key={admin.email} className="flex items-center justify-between p-4 px-6 hover:bg-muted/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {admin.email[0].toUpperCase()}
                        </div>
                        <p className="font-medium text-sm">{admin.email}</p>
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
          </div>
        )}
      </div>

      {/* 2. Gestores Operacionais */}
      <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
        <button
          onClick={() => toggleSection('managers')}
          className="w-full flex items-center justify-between p-5 hover:bg-secondary/10 transition-colors text-left"
        >
          <div className="flex items-center gap-3 text-emerald-600 font-bold">
            <Users className="h-6 w-6" />
            <span className="text-lg">Gestores Operacionais</span>
          </div>
          <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${expandedSections.managers ? 'rotate-180' : ''}`} />
        </button>
        {expandedSections.managers && (
          <div className="p-6 pt-0 border-t animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
              <div className="bg-emerald-50/20 border-emerald-100 border rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Plus className="h-5 w-5 text-emerald-500" /> Adicionar Novo Gestor
                </h3>
                <div className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <input
                      type="email"
                      placeholder="manager@exemplo.com"
                      value={newManagerEmail}
                      onChange={(e) => setNewManagerEmail(e.target.value)}
                      className="w-full h-11 pl-10 pr-4 rounded-xl border bg-background"
                    />
                  </div>
                  <Button onClick={onAddManager} className="w-full h-11 font-bold bg-emerald-600 hover:bg-emerald-700">
                    Conceder Função de Gestor
                  </Button>
                </div>
              </div>
              <div className="border rounded-2xl shadow-sm overflow-hidden bg-background">
                <div className="p-4 border-b bg-emerald-50/10 font-bold text-xs uppercase tracking-widest text-emerald-600">Gestores Ativos</div>
                <div className="divide-y max-h-[300px] overflow-y-auto">
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
                    <div className="p-8 text-center text-muted-foreground text-sm">Nenhum gestor configurado.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Permissões dos Gestores */}
      <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
        <button
          onClick={() => toggleSection('permissions')}
          className="w-full flex items-center justify-between p-5 hover:bg-secondary/10 transition-colors text-left"
        >
          <div className="flex items-center gap-3 text-amber-600 font-bold">
            <Shield className="h-6 w-6" />
            <span className="text-lg">Permissões dos Gestores</span>
          </div>
          <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${expandedSections.permissions ? 'rotate-180' : ''}`} />
        </button>
        {expandedSections.permissions && (
          <div className="p-6 pt-0 border-t animate-in fade-in slide-in-from-top-2">
            <div className="mt-6 space-y-4 max-w-2xl mx-auto">
              <p className="text-sm text-muted-foreground mb-4 text-center">
                Defina o nível de acesso para todos os Gestores Operacionais.
              </p>
              <div className="grid grid-cols-1 gap-3">
                {permissions.map(perm => (
                  <div
                    key={perm.id}
                    className="flex items-center justify-between p-4 rounded-xl border bg-secondary/5 hover:bg-secondary/10 transition-colors cursor-pointer"
                    onClick={() => togglePermission(perm.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-5 w-5 rounded border flex items-center justify-center transition-colors ${managerPermissions.includes(perm.id) ? 'bg-primary border-primary text-white shadow-md' : 'border-muted-foreground'}`}>
                        {managerPermissions.includes(perm.id) && <Check className="h-3 w-3" />}
                      </div>
                      <span className="text-sm font-bold">{perm.label}</span>
                    </div>
                    <Badge variant={managerPermissions.includes(perm.id) ? "default" : "outline"} className="px-3">
                      {managerPermissions.includes(perm.id) ? "Ativo" : "Restrito"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Ciclo de Vida do Sistema */}
      <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
        <button
          onClick={() => toggleSection('lifecycle')}
          className="w-full flex items-center justify-between p-5 hover:bg-secondary/10 transition-colors text-left"
        >
          <div className="flex items-center gap-3 text-blue-600 font-bold">
            <Clock className="h-6 w-6" />
            <span className="text-lg">Ciclo de Vida do Sistema</span>
          </div>
          <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${expandedSections.lifecycle ? 'rotate-180' : ''}`} />
        </button>
        {expandedSections.lifecycle && (
          <div className="p-6 pt-0 border-t animate-in fade-in slide-in-from-top-2">
            <div className="mt-6 max-w-md mx-auto space-y-6">
              <div className="space-y-4 bg-blue-50/30 p-6 rounded-2xl border border-blue-100">
                <Label className="text-sm font-black uppercase text-blue-800">Duração das Notificações (Dias)</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    value={notifDuration}
                    onChange={(e) => onUpdateSetting('notification_duration_days', e.target.value)}
                    className="w-24 h-12 text-xl font-bold border-blue-200"
                    min="1"
                    max="30"
                  />
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    Auto-limpeza após este período. <br />
                    <strong className="text-blue-700">Recomendado: 3 a 7 dias.</strong>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
                <Info className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800 leading-tight">
                  <strong>Importante:</strong> Esta alteração só se aplica a novas notificações. As existentes mantêm o seu ciclo original.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Gestão da Equipa (About Us) */}
      <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
        <button
          onClick={() => toggleSection('team')}
          className="w-full flex items-center justify-between p-5 hover:bg-secondary/10 transition-colors text-left"
        >
          <div className="flex items-center gap-3 text-indigo-600 font-bold">
            <Users className="h-6 w-6" />
            <span className="text-lg">Gestão da Equipa (Quem Somos)</span>
          </div>
          <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${expandedSections.team ? 'rotate-180' : ''}`} />
        </button>
        {expandedSections.team && (
          <div className="p-6 pt-0 border-t animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
              {teamMembers.map((member, index) => (
                <Card key={index} className="relative overflow-hidden group border-muted shadow-none hover:border-primary/40 transition-all">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 z-10 text-destructive bg-white/80 backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity"
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
                      <img src={member.photo} alt={member.name} className="h-full w-full object-cover transition-transform group-hover:scale-110 duration-500" />
                    ) : (
                      <ImageIcon className="h-10 w-10 text-muted-foreground/20" />
                    )}
                  </div>
                  <CardContent className="p-4 space-y-3">
                    <Input
                      value={member.name}
                      placeholder="Nome..."
                      onChange={(e) => {
                        const updated = [...teamMembers];
                        updated[index].name = e.target.value;
                        setTeamMembers(updated);
                      }}
                      className="h-8 text-sm font-bold"
                    />
                    <Input
                      value={member.role}
                      placeholder="Função..."
                      onChange={(e) => {
                        const updated = [...teamMembers];
                        updated[index].role = e.target.value;
                        setTeamMembers(updated);
                      }}
                      className="h-8 text-xs italic"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-[10px] h-7 gap-2"
                      onClick={() => document.getElementById(`team-photo-${index}`)?.click()}
                    >
                      <ImageIcon className="h-3 w-3" /> Foto
                    </Button>
                    <input
                      type="file" accept="image/*" className="hidden" id={`team-photo-${index}`}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = await uploadImage(file);
                          if (url) {
                            const updated = [...teamMembers];
                            updated[index].photo = url;
                            setTeamMembers(updated);
                            toast.success("Foto atualizada.");
                          }
                        }
                      }}
                    />
                  </CardContent>
                </Card>
              ))}
              <button
                onClick={() => setTeamMembers([...teamMembers, { name: "", role: "", photo: "" }])}
                className="flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl p-8 hover:bg-secondary/5 hover:border-primary transition-all text-muted-foreground hover:text-primary min-h-[250px]"
              >
                <Plus className="h-8 w-8" />
                <span className="text-sm font-bold">Adicionar Membro</span>
              </button>
            </div>
            <div className="flex justify-end mt-8 pt-6 border-t">
              <Button
                onClick={() => onUpdateSetting('team_members_json', JSON.stringify(teamMembers))}
                disabled={JSON.stringify(teamMembers) === settings.team_members_json}
                className="h-12 px-10 bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg"
              >
                <Save className="h-4 w-4 mr-2" /> Guardar Equipa Completa
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 6. Editor de Conteúdo Institucional */}
      <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
        <button
          onClick={() => toggleSection('content')}
          className="w-full flex items-center justify-between p-5 hover:bg-secondary/10 transition-colors text-left"
        >
          <div className="flex items-center gap-3 text-amber-600 font-bold">
            <FileCode className="h-6 w-6" />
            <span className="text-lg">Editor de Conteúdo Institucional</span>
          </div>
          <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${expandedSections.content ? 'rotate-180' : ''}`} />
        </button>
        {expandedSections.content && (
          <div className="p-6 pt-0 border-t animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {[
                { title: "Nossa Missão", desc: "Sobre o Saka Service", val: aboutUs, set: setAboutUs, key: 'about_us_content', color: 'amber' },
                { title: "Nossa Visão", desc: "O futuro da plataforma", val: vision, set: setVision, key: 'about_us_vision', color: 'emerald' },
                { title: "Privacidade", desc: "Política de Dados", val: privacy, set: setPrivacy, email: privacyEmail, setEmail: setPrivacyEmail, emailKey: 'privacy_policy_email', key: 'privacy_policy_content', color: 'blue' },
                { title: "Termos", desc: "Condições de Uso", val: terms, set: setTerms, email: termsEmail, setEmail: setTermsEmail, emailKey: 'terms_service_email', key: 'terms_service_content', color: 'slate' }
              ].map((item) => (
                <Card key={item.key} className={`border-${item.color}-200/50`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-bold">{item.title}</CardTitle>
                    <CardDescription className="text-[10px] uppercase font-mono">{item.desc}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      value={item.val}
                      onChange={(e) => item.set(e.target.value)}
                      className="min-h-[200px] text-sm font-serif leading-relaxed"
                    />
                    {item.emailKey && (
                      <div className="space-y-1.5">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Email de Contacto</Label>
                        <Input
                          value={item.email}
                          onChange={(e) => item.setEmail!(e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>
                    )}
                    <Button
                      onClick={async () => {
                        await onUpdateSetting(item.key, item.val);
                        if (item.emailKey) await onUpdateSetting(item.emailKey, item.email);
                      }}
                      disabled={item.val === settings[item.key] && (!item.emailKey || item.email === settings[item.emailKey])}
                      className="w-full font-bold"
                    >
                      <Save className="h-4 w-4 mr-2" /> Guardar {item.title}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800 text-xs flex items-start gap-3">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                As alterações feitas nestes campos refletem-se instantaneamente nas páginas públicas correspondentes.
                Pode usar parágrafos simples. A formatação rica (HTML) será renderizada se suportada pelas páginas.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


// Reusable Verification Card Component
function VerificationItem({ pro, mutation, featuredMutation, deleteMutation, canManage }: { pro: any, mutation: any, featuredMutation: any, deleteMutation: any, canManage: boolean }) {
  const [isRejecting, setIsRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const queryClient = useQueryClient();
  const [isValidated, setIsValidated] = useState(false);

  const [docUrls, setDocUrls] = useState({
    id_front: pro.id_card_front_url,
    id_back: pro.id_card_back_url,
    certificate: pro.certificate_url,
    video: pro.activity_video_url,
    payment: pro.payment_proof_url
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // SAKA OPTIMIZATION: Only fetch signed URLs if the item is expanded
    // This prevents hundreds of requests on page load that cause the browser to hang.
    if (!isExpanded) return;

    const refreshUrls = async () => {
      setIsRefreshing(true);
      try {
        const newUrls = { ...docUrls };

        if (pro.id_card_front_url) {
          const fresh = await getFreshSignedUrl(pro.id_card_front_url);
          if (fresh) newUrls.id_front = fresh;
        }

        if (pro.id_card_back_url) {
          const fresh = await getFreshSignedUrl(pro.id_card_back_url);
          if (fresh) newUrls.id_back = fresh;
        }

        if (pro.certificate_url) {
          const fresh = await getFreshSignedUrl(pro.certificate_url);
          if (fresh) newUrls.certificate = fresh;
        }

        if (pro.activity_video_url) {
          const fresh = await getFreshSignedUrl(pro.activity_video_url);
          if (fresh) newUrls.video = fresh;
        }

        if (pro.payment_proof_url) {
          const fresh = await getFreshSignedUrl(pro.payment_proof_url);
          if (fresh) newUrls.payment = fresh;
        }

        setDocUrls(newUrls);
      } catch (err) {
        console.error("Saka Admin: Error refreshing document URLs:", err);
      } finally {
        setIsRefreshing(false);
      }
    };

    refreshUrls();
  }, [pro.id, isExpanded]);

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
    <div className="bg-card border rounded-2xl overflow-hidden shadow-sm relative border-gradient-hero transition-all duration-300 hover:shadow-md">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-secondary/5 transition-colors text-left group"
      >
        <div className="flex items-center gap-3">
          <span className="text-base font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{pro.name}</span>
          {pro.verification_status === 'ativo' && (
            <CheckCircle className="h-4 w-4 text-emerald-500 fill-emerald-500/10" title="Verificado" />
          )}
        </div>
        <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {isExpanded && (
        <div className="p-6 pt-0 border-t animate-in fade-in slide-in-from-top-2 duration-300 bg-slate-50/50">
          <div className="mt-8">
            <div className="flex items-center gap-4 mb-6">
              {pro.avatar ? (
                <img 
                  src={pro.avatar} 
                  alt={pro.name} 
                  className="h-16 w-16 rounded-full object-cover bg-white border shadow-sm" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).parentElement?.classList.add('flex');
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`${pro.avatar ? 'hidden' : 'flex'} h-16 w-16 rounded-full bg-primary items-center justify-center text-white font-black text-xl border-2 border-white shadow-sm shrink-0`}>
                {pro.name.charAt(0).toUpperCase()}{pro.name.trim().charAt(pro.name.trim().length - 1).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                  {pro.name}
                  <a
                    href={`https://supabase.com/dashboard/project/zldaauprystajzxfypmc/storage/buckets/professional-documents/${pro.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Abrir pasta no Supabase Storage"
                    className="p-1 rounded-md hover:bg-primary/10 text-primary/40 hover:text-primary transition-colors"
                  >
                    <Monitor className="h-4 w-4" />
                  </a>
                </h2>
                <p className="text-sm font-medium text-black dark:text-black">{pro.title || pro.category || 'Novo Membro'}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    pro.subscription_status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {pro.subscription_status === 'active' ? 'Ativo' : 'Pendente'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold uppercase">
                    PLANO: {pro.subscription_plan || 'N/A'}
                  </span>
                  {pro.subscription_end_date && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold uppercase">
                      {Math.max(0, Math.ceil((new Date(pro.subscription_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} DIAS RESTANTES
                    </span>
                  )}
                </div>
              </div>
            </div>

            {pro.featured && (
              <div className="bg-yellow-400/10 text-yellow-700 text-[10px] font-bold px-3 py-2 rounded-lg flex items-center gap-2 mb-6 border border-yellow-200">
                <Star className="h-3 w-3 fill-current" /> ESTE PROFISSIONAL ESTÁ EM DESTAQUE (TOP PROFISSIONAL)
              </div>
            )}

            <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex-1 space-y-4">
                <div className="flex flex-wrap gap-2 mb-6">
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${pro.verification_status === 'ativo' || pro.verification_status === 'ativo_sem_selo' ? 'bg-green-500/10 text-green-600' :
                      pro.verification_status === 'suspenso' ? 'bg-orange-500/10 text-orange-600' : 'bg-red-500/10 text-red-600'
                    }`}>
                    {pro.verification_status === 'pending_review' ? 'Aguardando Verificação' :
                      pro.verification_status === 'ativo' ? 'Ativo (Verificado)' :
                        pro.verification_status === 'ativo_sem_selo' ? 'Ativo (Sem Selo)' :
                        pro.verification_status === 'suspenso' ? 'Suspenso' : pro.verification_status || 'Incompleto'}
                  </span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-secondary text-secondary-foreground">
                    Email: {pro.email}
                  </span>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${pro.verified_at ? 'bg-blue-500/10 text-blue-600' : 'bg-muted text-muted-foreground'}`}>
                    {pro.verified_at ? `ATIVADO EM: ${new Date(pro.verified_at).toLocaleDateString()}` : 'DATA ATIVAÇÃO: N/A'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Documents content here... I'll keep it abbreviated for the replace tool if it's too long, but I need to be sure about the divs */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase text-slate-900 dark:text-white flex items-center gap-1">
                      <Shield className="h-3 w-3" /> Bilhete de Identidade
                    </p>
                    {docUrls.id_front ? (
                      <a href={docUrls.id_front} target="_blank" rel="noopener noreferrer" className="block group relative">
                        <div className="h-40 w-full overflow-hidden rounded-xl border bg-muted/20 flex items-center justify-center">
                          <img src={docUrls.id_front} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                        </div>
                      </a>
                    ) : <div className="h-40 border border-dashed rounded-xl flex items-center justify-center text-[10px] font-bold text-black bg-muted/10">DOCUMENTO EM FALTA</div>}
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase text-slate-900 dark:text-white flex items-center gap-1">
                      <ImageIcon className="h-3 w-3" /> Vídeo / Atividade
                    </p>
                    {docUrls.video ? (
                      <div className="h-40 w-full overflow-hidden rounded-xl border bg-black flex items-center justify-center relative group">
                        <video src={docUrls.video} className="h-full w-full object-contain" controls />
                      </div>
                    ) : <div className="h-40 border border-dashed rounded-xl flex items-center justify-center text-[10px] font-bold text-black bg-muted/10">VÍDEO NÃO CARREGADO</div>}
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase text-slate-900 dark:text-white flex items-center gap-1">
                      <FileText className="h-3 w-3" /> Certificado / Habilitações
                    </p>
                    {docUrls.certificate ? (
                      <a href={docUrls.certificate} target="_blank" rel="noopener noreferrer" className="block group relative">
                        <div className="h-40 w-full overflow-hidden rounded-xl border bg-muted/20 flex items-center justify-center">
                          {isRefreshing ? (
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          ) : docUrls.certificate.toLowerCase().includes('.pdf') ? (
                            <div className="text-center">
                              <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-1" />
                              <span className="text-[10px] font-bold">VER PDF</span>
                            </div>
                          ) : (
                            <img src={docUrls.certificate} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                          )}
                        </div>
                      </a>
                    ) : <div className="h-40 border border-dashed rounded-xl flex items-center justify-center text-[10px] font-bold text-black bg-muted/10">CERTIFICADO EM FALTA</div>}
                  </div>

                  <div className="space-y-2 rounded-xl bg-white dark:bg-slate-900 p-4 border shadow-sm flex flex-col justify-center">
                    <p className="text-xs font-bold uppercase text-slate-900 dark:text-white mb-3">Resumo da Verificação</p>
                    <div className="space-y-2 text-xs text-slate-900 dark:text-slate-200">
                      <div className="flex justify-between"><span>BI:</span> <span className={pro.id_card_front_url ? "text-green-600 dark:text-green-400 font-bold" : "text-red-600"}>{pro.id_card_front_url ? 'OK' : 'FALTA'}</span></div>
                      <div className="flex justify-between"><span>Certificado:</span> <span className={pro.certificate_url ? "text-green-600 dark:text-green-400 font-bold" : "text-red-600"}>{pro.certificate_url ? 'OK' : 'FALTA'}</span></div>
                      <div className="flex justify-between"><span>Vídeo:</span> <span className={pro.activity_video_url ? "text-green-600 dark:text-green-400 font-bold" : "text-red-600"}>{pro.activity_video_url ? 'OK' : 'FALTA'}</span></div>
                      <div className="flex justify-between"><span>Comprovativo:</span> <span className={pro.payment_proof_url ? "text-blue-600 dark:text-blue-400 font-bold" : "text-amber-600"}>{pro.payment_proof_url ? 'ENVIADO' : 'PENDENTE'}</span></div>
                      <div className="flex justify-between border-t pt-2 mt-2"><span>Nº ID:</span> <span className="font-mono font-bold text-black dark:text-white">{pro.id_number || 'FALTA'}</span></div>
                    </div>
                  </div>

                  {docUrls.payment && (
                    <div className="space-y-2 md:col-span-2 lg:col-span-3">
                      <p className="text-xs font-bold uppercase text-primary flex items-center gap-1">
                        <Receipt className="h-3 w-3" /> Comprovativo de Pagamento Enviado
                      </p>
                      <div className="h-40 w-full overflow-hidden rounded-xl border bg-white flex items-center justify-center relative group">
                        {docUrls.payment.toLowerCase().includes('.pdf') ? (
                          <div className="text-center">
                            <FileText className="h-10 w-10 mx-auto text-primary mb-2" />
                            <span className="text-[10px] font-bold text-primary">VER COMPROVATIVO PDF</span>
                          </div>
                        ) : (
                          <img src={docUrls.payment} className="h-full w-full object-contain" />
                        )}
                        <a href={docUrls.payment} target="_blank" rel="noopener noreferrer" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl">
                          <ExternalLink className="h-6 w-6 text-white" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Portfolio Preview Section */}
                {pro.portfolios && pro.portfolios.length > 0 && (
                  <div className="mt-8 border-t pt-6">
                    <p className="text-xs font-bold uppercase text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" /> Portfólio do Profissional ({pro.portfolios.length} itens)
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {pro.portfolios.map((item: any, idx: number) => {
                        const isVideo = item.video_url || (item.image && (item.image.toLowerCase().includes('.mp4') || item.image.toLowerCase().includes('.mov') || item.image.toLowerCase().includes('video')));
                        return (
                          <div key={idx} className="group relative aspect-square rounded-lg border overflow-hidden bg-black flex items-center justify-center">
                            {isVideo ? (
                              <div className="h-full w-full flex flex-col items-center justify-center bg-slate-900">
                                <video src={item.video_url || item.image} className="h-full w-full object-cover opacity-50" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <Play className="h-8 w-8 text-white fill-white/20" />
                                </div>
                              </div>
                            ) : (
                              <img src={item.image} className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                            )}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-center">
                              <span className="text-[10px] font-bold text-white line-clamp-2">{item.title}</span>
                              <a href={item.video_url || item.image} target="_blank" rel="noopener noreferrer" className="mt-2 p-1 bg-white/20 rounded-md hover:bg-white/40 transition-colors">
                                <ExternalLink className="h-3 w-3 text-white" />
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="lg:w-64 flex flex-col gap-3 border-t lg:border-t-0 lg:border-l lg:pl-8 pt-6 lg:pt-0">
                {pro.verification_status !== 'ativo' && pro.verification_status !== 'ativo_sem_selo' && (
                  <>
                    <div className="flex items-start gap-2 mb-2 p-3 bg-amber-50/50 border border-amber-200 rounded-lg">
                      <input 
                        type="checkbox" 
                        id={`val-${pro.id}`} 
                        className="mt-1 h-4 w-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500"
                        checked={isValidated}
                        onChange={(e) => setIsValidated(e.target.checked)}
                      />
                      <label htmlFor={`val-${pro.id}`} className="text-xs font-medium text-amber-900 cursor-pointer leading-tight">
                        Confirmo que os documentos anexos são válidos e autênticos.
                      </label>
                    </div>

                    {isValidated ? (
                      <>
                        <Button
                          className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold flex items-center gap-2"
                          onClick={() => {
                            if (confirm(`Tem a certeza que deseja atribuir o SELO VERIFICADO a ${pro.name}? Esta ação é permanente e pública.`)) {
                              mutation.mutate({ id: pro.id, status: 'ativo' });
                            }
                          }}
                        >
                          <CheckCircle className="h-4 w-4" /> Atribuir Selo Verificado
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full border-primary text-primary font-bold flex items-center gap-2 mt-2"
                          onClick={() => {
                            if (confirm(`Ativar perfil de ${pro.name} SEM o selo de verificação?`)) {
                              mutation.mutate({ id: pro.id, status: 'ativo_sem_selo' });
                            }
                          }}
                        >
                          <CheckCircle className="h-4 w-4" /> Ativar Sem Selo
                        </Button>
                      </>
                    ) : (
                      <div className="text-[10px] text-center text-muted-foreground uppercase font-bold p-2 bg-slate-50 rounded border border-dashed">
                        Valide os documentos para ativar
                      </div>
                    )}
                  </>
                )}
                {pro.verification_status === 'ativo' && (
                  <Button
                    variant="outline"
                    className="w-full border-rose-500 text-rose-600 hover:bg-rose-50 font-bold flex items-center gap-2 mb-2"
                    onClick={() => {
                      if (window.confirm(`Deseja remover o selo de verificado de ${pro.name}? O perfil continuará ativo mas sem o ícone de verificação.`)) {
                        mutation.mutate({ id: pro.id, status: 'ativo_sem_selo' });
                      }
                    }}
                  >
                    <X className="h-4 w-4" /> Remover Selo Verificado
                  </Button>
                )}
                {(pro.verification_status === 'ativo' || pro.verification_status === 'ativo_sem_selo') && (
                  <Button
                    variant="outline"
                    className="w-full border-amber-500 text-amber-600 hover:bg-amber-50 font-bold flex items-center gap-2"
                    onClick={() => mutation.mutate({ id: pro.id, status: 'suspenso' })}
                  >
                    <Pause className="h-4 w-4" /> Suspender Conta
                  </Button>
                )}
                {(pro.verification_status === 'ativo' || pro.verification_status === 'ativo_sem_selo') && (
                  <Button
                    variant="outline"
                    className="w-full border-slate-500 text-slate-600 hover:bg-slate-50 font-bold flex items-center gap-2 mt-2"
                    onClick={() => {
                      if (window.confirm(`Deseja remover a ativação de ${pro.name} e colocá-lo novamente em revisão?`)) {
                        mutation.mutate({ id: pro.id, status: 'pending_review' });
                      }
                    }}
                  >
                    <RotateCcw className="h-4 w-4" /> Voltar para Pendente
                  </Button>
                )}
                {canManage && (
                  <>
                    <Button variant="outline" className="w-full font-bold border-destructive text-destructive" onClick={() => setIsRejecting(true)}>
                      Rejeitar Documentos
                    </Button>
                    <Button variant="secondary" className="w-full font-bold" onClick={() => featuredMutation.mutate({ id: pro.id, featured: !pro.featured })}>
                      {pro.featured ? 'Remover Top' : 'Tornar Top Pro'}
                    </Button>
                    <Button variant="outline" className="w-full font-bold" asChild>
                      <Link to={`/admin/verifications?tab=notifications&replyTo=${pro.id}`}>Contactar</Link>
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="w-full font-bold" 
                      onClick={() => {
                        if (window.confirm(`Tem a certeza absoluta que deseja eliminar definitivamente o perfil de ${pro.name}?\n\nEsta ação apagará todo o histórico, imagens e a conta (e-mail) do profissional. NÃO é possível desfazer!`)) {
                          deleteMutation.mutate(pro.id);
                        }
                      }}
                    >
                      Eliminar Definitivamente
                    </Button>
                  </>
                )}
                <Link to={`/professional/${pro.id}`} className="text-xs text-center text-primary hover:underline mt-2">
                  Ver perfil público →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
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
  const [approvedPlan, setApprovedPlan] = useState<'mensal' | 'trimestral' | 'semestral' | 'anual'>(sub.selected_plan || 'trimestral');
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
    <div className={`bg-card border rounded-2xl p-6 shadow-sm overflow-hidden border-l-4 ${sub.status === 'active' ? 'border-l-green-500' :
        sub.status === 'pending' ? 'border-l-amber-500' : 'border-l-destructive'
      }`}>
      <div className="flex flex-col lg:flex-row gap-8 items-center">
        {/* Info Profissional */}
        <div className="flex items-center gap-4 flex-1">
          <div className="h-12 w-12 rounded-full overflow-hidden border bg-muted shrink-0">
            <img src={pro?.avatar || "https://zldaauprystajzxfypmc.supabase.co/storage/v1/object/public/uploads/Logo%20Oku%20Saka%20e%20Sakaservice.png"} className="h-full w-full object-cover bg-white" alt={pro?.name || "Profissional"} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold truncate">{pro?.name || "Nome não disponível"}</h4>
            <p className="text-xs text-muted-foreground truncate">{pro?.email || "Sem email"}</p>
            <div className="flex gap-2 mt-1">
              <span className={`text-[10px] uppercase font-black px-1.5 py-0.5 rounded ${(sub.approved_plan || sub.selected_plan || sub.plan) === 'trimestral' ? 'bg-primary/10 text-primary' : 'bg-secondary text-secondary-foreground'
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
            <span className={`text-[9px] uppercase font-bold px-1 py-0.5 rounded ${sub.status === 'active' ? 'bg-green-500 text-white' :
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
