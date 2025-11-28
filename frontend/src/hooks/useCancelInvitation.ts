/**
 * TanStack Query mutation hook for cancelling a pending invitation
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { cancelInvitation } from '@/lib/api';

interface CancelInvitationResponse {
  success: boolean;
  message: string;
}

interface CancelInvitationVariables {
  invitationId: string;
  teamId: string; // For cache invalidation
}

export function useCancelInvitation() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<CancelInvitationResponse, Error, CancelInvitationVariables>({
    mutationFn: async ({ invitationId }) => {
      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }
      return cancelInvitation(token, invitationId);
    },
    onSuccess: (_, variables) => {
      // Invalidate pending invitations for this team
      queryClient.invalidateQueries({
        queryKey: ['pending-invitations', variables.teamId]
      });
    },
    retry: 1,
  });
}
