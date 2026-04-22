import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Headphones, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createNotification } from "@/data/api";
import { useAuth } from "@/hooks/useAuth";

interface SupportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SupportDialog = ({ open, onOpenChange }: SupportDialogProps) => {
  const { user } = useAuth();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error("Por favor, preencha o assunto e a mensagem.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Create notification for administration
      await createNotification({
        title: `Suporte: ${subject}`,
        message: `Mensagem de ${user?.email || 'Profissional'}:\n\n${message}`,
        level: 'warning',
        type: 'support_request',
        user_id: null, // Global notification for admins to see in their panel
        link: `reply-support://${user?.id}`, // Hidden link for admin to reply
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      });

      toast.success("A sua mensagem foi enviada à administração. Responderemos em breve via e-mail ou WhatsApp.");
      setSubject("");
      setMessage("");
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error sending support message:", error);
      toast.error("Erro ao enviar mensagem: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-primary p-6 text-primary-foreground">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-white/20 p-2 rounded-lg">
                <Headphones className="h-6 w-6" />
              </div>
              <DialogTitle className="text-2xl font-bold">Suporte Saka Service</DialogTitle>
            </div>
            <DialogDescription className="text-primary-foreground/80 text-base">
              Precisa de ajuda com o seu perfil ou pagamentos? Envie uma mensagem direta para a nossa equipa administrativa.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 bg-card">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Assunto</Label>
              <Input 
                id="subject" 
                placeholder="Ex: Problema com subscrição, Dúvida no perfil..." 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="h-12 border-primary/10 focus:ring-primary/20"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Mensagem Detalhada</Label>
              <Textarea 
                id="message" 
                placeholder="Descreva o seu problema ou dúvida com o máximo de detalhes possível..." 
                className="min-h-[150px] resize-none border-primary/10 focus:ring-primary/20"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-3">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => onOpenChange(false)}
              className="flex-1 font-bold text-muted-foreground hover:bg-secondary"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="flex-1 font-bold gap-2 shadow-lg shadow-primary/20 py-6"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> a enviar...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> Enviar Mensagem
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SupportDialog;
