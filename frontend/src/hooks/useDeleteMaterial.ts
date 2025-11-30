/**
 * TanStack Query mutation hook for deleting materials
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { deleteMaterial } from '@/lib/api';

interface UseDeleteMaterialReturn {
  mutate: (materialId: string) => void;
  mutateAsync: (materialId: string) => Promise<{ message: string }>;
  isLoading: boolean;
  error: Error | null;
  reset: () => void;
}

export function useDeleteMaterial(teamId: string | null | undefined): UseDeleteMaterialReturn {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (materialId: string) => {
      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }
      return deleteMaterial(materialId, token);
    },
    onSuccess: () => {
      // Invalidate team materials cache to refetch the list
      if (teamId) {
        queryClient.invalidateQueries({ queryKey: ['team-materials', teamId] });
      }
    },
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}
