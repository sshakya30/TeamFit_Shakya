/**
 * Supabase client configuration for TEAMFIT
 * Integrates with Clerk authentication + TypeScript types
 */

import { createClient } from '@supabase/supabase-js';
import { useSession } from '@clerk/clerk-react';
import type { Database } from '@/types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

/**
 * Create Supabase client authenticated with Clerk JWT
 * Use this in components that need to query Supabase
 */
export function useSupabaseClient() {
  const { session } = useSession();
  const token = session?.lastActiveToken?.getRawString();

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  });
}

/**
 * Base Supabase client (without auth)
 * Use only for public data queries
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);