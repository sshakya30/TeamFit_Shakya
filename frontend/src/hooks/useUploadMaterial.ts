/**
 * TanStack Query hook for uploading materials with progress tracking
 */

import { useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { uploadMaterial } from '@/lib/api';
import type { UploadMaterialResponse } from '@/types';

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'complete' | 'error';

interface UseUploadMaterialReturn {
  upload: (file: File, teamId: string, organizationId: string) => Promise<UploadMaterialResponse | null>;
  progress: number;
  status: UploadStatus;
  error: string | null;
  reset: () => void;
  isUploading: boolean;
}

export function useUploadMaterial(): UseUploadMaterialReturn {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<boolean>(false);

  const reset = useCallback(() => {
    setProgress(0);
    setStatus('idle');
    setError(null);
    abortRef.current = false;
  }, []);

  const upload = useCallback(async (
    file: File,
    teamId: string,
    organizationId: string
  ): Promise<UploadMaterialResponse | null> => {
    try {
      abortRef.current = false;
      setStatus('uploading');
      setProgress(0);
      setError(null);

      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const result = await uploadMaterial(
        file,
        teamId,
        organizationId,
        token,
        (percent) => {
          if (!abortRef.current) {
            setProgress(percent);
            // When upload reaches 100%, show processing state
            if (percent === 100) {
              setStatus('processing');
            }
          }
        }
      );

      if (abortRef.current) {
        return null;
      }

      setStatus('complete');
      setProgress(100);

      // Invalidate team materials cache to refetch the list
      queryClient.invalidateQueries({ queryKey: ['team-materials', teamId] });

      return result;
    } catch (err) {
      if (abortRef.current) {
        return null;
      }

      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      setStatus('error');
      return null;
    }
  }, [getToken, queryClient]);

  return {
    upload,
    progress,
    status,
    error,
    reset,
    isUploading: status === 'uploading' || status === 'processing',
  };
}
