import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { getProfessionalById } from "@/data/api";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  signOut: () => Promise<void>;
  isLoading: boolean;
  isProfessional: boolean;
  refreshProfile: () => Promise<void>;
  checkSession: () => Promise<Session | null>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  signOut: async () => {},
  isLoading: true,
  isProfessional: false,
  refreshProfile: async () => {},
  checkSession: async () => null,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfessional, setIsProfessional] = useState(false);

  const checkProfessionalStatus = useCallback(async (userId: string) => {
    try {
      const profile = await getProfessionalById(userId);
      setIsProfessional(!!profile);
    } catch (error) {
      console.error("Error checking professional status:", error);
      setIsProfessional(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await checkProfessionalStatus(user.id);
    }
  }, [user, checkProfessionalStatus]);

  const checkSession = useCallback(async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error("Saka Auth: Session check error:", error);
      if (error.message.includes("JWT") || error.message.includes("exp")) {
        await signOut();
      }
      return null;
    }
    setSession(session);
    setUser(session?.user ?? null);
    return session;
  }, []);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Timeout de segurança: se o Supabase demorar mais de 10s, interrompemos o loading
        const timeoutId = setTimeout(() => {
          if (mounted && isLoading) {
            console.warn("Saka Auth: Initialization timeout. Forcing loading end.");
            setIsLoading(false);
          }
        }, 10000);

        const { data: { session }, error } = await supabase.auth.getSession();
        clearTimeout(timeoutId);

        if (error) {
          console.error("Saka Auth: Session error:", error);
          if (error.message.includes("JWT") || error.message.includes("expired")) {
            await signOut();
          }
        }

        if (mounted) {
          setSession(session);
          const currentUser = session?.user ?? null;
          setUser(currentUser);
          
          if (currentUser) {
            checkProfessionalStatus(currentUser.id);
          }
        }
      } catch (err) {
        console.error("Saka Auth: Fatal initialization error:", err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Saka Auth Event:", event);
        
        if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
          // Limpeza profunda em caso de logout
          localStorage.removeItem('supabase.auth.token');
          setSession(null);
          setUser(null);
          setIsProfessional(false);
        } else {
          setSession(session);
          const currentUser = session?.user ?? null;
          setUser(currentUser);
          
          if (currentUser) {
            checkProfessionalStatus(currentUser.id);
          } else {
            setIsProfessional(false);
          }
        }
        
        if (mounted) {
          setIsLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [checkProfessionalStatus]);

  const signOut = useCallback(async () => {
    try {
      // 1. Limpeza imediata do estado local para evitar UI "presa"
      setUser(null);
      setSession(null);
      setIsProfessional(false);
      
      // 2. Limpeza física do token
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('saka_last_activity');
      
      // Adicional: limpar todos os dados do Supabase de forma segura e não destrutiva por concorrência
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('sb-') || key === 'saka_last_activity')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      // 3. Tentar avisar o servidor (sem esperar se demorar muito)
      await Promise.race([
        supabase.auth.signOut(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2000))
      ]).catch(err => console.warn("Saka Auth: SignOut server sync failed/timeout:", err));

    } catch (error) {
      console.error("Error during signOut:", error);
    } finally {
      // 4. Forçar recarregamento para garantir estado limpo do JS
      window.location.href = '/';
    }
  }, []);

  // Efeito para deslogar o usuário após 1 hora de inatividade completa
  useEffect(() => {
    if (!user) {
      localStorage.removeItem("saka_last_activity");
      return;
    }

    let active = true;
    const INACTIVITY_TIMEOUT = 60 * 60 * 1000; // 1 hora em milissegundos
    let timerId: NodeJS.Timeout | null = null;

    const checkInactivity = async () => {
      const lastActivity = localStorage.getItem("saka_last_activity");
      const now = Date.now();

      if (lastActivity) {
        const parsed = parseInt(lastActivity, 10);
        if (!isNaN(parsed)) {
          const diff = now - parsed;
          if (diff >= INACTIVITY_TIMEOUT) {
            if (active) {
              console.log("Saka Auth: Logging out due to 1h inactivity on initial/visibility check.");
              await signOut();
            }
            return true;
          }
        }
      }
      if (active) {
        localStorage.setItem("saka_last_activity", now.toString());
      }
      return false;
    };

    const resetTimer = () => {
      if (timerId) clearTimeout(timerId);

      const now = Date.now();
      const lastActivity = localStorage.getItem("saka_last_activity");
      const parsed = lastActivity ? parseInt(lastActivity, 10) : NaN;

      if (!lastActivity || isNaN(parsed) || now - parsed > 5000) {
        localStorage.setItem("saka_last_activity", now.toString());
      }

      timerId = setTimeout(async () => {
        if (active) {
          console.log("Saka Auth: Inactivity limit reached (1h). Logging out...");
          await signOut();
        }
      }, INACTIVITY_TIMEOUT);
    };

    checkInactivity().then((loggedOut) => {
      if (!active || loggedOut) return;

      resetTimer();

      const events = ["mousedown", "keydown", "scroll", "touchstart", "click"];
      const handleActivity = () => {
        resetTimer();
      };

      events.forEach((event) => {
        window.addEventListener(event, handleActivity, { passive: true });
      });

      const handleVisibilityChange = async () => {
        if (document.visibilityState === "visible" && active) {
          const loggedOut = await checkInactivity();
          if (!loggedOut && active) {
            resetTimer();
          }
        }
      };
      document.addEventListener("visibilitychange", handleVisibilityChange);

      return () => {
        events.forEach((event) => {
          window.removeEventListener(event, handleActivity);
        });
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      };
    });

    return () => {
      active = false;
      if (timerId) clearTimeout(timerId);
    };
  }, [user, signOut]);

  return (
    <AuthContext.Provider value={{ user, session, signOut, isLoading, isProfessional, refreshProfile, checkSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
