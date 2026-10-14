import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Read from Vite environment variables or localStorage override for easy testing
const getStoredConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const localUrl = typeof window !== 'undefined' ? localStorage.getItem('bicircle_supabase_url') || '' : '';
  const localKey = typeof window !== 'undefined' ? localStorage.getItem('bicircle_supabase_key') || '' : '';

  return {
    url: localUrl || envUrl,
    key: localKey || envKey,
  };
};

let clientInstance: SupabaseClient | null = null;

export function getSupabaseConfig() {
  return getStoredConfig();
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = getStoredConfig();
  return Boolean(url && key && url.startsWith('http') && !url.includes('placeholder'));
}

export function initSupabase(): SupabaseClient | null {
  const { url, key } = getStoredConfig();
  if (!url || !key || !url.startsWith('http')) {
    return null;
  }
  try {
    if (!clientInstance) {
      clientInstance = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
    }
    return clientInstance;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

export function updateSupabaseConfig(url: string, key: string) {
  if (typeof window !== 'undefined') {
    if (url && key) {
      localStorage.setItem('bicircle_supabase_url', url.trim());
      localStorage.setItem('bicircle_supabase_key', key.trim());
    } else {
      localStorage.removeItem('bicircle_supabase_url');
      localStorage.removeItem('bicircle_supabase_key');
    }
  }
  clientInstance = null; // Reset instance
}

export const supabase = initSupabase();
