/**
 * Custom hook to fetch user data via backend API
 * Includes team membership and organization info
 * Uses backend API instead of direct Supabase queries to avoid JWT configuration issues
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { getMyProfile } from '@/lib/api';
import type { DashboardData } from '@/types';

export function useUser() {
  const { getToken, isSignedIn } = useAuth();

  return useQuery<DashboardData | null>({
    queryKey: ['user-dashboard'],
    queryFn: async () => {
      const token = await getToken();
      if (!token) {
        console.error('No auth token available');
        return null;
      }

      try {
        const data = await getMyProfile(token);
        return {
          user: data.user,
          teamMember: data.teamMember,
          team: data.team,
          organization: data.organization,
          teamMembersCount: data.teamMembersCount,
          upcomingEventsCount: data.upcomingEventsCount,
        };
      } catch (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }
    },
    enabled: isSignedIn,
  });
}
