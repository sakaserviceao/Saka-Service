import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getCategories, createProfessionalProfile, addPortfolios, uploadImage, getProfessionalById } from "@/data/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus, UploadCloud, Check, ChevronRight, ShieldCheck, FileText } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";

const BecomePro = () => {
  const { user, isLoading, isProfessional, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<any[]>([]);
  const [hasExistingProfile, setHasExistingProfile] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    title: "",
    description: "",
    category: "",
    location: "",
    phone: "",
    email: "",
    whatsapp: "",
    linkedin_url: "",
    id_number: "",
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [portfolios, setPortfolios] = useState<{ title: string; description: string; imageFile: File | null }[]>([
    { title: "", description: "", imageFile: null }
  ]);

  useEffect(() => {
    if (!isLoading && !user) navigate("/login");
    // Se já é profissional verificado, não precisa estar aqui, mas deixamos editar se não for verificado
  }, [user, isLoading, navigate]);

  useEffect(() => {
    const fetchCats = async () => {
      const data = await getCategories();
      setCategories(data || []);
      if (data && data.length > 0 && !formData.category) {
        setFormData(prev => ({ ...prev, category: data[0].id }));
      }
    };
    fetchCats();
  }, [formData.category]);

  useEffect(() => {
    const checkExistingProfile = async () => {
      if (!user) return;
      
      try {
        const existingPro = await getProfessionalById(user.id);
        if (existingPro) {
          setHasExistingProfile(true);
          setFormData({
            name: existingPro.name || "",
            title: existingPro.title || "",
            description: existingPro.description || "",
            category: existingPro.category || "",
            location: existingPro.location || "",
            phone: existingPro.phone || "",
            email: existingPro.email || "",
            whatsapp: existingPro.whatsapp || "",
            linkedin_url: existingPro.linkedin_url || "",
            id_number: existingPro.id_number || "",
          });
        }
      } catch (err) {
        console.error("Erro ao verificar perfil existente:", err);
      }
    };
    
    if (user) checkExistingProfile();
  }, [user]);

  if (isLoading || !user) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePortfolioChange = (index: number, field: string, value: any) => {
    const updated = [...portfolios];
    updated[index] = { ...updated[index], [field]: value };
    setPortfolios(updated);
  };

  const addPortfolio = () => {
    setPortfolios([...portfolios, { title: "", description: "", imageFile: null }]);
  };

  const removePortfolio = (index: number) => {
    setPortfolios(portfolios.filter((_, i) => i !== index));
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.name || !formData.title || !formData.category || !formData.description || !formData.location) {
        return toast.error("Por favor, preencha todos os campos obrigatórios do perfil.");
      }
      setStep(2);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    setStep(1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id_number || !idCardFile || !certificateFile) {
      return toast.error("Por favor, preencha o número do BI e carregue os documentos obrigatórios.");
    }

    setLoading(true);
    try {
      // 1. Upload do Avatar
      let uploadedAvatarUrl = "";
      if (avatarFile) {
        toast.info("A carregar foto de perfil...");
        const url = await uploadImage(avatarFile);
        if (url) uploadedAvatarUrl = url;
      }

      // 2. Upload do BI (Frente/Verso Único)
      toast.info("A carregar Bilhete de Identidade...");
      const idCardUrl = await uploadImage(idCardFile);

      // 3. Upload do Certificado
      toast.info("A carregar Certificado Profissional...");
      const certificateUrl = await uploadImage(certificateFile);

      // 4. Criar/Atualizar o Perfil Profissional
      await createProfessionalProfile({
        id: user.id,
        ...formData,
        avatar: uploadedAvatarUrl || (hasExistingProfile ? undefined : ""),
        id_card_front_url: idCardUrl,
        certificate_url: certificateUrl,
        verification_status: 'pending_review' // Alterado para pending_review para corresponder ao ENUM do Postgres
      });

      // 5. Upload das imagens de portfolio
      const validPortfolios = [];
      for (const p of portfolios) {
        if (p.title && p.imageFile) {
          toast.info(`A carregar portfolio: ${p.title}...`);
          const pUrl = await uploadImage(p.imageFile);
          if (pUrl) {
            validPortfolios.push({
              title: p.title,
              description: p.description,
              image: pUrl,
              professional_id: user.id
            });
          }
        }
      }

      if (validPortfolios.length > 0) {
        await addPortfolios(validPortfolios);
      }
      
      await refreshProfile();
      toast.success("Perfil e documentos enviados com sucesso! A nossa equipa irá analisar os seus dados em breve.");
      navigate("/planos");
    } catch (error: any) {
      toast.error(error.message || "Erro ao processar o registo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      <Navbar />
      <div className="container max-w-3xl mt-8">
        {/* Progress Header */}
        <div className="mb-10">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${step >= 1 ? 'border-primary bg-primary text-white' : 'border-muted'}`}>
              {step > 1 ? <Check className="h-5 w-5" /> : "1"}
            </div>
            <div className={`h-1 w-12 rounded transition-all ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${step >= 2 ? 'border-primary bg-primary text-white' : 'border-muted'}`}>
              "2"
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold">{step === 1 ? "Perfil Público" : "Verificação de Identidade"}</h1>
            <p className="text-muted-foreground">
              {step === 1 
                ? "Como os clientes o verão na plataforma." 
                : "Documentação obrigatória para garantir a segurança da rede."}
            </p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-8 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          {step === 1 ? (
            <div className="space-y-8">
              {/* Informação Básica */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold border-b pb-2 flex items-center gap-2">
                  <Plus className="h-5 w-5 text-primary" /> Informação Profissional
                </h2>
                
                <div className="space-y-2 pb-4">
                  <Label htmlFor="avatar" className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors">
                    <UploadCloud className="h-5 w-5" /> Foto de Perfil Profissional
                  </Label>
                  <Input id="avatar" type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} className="cursor-pointer" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo / Empresa</Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Ex: João Silva" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Especialidade / Título Profissional</Label>
                    <Input id="title" name="title" value={formData.title} onChange={handleChange} placeholder="Ex: Mestre de Obras / Canalizador" required />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Área de Atuação</Label>
                    <select 
                      id="category" 
                      name="category" 
                      value={formData.category} 
                      onChange={handleChange} 
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-primary outline-none"
                      required
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Sua Localização (Cidade, Província)</Label>
                    <Input id="location" name="location" value={formData.location} onChange={handleChange} placeholder="Ex: Luanda, Talatona" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição das Suas Competências</Label>
                  <Textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={4} placeholder="Conte-nos sobre a sua experiência e o que faz de melhor..." required />
                </div>
              </div>

              {/* Contactos */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold border-b pb-2">Contactos Diretos</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Profissional</Label>
                    <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">WhatsApp (Só números)</Label>
                    <Input id="whatsapp" name="whatsapp" value={formData.whatsapp} onChange={handleChange} placeholder="Ex: 923000000" />
                  </div>
                </div>
              </div>

              {/* Portfolio */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h2 className="text-xl font-semibold">Fotos de Trabalhos (Opcional)</h2>
                  <Button type="button" variant="outline" size="sm" onClick={addPortfolio} className="gap-2">
                    <Plus className="h-4 w-4" /> Adicionar Foto
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  {portfolios.map((port, index) => (
                    <div key={index} className="flex flex-col gap-3 p-4 border border-input rounded-lg relative bg-secondary/20">
                      <button type="button" onClick={() => removePortfolio(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700 transition-colors">
                        <Trash2 className="h-5 w-5" />
                      </button>
                      <div className="space-y-2 mt-2">
                        <Label>Escolher Fotografia</Label>
                        <Input type="file" accept="image/*" onChange={(e) => handlePortfolioChange(index, 'imageFile', e.target.files?.[0] || null)} />
                      </div>
                      <Input value={port.title} onChange={(e) => handlePortfolioChange(index, 'title', e.target.value)} placeholder="Título do trabalho" className="text-xs" />
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={nextStep} className="w-full h-14 text-lg gap-2 bg-gradient-hero">
                Continuar para Verificação <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              <div className="rounded-xl bg-primary/5 p-6 border border-primary/10 flex gap-4">
                <ShieldCheck className="h-8 w-8 text-primary shrink-0" />
                <div>
                  <h3 className="font-bold text-primary">Segurança em Primeiro Lugar</h3>
                  <p className="text-sm text-muted-foreground">Para ser um profissional verificado e ganhar a confiança dos clientes, precisamos de validar a sua identidade. Seus dados são guardados de forma encriptada.</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="id_number">Número do Bilhete de Identidade (BI)</Label>
                  <Input 
                    id="id_number" 
                    name="id_number" 
                    value={formData.id_number} 
                    onChange={handleChange} 
                    placeholder="Ex: 000000000LA000" 
                    required 
                    className="h-12 text-lg font-mono tracking-widest"
                  />
                </div>

                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-base font-bold">
                      <FileText className="h-5 w-5 text-primary" /> Bilhete de Identidade (Frente e Verso)
                    </Label>
                    <p className="text-xs text-muted-foreground mb-2">Carregue um ficheiro único (Foto ou PDF) que mostre nitidamente a frente e o verso do seu BI.</p>
                    <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl p-6 flex flex-col items-center hover:bg-secondary/10 transition-colors cursor-pointer relative">
                      <Input 
                        type="file" 
                        accept="image/*,application/pdf" 
                        onChange={(e) => setIdCardFile(e.target.files?.[0] || null)} 
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        required
                      />
                      <UploadCloud className={`h-12 w-12 mb-2 ${idCardFile ? 'text-green-500' : 'text-muted-foreground'}`} />
                      <span className="text-sm font-medium">{idCardFile ? idCardFile.name : "Clique para selecionar o BI"}</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-4">
                    <Label className="flex items-center gap-2 text-base font-bold">
                      <ShieldCheck className="h-5 w-5 text-primary" /> Certificado / Diploma Profissional
                    </Label>
                    <p className="text-xs text-muted-foreground mb-2">Comprovativo de habilitações ou certificado de formação na área.</p>
                    <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl p-6 flex flex-col items-center hover:bg-secondary/10 transition-colors cursor-pointer relative">
                      <Input 
                        type="file" 
                        accept="image/*,application/pdf" 
                        onChange={(e) => setCertificateFile(e.target.files?.[0] || null)} 
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        required
                      />
                      <UploadCloud className={`h-12 w-12 mb-2 ${certificateFile ? 'text-green-500' : 'text-muted-foreground'}`} />
                      <span className="text-sm font-medium">{certificateFile ? certificateFile.name : "Clique para selecionar o Certificado"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button variant="outline" onClick={prevStep} className="flex-1 h-12" disabled={loading}>
                  Voltar
                </Button>
                <Button onClick={handleSubmit} className="flex-[2] h-12 bg-gradient-hero gap-2" disabled={loading}>
                  {loading ? "A processar..." : <><Check className="h-5 w-5" /> Enviar e Finalizar</>}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BecomePro;

