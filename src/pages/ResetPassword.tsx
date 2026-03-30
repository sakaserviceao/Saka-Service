import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";

const ResetPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Envia o link de recuperação para o respectivo email. O link redireciona para a nossa página de update-password.
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Se o email estiver registado, vai receber as instruções!");
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6 rounded-2xl border border-border bg-card p-8 shadow-card">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold">Recuperar Password</h1>
            <p className="text-sm text-muted-foreground">Insira o seu email para receber um link de recuperação</p>
          </div>
          
          {submitted ? (
            <div className="text-center space-y-4">
              <p className="text-sm">Por favor, verifique a sua caixa de entrada (e a pasta de Spam) para as instruções.</p>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/login">Voltar ao Login</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email de Registo</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="m@exemplo.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                />
              </div>
              <Button type="submit" className="w-full bg-gradient-hero" disabled={loading}>
                {loading ? "A processar..." : "Enviar Email de Recuperação"}
              </Button>
            </form>
          )}
          
          {!submitted && (
            <div className="text-center text-sm">
              <Link to="/login" className="text-muted-foreground hover:text-foreground">Voltar ao Login</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
