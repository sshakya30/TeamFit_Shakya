/**
 * TanStack Query hook for fetching usage quota
 * Used to display quota information in customization flow
 */

import { useQuery } from '@tanstack/react-query';
import { useSupabaseClient } from '@/lib/supabase';
import type { UsageQuota } from '@/types';

export function useQuota(organizationId: string | null) {
  const supabase = useSupabaseClient();

  return useQuery<UsageQuota | null, Error>({
    queryKey: ['usage-quota', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('usage_quotas')
        .select('*')
        .eq('organization_id', organizationId!)
        .single();

      // PGRST116 means no rows found - not an error, just no quota
      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data as UsageQuota | null;
    },
    enabled: !!organizationId,
    staleTime: 1000 * 60 * 2, // 2 minutes - quota can change
  });
}
