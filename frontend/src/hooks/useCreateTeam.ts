/**
 * TanStack Query mutation hook for creating a team
 * Used during onboarding and for adding additional teams
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { createTeam } from '@/lib/api';
import type { CreateTeamRequest, CreateTeamResponse } from '@/types';

export function useCreateTeam() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<CreateTeamResponse, Error, CreateTeamRequest>({
    mutationFn: async (data) => {
      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }
      return createTeam(token, data);
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['onboarding-status'] });
      queryClient.invalidateQueries({ queryKey: ['user-teams'] });
    },
    retry: 1,
  });
}
