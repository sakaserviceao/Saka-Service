import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Search, LogOut, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useSettings } from "@/hooks/useSettings";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut, isProfessional } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0];
  const { getSetting } = useSettings();

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg overflow-hidden">
            <img 
              src={getSetting('logo_url', 'https://zldaauprystajzxfypmc.supabase.co/storage/v1/object/public/uploads/Logo%20Oku%20Saka%20e%20Sakaservice.png')} 
              alt={getSetting('brand_name', 'Sakaservice')} 
              className="h-full w-full object-contain" 
            />
          </div>
          <span className="text-xl font-bold text-foreground">
            {getSetting('brand_name', 'Sakaservice')}
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 md:flex">
          <Link to="/" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Início
          </Link>
          <Link to="/categories" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Categorias
          </Link>
          <Link to="/search" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            <Search className="h-4 w-4" />
          </Link>

          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/50">
            {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>

          {user ? (
            <div className="flex items-center gap-4">
              {['franciscobeneditomucamba@gmail.com', 'sakaservice.ao@gmail.com'].includes(user.email || '') && (
                <Link to="/admin/verifications" className="text-sm font-semibold text-primary hover:underline">
                  Verificações
                </Link>
              )}
              <span className="text-sm font-medium text-primary">{displayName}</span>
              {isProfessional ? (
                <>
                  <Button size="sm" variant="ghost" className="text-primary hover:bg-primary/5" asChild>
                    <Link to="/planos">Planos</Link>
                  </Button>
                  <Button size="sm" variant="outline" className="border-primary text-primary hover:bg-primary/5" asChild>
                    <Link to="/perfil-editar">Editar Perfil</Link>
                  </Button>
                </>
              ) : (
                <Button size="sm" className={`bg-gradient-hero ${theme === 'dark' ? 'text-slate-100' : 'text-primary-foreground'}`} asChild>
                  <Link to="/tornar-se-pro">Tornar-me Pro</Link>
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={signOut} className="gap-2">
                <LogOut className="h-4 w-4" /> Sair
              </Button>
            </div>
          ) : (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link to="/login">Entrar</Link>
              </Button>
              <Button size="sm" className={`bg-gradient-hero hover:opacity-90 ${theme === 'dark' ? 'text-slate-100' : 'text-primary-foreground'}`} asChild>
                <Link to="/register">Cadastrar-se</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile actions */}
        <div className="flex items-center gap-2 md:hidden">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
            {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
          <button onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border md:hidden"
          >
            <div className="container flex flex-col gap-3 py-4">
              <Link to="/" onClick={() => setIsOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary">Início</Link>
              <Link to="/categories" onClick={() => setIsOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary">Categorias</Link>
              <Link to="/search" onClick={() => setIsOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary">Buscar</Link>
              <div className="flex flex-col gap-2 pt-2">
                {user ? (
                  <>
                    {['franciscobeneditomucamba@gmail.com', 'sakaservice.ao@gmail.com'].includes(user.email || '') && (
                      <Link to="/admin/verifications" className="text-sm font-bold text-center text-primary mb-2" onClick={() => setIsOpen(false)}>
                        Painel de Verificação
                      </Link>
                    )}
                    <span className="text-sm font-medium text-center text-primary mb-2">{displayName}</span>
                    {isProfessional ? (
                      <>
                        <Button size="sm" variant="outline" className="w-full border-primary text-primary mb-2" asChild>
                          <Link to="/planos" onClick={() => setIsOpen(false)}>Planos de Subscrição</Link>
                        </Button>
                        <Button size="sm" variant="outline" className="w-full border-primary text-primary" asChild>
                          <Link to="/perfil-editar" onClick={() => setIsOpen(false)}>Editar meu perfil</Link>
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" className={`w-full bg-gradient-hero ${theme === 'dark' ? 'text-slate-100' : 'text-primary-foreground'}`} asChild>
                        <Link to="/tornar-se-pro" onClick={() => setIsOpen(false)}>Tornar-me Pro</Link>
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => { signOut(); setIsOpen(false); }}>
                      <LogOut className="h-4 w-4" /> Sair
                    </Button>
                  </>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link to="/login" onClick={() => setIsOpen(false)}>Entrar</Link>
                    </Button>
                    <Button size="sm" className={`flex-1 bg-gradient-hero ${theme === 'dark' ? 'text-slate-100' : 'text-primary-foreground'}`} asChild>
                      <Link to="/register" onClick={() => setIsOpen(false)}>Cadastrar-se</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;

