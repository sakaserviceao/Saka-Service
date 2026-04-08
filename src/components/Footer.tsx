import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useSettings } from "@/hooks/useSettings";

const Footer = () => {
  const { getSetting } = useSettings();
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  return (
    <footer className="border-t border-border bg-secondary/50">
      <div className="container py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg overflow-hidden">
                <img 
                  src={getSetting('logo_url', 'https://zldaauprystajzxfypmc.supabase.co/storage/v1/object/public/uploads/Logo%20Oku%20Saka%20e%20Sakaservice.png')} 
                  alt={getSetting('brand_name', 'Sakaservice')} 
                  className="h-full w-full object-contain" 
                />
              </div>
              <span className="text-lg font-bold">
                {getSetting('brand_name', 'Sakaservice')}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {getSetting('footer_description', 'O marketplace moderno que conecta profissionais e clientes. Encontre o especialista ideal para o seu próximo projeto.')}
            </p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">Plataforma</h4>
            <div className="flex flex-col gap-2">
              <Link to="/categories" className="text-sm text-muted-foreground hover:text-foreground">Ver Categorias</Link>
              <Link to="/search" className="text-sm text-muted-foreground hover:text-foreground">Buscar Profissionais</Link>
              <Link to="/become-pro" className="text-sm text-muted-foreground hover:text-foreground">Torne-se um Profissional</Link>
            </div>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">Empresa</h4>
            <div className="flex flex-col gap-2">
              <Link to={getSetting('url_about_us', '/about-us')} className="text-sm text-muted-foreground hover:text-foreground">Sobre Nós</Link>
              <Link to={getSetting('url_privacy_policy', '/privacy-policy')} className="text-sm text-muted-foreground hover:text-foreground">Política de Privacidade</Link>
              <Link to={getSetting('url_terms_of_service', '/terms-of-service')} className="text-sm text-muted-foreground hover:text-foreground">Termos de Serviço</Link>
            </div>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">Redes Sociais</h4>
            <div className="flex flex-col gap-2">
              <a href={getSetting('social_instagram', '#')} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground">Instagram</a>
              <a href={getSetting('social_facebook', '#')} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground">Facebook</a>
              <a href={getSetting('social_tiktok', '#')} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground">TikTok</a>
              <a href={getSetting('social_linkedin', '#')} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground">LinkedIn</a>
              <a href={getSetting('social_twitter', '#')} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground">Twitter / X</a>
              <a href={`mailto:${getSetting('contact_email', 'contato@sakaservice.com')}`} className="text-sm text-muted-foreground hover:text-foreground">
                {getSetting('contact_email', 'contato@sakaservice.com')}
              </a>
              {getSetting('contact_whatsapp') && (
                <a href={`https://wa.me/${getSetting('contact_whatsapp').replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground">
                  WhatsApp: {getSetting('contact_whatsapp')}
                </a>
              )}
              {getSetting('contact_phone') && (
                <a href={`tel:${getSetting('contact_phone').replace(/\D/g, '')}`} className="text-sm text-muted-foreground hover:text-foreground">
                  Ligar: {getSetting('contact_phone')}
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-6 text-center text-sm text-muted-foreground flex flex-col items-center gap-1">
          <div className="font-medium">
            {currentDate.toLocaleDateString('pt-AO', { weekday: 'long' })}, {currentDate.toLocaleDateString('pt-AO', { day: '2-digit', month: '2-digit', year: 'numeric' })} | {currentDate.toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div>© {new Date().getFullYear()} {getSetting('brand_name', 'Sakaservice')}. Todos os direitos reservados.</div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
