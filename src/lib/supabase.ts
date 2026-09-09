import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

const metaEnv = (import.meta as any).env || {};
const supabaseUrl = metaEnv.VITE_SUPABASE_URL || '';
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || metaEnv.VITE_SUPABASE_PUBLISHABLE_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'MY_SUPABASE_URL' &&
  !supabaseUrl.includes('placeholder')
);

// Hybrid storage adapter: ensures tokens persist on both web localStorage and Android SharedPreferences
export const capacitorStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Capacitor.isNativePlatform()) {
      try {
        const { value } = await Preferences.get({ key });
        if (value !== null && value !== undefined) return value;
      } catch {
        // fallback to localStorage
      }
    }
    return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        // ignore
      }
    }
    if (Capacitor.isNativePlatform()) {
      try {
        await Preferences.set({ key, value });
      } catch {
        // ignore
      }
    }
  },
  removeItem: async (key: string): Promise<void> => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // ignore
      }
    }
    if (Capacitor.isNativePlatform()) {
      try {
        await Preferences.remove({ key });
      } catch {
        // ignore
      }
    }
  },
};

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: capacitorStorage,
      },
    })
  : null;

