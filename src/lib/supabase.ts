import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { STORAGE_KEYS } from './constants.ts';
import { nanoid } from 'nanoid';

// Safe environment variable retrieval across Vite and Node test runner
const env =
  typeof import.meta !== 'undefined' && (import.meta as unknown as { env?: Record<string, string> }).env
    ? (import.meta as unknown as { env: Record<string, string> }).env
    : typeof process !== 'undefined'
    ? (process.env as Record<string, string>)
    : {};

const supabaseUrl = env.VITE_SUPABASE_URL?.trim() || '';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY?.trim() || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('your-project-id')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export function getDeviceId(): string {
  try {
    let deviceId = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
    if (!deviceId) {
      deviceId = `dev_${nanoid(14)}`;
      localStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
    }
    return deviceId;
  } catch {
    return 'dev_fallback';
  }
}
