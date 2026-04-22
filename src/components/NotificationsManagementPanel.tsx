import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getNotifications, 
  createNotification, 
  deleteNotification, 
  getAllProfessionals,
  getSiteSettings,
  updateSiteSetting
} from "@/data/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Megaphone, Mail, Trash2, Save, Plus, Bell, AlertTriangle, Info, CheckCircle2, User, Users, Settings, ShieldCheck, Clock, CreditCard, Home, Send } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

const NotificationsManagementPanel = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("alerts");
  
  // Form State for New Notification
  const [newTitle, setNewTitle] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [newLevel, setNewLevel] = useState("info");
  const [newLink, setNewLink] = useState("");
  const [targetType, setTargetType] = useState("all"); // "all" or "specific"
  const [targetUserId, setTargetUserId] = useState("");
  
  // System Messages State
  const [systemMessages, setSystemMessages] = useState<Record<string, string>>({});
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState("");

  const { data: notifications = [], isLoading: isLoadingNotifications } = useQuery({
    queryKey: ['admin_notifications'],
    queryFn: () => getNotifications(null), // For admin, we should probably have a "getAll" version, but the schema allows public read for global anyway. I'll use a specific admin call if I had one. For now, this works for global ones.
  });

  const { data: professionals = [] } = useQuery({
    queryKey: ['allProfessionals'],
    queryFn: getAllProfessionals,
  });

  const { data: fetchedSettings } = useQuery({
    queryKey: ['siteSettings'],
    queryFn: getSiteSettings,
  });

  // Update local state when settings are fetched
  useEffect(() => {
    if (fetchedSettings) {
      setSystemMessages(fetchedSettings);
    }
  }, [fetchedSettings]);

  const handleUpdateSetting = async (key: string, value: string) => {
    setIsSavingSettings(true);
    try {
      await updateSiteSetting(key, value);
      setSystemMessages(prev => ({ ...prev, [key]: value }));
      toast.success("Mensagem do sistema atualizada!");
    } catch (e) {
      toast.error("Erro ao atualizar mensagem.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const createMutation = useMutation({
    mutationFn: createNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success("Notificação criada com sucesso!");
      setNewTitle("");
      setNewMessage("");
      setNewLink("");
      setTargetUserId("");
    },
    onError: (error: any) => {
      console.error("Mutation error:", error);
      const msg = error.message || "Erro desconhecido";
      if (msg.includes("uuid")) {
        toast.error("Erro: O ID do destinatário não é um UUID válido. (Provavelmente um perfil de teste/mock)");
      } else {
        toast.error("Erro ao criar notificação: " + msg);
      }
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success("Notificação removida!");
    },
  });

  const handleCreateNotification = () => {
    if (!newTitle || !newMessage) {
      toast.error("Título e mensagem são obrigatórios.");
      return;
    }

    createMutation.mutate({
      title: newTitle,
      message: newMessage,
      level: newLevel,
      link: newLink || null,
      user_id: targetType === "specific" ? targetUserId : null,
      type: 'ui',
      expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days Default
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Megaphone className="h-8 w-8 text-primary" /> Central de Notificações
        </h2>
        <p className="text-muted-foreground text-sm">
          Personalize as mensagens automáticas do sistema e envie alertas contextuais.
        </p>
      </div>

      <Tabs defaultValue="alerts" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Bell className="h-4 w-4" /> Alertas UI
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings className="h-4 w-4" /> Mensagens
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="mt-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Create form */}
            <Card className="border-primary/10 shadow-sm overflow-hidden flex flex-col">
              <CardHeader className="bg-primary/5">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Plus className="h-5 w-5 text-primary" /> Nova Notificação
                </CardTitle>
                <CardDescription>
                  Esta mensagem aparecerá no sino de notificações dos utilizadores.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6 flex-1">
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input 
                    placeholder="Ex: Nova funcionalidade disponível!" 
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mensagem</Label>
                  <Textarea 
                    placeholder="Conteúdo detalhado da notificação..." 
                    className="min-h-[100px] resize-none"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nível de Alerta</Label>
                    <Select value={newLevel} onValueChange={setNewLevel}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">Informação (Azul)</SelectItem>
                        <SelectItem value="success">Sucesso (Verde)</SelectItem>
                        <SelectItem value="warning">Aviso (Amarelo)</SelectItem>
                        <SelectItem value="error">Erro (Vermelho)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Link (Opcional)</Label>
                    <Input 
                      placeholder="https://..." 
                      value={newLink}
                      onChange={(e) => setNewLink(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-4 pt-2 border-t mt-4">
                  <Label>Destinatários</Label>
                  <div className="flex gap-4">
                    <Button 
                      variant={targetType === "all" ? "default" : "outline"} 
                      size="sm" 
                      onClick={() => setTargetType("all")}
                      className="flex-1 gap-2"
                    >
                      <Users className="h-4 w-4" /> Todos
                    </Button>
                    <Button 
                      variant={targetType === "specific" ? "default" : "outline"} 
                      size="sm" 
                      onClick={() => setTargetType("specific")}
                      className="flex-1 gap-2"
                    >
                      <User className="h-4 w-4" /> Específico
                    </Button>
                  </div>
                  {targetType === "specific" && (
                    <div className="space-y-2">
                    <Select value={targetUserId} onValueChange={setTargetUserId}>
                      <SelectTrigger className={targetUserId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(targetUserId) ? "border-destructive" : ""}>
                        <SelectValue placeholder="Selecionar profissional..." />
                      </SelectTrigger>
                      <SelectContent>
                        {professionals.map((pro: any) => {
                          const isValid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(pro.id);
                          return (
                            <SelectItem key={pro.id} value={pro.id} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {pro.name} ({pro.email})
                                {!isValid && <AlertTriangle className="h-3 w-3 text-destructive" />}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    {targetUserId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(targetUserId) && (
                      <p className="text-[10px] text-destructive flex items-center gap-1 font-medium">
                        <AlertTriangle className="h-2.5 w-2.5" /> Este perfil não pode receber notificações (ID incompatível).
                      </p>
                    )}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="bg-secondary/20 border-t py-4">
                <Button 
                  className="w-full font-bold" 
                  onClick={handleCreateNotification}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? "A enviar..." : "Enviar Notificação"}
                </Button>
              </CardFooter>
            </Card>

            {/* List active */}
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg">Notificações Ativas</CardTitle>
                <CardDescription>
                  Alertas que estão visíveis no site atualmente.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 flex-1">
                <ScrollArea className="h-[500px]">
                  {isLoadingNotifications ? (
                    <div className="p-8 text-center text-muted-foreground">A carregar...</div>
                  ) : notifications.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground bg-secondary/5 h-full flex flex-col items-center justify-center">
                      <Bell className="h-10 w-10 opacity-20 mb-2" />
                      Sem notificações ativas.
                    </div>
                  ) : (
                    <div className="divide-y">
                      {notifications.map((n: any) => (
                        <div key={n.id} className="p-4 hover:bg-secondary/20 transition-colors group">
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                  <Badge 
                                    variant={n.type === 'support_request' ? 'default' : (n.level === 'error' ? 'destructive' : 'outline')} 
                                    className={`capitalize text-[10px] px-1.5 py-0 ${n.type === 'support_request' ? 'bg-amber-500 text-white' : ''}`}
                                  >
                                    {n.type === 'support_request' ? 'SUPORTE' : n.level}
                                  </Badge>
                                <span className="text-xs text-muted-foreground">
                                  Expira {format(new Date(n.expires_at), "dd MMM HH:mm", { locale: pt })}
                                </span>
                              </div>
                              <h5 className={`font-bold text-sm ${n.type === 'support_request' ? 'text-amber-700' : ''}`}>{n.title}</h5>
                              <p className="text-xs text-muted-foreground line-clamp-2 whitespace-pre-wrap">{n.message}</p>
                              {n.user_id ? (
                                <p className="text-[10px] font-bold text-primary flex items-center gap-1 mt-2">
                                  <User className="h-2.5 w-2.5" /> Direcionado
                                </p>
                              ) : (
                                <p className="text-[10px] font-bold text-amber-600 flex items-center gap-1 mt-2">
                                  <Users className="h-2.5 w-2.5" /> Global
                                </p>
                              )}
                            </div>
                            <div className="flex gap-1">
                              {n.type === 'support_request' && n.link?.startsWith('reply-support://') && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-primary"
                                  onClick={() => {
                                    const professionalId = n.link.replace('reply-support://', '');
                                    setTargetType('specific');
                                    setTargetUserId(professionalId);
                                    setNewTitle(`Resposta ao seu pedido de suporte: ${n.title.replace('Suporte: ', '')}`);
                                    setNewLevel('info');
                                    // Scroll to form
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                    toast.info("Formulário preenchido para resposta.");
                                  }}
                                  title="Responder"
                                >
                                  <Send className="h-4 w-4" />
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => deleteMutation.mutate(n.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="system" className="mt-6 space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Mensagens de Estado do Sistema</CardTitle>
                <CardDescription>
                  Personalize os avisos que os utilizadores veem nos seus painéis e durante o checkout.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Verificação de Identidade */}
                <div className="space-y-3 p-4 bg-secondary/20 rounded-xl border">
                  <div className="flex items-center gap-2 text-primary">
                    <ShieldCheck className="h-5 w-5" />
                    <h3 className="font-bold">Verificação de Identidade</h3>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Texto exibido quando faltam documentos (BI/NIF):</Label>
                    <Textarea 
                      value={systemMessages.msg_verification_pending || "Faltam carregar os seus documentos para obter o selo de Verificado."}
                      onChange={(e) => setSystemMessages(prev => ({ ...prev, msg_verification_pending: e.target.value }))}
                      className="resize-none"
                    />
                    <div className="flex justify-end">
                      <Button 
                        size="sm" 
                        onClick={() => handleUpdateSetting("msg_verification_pending", systemMessages.msg_verification_pending)}
                        className="h-8 text-xs font-bold"
                        disabled={isSavingSettings}
                      >
                        <Save className="h-3 w-3 mr-1" /> Guardar Texto
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Subscrição Pendente */}
                <div className="space-y-3 p-4 bg-secondary/20 rounded-xl border">
                  <div className="flex items-center gap-2 text-amber-600">
                    <Clock className="h-5 w-5" />
                    <h3 className="font-bold">Subscrição Pendente/Expirada</h3>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Texto avisando que o perfil está invisível:</Label>
                    <Textarea 
                      value={systemMessages.msg_subscription_pending || "O seu perfil está invisível. Ative a sua subscrição para voltar a receber ofertas de clientes."}
                      onChange={(e) => setSystemMessages(prev => ({ ...prev, msg_subscription_pending: e.target.value }))}
                      className="resize-none"
                    />
                    <div className="flex justify-end">
                      <Button 
                        size="sm" 
                        onClick={() => handleUpdateSetting("msg_subscription_pending", systemMessages.msg_subscription_pending)}
                        className="h-8 text-xs font-bold"
                        disabled={isSavingSettings}
                      >
                        <Save className="h-3 w-3 mr-1" /> Guardar Texto
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Explore Imóveis */}
                <div className="space-y-3 p-4 bg-secondary/20 rounded-xl border">
                  <div className="flex items-center gap-2 text-primary">
                    <Home className="h-5 w-5" />
                    <h3 className="font-bold">Explore imóveis para arrendar</h3>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Descrição da secção de imóveis no Início:</Label>
                    <Textarea 
                      value={systemMessages.imoveis_description || "Explore imóveis disponíveis em Luanda, com informação clara e contacto direto com proprietários ou agentes verificados."}
                      onChange={(e) => setSystemMessages(prev => ({ ...prev, imoveis_description: e.target.value }))}
                      className="resize-none"
                    />
                    <div className="flex justify-end">
                      <Button 
                        size="sm" 
                        onClick={() => handleUpdateSetting("imoveis_description", systemMessages.imoveis_description)}
                        className="h-8 text-xs font-bold"
                        disabled={isSavingSettings}
                      >
                        <Save className="h-3 w-3 mr-1" /> Guardar Texto
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
};


export default NotificationsManagementPanel;
