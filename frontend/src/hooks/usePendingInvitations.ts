/**
 * TanStack Query hook for fetching pending invitations for a team
 * Used to display invitation list and status
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { getPendingInvitations } from '@/lib/api';
import type { PendingInvitation } from '@/types';

export function usePendingInvitations(teamId: string | null) {
  const { getToken, isSignedIn } = useAuth();

  return useQuery<PendingInvitation[], Error>({
    queryKey: ['pending-invitations', teamId],
    queryFn: async () => {
      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }
      return getPendingInvitations(token, teamId!);
    },
    enabled: isSignedIn && !!teamId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
