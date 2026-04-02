import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      if (error.message.toLowerCase().includes("confirm")) {
        toast.warning("Conta ainda não ativada.", {
          description: "Verifica o teu e-mail e confirma o endereço antes de fazer login. Se não encontrares a mensagem, consulta a pasta de spam ou solicita um novo envio."
        });
        navigate("/verificar-email", { state: { email } });
      } else {
        toast.error("Não foi possível iniciar sessão.", {
          description: "Verifica os teus dados e tenta novamente."
        });
      }
    } else if (data.user && !data.user.email_confirmed_at) {
      toast.warning("Conta ainda não ativada.", {
        description: "Verifica o teu e-mail e confirma o endereço antes de fazer login. Se não encontrares a mensagem, consulta a pasta de spam ou solicita um novo envio."
      });
      navigate("/verificar-email", { state: { email } });
    } else {
      toast.success("Bem-vindo de volta!");
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6 rounded-2xl border border-border bg-card p-8 shadow-card">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold">Login</h1>
            <p className="text-sm text-muted-foreground">Insira as suas credenciais para continuar</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="m@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Palavra-passe</Label>
                <Link to="/reset-password" className="text-xs text-primary hover:underline">Esqueceu-se da sua palavra-passe?</Link>
              </div>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  className="pr-10"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full bg-gradient-hero" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
          <div className="text-center text-sm">
            Não tem conta? <Link to="/register" className="text-primary font-semibold hover:underline">Registe-se</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

