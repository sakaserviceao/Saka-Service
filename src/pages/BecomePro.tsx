import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getCategories, createProfessionalProfile, addPortfolios, uploadImage, getProfessionalById } from "@/data/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";

const BecomePro = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [portfolios, setPortfolios] = useState<{ title: string; description: string; imageFile: File | null }[]>([
    { title: "", description: "", imageFile: null }
  ]);

  useEffect(() => {
    if (!isLoading && !user) navigate("/login");
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

  // Carregar dados se o perfil já existir
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category) return toast.error("Selecione uma categoria válida.");

    setLoading(true);
    try {
      // 1. Upload the avatar if it exists
      let uploadedAvatarUrl = "";
      if (avatarFile) {
        toast.info("A carregar foto de perfil...");
        const url = await uploadImage(avatarFile);
        if (url) uploadedAvatarUrl = url;
      }

      // 2. Criar o Perfil Profissional
      await createProfessionalProfile({
        id: user.id,
        ...formData,
        avatar: uploadedAvatarUrl,
        rating: 0,
        review_count: 0
      });

      // 3. Upload das imagens de portfolio e registo
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
      
      const successMsg = hasExistingProfile 
        ? "Perfil atualizado e ativado com sucesso!" 
        : "Perfil criado! O seu perfil já está visível na plataforma. Pode agora submeter os seus documentos para obter o selo de verificado.";

      toast.success(successMsg);
      navigate(`/verify`);
    } catch (error: any) {
      const errorMsg = hasExistingProfile 
        ? "Erro ao atualizar perfil." 
        : "Erro ao criar perfil. (Verifique se não tem já um perfil ativo ou falta de permissões)";
      toast.error(error.message || errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      <Navbar />
      <div className="container max-w-3xl mt-8">
        <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Torne-se num Profissional</h1>
            <p className="text-muted-foreground">Preencha os dados abaixo para o seu perfil público ser visível na plataforma.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Informação Básica */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold border-b pb-2">Informação Básica</h2>
              
              <div className="space-y-2 pb-4">
                <Label htmlFor="avatar" className="flex items-center gap-2"><UploadCloud className="h-4 w-4" /> Foto de Perfil (Opcional)</Label>
                <Input id="avatar" type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo / Empresa</Label>
                  <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Profissão / Título Curto</Label>
                  <Input id="title" name="title" value={formData.title} onChange={handleChange} placeholder="Ex: Eletricista Experiente" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <select 
                  id="category" 
                  name="category" 
                  value={formData.category} 
                  onChange={handleChange} 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Biografia / Descrição</Label>
                <Textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={4} placeholder="Diga-nos um pouco sobre a sua experiência..." required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Localização (Cidade, Província)</Label>
                <Input id="location" name="location" value={formData.location} onChange={handleChange} required />
              </div>
            </div>

            {/* Contactos */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold border-b pb-2">Contactos de Trabalho</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Profissional</Label>
                  <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp (Só números)</Label>
                  <Input id="whatsapp" name="whatsapp" value={formData.whatsapp} onChange={handleChange} placeholder="ex: 258840000000" />
                </div>
              </div>
            </div>

            {/* Portfolio */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h2 className="text-xl font-semibold">Portfólio de Imagens (Opcional)</h2>
                <Button type="button" variant="outline" size="sm" onClick={addPortfolio} className="gap-2">
                  <Plus className="h-4 w-4" /> Adicionar Fotografia
                </Button>
              </div>
              
              {portfolios.map((port, index) => (
                <div key={index} className="flex flex-col gap-3 p-4 border border-input rounded-lg relative bg-secondary/20">
                  <button type="button" onClick={() => removePortfolio(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700">
                    <Trash2 className="h-5 w-5" />
                  </button>
                  <div className="space-y-2 mt-2">
                    <Label>Ficheiro de Imagem</Label>
                    <Input type="file" accept="image/*" onChange={(e) => handlePortfolioChange(index, 'imageFile', e.target.files?.[0] || null)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Título do Trabalho</Label>
                    <Input value={port.title} onChange={(e) => handlePortfolioChange(index, 'title', e.target.value)} placeholder="Ex: Reparação de Telhado" />
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição Curta</Label>
                    <Input value={port.description} onChange={(e) => handlePortfolioChange(index, 'description', e.target.value)} />
                  </div>
                </div>
              ))}
            </div>

            <Button type="submit" className="w-full bg-gradient-hero text-lg py-6" disabled={loading}>
              {loading ? "A Guardar Ficheiros..." : (hasExistingProfile ? "Atualizar e Ativar Perfil" : "Criar Perfil Profissional")}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BecomePro;

