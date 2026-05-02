import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

export const SEO = ({
  title = "Saka Service - A sua plataforma de serviços e imóveis em Angola",
  description = "Encontre os melhores profissionais e imóveis em Angola. Saka Service conecta quem precisa com quem sabe fazer.",
  image = "https://saka-service.com/og-image.png",
  url = "https://saka-service.com",
  type = "website",
}: SEOProps) => {
  const siteTitle = title.includes("Saka Service") ? title : `${title} | Saka Service`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{siteTitle}</title>
      <meta name="description" content={description} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={description} />
      {image && <meta property="og:image" content={image} />}

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={siteTitle} />
      <meta property="twitter:description" content={description} />
      {image && <meta property="twitter:image" content={image} />}
    </Helmet>
  );
};
