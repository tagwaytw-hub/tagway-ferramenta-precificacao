import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pvisyuhhyruuxrylzpqr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2aXN5dWhoeXJ1dXhyeWx6cHFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczOTQ2NDEsImV4cCI6MjA4Mjk3MDY0MX0.NGc5ws9ERsgDzelKYMiDZFA34MSyPiwn10agfQU1OnQ';

/**
 * Polyfill Universal de Locks.
 * Resolve o erro 'this.lock is not a function' em ambientes restritos (iframes/Vercel/Sandbox).
 * Implementa a interface que o SDK GoTrue espera.
 */
const createResilientLock = () => {
  const lockHandler = async (name: string, optionsOrCallback: any, callback?: any) => {
    const fn = typeof optionsOrCallback === 'function' ? optionsOrCallback : callback;
    if (typeof fn === 'function') {
      try {
        return await fn();
      } catch (e) {
        console.error('Erro no lock polyfill:', e);
        throw e;
      }
    }
    return Promise.resolve();
  };

  (lockHandler as any).acquire = lockHandler;
  (lockHandler as any).request = lockHandler;

  return lockHandler;
};

const customLock = createResilientLock();

// Injeção global para garantir que o navigator.locks sempre exista
if (typeof window !== 'undefined') {
  try {
    const nav = window.navigator as any;
    if (!nav.locks || typeof nav.locks.request !== 'function') {
      Object.defineProperty(nav, 'locks', {
        value: customLock,
        configurable: true,
        writable: true
      });
    }
  } catch (e) {
    // Silencioso se o ambiente bloquear modificações no navigator
  }
}

const memoryStorage: Record<string, string> = {};

/**
 * Storage resiliente para evitar SecurityError (localStorage bloqueado)
 */
const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return memoryStorage[key] || null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      memoryStorage[key] = value;
    }
  },
  removeItem: (key: string): void => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      delete memoryStorage[key];
    }
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: safeStorage as any,
    // Define o lock customizado para evitar 'this.lock is not a function'
    lock: customLock as any,
    // Nota: 'broadcast: false' foi removido pois não é uma propriedade válida no tipo Auth do SDK v2
    // O erro de BroadcastChannel é mitigado pelo uso do safeStorage e customLock.
  },
  global: {
    headers: { 'x-application-name': 'tagway-pro' }
  }
});
