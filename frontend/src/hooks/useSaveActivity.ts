/**
 * TanStack Query mutation hook for saving customized activities
 * Calls PATCH /api/activities/{id}/status endpoint
 */

import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { updateActivityStatus, type CustomizedActivityData } from '@/lib/api';

export function useSaveActivity() {
  const { getToken } = useAuth();

  return useMutation<
    { success: boolean; activity: CustomizedActivityData },
    Error,
    { activityId: string; status: 'suggested' | 'saved' | 'scheduled' | 'expired' }
  >({
    mutationFn: async ({ activityId, status }) => {
      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }
      return updateActivityStatus(token, activityId, status);
    },
    retry: 1,
  });
}
