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
            await checkProfessionalStatus(currentUser.id);
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
            await checkProfessionalStatus(currentUser.id);
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

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsProfessional(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, signOut, isLoading, isProfessional, refreshProfile, checkSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
