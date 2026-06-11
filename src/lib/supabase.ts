import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("Saka Service: Initializing Supabase client...");

const isUrlValid = supabaseUrl && supabaseUrl.startsWith('http');

if (!isUrlValid || !supabaseAnonKey) {
  console.error('ERRO CRÍTICO: Variáveis de ambiente do Supabase ausentes ou inválidas.');
  console.info('Configuradas:', { url: supabaseUrl, hasKey: !!supabaseAnonKey });
  console.info('Dica: O VITE_SUPABASE_URL deve começar com https://');
}

// Cliente PRINCIPAL — usado para autenticação (login, registo, perfil).
// Mantém sessão no localStorage.
export const supabase = (isUrlValid && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        detectSessionInUrl: true,
        autoRefreshToken: true,
        lock: async (name, acquireLock) => {
          if (typeof navigator !== 'undefined' && navigator.locks) {
            try {
              return await navigator.locks.request(name, { mode: 'exclusive' }, acquireLock);
            } catch (err: any) {
              console.warn('Saka Service: Supabase lock warning (fallback to direct execution):', err.message);
              return await acquireLock();
            }
          } else {
            return await acquireLock();
          }
        }
      },
    })
  : { auth: { getSession: async () => ({ data: { session: null } }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }) }, storage: {}, from: () => ({}) } as any;

// Cliente PÚBLICO — usado APENAS para leituras públicas (categorias, profissionais, stats).
// Sem gestão de sessão, sem locks de auth → nunca bloqueia.
export const supabasePublic = (isUrlValid && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  : { auth: {}, storage: {}, from: () => ({}) } as any;
