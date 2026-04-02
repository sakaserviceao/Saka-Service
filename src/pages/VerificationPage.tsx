import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { uploadVerificationDocument, submitVerification, getProfessionalById } from "@/data/api";
import { DocumentUpload } from "@/components/DocumentUpload";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { CheckCircle2, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";

const VerificationPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [idNumber, setIdNumber] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        try {
          const profile = await getProfessionalById(user.id);
          setUserProfile(profile);
          if (profile?.rejection_reason) {
            setRejectionReason(profile.rejection_reason);
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        }
      }
    };
    fetchProfile();
  }, [user]);

  const [files, setFiles] = useState<{
    id_card: File | null;
    certificate: File | null;
  }>({
    id_card: null,
    certificate: null,
  });

  if (!user) return null;

  const handleFileSelect = (type: keyof typeof files, file: File | null) => {
    setFiles(prev => ({ ...prev, [type]: file }));
  };

  const handleNextStep = async () => {
    const biRegex = /^\d{9}[A-Z]{2}\d{3}$/;

    if (step === 1) {
      if (!idNumber) {
        return toast.error("Por favor, introduza o seu número de BI.");
      }
      if (!biRegex.test(idNumber)) {
        return toast.error("Formato de BI inválido. O formato correto é: 000000000LA000");
      }
      if (!files.id_card) {
        return toast.error("Por favor, faça upload do seu Bilhete de Identidade (Frente e Verso).");
      }
    }
    
    if (step === 2 && !files.certificate) {
      return toast.error("Por favor, faça upload do seu Certificado de Habilitações.");
    }

    if (step === 2) {
      await handleSubmit();
    } else {
      setStep(step + 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      toast.info("A enviar documentos para análise segura...");
      
      const [idCardUrl, certUrl] = await Promise.all([
        uploadVerificationDocument(files.id_card!, user.id, 'id_front'),
        uploadVerificationDocument(files.certificate!, user.id, 'certificate')
      ]);

      await submitVerification(user.id, {
        id_card_front_url: idCardUrl,
        certificate_url: certUrl,
        id_number: idNumber,
      });

      toast.success("Documentos enviados com sucesso! O seu perfil será analisado em breve.");
      navigate(`/perfil/editar`);
    } catch (error: any) {
      toast.error(error.message || "Erro ao submeter verificação.");
    } finally {
      setLoading(false);
    }
  };

  const progress = (step / 2) * 100;

  return (
    <div className="min-h-screen bg-background pb-12">
      <Navbar />
      <div className="container max-w-2xl mt-12 text-center">
        {rejectionReason && (
          <div className="mb-6 p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl italic">
             "{rejectionReason}"
          </div>
        )}
        <div className="flex flex-col items-center gap-4 mb-8">
           <ShieldCheck className="h-12 w-12 text-primary" />
           <h1 className="text-3xl font-bold">Verificação de Identidade</h1>
           <p className="text-muted-foreground">Complete o seu perfil para ser um profissional verificado na Sakaservice.</p>
        </div>

        <div className="bg-card border rounded-2xl p-8 shadow-sm text-left">
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold">Número do BI</label>
                <input 
                  type="text" 
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder="000000000LA000"
                  className="w-full h-12 rounded-xl border bg-background px-4 outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <DocumentUpload 
                label="Bilhete de Identidade (Frente e Verso)" 
                description="Carregue uma foto ou PDF do seu documento."
                onFileSelect={(file) => handleFileSelect('id_card', file)}
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-bold">Comprovativo de Habilitações</h3>
               <DocumentUpload 
                label="Certificado ou Diploma" 
                description="Carregue o comprovativo das suas qualificações profissionais."
                onFileSelect={(file) => handleFileSelect('certificate', file)}
              />
            </div>
          )}

          <div className="mt-8 flex gap-4">
            {step > 1 && (
              <Button variant="outline" className="flex-1 h-12" onClick={() => setStep(step - 1)}>
                Voltar
              </Button>
            )}
            <Button className="flex-[2] h-12" onClick={handleNextStep} disabled={loading}>
              {loading ? "A enviar..." : (step === 2 ? "Finalizar" : "Seguinte")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationPage;
