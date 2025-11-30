/**
 * RecentActivitiesCard component displays the 5 most recent customized activities
 * Shows activity title, type badge, status badge, and creation date
 * Includes empty state with CTA to browse Activity Library
 *
 * @example
 * <RecentActivitiesCard teamId={teamId} />
 */

import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useRecentActivities } from '@/hooks/useRecentActivities';
import type { CustomizedActivity } from '@/types';

interface RecentActivitiesCardProps {
  /** Team ID to fetch activities for */
  teamId: string | null;
}

/**
 * Returns badge variant and label for customization type
 */
function getTypeBadge(type: CustomizedActivity['customization_type']) {
  if (type === 'public_customized') {
    return { variant: 'secondary' as const, label: 'Customized' };
  }
  return { variant: 'default' as const, label: 'Generated' };
}

/**
 * Returns badge variant and label for activity status
 */
function getStatusBadge(status: CustomizedActivity['status']) {
  switch (status) {
    case 'saved':
      return { variant: 'default' as const, label: 'Saved' };
    case 'scheduled':
      return { variant: 'outline' as const, label: 'Scheduled' };
    case 'expired':
      return { variant: 'destructive' as const, label: 'Expired' };
    default:
      return { variant: 'secondary' as const, label: 'Suggested' };
  }
}

/**
 * Formats date to relative or short format
 */
function formatDate(dateString: string | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Single activity item in the list
 */
function ActivityItem({ activity }: { activity: CustomizedActivity }) {
  const navigate = useNavigate();
  const typeBadge = getTypeBadge(activity.customization_type);
  const statusBadge = getStatusBadge(activity.status);

  const handleClick = () => {
    // Navigate to activity library - could be enhanced to go to specific activity
    navigate('/activities');
  };

  return (
    <div
      onClick={handleClick}
      className="flex items-start justify-between p-3 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
    >
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium truncate">{activity.title}</h4>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant={typeBadge.variant} className="text-xs">
            {typeBadge.label}
          </Badge>
          <Badge variant={statusBadge.variant} className="text-xs">
            {statusBadge.label}
          </Badge>
        </div>
      </div>
      <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
        {formatDate(activity.created_at)}
      </span>
    </div>
  );
}

/**
 * Loading skeleton for recent activities
 */
function RecentActivitiesSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-3">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-16" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/**
 * Error state with retry button
 */
function RecentActivitiesError({ onRetry }: { onRetry: () => void }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Recent Activities</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground mb-3">
            Failed to load recent activities
          </p>
          <Button variant="outline" size="sm" onClick={onRetry}>
            Retry
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Empty state when no activities exist
 */
function EmptyState() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Recent Activities</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-6">
          <div className="text-4xl mb-3">&#128218;</div>
          <p className="text-sm text-muted-foreground mb-4">
            No customized activities yet. Browse our library to get started!
          </p>
          <Link to="/activities">
            <Button size="sm">Browse Activity Library</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export function RecentActivitiesCard({ teamId }: RecentActivitiesCardProps) {
  const { data: activities, isLoading, isError, refetch } = useRecentActivities(teamId);

  // Loading state
  if (isLoading) {
    return <RecentActivitiesSkeleton />;
  }

  // Error state
  if (isError) {
    return <RecentActivitiesError onRetry={() => refetch()} />;
  }

  // Empty state
  if (!activities || activities.length === 0) {
    return <EmptyState />;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Recent Activities</CardTitle>
          <Link to="/activities">
            <Button variant="ghost" size="sm" className="text-xs">
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {activities.map((activity) => (
          <ActivityItem key={activity.id} activity={activity} />
        ))}
      </CardContent>
    </Card>
  );
}
