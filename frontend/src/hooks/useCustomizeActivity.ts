/**
 * TanStack Query mutation hook for customizing activities
 * Calls POST /api/activities/customize endpoint
 */

import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import {
  customizeActivity,
  type CustomizeActivityRequest,
  type CustomizeActivityResponse
} from '@/lib/api';

export function useCustomizeActivity() {
  const { getToken } = useAuth();

  return useMutation<CustomizeActivityResponse, Error, CustomizeActivityRequest>({
    mutationFn: async (data) => {
      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }
      return customizeActivity(token, data);
    },
    retry: 1,
  });
}
