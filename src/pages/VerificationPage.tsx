import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { uploadVerificationDocument, submitVerification, performSimulatedOCR } from "@/data/api";
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
  const [ocrData, setOcrData] = useState<{ name: string; idNumber: string } | null>(null);

  const [files, setFiles] = useState<{
    id_front: File | null;
    id_back: File | null;
    certificate: File | null;
  }>({
    id_front: null,
    id_back: null,
    certificate: null,
  });

  if (!user) return null;

  const handleFileSelect = (type: keyof typeof files, file: File | null) => {
    setFiles(prev => ({ ...prev, [type]: file }));
  };

  const handleNextStep = async () => {
    if (step === 1 && (!files.id_front || !files.id_back)) {
      return toast.error("Por favor, faça upload da frente e verso do seu BI.");
    }
    if (step === 2 && !files.certificate) {
      return toast.error("Por favor, faça upload do seu Certificado de Habilitações.");
    }

    if (step === 2) {
      // Start OCR Simulation
      setLoading(true);
      try {
        const data = await performSimulatedOCR(files.id_front!);
        setOcrData(data);
        setStep(3);
      } catch (error) {
        toast.error("Erro no processamento automático de documentos.");
      } finally {
        setLoading(false);
      }
    } else {
      setStep(step + 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      toast.info("A enviar documentos para análise segura...");
      
      const [frontUrl, backUrl, certUrl] = await Promise.all([
        uploadVerificationDocument(files.id_front!, user.id, 'id_front'),
        uploadVerificationDocument(files.id_back!, user.id, 'id_back'),
        uploadVerificationDocument(files.certificate!, user.id, 'certificate')
      ]);

      await submitVerification(user.id, {
        id_card_front_url: frontUrl,
        id_card_back_url: backUrl,
        certificate_url: certUrl,
        id_number: ocrData?.idNumber,
      });

      toast.success("Documentos enviados com sucesso! O seu perfil será analisado em breve.");
      navigate(`/professional/${user.id}`);
    } catch (error: any) {
      toast.error(error.message || "Erro ao submeter verificação.");
    } finally {
      setLoading(false);
    }
  };

  const progress = (step / 3) * 100;

  return (
    <div className="min-h-screen bg-background pb-12">
      <Navbar />
      <div className="container max-w-2xl mt-12">
        <div className="mb-8 space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold">Verificação de Profissional</h1>
          <p className="text-muted-foreground">Para garantir a segurança da nossa comunidade, precisamos verificar a sua identidade e qualificações.</p>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="rounded-2xl border bg-card p-8 shadow-sm">
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 rounded-lg bg-blue-500/10 p-4 text-blue-600">
                <AlertCircle className="h-5 w-5" />
                <p className="text-sm font-medium">Os seus dados são armazenados de forma segura e nunca serão expostos.</p>
              </div>
              <div className="grid gap-6">
                <DocumentUpload 
                  label="Bilhete de Identidade (Frente)" 
                  description="Certifique-se que o nome e foto estão bem visíveis."
                  onFileSelect={(file) => handleFileSelect('id_front', file)}
                />
                <DocumentUpload 
                  label="Bilhete de Identidade (Verso)" 
                  description="Certifique-se que os dados do verso estão legíveis."
                  onFileSelect={(file) => handleFileSelect('id_back', file)}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <DocumentUpload 
                label="Certificado de Habilitações" 
                description="Upload do seu diploma ou certificado profissional (PDF ou Imagem)."
                onFileSelect={(file) => handleFileSelect('certificate', file)}
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 py-4">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 text-green-600">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-bold text-green-600">Leitura Automática Concluída</h3>
                <p className="text-muted-foreground">Extraímos os seguintes dados dos seus documentos:</p>
              </div>

              <div className="rounded-xl border bg-secondary/20 p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Nome no Documento</p>
                    <p className="font-semibold">{ocrData?.name}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Nº do Documento</p>
                    <p className="font-semibold">{ocrData?.idNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-md bg-white/50 p-2 text-xs text-muted-foreground">
                  <ShieldCheck className="h-3 w-3" />
                  <span>Estes dados serão validados manualmente pela nossa equipa de segurança.</span>
                </div>
              </div>
            </div>
          )}

          <div className="mt-10 flex gap-4">
            {step > 1 && (
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={() => setStep(step - 1)}
                disabled={loading}
              >
                Voltar
              </Button>
            )}
            {step < 3 ? (
              <Button className="flex-1 bg-gradient-hero" onClick={handleNextStep} disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando OCR...</> : "Cofirmar e Continuar"}
              </Button>
            ) : (
              <Button className="flex-1 bg-gradient-hero" onClick={handleSubmit} disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</> : "Finalizar Verificação"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationPage;
