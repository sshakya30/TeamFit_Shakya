/**
 * TanStack Query hook for fetching team materials
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { getTeamMaterials } from '@/lib/api';
import type { Material } from '@/types';

interface UseTeamMaterialsReturn {
  data: Material[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useTeamMaterials(teamId: string | null | undefined): UseTeamMaterialsReturn {
  const { getToken } = useAuth();

  const query = useQuery<Material[], Error>({
    queryKey: ['team-materials', teamId],
    queryFn: async () => {
      if (!teamId) {
        throw new Error('Team ID is required');
      }

      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      return getTeamMaterials(teamId, token);
    },
    enabled: !!teamId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: true,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
