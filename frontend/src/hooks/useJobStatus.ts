/**
 * TanStack Query hook for polling job status
 * Polls GET /api/jobs/{job_id} every 5 seconds until completed or failed
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { getJobStatus } from '@/lib/api';
import type { JobStatusResponse } from '@/types';

/**
 * Hook for polling job status with auto-stop on completion
 * @param jobId - The job ID to poll, or null to disable polling
 */
export function useJobStatus(jobId: string | null) {
  const { getToken } = useAuth();

  return useQuery<JobStatusResponse, Error>({
    queryKey: ['job-status', jobId],
    queryFn: async () => {
      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }
      return getJobStatus(token, jobId!);
    },
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      // Stop polling when completed or failed
      if (status === 'completed' || status === 'failed') {
        return false;
      }
      return 5000; // Poll every 5 seconds
    },
    staleTime: 0, // Always refetch on poll
    retry: 3, // Retry on network errors
  });
}
