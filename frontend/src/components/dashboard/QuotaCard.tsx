/**
 * QuotaCard component displays organization quota usage
 * Shows public customizations and custom generations with progress bars
 * Color coded: green (<70%), yellow (70-90%), red (>90%)
 *
 * @example
 * <QuotaCard organizationId={orgId} subscriptionPlan="free" />
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useQuota } from '@/hooks/useQuota';
import { cn } from '@/lib/utils';

interface QuotaCardProps {
  /** Organization ID to fetch quota for */
  organizationId: string | null;
  /** Subscription plan to determine what quotas to show */
  subscriptionPlan: string;
}

/**
 * Returns the appropriate color class based on usage percentage
 */
function getProgressColor(percentage: number): string {
  if (percentage >= 90) return 'bg-red-500';
  if (percentage >= 70) return 'bg-yellow-500';
  return 'bg-green-500';
}

/**
 * Returns the appropriate text color class based on usage percentage
 */
function getTextColor(percentage: number): string {
  if (percentage >= 90) return 'text-red-600';
  if (percentage >= 70) return 'text-yellow-600';
  return 'text-green-600';
}

/**
 * Individual quota progress bar with label and count
 */
function QuotaProgress({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number;
}) {
  const percentage = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const colorClass = getProgressColor(percentage);
  const textColorClass = getTextColor(percentage);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{label}</span>
        <span className={cn('text-sm font-semibold', textColorClass)}>
          {used} of {limit} used
        </span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full transition-all duration-300', colorClass)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Loading skeleton for quota card
 */
function QuotaCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-2 w-full" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-2 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Error state for quota card with retry button
 */
function QuotaCardError({ onRetry }: { onRetry: () => void }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Quota Usage</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground mb-3">
            Failed to load quota information
          </p>
          <Button variant="outline" size="sm" onClick={onRetry}>
            Retry
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function QuotaCard({ organizationId, subscriptionPlan }: QuotaCardProps) {
  const { data: quota, isLoading, isError, refetch } = useQuota(organizationId);
  const isPaidTier = subscriptionPlan !== 'free';

  // Loading state
  if (isLoading) {
    return <QuotaCardSkeleton />;
  }

  // Error state
  if (isError) {
    return <QuotaCardError onRetry={() => refetch()} />;
  }

  // No quota data found - show default limits
  const publicUsed = quota?.public_customizations_used ?? 0;
  const publicLimit = quota?.public_customizations_limit ?? (isPaidTier ? 10 : 5);
  const customUsed = quota?.custom_generations_used ?? 0;
  const customLimit = quota?.custom_generations_limit ?? (isPaidTier ? 10 : 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span>Quota Usage</span>
          <span className="text-xs font-normal text-muted-foreground capitalize">
            {subscriptionPlan} tier
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <QuotaProgress
          label="Public Customizations"
          used={publicUsed}
          limit={publicLimit}
        />

        {isPaidTier ? (
          <QuotaProgress
            label="Custom Generations"
            used={customUsed}
            limit={customLimit}
          />
        ) : (
          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
            Upgrade to paid plan for custom AI-generated activities
          </div>
        )}

        {/* Show reset info if available */}
        {quota?.quota_period_end && (
          <p className="text-xs text-muted-foreground text-center pt-2">
            Resets {new Date(quota.quota_period_end).toLocaleDateString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
