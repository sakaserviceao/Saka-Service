import { useQuery } from "@tanstack/react-query";
import { getSiteSettings } from "@/data/api";

/**
 * Hook para carregar as configurações dinâmicas do site (Logo, Banners, Footer).
 * Armazena em cache para evitar chamadas repetidas.
 */
export const useSettings = () => {
  const { data: settings = {}, isLoading, error } = useQuery({
    queryKey: ['siteSettings'],
    queryFn: getSiteSettings,
    staleTime: 1000 * 30, // 30 segundos de cache para maior reatividade
  });

  // Função auxiliar para pegar um valor com fallback
  const getSetting = (key: string, fallback: string = ""): string => {
    return settings[key] || fallback;
  };

  return {
    settings,
    getSetting,
    isLoading,
    error
  };
};
