/**
 * TanStack Query hook for fetching team profile
 * Used to display team context before customization
 */

import { useQuery } from '@tanstack/react-query';
import { useSupabaseClient } from '@/lib/supabase';
import type { TeamProfile } from '@/types';

export function useTeamProfile(teamId: string | null) {
  const supabase = useSupabaseClient();

  return useQuery<TeamProfile | null, Error>({
    queryKey: ['team-profile', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_profiles')
        .select('*')
        .eq('team_id', teamId!)
        .single();

      // PGRST116 means no rows found - not an error, just no profile
      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data as TeamProfile | null;
    },
    enabled: !!teamId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
