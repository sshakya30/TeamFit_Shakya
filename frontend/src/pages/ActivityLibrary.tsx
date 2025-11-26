/**
 * Activity Library page
 * Displays all public activities in a responsive grid with filtering
 */

import { useState, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { ActivityGrid, ActivityFilters, ActivityDetailModal, EmptyState } from '@/components/activities';
import { Skeleton } from '@/components/ui/skeleton';
import { useActivities, type PublicActivity } from '@/hooks/useActivities';
import type { FilterState } from '@/types';

function ActivityLibrarySkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="border rounded-lg p-4">
          <Skeleton className="h-6 w-3/4 mb-3" />
          <div className="flex gap-2 mb-3">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-4/5 mb-4" />
          <div className="flex gap-2">
            <Skeleton className="h-9 flex-1" />
            <Skeleton className="h-9 flex-1" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ActivityLibrary() {
  const { data: activities, isLoading, error, refetch } = useActivities();

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    category: null,
    duration: null,
    complexity: null,
  });

  // Selected activity for modal
  const [selectedActivity, setSelectedActivity] = useState<PublicActivity | null>(null);

  // Client-side filtering with useMemo
  const filteredActivities = useMemo(() => {
    if (!activities) return [];
    return activities.filter((activity) => {
      const matchesCategory = !filters.category || activity.category === filters.category;
      const matchesDuration = !filters.duration || activity.duration_minutes === filters.duration;
      const matchesComplexity = !filters.complexity || activity.complexity === filters.complexity;
      return matchesCategory && matchesDuration && matchesComplexity;
    });
  }, [activities, filters.category, filters.duration, filters.complexity]);

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({ category: null, duration: null, complexity: null });
  };

  const handleViewDetails = (activity: PublicActivity) => {
    setSelectedActivity(activity);
  };

  const handleCloseModal = () => {
    setSelectedActivity(null);
  };

  const hasActiveFilters = filters.category || filters.duration || filters.complexity;

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold">Activity Library</h1>
            <p className="text-muted-foreground">
              Browse and customize team-building activities for your team
            </p>
          </div>

          {/* Filters */}
          <ActivityFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            resultCount={filteredActivities.length}
          />

          {/* Loading State */}
          {isLoading && <ActivityLibrarySkeleton />}

          {/* Error State */}
          {error && !isLoading && (
            <EmptyState
              type="error"
              onRetry={() => refetch()}
              errorMessage={error.message}
            />
          )}

          {/* No activities available */}
          {!isLoading && !error && activities?.length === 0 && (
            <EmptyState type="no-activities" />
          )}

          {/* No results after filtering */}
          {!isLoading && !error && activities && activities.length > 0 && filteredActivities.length === 0 && hasActiveFilters && (
            <EmptyState type="no-results" onClearFilters={handleClearFilters} />
          )}

          {/* Activities Grid */}
          {!isLoading && !error && filteredActivities.length > 0 && (
            <ActivityGrid
              activities={filteredActivities}
              onViewDetails={handleViewDetails}
            />
          )}

          {/* Activity Detail Modal */}
          <ActivityDetailModal
            activity={selectedActivity}
            open={!!selectedActivity}
            onClose={handleCloseModal}
          />
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
