import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('ERRO CRÍTICO: Variáveis de ambiente do Supabase não encontradas.');
  console.info('Certifique-se de configurar VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no Vercel ou no arquivo .env local.');
}

// Só inicializamos o cliente se as variáveis estiverem presentes. 
// Caso contrário, exportamos um objeto vazio para evitar que o import quebre o app
// antes que o ecrã de ConfigError possa ser mostrado no App.tsx.
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : { auth: {}, storage: {}, from: () => {} } as any;
