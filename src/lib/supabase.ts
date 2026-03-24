import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder_key';

// Only instantiate properly if we have real keys, otherwise mock or error out gracefully
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserProfile = {
  id: string; // matches telegram user id
  telegram_username: string | null;
  balance: number;
  energy: number;
  last_sync: string;
};
