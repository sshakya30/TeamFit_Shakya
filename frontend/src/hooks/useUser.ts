/**
 * Custom hook to fetch user data from Supabase
 * Includes team membership and organization info
 */

import { useQuery } from '@tanstack/react-query';
import { useUser as useClerkUser } from '@clerk/clerk-react';
import { useSupabaseClient } from '@/lib/supabase';
import type { User, TeamMember, Team, Organization, DashboardData } from '@/types';

export function useUser() {
  const { user: clerkUser } = useClerkUser();
  const supabase = useSupabaseClient();

  return useQuery<DashboardData | null>({
    queryKey: ['user-dashboard', clerkUser?.id],
    queryFn: async () => {
      if (!clerkUser) return null;

      // Fetch user from Supabase
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('clerk_user_id', clerkUser.id)
        .single();

      if (userError || !user) {
        console.error('Error fetching user:', userError);
        return null;
      }

      // Fetch team membership
      const { data: teamMember, error: teamMemberError } = await supabase
        .from('team_members')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // If no team membership, return user only
      if (teamMemberError || !teamMember) {
        return {
          user,
          teamMember: null,
          team: null,
          organization: null,
          teamMembersCount: 0,
          upcomingEventsCount: 0,
        };
      }

      // Fetch team
      const { data: team } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamMember.team_id)
        .single();

      // Fetch organization
      const { data: organization } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', teamMember.organization_id)
        .single();

      // Get team member count
      const { count: teamMembersCount } = await supabase
        .from('team_members')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', teamMember.team_id);

      // Get upcoming events count
      const { count: upcomingEventsCount } = await supabase
        .from('scheduled_events')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', teamMember.team_id)
        .eq('status', 'scheduled')
        .gte('scheduled_date', new Date().toISOString());

      return {
        user,
        teamMember,
        team: team || null,
        organization: organization || null,
        teamMembersCount: teamMembersCount || 0,
        upcomingEventsCount: upcomingEventsCount || 0,
      };
    },
    enabled: !!clerkUser,
  });
}
