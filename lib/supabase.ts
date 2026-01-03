import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pvisyuhhyruuxrylzpqr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2aXN5dWhoeXJ1dXhyeWx6cHFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczOTQ2NDEsImV4cCI6MjA4Mjk3MDY0MX0.NGc5ws9ERsgDzelKYMiDZFA34MSyPiwn10agfQU1OnQ';

/**
 * Polyfill Universal de Locks.
 * O erro 'this.lock is not a function' ocorre quando o SDK tenta invocar o lock 
 * diretamente ou espera uma interface específica que está bloqueada pelo navegador.
 * Esta implementação funciona como função E como objeto com métodos .acquire e .request.
 */
const createResilientLock = () => {
  const lockHandler = async (name: string, optionsOrCallback: any, callback?: any) => {
    // Resolve o callback independente da assinatura (name, cb) ou (name, opts, cb)
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

  // Algumas versões do SDK buscam .acquire ou .request (padrão Web Locks)
  (lockHandler as any).acquire = lockHandler;
  (lockHandler as any).request = lockHandler;

  return lockHandler;
};

const customLock = createResilientLock();

// Tenta injetar no ambiente global para scripts de terceiros e redundância
if (typeof window !== 'undefined') {
  try {
    const nav = window.navigator as any;
    // Se não existir ou for inválido, sobrescreve
    if (!nav.locks || typeof nav.locks.request !== 'function') {
      Object.defineProperty(nav, 'locks', {
        value: customLock,
        configurable: true,
        writable: true
      });
    }
  } catch (e) {
    // Falha silenciosa se o ambiente for extremamente restrito
  }
}

const memoryStorage: Record<string, string> = {};

/**
 * Storage resiliente que evita SecurityError em ambientes de iframe/sandbox.
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
    // Passamos o lock resiliente diretamente na config do auth
    lock: customLock as any,
    // Desativar broadcast evita SecurityError: The operation is insecure
    broadcast: false,
  },
  global: {
    headers: { 'x-application-name': 'tagway-pro' }
  }
});
