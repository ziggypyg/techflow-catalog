import { createClient } from '@supabase/supabase-js';

// Asegúrate de que estas variables de entorno existan en tu archivo .env
// Por ejemplo:
// VITE_SUPABASE_URL=https://tu_url_de_supabase.supabase.co
// VITE_SUPABASE_ANON_KEY=tu_clave_anon_publica
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY deben estar definidas en el archivo .env');
}

// Creamos y exportamos el cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Definición de tipos de la base de datos para tipado seguro (usando un tipo genérico por ahora)
// Idealmente, se generaría con `supabase gen types`, pero por ahora, usamos "any".
export type Database = any;
