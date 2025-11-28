/**
 * TanStack Query mutation hook for creating an organization
 * Used during onboarding for first-time admins
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { createOrganization } from '@/lib/api';
import type { CreateOrganizationRequest, CreateOrganizationResponse } from '@/types';

export function useCreateOrganization() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<CreateOrganizationResponse, Error, CreateOrganizationRequest>({
    mutationFn: async (data) => {
      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }
      return createOrganization(token, data);
    },
    onSuccess: () => {
      // Invalidate onboarding status to reflect new step
      queryClient.invalidateQueries({ queryKey: ['onboarding-status'] });
    },
    retry: 1,
  });
}
