/**
 * TanStack Query hook for fetching public activities
 * Uses staleTime: Infinity since activities are static data
 * Uses base supabase client (no auth) since public_activities is public data
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';

export type PublicActivity = Database['public']['Tables']['public_activities']['Row'];

export function useActivities() {
  return useQuery({
    queryKey: ['public-activities'],
    queryFn: async (): Promise<PublicActivity[]> => {
      const { data, error } = await supabase
        .from('public_activities')
        .select('*')
        .eq('is_active', true)
        .order('category')
        .order('duration_minutes');

      if (error) throw error;
      return data ?? [];
    },
    staleTime: Infinity, // Static data, never refetch automatically
    gcTime: 1000 * 60 * 30, // Keep in cache 30 minutes
    retry: 2,
  });
}
