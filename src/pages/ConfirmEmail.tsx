import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";

const ConfirmEmail = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Escuta por mudanças de estado e verifica a sessão
    // O Supabase processa automaticamente o access_token do fragment
    const checkConfirmation = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Erro na confirmação:", error.message);
        toast.error("Falha ao processar confirmação de e-mail.");
        navigate("/login");
        return;
      }

      if (session) {
        toast.success("E-mail confirmado com sucesso!", {
          description: "Bem-vindo ao Saka Service. A redirecionar para o painel..."
        });
        
        // Pequeno delay para o utilizador ver a mensagem de sucesso
        setTimeout(() => {
          navigate("/");
        }, 3000);
      } else {
        // Se não houver sessão imediata, pode ser um erro ou o token expirou
        // Mas damos um tempo para o onAuthStateChange processar
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === "SIGNED_IN" && session) {
            toast.success("E-mail confirmado! Bem-vindo.");
            navigate("/");
            subscription.unsubscribe();
          }
        });

        // Timeout de segurança
        const timer = setTimeout(() => {
          toast.error("Não foi possível confirmar a sessão automaticamente.", {
            description: "Por favor, tente fazer login."
          });
          navigate("/login");
          subscription.unsubscribe();
        }, 10000);

        return () => {
          clearTimeout(timer);
          subscription.unsubscribe();
        };
      }
    };

    checkConfirmation();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8 text-center animate-in fade-in zoom-in duration-500">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 mb-4 ring-8 ring-emerald-500/5">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-foreground">A confirmar o teu e-mail...</h1>
          <p className="text-muted-foreground leading-relaxed">
            Obrigado por te juntares ao Saka Service. Estamos a preparar o teu acesso.
          </p>
        </div>

        <div className="flex justify-center pt-4">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>

        <div className="pt-8 text-xs text-muted-foreground uppercase tracking-wider font-semibold">
          Saka Service — liga talento a oportunidades
        </div>
      </div>
    </div>
  );
};

export default ConfirmEmail;
