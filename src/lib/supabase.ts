/**
 * src/lib/supabase.ts
 * Safe Supabase Client Initializer for AgriOptima AI
 *
 * Security Guidelines:
 * - Only safe public credentials (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are consumed.
 * - Never prints or logs secrets/keys.
 * - Fails gracefully with typed warnings if environment variables are not yet provided.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

/**
 * Validates whether valid Supabase public credentials have been supplied.
 */
export const isSupabaseConfigured: boolean = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  supabaseAnonKey.length > 20
);

/**
 * Singleton Supabase Client instance.
 * Uses a dummy client fallback if configuration is missing to avoid runtime crashes before setup.
 */
export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
    })
  : createClient('https://placeholder.supabase.co', 'placeholder-anon-key-not-configured', {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

/**
 * User Profile database schema representation
 */
export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  preferred_language: 'en' | 'hi' | string;
  created_at?: string;
  updated_at?: string;
}
