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
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  signOut: async () => {},
  isLoading: true,
  isProfessional: false,
  refreshProfile: async () => {},
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

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        await checkProfessionalStatus(currentUser.id);
      }
      
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          await checkProfessionalStatus(currentUser.id);
        } else {
          setIsProfessional(false);
        }
        
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [checkProfessionalStatus]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsProfessional(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, signOut, isLoading, isProfessional, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
