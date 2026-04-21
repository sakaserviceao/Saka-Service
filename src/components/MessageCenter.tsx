import { useState } from "react";
import { MessageSquare, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getProfessionalMessages } from "@/data/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import { useIsMobile } from "@/hooks/use-mobile";

const MessageList = ({ messages, isLoading, user, onMessageClick }: any) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-2">
        <div className="h-5 w-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        <span className="text-xs text-muted-foreground">A carregar mensagens...</span>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground">
        <MessageSquare className="h-8 w-8 opacity-10" />
        <p className="text-xs">Nenhuma mensagem recebida</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {messages.slice(0, 5).map((msg: any) => (
        <div 
          key={msg.id}
          onClick={() => onMessageClick(msg)}
          className={`cursor-pointer border-b px-4 py-4 transition-colors hover:bg-secondary/30 border-gradient-hero ${msg.status === 'unread' && msg.receiver_id === user?.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}
        >
          <div className="flex gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary shrink-0 shadow-inner">
              <User className="h-5 w-5" />
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold truncate text-foreground">{msg.sender_name || 'Novo Pedido de Serviço'}</span>
                <span className="text-[10px] text-muted-foreground flex-shrink-0">
                  {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: pt })}
                </span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {msg.content}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const MessageCenter = () => {
  const { user, isProfessional } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['service_messages_inbox', user?.id],
    queryFn: () => getProfessionalMessages(user?.id || ""),
    enabled: !!user && !!isProfessional,
    refetchInterval: 15000,
  });

  const unreadCount = (messages || []).filter((m: any) => m.status === 'unread' && m.receiver_id === user?.id).length;

  if (!isProfessional) return null;

  const handleMessageClick = () => {
    navigate('/perfil-editar?tab=messages');
    setIsOpen(false);
  };

  const trigger = (
    <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-secondary/50 transition-colors">
      <MessageSquare className="h-5 w-5 text-muted-foreground" />
      {unreadCount > 0 && (
        <Badge 
          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-emerald-500 text-white border-2 border-background animate-pulse shadow-sm"
        >
          {unreadCount}
        </Badge>
      )}
    </Button>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerTrigger asChild>
          {trigger}
        </DrawerTrigger>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="border-b bg-secondary/5">
            <DrawerTitle className="flex items-center gap-2 text-base font-black uppercase tracking-tighter">
              <MessageSquare className="h-5 w-5 text-primary" /> Mensagens Saka
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-1">
            <ScrollArea className="h-[50vh]">
              <MessageList 
                messages={messages} 
                isLoading={isLoading} 
                user={user} 
                onMessageClick={handleMessageClick} 
              />
            </ScrollArea>
          </div>
          <DrawerFooter className="border-t bg-background pt-4">
            <Button className="w-full font-black uppercase tracking-tighter" onClick={handleMessageClick}>
              Abrir Inbox Completo
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">Fechar</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {trigger}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 sm:w-96 shadow-2xl border-primary/10" align="end">
        <div className="flex items-center justify-between border-b bg-secondary/10 px-4 py-3">
          <h4 className="font-bold flex items-center gap-2 text-sm uppercase tracking-tighter">
            <MessageSquare className="h-4 w-4 text-primary" /> Mensagens
          </h4>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 text-[10px] font-black text-primary hover:bg-primary/5 uppercase tracking-tighter"
            onClick={handleMessageClick}
          >
            Ver todas
          </Button>
        </div>
        <ScrollArea className="h-[350px]">
          <MessageList 
            messages={messages} 
            isLoading={isLoading} 
            user={user} 
            onMessageClick={handleMessageClick} 
          />
        </ScrollArea>
        <div className="p-3 bg-secondary/10 text-center border-t">
           <Button 
            className="w-full text-xs font-black uppercase tracking-tighter bg-primary hover:bg-primary/90 h-9" 
            onClick={handleMessageClick}
           >
             Ir para Inbox de Mensagens
           </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default MessageCenter;
