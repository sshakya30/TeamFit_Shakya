/**
 * TanStack Query hook for fetching user's team memberships
 * Only returns teams where user has manager or admin role
 * Used for team selector in customization flow
 */

import { useQuery } from '@tanstack/react-query';
import { useUser as useClerkUser } from '@clerk/clerk-react';
import { useSupabaseClient } from '@/lib/supabase';
import type { TeamMembershipWithDetails } from '@/types';

export function useUserTeams() {
  const { user: clerkUser } = useClerkUser();
  const supabase = useSupabaseClient();

  return useQuery<TeamMembershipWithDetails[], Error>({
    queryKey: ['user-teams', clerkUser?.id],
    queryFn: async () => {
      // First, get the user's internal ID from clerk_user_id
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_user_id', clerkUser!.id)
        .single();

      if (userError) throw userError;
      if (!user) return [];

      // Get all team memberships with team and organization details
      // Only include manager and admin roles (members can't customize)
      const { data: memberships, error: membershipsError } = await supabase
        .from('team_members')
        .select(`
          id,
          team_id,
          user_id,
          organization_id,
          role,
          joined_at,
          teams (
            id,
            organization_id,
            name,
            description,
            settings,
            created_at,
            updated_at
          ),
          organizations (
            id,
            name,
            slug,
            settings,
            subscription_plan,
            subscription_status,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', user.id)
        .in('role', ['manager', 'admin']);

      if (membershipsError) throw membershipsError;

      // Transform the response to flatten the nested objects
      return (memberships || []).map((m) => ({
        id: m.id,
        team_id: m.team_id,
        user_id: m.user_id,
        organization_id: m.organization_id,
        role: m.role as 'member' | 'manager' | 'admin',
        joined_at: m.joined_at,
        teams: m.teams as TeamMembershipWithDetails['teams'],
        organizations: m.organizations as TeamMembershipWithDetails['organizations'],
      }));
    },
    enabled: !!clerkUser,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
