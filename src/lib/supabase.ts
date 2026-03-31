import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('ERRO CRÍTICO: Variáveis de ambiente do Supabase não encontradas.');
  console.info('Certifique-se de configurar VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no Vercel ou no arquivo .env local.');
}

// Inicializa mesmo sem as chaves para evitar que o import quebre o app inteiro, 
// embora as chamadas venham a falhar depois.
export const supabase = createClient(
  supabaseUrl || '', 
  supabaseAnonKey || ''
);
