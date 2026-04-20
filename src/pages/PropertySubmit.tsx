import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Home, 
  MapPin, 
  DollarSign, 
  FileText, 
  Camera, 
  CheckCircle2, 
  ArrowLeft, 
  Upload, 
  X,
  Plus,
  Info,
  CreditCard
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { submitPropertyListing } from "@/data/api";
import { useSettings } from "@/hooks/useSettings";

type Tipologia = "T1" | "T2" | "T3" | "T4" | "T5+";

const PropertySubmit = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getSetting } = useSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  // Form State
  const [formData, setFormData] = useState({
    tipologia: "T2" as Tipologia,
    numero_quartos: 2,
    preco_mensal: "",
    localizacao: "",
    descricao: "",
    contacto_nome: user?.user_metadata?.full_name || "",
    contacto_telefone: user?.user_metadata?.phone || "",
  });

  const [photos, setPhotos] = useState<File[]>([]);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (photos.length + newFiles.length > 10) {
        toast.error("Pode carregar no máximo 10 fotos.");
        return;
      }

      setPhotos(prev => [...prev, ...newFiles]);
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setPhotoPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setReceipt(file);
      setReceiptPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!formData.preco_mensal || !formData.localizacao || photos.length === 0 || !receipt) {
      toast.error("Por favor, preencha todos os campos obrigatórios e carregue as fotos e o comprovativo.");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitPropertyListing(
        {
          ...formData,
          user_id: user?.id,
          preco_mensal: parseFloat(formData.preco_mensal),
        },
        photos,
        receipt
      );
      toast.success("Anúncio submetido com sucesso! Aguarde a aprovação do gestor.");
      navigate("/imoveis");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao submeter anúncio. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-grow container max-w-4xl py-12 px-4">
        {/* Header */}
        <div className="mb-10 text-center">
          <Button 
            variant="ghost" 
            className="mb-4 gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Anunciar Imóvel</h1>
              <p className="text-muted-foreground">Registe a sua residência para arrendamento no Saka Imóveis.</p>
            </div>
            {getSetting('imoveis_pricing_url') && (
              <Button asChild variant="outline" className="text-primary border-primary hover:bg-primary hover:text-primary-foreground border-dashed">
                <a href={getSetting('imoveis_pricing_url')} target="_blank" rel="noopener noreferrer">
                  <CreditCard className="mr-2 h-4 w-4" /> Consulte o Preçário
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-4 mb-12">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {s}
              </div>
              {s < 3 && <div className={`h-1 w-12 rounded-full ${step > s ? 'bg-primary' : 'bg-muted'}`} />}
            </div>
          ))}
        </div>

        {/* Form Container */}
        <div className="bg-card border rounded-3xl p-6 md:p-10 shadow-xl shadow-primary/5">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-sm font-bold flex items-center gap-2">
                      <Home className="h-4 w-4 text-primary" /> Tipologia
                    </Label>
                    <div className="grid grid-cols-5 gap-2">
                      {(["T1", "T2", "T3", "T4", "T5+"] as Tipologia[]).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setFormData({ ...formData, tipologia: t })}
                          className={`h-11 rounded-xl border font-medium transition-all ${
                            formData.tipologia === t 
                              ? 'bg-primary text-primary-foreground border-primary' 
                              : 'bg-background hover:border-primary/50'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-bold flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-primary" /> Preço Mensal (Kz)
                    </Label>
                    <Input 
                      type="number"
                      placeholder="Ex: 150000"
                      value={formData.preco_mensal}
                      onChange={(e) => setFormData({ ...formData, preco_mensal: e.target.value })}
                      className="h-11 rounded-xl bg-background"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-bold flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" /> Localização Detalhada
                  </Label>
                  <Input 
                    placeholder="Ex: Talatona, Condomínio Girassol, Luanda"
                    value={formData.localizacao}
                    onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })}
                    className="h-11 rounded-xl bg-background"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-bold flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" /> Descrição do Imóvel
                  </Label>
                  <Textarea 
                    placeholder="Detalhes sobre a zona, segurança, extras (quintal, piscina)..."
                    rows={5}
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    className="rounded-2xl bg-background resize-none"
                  />
                </div>

                <div className="pt-4">
                  <Button onClick={nextStep} className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20">
                    Continuar para Fotos
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-4">
                  <Label className="text-sm font-bold flex items-center gap-2">
                    <Camera className="h-4 w-4 text-primary" /> Fotos da Residência (Mínimo 1, Máximo 10)
                  </Label>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {photoPreviews.map((url, i) => (
                      <div key={url} className="relative aspect-square rounded-2xl overflow-hidden border bg-muted group">
                        <img src={url} alt={`Preview ${i}`} className="w-full h-full object-cover" />
                        <button 
                          onClick={() => removePhoto(i)}
                          className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    
                    {photos.length < 10 && (
                      <label className="aspect-square rounded-2xl border-2 border-dashed border-primary/20 hover:border-primary/50 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:bg-primary/5">
                        <Plus className="h-6 w-6 text-primary" />
                        <span className="text-[10px] font-bold text-primary italic uppercase">Adicionar</span>
                        <input type="file" multiple accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                      </label>
                    )}
                  </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/50 flex gap-4">
                  <Info className="h-5 w-5 text-amber-600 shrink-0" />
                  <p className="text-sm text-amber-800 dark:text-amber-400">
                    Fotos de alta qualidade ajudam a arrendar o seu imóvel mais rapidamente. Mostre a sala, quartos e áreas comuns.
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button variant="outline" onClick={prevStep} className="flex-1 h-14 rounded-2xl text-lg font-bold">
                    Voltar
                  </Button>
                  <Button onClick={nextStep} className="flex-1 h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20">
                    Pagamento
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                {/* Bank Info */}
                <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6">
                  <h4 className="font-bold flex items-center gap-2 mb-4">
                    <CreditCard className="h-5 w-5 text-primary" /> Dados para Pagamento
                  </h4>
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between items-center py-2 border-b border-primary/10">
                      <span className="text-muted-foreground">Banco</span>
                      <span className="font-bold">{getSetting("bank_name", "BAI")}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-primary/10">
                      <span className="text-muted-foreground">IBAN</span>
                      <span className="font-mono font-bold select-all">{getSetting("bank_iban", "AO06 0000 0000 0000 0000 0")}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-muted-foreground">Taxa de Registo</span>
                      <span className="font-bold text-primary">Consulte o Preário</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-sm font-bold flex items-center gap-2">
                    <Upload className="h-4 w-4 text-primary" /> Comprovativo de Pagamento
                  </Label>
                  
                  {!receiptPreview ? (
                    <label className="w-full h-32 rounded-2xl border-2 border-dashed border-primary/20 hover:border-primary/50 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all hover:bg-primary/5">
                      <div className="p-3 bg-primary/10 rounded-full">
                        <Plus className="h-6 w-6 text-primary" />
                      </div>
                      <span className="text-sm font-bold text-primary italic uppercase">Carregar Recibo (Apenas PDF)</span>
                      <input type="file" accept="application/pdf" className="hidden" onChange={handleReceiptUpload} />
                    </label>
                  ) : (
                    <div className="relative p-6 border rounded-2xl bg-muted/50 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">{receipt?.name}</p>
                          <p className="text-[10px] text-muted-foreground">{(receipt?.size || 0 / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => {setReceipt(null); setReceiptPreview(null)}} className="hover:text-destructive">
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  )}
                </div>

                <hr className="opacity-50" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Nome de Contacto</Label>
                    <Input 
                      value={formData.contacto_nome}
                      onChange={(e) => setFormData({ ...formData, contacto_nome: e.target.value })}
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Telefone de Contacto</Label>
                    <Input 
                      value={formData.contacto_telefone}
                      onChange={(e) => setFormData({ ...formData, contacto_telefone: e.target.value })}
                      className="h-11 rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button variant="outline" onClick={prevStep} className="flex-1 h-14 rounded-2xl text-lg font-bold" disabled={isSubmitting}>
                    Voltar
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    className="flex-1 h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20 gap-2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>A Processar...</>
                    ) : (
                      <>Finalizar Registro <CheckCircle2 className="h-5 w-5" /></>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PropertySubmit;
