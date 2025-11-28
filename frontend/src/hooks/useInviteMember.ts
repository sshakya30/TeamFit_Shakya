/**
 * TanStack Query mutation hook for inviting a team member
 * Creates pending invitation record
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { inviteMember } from '@/lib/api';
import type { InviteMemberRequest, InviteMemberResponse } from '@/types';

export function useInviteMember() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<InviteMemberResponse, Error, InviteMemberRequest>({
    mutationFn: async (data) => {
      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }
      return inviteMember(token, data);
    },
    onSuccess: (_, variables) => {
      // Invalidate pending invitations for this team
      queryClient.invalidateQueries({
        queryKey: ['pending-invitations', variables.team_id]
      });
    },
    retry: 1,
  });
}
