/**
 * TanStack Query mutation hook for generating custom activities
 * Calls POST /api/activities/generate-custom endpoint
 */

import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { generateCustomActivities } from '@/lib/api';
import type {
  GenerateCustomActivitiesRequest,
  GenerateCustomActivitiesResponse,
} from '@/types';

/**
 * Hook for initiating custom activity generation
 * Returns a mutation for starting the async generation job
 */
export function useGenerateActivities() {
  const { getToken } = useAuth();

  return useMutation<
    GenerateCustomActivitiesResponse,
    Error,
    GenerateCustomActivitiesRequest
  >({
    mutationFn: async (data) => {
      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }
      return generateCustomActivities(token, data);
    },
    retry: 1,
  });
}
