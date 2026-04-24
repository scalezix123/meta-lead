import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRITICAL: Supabase URL or Anon Key is missing! Check Vercel Environment Variables.');
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false, // Prevents duplicate initialization from URL fragments
    storageKey: 'sb-iijukoizlrztgxozieav-auth-token',
    storage: window.localStorage,
    flowType: 'pkce',
  },
  global: {
    headers: { 'x-application-name': 'scalezix-crm' },
  },
  db: {
    schema: 'public'
  }
});




