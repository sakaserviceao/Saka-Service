import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Se não estiver logado, redireciona para o login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Comentado para permitir acesso sem verificação obrigatória de e-mail por agora
  /*
  if (!user.email_confirmed_at) {
    if (location.pathname !== "/verificar-email") {
      return <Navigate to="/verificar-email" state={{ email: user.email }} replace />;
    }
  }
  */

  // Aqui você poderia adicionar uma verificação de admin se necessário
  // if (requireAdmin && !isAdminUser(user)) { ... }

  return <>{children}</>;
};

export default ProtectedRoute;
