/**
 * Supabase client configuration for TEAMFIT
 * Integrates with Clerk authentication + TypeScript types
 *
 * SETUP REQUIRED (Clerk Dashboard):
 * 1. Go to Clerk Dashboard -> JWT Templates -> Create new template
 * 2. Name the template "supabase" (exactly, case-sensitive)
 * 3. Add these claims to the template:
 *    - "role": "authenticated" (required for Supabase RLS)
 *    - "sub": "{{user.id}}" (Clerk user ID, used by current_user_id() function)
 * 4. Set the signing algorithm to HS256
 * 5. Use your Supabase JWT Secret as the signing key (from Supabase Dashboard -> Settings -> API -> JWT Secret)
 *
 * SETUP REQUIRED (Supabase Dashboard):
 * 1. Go to Supabase Dashboard -> Authentication -> Providers -> Add new provider
 * 2. Or configure Third-Party Auth with your Clerk domain
 */

import { createClient } from '@supabase/supabase-js';
import { useSession } from '@clerk/clerk-react';
import { useMemo } from 'react';
import type { Database } from '@/types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

/**
 * Create Supabase client authenticated with Clerk JWT
 * Use this in components that need to query Supabase with auth
 *
 * Uses the modern accessToken approach for Clerk + Supabase integration
 * Requires Clerk to be configured for Supabase (adds role claim to JWT)
 */
export function useSupabaseClient() {
  const { session } = useSession();

  // Memoize the client to avoid recreating on every render
  const client = useMemo(() => {
    return createClient<Database>(supabaseUrl, supabaseAnonKey, {
      accessToken: async () => {
        // getToken({ template: 'supabase' }) returns a JWT with:
        // - 'sub' claim containing the Clerk user ID (used by RLS policies)
        // - 'role' claim set to 'authenticated' (required by Supabase RLS)
        // Falls back to null if no session, which uses anon role
        const token = await session?.getToken({ template: 'supabase' });
        return token ?? null;
      },
    });
  }, [session]);

  return client;
}

/**
 * Base Supabase client (without auth)
 * Use only for public data queries that don't require authentication
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);