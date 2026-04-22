import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useSettings } from "@/hooks/useSettings";
import { Mail, Phone } from "lucide-react";

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
            <div className="mt-6 flex flex-wrap gap-2">
              <a href={`mailto:${getSetting('contact_email', 'contato@sakaservice.com')}`} className="inline-flex h-9 items-center justify-center rounded-md bg-secondary px-3 text-sm font-medium transition-colors hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                <Mail className="mr-2 h-4 w-4" /> Email
              </a>
              {getSetting('contact_whatsapp') && (
                <a href={`https://wa.me/${getSetting('contact_whatsapp').replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center justify-center rounded-md bg-[#25D366] text-white px-3 text-sm font-medium transition-colors hover:bg-[#25D366]/90 focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2">
                  <svg className="mr-2 h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564c.173.087.289.129.332.202.043.073.043.423-.101.827z"/></svg>
                  WhatsApp
                </a>
              )}
              {getSetting('contact_phone') && (
                <a href={`tel:${getSetting('contact_phone').replace(/\D/g, '')}`} className="inline-flex h-9 items-center justify-center rounded-md bg-secondary px-3 text-sm font-medium transition-colors hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                  <Phone className="mr-2 h-4 w-4" /> Ligar
                </a>
              )}
            </div>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">Plataforma</h4>
            <div className="flex flex-col gap-2">
              <Link to="/categories" className="text-sm text-muted-foreground hover:text-foreground">Ver Categorias</Link>
              <Link to="/search" className="text-sm text-muted-foreground hover:text-foreground">Buscar Profissionais</Link>
              <Link to="/tornar-se-pro" className="text-sm text-muted-foreground hover:text-foreground">Torne-se um Profissional</Link>
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
