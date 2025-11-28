/**
 * TanStack Query hook for fetching user's onboarding status
 * Determines which step of onboarding the user is on
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { getOnboardingStatus } from '@/lib/api';
import type { OnboardingState } from '@/types';

export function useOnboardingStatus() {
  const { getToken, isSignedIn } = useAuth();

  return useQuery<OnboardingState, Error>({
    queryKey: ['onboarding-status'],
    queryFn: async () => {
      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }
      return getOnboardingStatus(token);
    },
    enabled: isSignedIn,
    staleTime: 1000 * 60 * 2, // 2 minutes - onboarding state can change
    refetchOnWindowFocus: true,
  });
}
