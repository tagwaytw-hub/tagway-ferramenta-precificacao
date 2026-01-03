
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pvisyuhhyruuxrylzpqr.supabase.co';
const supabaseAnonKey = 'sb_publishable_Vi0uwwpt4Ztos2NzKgdN9w_z8Vt0WS7';

// Implementação de storage resiliente para evitar SecurityError em iframes/cross-origin
const safeStorage = {
  getItem: (key: string) => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      window.localStorage.setItem(key, value);
    } catch {}
  },
  removeItem: (key: string) => {
    try {
      window.localStorage.removeItem(key);
    } catch {}
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: safeStorage as any,
    storageKey: 'tagway-auth-token',
    flowType: 'pkce'
  },
  global: {
    headers: { 'x-application-name': 'tagway-pro' }
  }
});
