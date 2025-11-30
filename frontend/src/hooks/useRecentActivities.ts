/**
 * TanStack Query hook for fetching recent customized activities
 * Returns the 5 most recent activities for a team
 * Used in dashboard RecentActivitiesCard component
 */

import { useQuery } from '@tanstack/react-query';
import { useSupabaseClient } from '@/lib/supabase';
import type { CustomizedActivity } from '@/types';

export interface RecentActivity extends CustomizedActivity {
  // Additional fields can be added here if needed
}

/**
 * Fetches the 5 most recent customized activities for a team
 * @param teamId - The team ID to fetch activities for
 * @returns Query result with recent activities data
 */
export function useRecentActivities(teamId: string | null) {
  const supabase = useSupabaseClient();

  return useQuery<RecentActivity[], Error>({
    queryKey: ['recent-activities', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customized_activities')
        .select('*')
        .eq('team_id', teamId!)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        throw error;
      }

      return (data || []) as RecentActivity[];
    },
    enabled: !!teamId,
    staleTime: 1000 * 60 * 2, // 2 minutes - activities can be created frequently
  });
}
