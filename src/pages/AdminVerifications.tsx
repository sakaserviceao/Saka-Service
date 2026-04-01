import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getPendingVerifications, 
  getAllProfessionals, 
  adminUpdateVerificationStatus, 
  adminUpdateFeaturedStatus, 
  supabase,
  getAdmins,
  addAdmin,
  removeAdmin,
  getSiteStats,
  getTopProfiles
} from "@/data/api";
import { Button } from "@/components/ui/button";
import { Check, X, ExternalLink, Shield, ArrowLeft, Search, AlertCircle, Star, Pause, RotateCcw, Settings, Plus, Trash2, Mail, BarChart3, TrendingUp, Calendar, Eye } from "lucide-react";
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
  const [viewMode, setViewMode] = useState<'pending' | 'all' | 'settings' | 'analytics'>('pending');
  const [newAdminEmail, setNewAdminEmail] = useState("");

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
                  user?.email === 'sakaservice.ao@gmail.com';

  // Restricted Access Check
  if (!isLoadingAdmins && !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <Shield className="h-16 w-16 text-destructive/20 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Acesso Restrito</h1>
        <p className="text-muted-foreground mb-6">Apenas administradores autorizados podem aceder a esta página.</p>
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
                <VerificationItem key={pro.id} pro={pro} mutation={mutation} featuredMutation={featuredMutation} />
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
          <Button 
            variant={viewMode === 'settings' ? 'default' : 'outline'} 
            onClick={() => setViewMode('settings')}
            className="rounded-full flex items-center gap-2"
          >
            <Settings className="h-4 w-4" /> Configurações
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
            <h2 className="text-xl font-bold mb-4">Perfis que Aguardam Verificação</h2>
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
                  <VerificationItem key={pro.id} pro={pro} mutation={mutation} featuredMutation={featuredMutation} />
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
                  <VerificationItem key={pro.id} pro={pro} mutation={mutation} featuredMutation={featuredMutation} />
                ))}
              </div>
            )}
          </>
        ) : viewMode === 'settings' ? (
          <SettingsPanel 
            adminList={adminList} 
            newEmail={newAdminEmail} 
            setNewEmail={setNewAdminEmail}
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
          />
        ) : (
          <AnalyticsPanel />
        )}
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
const SettingsPanel = ({ adminList, newEmail, setNewEmail, onAdd, onRemove }: any) => (
  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Add Admin Form */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-card border rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" /> Adicionar Admin
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Insira o e-mail de um utilizador registado para lhe conceder privilégios administrativos.
          </p>
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
              Conceder Acesso
            </Button>
          </div>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
          <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> Informação importante
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Administradores podem gerir veriticações, destacar profissionais e adicionar outros administradores. Tenha cuidado ao conceder acesso.
          </p>
        </div>
      </div>

      {/* Admin List */}
      <div className="lg:col-span-2">
        <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b bg-muted/30">
            <h3 className="font-bold">Lista de Administradores ({adminList.length})</h3>
          </div>
          <div className="divide-y">
            {adminList.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-10" />
                <p>Nenhum administrador extra configurado.</p>
              </div>
            ) : (
              adminList.map((admin: any) => (
                <div key={admin.email} className="flex items-center justify-between p-4 px-6 hover:bg-muted/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {admin.email[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{admin.email}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        Adicionado em: {new Date(admin.created_at).toLocaleDateString()}
                      </p>
                    </div>
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
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);


// Reusable Verification Card Component
const VerificationItem = ({ pro, mutation, featuredMutation }: { pro: any, mutation: any, featuredMutation: any }) => (
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
                {pro.verification_status || 'Incompleto'}
              </span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-secondary text-secondary-foreground">
                Email: {pro.email}
              </span>
              {pro.featured && (
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-700">
                  Featured Pro
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase text-muted-foreground">BI Frente</p>
            {pro.id_card_front_url ? (
              <a href={pro.id_card_front_url} target="_blank" rel="noopener noreferrer" className="block group relative">
                <img src={pro.id_card_front_url} className="h-32 w-full object-cover rounded-lg border transition-opacity group-hover:opacity-50" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
                  <ExternalLink className="h-6 w-6 text-white" />
                </div>
              </a>
            ) : <div className="h-32 border border-dashed rounded-lg flex items-center justify-center text-[10px] text-muted-foreground bg-muted/20">SEM DOCUMENTO</div>}
          </div>
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase text-muted-foreground">BI Verso</p>
            {pro.id_card_back_url ? (
               <a href={pro.id_card_back_url} target="_blank" rel="noopener noreferrer" className="block group relative">
                <img src={pro.id_card_back_url} className="h-32 w-full object-cover rounded-lg border transition-opacity group-hover:opacity-50" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
                  <ExternalLink className="h-6 w-6 text-white" />
                </div>
              </a>
            ) : <div className="h-32 border border-dashed rounded-lg flex items-center justify-center text-[10px] text-muted-foreground bg-muted/20">SEM DOCUMENTO</div>}
          </div>
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase text-muted-foreground">Certificado</p>
            {pro.certificate_url ? (
              <a href={pro.certificate_url} target="_blank" rel="noopener noreferrer" className="flex h-32 w-full items-center justify-center rounded-lg border bg-secondary/30 group hover:bg-secondary transition-colors">
                <div className="text-center">
                  <ExternalLink className="mx-auto h-5 w-5 mb-1" />
                  <span className="text-[10px] font-bold tracking-widest">VER DOCUMENTO</span>
                </div>
              </a>
            ) : <div className="h-32 border border-dashed rounded-lg flex items-center justify-center text-[10px] text-muted-foreground bg-muted/20">SEM DOCUMENTO</div>}
          </div>
        </div>
      </div>

      <div className="lg:w-64 flex flex-col justify-center gap-3 border-t lg:border-t-0 lg:border-l lg:pl-8 pt-6 lg:pt-0">
        {pro.verification_status !== 'ativo' && (
          <Button 
            className="w-full bg-green-600 hover:bg-green-700 h-11 text-white font-bold" 
            onClick={() => mutation.mutate({ id: pro.id, status: 'ativo' })}
            disabled={mutation.isPending}
          >
            <RotateCcw className="mr-2 h-5 w-5" /> Reativar Perfil
          </Button>
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
            if (confirm("Tem certeza que deseja remover este perfil? Esta ação pode ser revertida reativando o perfil.")) {
              mutation.mutate({ id: pro.id, status: 'removido' });
            }
          }}
          disabled={mutation.isPending}
        >
          <X className="mr-2 h-5 w-5" /> Remover
        </Button>
        <Link to={`/professional/${pro.id}`} className="text-xs text-center text-primary hover:underline italic">
          Ver perfil público →
        </Link>
      </div>
    </div>
  </div>
);

export default AdminVerifications;
