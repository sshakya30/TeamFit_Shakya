/**
 * TanStack Query mutation hook for completing onboarding
 * Marks user's onboarding as finished
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { completeOnboarding } from '@/lib/api';

interface CompleteOnboardingResponse {
  success: boolean;
  message: string;
}

export function useCompleteOnboarding() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<CompleteOnboardingResponse, Error, void>({
    mutationFn: async () => {
      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }
      return completeOnboarding(token);
    },
    onSuccess: () => {
      // Invalidate onboarding status
      queryClient.invalidateQueries({ queryKey: ['onboarding-status'] });
      // Also refresh user teams in case they were updated during onboarding
      queryClient.invalidateQueries({ queryKey: ['user-teams'] });
    },
    retry: 1,
  });
}
