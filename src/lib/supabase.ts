import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('ERRO CRÍTICO: Variáveis de ambiente do Supabase não encontradas.');
  console.info('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env ou no Vercel.');
}

// Cliente PRINCIPAL — usado para autenticação (login, registo, perfil).
// Mantém sessão no localStorage.
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        detectSessionInUrl: true,
        autoRefreshToken: true,
      },
    })
  : { auth: {}, storage: {}, from: () => ({}) } as any;

// Cliente PÚBLICO — usado APENAS para leituras públicas (categorias, profissionais, stats).
// Sem gestão de sessão, sem locks de auth → nunca bloqueia.
export const supabasePublic = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  : { auth: {}, storage: {}, from: () => ({}) } as any;
