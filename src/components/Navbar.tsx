import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Search, LogOut, Sun, Moon, Headphones, CreditCard, User, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useSettings } from "@/hooks/useSettings";
import NotificationCenter from "./NotificationCenter";
import MessageCenter from "./MessageCenter";
import SupportDialog from "./SupportDialog";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const { user, signOut, isProfessional } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0];
  const { getSetting } = useSettings();

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/70 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg overflow-hidden">
            <img 
              src={getSetting('logo_url', 'https://zldaauprystajzxfypmc.supabase.co/storage/v1/object/public/uploads/Logo%20Oku%20Saka%20e%20Sakaservice.png')} 
              alt={getSetting('brand_name', 'Sakaservice')} 
              className="h-full w-full object-contain" 
            />
          </div>
          <div className="flex flex-col">
            <motion.span 
              className="text-xl font-bold text-foreground leading-none"
              whileHover={{ 
                scale: 1.05,
                color: "var(--primary)",
                transition: { duration: 0.2 }
              }}
            >
              {getSetting('brand_name', 'Sakaservice')}
            </motion.span>
            <div className="flex md:hidden items-center gap-3 mt-1">
              {!user ? (
                <>
                  <Link to="/login" className="text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors">
                    Entrar
                  </Link>
                  <Link to="/register" className="text-[10px] font-bold text-primary hover:text-primary/80 transition-colors">
                    Cadastrar-se
                  </Link>
                </>
              ) : null}
              <Link to="/search" className="text-muted-foreground hover:text-primary transition-colors">
                <Search className="h-3 w-3" />
              </Link>
              <Link to="/categories" className="text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors">
                Categorias
              </Link>
            </div>
          </div>
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
          <button 
            onClick={() => document.getElementById('footer')?.scrollIntoView({ behavior: 'smooth' })}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Contactos
          </button>

          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/50">
            {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>

          {user && (
            <div className="flex items-center gap-2">
              <MessageCenter />
              <NotificationCenter />
            </div>
          )}

          {user ? (
            <div className="flex items-center gap-4">
              {['franciscobeneditomucamba@gmail.com', 'sakaservice.ao@gmail.com', 'podosk2010@hotmail.com', 'francisco.mucamba@gmail.com'].includes(user.email || '') && (
                <Link to="/admin/verifications" className="text-sm font-semibold text-primary hover:underline border border-primary/20 px-3 py-1 rounded-full bg-primary/5">
                  Painel Admin
                </Link>
              )}
              {isProfessional ? (
                <>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-primary hover:bg-primary/5 flex flex-col h-auto py-1 px-2 gap-0" 
                    onClick={() => setSupportOpen(true)}
                  >
                    <Headphones className="h-4 w-4" />
                    <span className="text-[10px] leading-tight">Suporte</span>
                  </Button>
                  <Button size="sm" variant="ghost" className="text-primary hover:bg-primary/5 flex flex-col h-auto py-1 px-2 gap-0" asChild>
                    <Link to="/planos">
                      <CreditCard className="h-4 w-4" />
                      <span className="text-[10px] leading-tight">Planos</span>
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" className="border-primary text-primary hover:bg-primary/5 font-bold flex flex-col h-auto py-1 px-2 gap-0" asChild>
                    <Link to="/perfil-editar">
                      <User className="h-4 w-4" />
                      <span className="text-[10px] leading-tight">{displayName} | Editar Perfil</span>
                    </Link>
                  </Button>
                </>
              ) : (
                <Button size="sm" className={`bg-gradient-hero ${theme === 'dark' ? 'text-slate-100' : 'text-primary-foreground'} font-bold flex flex-col h-auto py-1 px-2 gap-0`} asChild>
                  <Link to="/tornar-se-pro">
                    <Star className="h-4 w-4" />
                    <span className="text-[10px] leading-tight">{displayName} | Profissional</span>
                  </Link>
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={signOut} className="flex flex-col h-auto py-1 px-2 gap-0">
                <LogOut className="h-4 w-4" />
                <span className="text-[10px] leading-tight">Sair</span>
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
        <div className={`flex items-center gap-2 md:hidden ml-auto`}>
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
            {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
          {user && (
            <div className="flex items-center gap-1">
              <MessageCenter />
              <NotificationCenter />
            </div>
          )}
          <button onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>
      <SupportDialog open={supportOpen} onOpenChange={setSupportOpen} />

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
              <button 
                onClick={() => {
                  document.getElementById('footer')?.scrollIntoView({ behavior: 'smooth' });
                  setIsOpen(false);
                }}
                className="text-left text-sm font-medium text-muted-foreground transition-colors hover:text-foreground py-2"
              >
                Contactos
              </button>
              {/* Removidos links redundantes que agora estão no cabeçalho */}
              <div className="flex flex-col gap-2 pt-2">
                {user ? (
                  <>
                    {['franciscobeneditomucamba@gmail.com', 'sakaservice.ao@gmail.com', 'podosk2010@hotmail.com', 'francisco.mucamba@gmail.com'].includes(user.email || '') && (
                      <Button size="sm" variant="outline" className="w-full border-primary text-primary mb-2" asChild>
                        <Link to="/admin/verifications" onClick={() => setIsOpen(false)}>
                          Painel de Administração
                        </Link>
                      </Button>
                    )}
                    {isProfessional ? (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full border-primary text-primary mb-2 flex flex-col h-auto py-2 gap-1 justify-center" 
                          onClick={() => {
                            setSupportOpen(true);
                            setIsOpen(false);
                          }}
                        >
                          <Headphones className="h-4 w-4" />
                          <span className="text-[10px] leading-tight">Suporte</span>
                        </Button>
                        <Button size="sm" variant="outline" className="w-full border-primary text-primary mb-2 flex flex-col h-auto py-2 gap-1 justify-center" asChild>
                          <Link to="/planos" onClick={() => setIsOpen(false)}>
                            <CreditCard className="h-4 w-4" />
                            <span className="text-[10px] leading-tight">Planos de Subscrição</span>
                          </Link>
                        </Button>
                        <Button size="sm" variant="outline" className="w-full border-primary text-primary hover:bg-primary/5 font-bold flex flex-col h-auto py-2 gap-1 justify-center" asChild>
                          <Link to="/perfil-editar" onClick={() => setIsOpen(false)}>
                            <User className="h-4 w-4" />
                            <span className="text-[10px] leading-tight">{displayName} | Editar Perfil</span>
                          </Link>
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" className="w-full bg-gradient-hero text-white font-bold flex flex-col h-auto py-2 gap-1 justify-center" asChild>
                        <Link to="/tornar-se-pro" onClick={() => setIsOpen(false)}>
                          <Star className="h-4 w-4" />
                          <span className="text-[10px] leading-tight">{displayName} | Tornar-me Profissional</span>
                        </Link>
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="w-full border-primary text-primary flex flex-col h-auto py-2 gap-1 justify-center" onClick={() => { signOut(); setIsOpen(false); }}>
                      <LogOut className="h-4 w-4" />
                      <span className="text-[10px] leading-tight">Sair</span>
                    </Button>
                  </>
                ) : (
                  null
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

