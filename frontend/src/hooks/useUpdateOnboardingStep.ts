/**
 * TanStack Query mutation hook for updating onboarding step
 * Used for navigation between onboarding steps
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { updateOnboardingStep } from '@/lib/api';
import type { OnboardingStep } from '@/types';

interface UpdateStepResponse {
  success: boolean;
  step: string;
}

export function useUpdateOnboardingStep() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<UpdateStepResponse, Error, OnboardingStep>({
    mutationFn: async (step) => {
      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }
      return updateOnboardingStep(token, step);
    },
    onSuccess: () => {
      // Invalidate onboarding status to reflect new step
      queryClient.invalidateQueries({ queryKey: ['onboarding-status'] });
    },
    retry: 1,
  });
}
