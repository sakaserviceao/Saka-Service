import { useState, useEffect } from "react";
import { Bell, BellOff, Check, Trash2, ExternalLink, Info, AlertTriangle, AlertCircle, CheckCircle2, MessageSquare } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getNotifications, markNotificationAsRead, deleteNotification } from "@/data/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";

const NotificationCenter = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const { data: allNotifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => getNotifications(user?.id || null),
    enabled: true,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const notifications = allNotifications.filter((n: any) => n.type !== 'message' && n.type !== 'support_request');

  const unreadCount = notifications.filter((n: any) => !n.is_read).length;

  const markReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['notifications', user?.id] });
      const previousNotifications = queryClient.getQueryData(['notifications', user?.id]);
      queryClient.setQueryData(['notifications', user?.id], (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((n: any) => n.id === id ? { ...n, is_read: true } : n);
      });
      return { previousNotifications };
    },
    onError: (err, id, context: any) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(['notifications', user?.id], context.previousNotifications);
      }
    },
    onSettled: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      }, 1500);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['notifications', user?.id] });
      const previousNotifications = queryClient.getQueryData(['notifications', user?.id]);
      queryClient.setQueryData(['notifications', user?.id], (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.filter((n: any) => n.id !== id);
      });
      return { previousNotifications };
    },
    onSuccess: () => {
      toast.success("Notificação removida");
    },
    onError: (err, id, context: any) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(['notifications', user?.id], context.previousNotifications);
      }
    },
    onSettled: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      }, 1500);
    },
  });

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications.filter((n: any) => !n.is_read).map((n: any) => n.id);
    if (unreadIds.length === 0) return;

    // Cancela qualquer refetch em andamento para não sobrescrever a nossa alteração local
    await queryClient.cancelQueries({ queryKey: ['notifications', user?.id] });

    // Atualização otimista imediata
    queryClient.setQueryData(['notifications', user?.id], (old: any) => {
      if (!Array.isArray(old)) return old;
      return old.map((n: any) => ({ ...n, is_read: true }));
    });

    try {
      await Promise.all(unreadIds.map(id => markNotificationAsRead(id)));
      
      // Pequeno atraso antes de invalidar para dar tempo ao Supabase de processar tudo
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      }, 1000);
    } catch (err) {
      console.error("Erro ao marcar todas como lidas:", err);
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    }
  };

  const getIcon = (level: string, type?: string) => {
    if (type === 'message') return <MessageSquare className="h-4 w-4 text-primary" />;
    
    switch (level) {
      case 'success': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-secondary/50 transition-colors">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-primary text-primary-foreground border-2 border-background animate-in zoom-in duration-300"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 sm:w-96" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="font-bold">Notificações</h4>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-[11px] font-bold text-primary hover:bg-primary/5"
                onClick={handleMarkAllAsRead}
              >
                Marcar todas como lidas
              </Button>
            )}
          </div>
        </div>
        <ScrollArea className="h-[400px]">
          <div className="flex flex-col">
            {isLoading ? (
              <div className="flex h-32 items-center justify-center text-muted-foreground">
                <div className="h-5 w-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-2" />
                A carregar...
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground">
                <BellOff className="h-8 w-8 opacity-20" />
                <p className="text-sm">Nenhuma notificação recente</p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {notifications.map((n: any) => (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className={`relative border-b px-4 py-4 transition-colors hover:bg-secondary/30 ${!n.is_read ? 'bg-primary/5' : ''}`}
                  >
                    <div className="flex gap-3">
                      <div className="mt-1 shrink-0">
                        {getIcon(n.level, n.type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-bold leading-none ${!n.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {n.title}
                          </p>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: pt })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {n.message}
                        </p>
                        <div className="flex items-center gap-3 pt-2">
                          {n.link && (
                            <Button 
                              variant="link" 
                              className="h-auto p-0 text-[11px] font-bold text-primary"
                              onClick={() => {
                                if (n.link.startsWith('/')) {
                                  navigate(n.link);
                                  setIsOpen(false);
                                } else {
                                  window.open(n.link, '_blank');
                                }
                              }}
                            >
                              Ver detalhes <ExternalLink className="ml-1 h-3 w-3" />
                            </Button>
                          )}
                          {!n.is_read && (
                            <Button 
                              variant="ghost" 
                              className="h-auto p-0 text-[11px] font-bold text-muted-foreground hover:text-primary transition-colors"
                              onClick={() => markReadMutation.mutate(n.id)}
                            >
                              <Check className="mr-1 h-3 w-3" /> Marcar como lida
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </ScrollArea>
        <div className="border-t p-2 text-center">
           <p className="text-[10px] text-muted-foreground">
             * As notificações são removidas automaticamente após 3 dias.
           </p>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationCenter;
