# Quickstart: Dashboard Enhancements

**Feature**: 005-dashboard-enhancements
**Date**: 2025-11-30

## Prerequisites

- Node.js 18+ installed
- Frontend dependencies installed (`npm install` in `frontend/`)
- Backend server running (`uv run uvicorn app.main:app --reload` in `backend/`)
- Clerk authentication configured
- Supabase database with existing schema

## Quick Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

## Implementation Steps

### Step 1: Create useRecentActivities Hook

Create `frontend/src/hooks/useRecentActivities.ts`:

```typescript
/**
 * TanStack Query hook for fetching recent customized activities
 * Used to display recent activities on dashboard
 */

import { useQuery } from '@tanstack/react-query';
import { useSupabaseClient } from '@/lib/supabase';
import type { CustomizedActivity } from '@/types';

export function useRecentActivities(teamId: string | null) {
  const supabase = useSupabaseClient();

  return useQuery<CustomizedActivity[], Error>({
    queryKey: ['recent-activities', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customized_activities')
        .select('id, title, customization_type, status, created_at')
        .eq('team_id', teamId!)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data as CustomizedActivity[];
    },
    enabled: !!teamId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
```

### Step 2: Create QuotaCard Component

Create `frontend/src/components/dashboard/QuotaCard.tsx`:

```typescript
/**
 * Quota usage card with progress bar
 * Shows public customizations and custom generations quota
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useQuota } from '@/hooks/useQuota';
import { cn } from '@/lib/utils';

interface QuotaCardProps {
  organizationId: string | null;
  subscriptionPlan: string | null;
}

export function QuotaCard({ organizationId, subscriptionPlan }: QuotaCardProps) {
  const { data: quota, isLoading, isError, refetch } = useQuota(organizationId);
  const isPaid = subscriptionPlan !== 'free';

  const getProgressColor = (used: number, limit: number) => {
    const percentage = limit > 0 ? (used / limit) * 100 : 0;
    if (percentage >= 90) return '[&>div]:bg-red-500';
    if (percentage >= 70) return '[&>div]:bg-yellow-500';
    return '[&>div]:bg-green-500';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-2 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Usage Quota</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">Failed to load quota</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const publicUsed = quota?.public_customizations_used ?? 0;
  const publicLimit = quota?.public_customizations_limit ?? 5;
  const customUsed = quota?.custom_generations_used ?? 0;
  const customLimit = quota?.custom_generations_limit ?? 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Usage Quota</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Public Customizations */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Activity Customizations</span>
            <span className="text-muted-foreground">{publicUsed} of {publicLimit}</span>
          </div>
          <Progress
            value={(publicUsed / publicLimit) * 100}
            className={cn('h-2', getProgressColor(publicUsed, publicLimit))}
          />
        </div>

        {/* Custom Generations (paid only) */}
        {isPaid && customLimit > 0 && (
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Custom Generations</span>
              <span className="text-muted-foreground">{customUsed} of {customLimit}</span>
            </div>
            <Progress
              value={(customUsed / customLimit) * 100}
              className={cn('h-2', getProgressColor(customUsed, customLimit))}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### Step 3: Create RecentActivitiesCard Component

Create `frontend/src/components/dashboard/RecentActivitiesCard.tsx`:

```typescript
/**
 * Recent customized activities card
 * Shows last 5 activities with navigation
 */

import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useRecentActivities } from '@/hooks/useRecentActivities';

interface RecentActivitiesCardProps {
  teamId: string | null;
}

export function RecentActivitiesCard({ teamId }: RecentActivitiesCardProps) {
  const { data: activities, isLoading, isError, refetch } = useRecentActivities(teamId);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recent Activities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">Failed to load activities</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            No customized activities yet.
          </p>
          <Link to="/activities">
            <Button variant="outline" size="sm">Browse Activity Library</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Recent Activities</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {activities.map((activity) => (
          <Link
            key={activity.id}
            to="/activities"
            className="flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm truncate">{activity.title}</span>
              <Badge variant="outline" className="text-xs shrink-0">
                {activity.customization_type === 'custom_generated' ? 'Generated' : 'Customized'}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground shrink-0">
              {formatDate(activity.created_at)}
            </span>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
```

### Step 4: Create TeamProfileCard Component

Create `frontend/src/components/dashboard/TeamProfileCard.tsx`:

```typescript
/**
 * Team profile summary card
 * Shows key profile info with edit access
 */

import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useTeamProfile } from '@/hooks/useTeamProfile';

interface TeamProfileCardProps {
  teamId: string | null;
  teamName: string | null;
}

export function TeamProfileCard({ teamId, teamName }: TeamProfileCardProps) {
  const { data: profile, isLoading, isError } = useTeamProfile(teamId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Team Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">Failed to load profile</p>
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Team Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Complete your team profile to get personalized activity recommendations.
          </p>
          <Link to={teamId ? `/team/${teamId}/manage` : '#'}>
            <Button variant="outline" size="sm" disabled={!teamId}>
              Complete Profile
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base">Team Profile</CardTitle>
        <Link to={teamId ? `/team/${teamId}/manage` : '#'}>
          <Button variant="ghost" size="sm" disabled={!teamId}>
            Edit
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {profile.industry_sector && (
          <div>
            <span className="text-muted-foreground">Industry:</span>{' '}
            <span>{profile.industry_sector}</span>
          </div>
        )}
        {profile.team_size && (
          <div>
            <span className="text-muted-foreground">Team Size:</span>{' '}
            <span>{profile.team_size} members</span>
          </div>
        )}
        {profile.team_role_description && (
          <div>
            <span className="text-muted-foreground">Role:</span>{' '}
            <span className="line-clamp-2">{profile.team_role_description}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### Step 5: Update Dashboard.tsx

Modify `frontend/src/pages/Dashboard.tsx` to integrate new components:

```typescript
// Add imports at top
import { QuotaCard } from '@/components/dashboard/QuotaCard';
import { RecentActivitiesCard } from '@/components/dashboard/RecentActivitiesCard';
import { TeamProfileCard } from '@/components/dashboard/TeamProfileCard';

// Replace the placeholder cards section with:
{/* Quota & Profile Row */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <QuotaCard
    organizationId={dashboardData.organization?.id || null}
    subscriptionPlan={dashboardData.organization?.subscription_plan || null}
  />
  <TeamProfileCard
    teamId={dashboardData.team?.id || null}
    teamName={dashboardData.team?.name || null}
  />
</div>

{/* Recent Activities */}
<RecentActivitiesCard teamId={dashboardData.team?.id || null} />
```

### Step 6: Enhance QuickActionsCard

Update `frontend/src/components/dashboard/QuickActionsCard.tsx`:

```typescript
// Add "Generate Activities" button for managers/admins
{isManagerOrAdmin && (
  <Link to="/generate">
    <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-1">
      <span className="text-lg">✨</span>
      <span className="text-xs">Generate Activities</span>
    </Button>
  </Link>
)}
```

## Verification

1. **Start development server**: `npm run dev`
2. **Navigate to dashboard**: http://localhost:5173/dashboard
3. **Verify quota card**: Shows usage with color-coded progress
4. **Verify recent activities**: Shows activities or empty state
5. **Verify team profile**: Shows summary or setup prompt
6. **Verify quick actions**: New buttons appear for managers/admins
7. **Test loading states**: Refresh page, observe skeletons
8. **Test error handling**: Temporarily break API, verify retry buttons

## Common Issues

### Quota Not Loading
- Check if organization has a `usage_quotas` record
- Verify RLS policies allow read access
- Check browser console for Supabase errors

### Activities Not Showing
- Check if team has any `customized_activities` records
- Verify team_id is being passed correctly
- Check RLS policies

### Profile Card Empty
- Check if team has a `team_profiles` record
- Verify profile was created during onboarding
