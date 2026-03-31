import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { Mail, CheckCircle2, AlertCircle, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { resendVerificationEmail } from "@/data/api";
import { useSettings } from "@/hooks/useSettings";

const EmailVerification = () => {
  const location = useLocation();
  const email = location.state?.email || "";
  const [loading, setLoading] = useState(false);
  const { getSetting } = useSettings();

  const handleResend = async () => {
    if (!email) {
      toast.error("Email não encontrado. Por favor, tente fazer login novamente.");
      return;
    }

    setLoading(true);
    try {
      await resendVerificationEmail(email);
      toast.success("Link de confirmação reenviado com sucesso! Verifique o seu e-mail.");
    } catch (error: any) {
      toast.error(error.message || "Erro ao reenviar e-mail de confirmação.");
    } finally {
      setLoading(false);
    }
  };

  const openMailProvider = () => {
    if (!email) return window.open("https://mail.google.com", "_blank");
    
    const domain = email.split("@")[1]?.toLowerCase();
    if (domain === "gmail.com") window.open("https://mail.google.com", "_blank");
    else if (domain === "outlook.com" || domain === "hotmail.com") window.open("https://outlook.live.com", "_blank");
    else if (domain === "yahoo.com") window.open("https://mail.yahoo.com", "_blank");
    else window.open("https://mail.google.com", "_blank"); // Default to Gmail or let them handle it
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 text-center animate-in fade-in zoom-in duration-500">
        {/* Branding Logo */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl overflow-hidden shadow-lg bg-card border border-border">
            <img 
              src={getSetting('logo_url', '/logo.png')} 
              alt={getSetting('brand_name', 'Sakaservice')} 
              className="h-full w-full object-cover" 
            />
          </div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-primary">
            {getSetting('brand_name', 'Saka Service')}
          </h2>
        </div>

        {/* Main Content Card */}
        <div className="bg-card rounded-3xl border border-border p-8 shadow-card space-y-6 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-primary/5 blur-2xl" />
          
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary mb-6 ring-8 ring-primary/5">
            <div className="relative">
              <Mail className="h-10 w-10" />
              <CheckCircle2 className="absolute -bottom-1 -right-1 h-5 w-5 fill-background" />
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-2xl font-bold tracking-tight">
              Tudo pronto para começares no Saka Service. 🚀
            </h1>
            <div className="space-y-3 text-muted-foreground leading-relaxed">
              <p>
                Enviámos um link de confirmação para o teu e-mail {email && <span className="font-semibold text-foreground">({email})</span>}.
              </p>
              <p>
                Confirma o teu endereço para activares a tua conta e começares a oferecer os teus serviços na plataforma.
              </p>
              <p className="font-medium text-primary py-2 italic border-y border-border/50">
                Saka Service — liga talento a oportunidades.
              </p>
            </div>
          </div>

          {/* Support Note */}
          <div className="flex items-start gap-3 rounded-2xl bg-secondary/30 p-4 text-left border border-border/40">
            <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground leading-snug">
              <strong>Não recebeste o e-mail?</strong> Verifica a tua pasta de spam ou solicita um novo envio.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-2">
            <Button 
              onClick={openMailProvider}
              className="w-full bg-gradient-hero py-6 text-base font-semibold shadow-lg hover:shadow-primary/20 transition-all active:scale-[0.98]"
            >
              <ExternalLink className="mr-2 h-5 w-5" />
              Abrir meu e-mail
            </Button>
            
            <Button 
              variant="ghost"
              onClick={handleResend} 
              disabled={loading} 
              className="w-full font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Reenviando...</>
              ) : (
                "Reenviar e-mail"
              )}
            </Button>
          </div>
        </div>

        {/* Footer Link */}
        <div className="pt-4">
          <Link 
            to="/login" 
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            ← Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;
