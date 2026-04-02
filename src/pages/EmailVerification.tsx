import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { Mail, CheckCircle2, AlertCircle, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { resendVerificationEmail } from "@/data/api";
import { useSettings } from "@/hooks/useSettings";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";

const EmailVerification = () => {
  const location = useLocation();
  const email = location.state?.email || "";
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const { getSetting } = useSettings();
  const navigate = useNavigate();

  const checkStatus = async () => {
    setChecking(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        toast.success("Conta confirmada! Bem-vindo.");
        navigate("/");
        return;
      }

      // Se não houver sessão, tentamos um refresh forçado
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email_confirmed_at) {
        toast.success("E-mail verificado. Por favor, faça login.");
        navigate("/login");
      } else {
        toast.error("A conta ainda não está confirmada.", {
          description: "Certifique-se de que clicou no link do e-mail ou usou o comando SQL no dashboard."
        });
      }
    } catch (err) {
      toast.error("Erro ao verificar estado.");
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error("Email não encontrado. Por favor, tente fazer login novamente.");
      return;
    }

    setLoading(true);
    try {
      await resendVerificationEmail(email);
      toast.success("E-mail reenviado para " + email, {
        description: "Enviámos um novo link. Se continuar a não receber, verifique a pasta de SPAM ou aguarde alguns minutos devido a limites do servidor."
      });
    } catch (error: any) {
      toast.error("Falha ao reenviar e-mail.", {
        description: error.message || "Tente novamente mais tarde."
      });
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
      <div className="w-full max-w-md space-y-10 text-center animate-in fade-in zoom-in duration-500">
        
        {/* 3. Identidade Visual - Logotipo no topo */}
        <div className="flex flex-col items-center gap-2">
          <div className="h-20 w-20 p-2 rounded-2xl bg-white shadow-xl flex items-center justify-center border border-border/50">
            <img 
              src={getSetting('logo_url', '/logo.png')} 
              alt="Saka Service Logo" 
              className="max-h-full max-w-full object-contain" 
            />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground mt-4">
            {getSetting('brand_name', 'Saka Service')}
          </h2>
        </div>

        {/* 1. Mensagem Principal & Layout Centralizado */}
        <div className="bg-card rounded-3xl border border-border p-8 md:p-10 shadow-card space-y-8 relative overflow-hidden">
          {/* Background decoration for modern feel */}
          <div className="absolute top-0 left-0 w-full h-2 bg-primary" />
          
          {/* Success Badge - Novo */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold border border-emerald-500/20 mb-2">
            <CheckCircle2 className="h-3.5 w-3.5" /> Registo concluído com sucesso
          </div>

          {/* 3. Ícone: envelope/check */}
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-primary mb-2 ring-8 ring-primary/5">
            <div className="relative">
              <Mail className="h-12 w-12" />
              <CheckCircle2 className="absolute -bottom-1 -right-1 h-6 w-6 text-primary fill-background" />
            </div>
          </div>
          
          <div className="space-y-6">
            <h1 className="text-xl font-bold leading-tight text-foreground">
              Tudo pronto para começares no Saka Service.
            </h1>
            <div className="space-y-4 text-muted-foreground leading-relaxed text-sm">
              <p>
                Enviámos um link de confirmação para o teu e-mail 
                {email && <span className="block font-semibold text-foreground mt-1">{email}</span>}.
              </p>
              <p>
                Confirma o teu endereço para activares a tua conta e começares a oferecer os teus serviços na plataforma.
              </p>
              <p className="font-bold text-primary text-base pt-4 border-t border-border/50">
                Saka Service — liga talento a oportunidades.
              </p>
            </div>
          </div>

          {/* 2. Exibir nota de apoio */}
          <div className="rounded-2xl bg-secondary/50 p-4 text-center border border-border/40">
            <p className="text-xs text-muted-foreground leading-snug">
              <span className="font-bold block mb-1">Não recebeste o e-mail?</span> 
              Verifica a tua pasta de spam ou solicita um novo envio abaixo.
            </p>
          </div>

          {/* 6. Ações disponíveis */}
          <div className="flex flex-col gap-4 pt-4">
            <Button 
              onClick={openMailProvider}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-14 rounded-2xl text-base font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <ExternalLink className="mr-2 h-5 w-5" />
              Abrir meu e-mail
            </Button>

            <Button 
              onClick={checkStatus}
              disabled={checking}
              variant="secondary"
              className="w-full h-12 rounded-xl text-sm font-bold bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all"
            >
              {checking ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> A verificar...</>
              ) : (
                "Já confirmei / Verificar estado"
              )}
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleResend} 
              disabled={loading} 
              className="w-full h-12 rounded-xl text-sm font-semibold border-border bg-transparent hover:bg-secondary transition-colors"
            >
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> A enviar...</>
              ) : (
                "Reenviar e-mail de confirmação"
              )}
            </Button>
          </div>
        </div>

        {/* Footer Link */}
        <div className="pt-2">
          <Link 
            to="/login" 
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2"
          >
            ← Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;
