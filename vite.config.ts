import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import Sitemap from "vite-plugin-sitemap";
import { createClient } from "@supabase/supabase-js";

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const dynamicRoutes: string[] = [];

  try {
    const supabaseUrl = env.VITE_SUPABASE_URL;
    const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      console.log("Fetching dynamic routes from Supabase for Sitemap...");
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Profissionais
      const { data: pros } = await supabase.from("profiles").select("id").eq("role", "professional");
      if (pros) dynamicRoutes.push(...pros.map((p) => `/professional/${p.id}`));

      // Imóveis
      const { data: imoveis } = await supabase.from("imoveis").select("id").eq("status", "aprovado");
      if (imoveis) dynamicRoutes.push(...imoveis.map((i) => `/imoveis/${i.id}`));

      // Categorias
      const { data: cats } = await supabase.from("categories").select("id");
      if (cats) dynamicRoutes.push(...cats.map((c) => `/category/${c.id}`));
    }
  } catch (error) {
    console.error("Error fetching dynamic routes for sitemap:", error);
  }

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [
      react(), 
      mode === "development" && componentTagger(),
      Sitemap({
        hostname: "https://saka-service.com",
        dynamicRoutes,
        generateRobotsTxt: true,
        robots: [
          { userAgent: '*', allow: '/', disallow: ['/admin/*', '/perfil-editar', '/update-password'] }
        ]
      })
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
