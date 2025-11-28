/**
 * TanStack Query mutation hook for creating/updating team profile
 * Used during onboarding and for updating team context
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { createTeamProfile } from '@/lib/api';
import type { CreateTeamProfileRequest } from '@/types';

interface TeamProfileResponse {
  success: boolean;
  profile: Record<string, unknown>;
}

export function useUpdateTeamProfile() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<TeamProfileResponse, Error, CreateTeamProfileRequest>({
    mutationFn: async (data) => {
      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }
      return createTeamProfile(token, data);
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['onboarding-status'] });
      queryClient.invalidateQueries({ queryKey: ['team-profile', variables.team_id] });
    },
    retry: 1,
  });
}
