import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./hooks/useAuth";
import { ThemeProvider } from "./hooks/useTheme";
import Index from "./pages/Index";
import Categories from "./pages/Categories";
import CategoryDetail from "./pages/CategoryDetail";
import SearchPage from "./pages/SearchPage";
import ProfessionalProfile from "./pages/ProfessionalProfile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import UpdatePassword from "./pages/UpdatePassword";
import BecomePro from "./pages/BecomePro";
import EditProfile from "./pages/EditProfile";
import NotFound from "./pages/NotFound";
import VerificationPage from "./pages/VerificationPage";
import AdminVerifications from "./pages/AdminVerifications";
import AboutUs from "./pages/AboutUs";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import EmailVerification from "./pages/EmailVerification";
import ProtectedRoute from "./components/ProtectedRoute";
import ConfigError from "./components/ConfigError";
import ConfirmEmail from "./pages/ConfirmEmail";

// Check for missing Supabase configuration
const isConfigured = 
  import.meta.env.VITE_SUPABASE_URL && 
  import.meta.env.VITE_SUPABASE_ANON_KEY;

const queryClient = new QueryClient();

const App = () => {
  if (!isConfigured) {
    return <ConfigError />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ThemeProvider>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/category/:id" element={<CategoryDetail />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/professional/:id" element={<ProfessionalProfile />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/update-password" element={<UpdatePassword />} />
                <Route path="/tornar-se-pro" element={<ProtectedRoute><BecomePro /></ProtectedRoute>} />
                <Route path="/verify" element={<ProtectedRoute><VerificationPage /></ProtectedRoute>} />
                <Route path="/verificar-email" element={<EmailVerification />} />
                <Route path="/confirm" element={<ConfirmEmail />} />
                <Route path="/admin/verifications" element={<ProtectedRoute requireAdmin><AdminVerifications /></ProtectedRoute>} />
                <Route path="/about-us" element={<AboutUs />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route path="/perfil/editar" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

