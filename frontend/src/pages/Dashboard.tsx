/**
 * Main dashboard page
 * Shows different content based on whether user has team assignment
 */

import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { WelcomeCard } from '@/components/dashboard/WelcomeCard';
import { TeamInfoCard } from '@/components/dashboard/TeamInfoCard';
import { useUser as useClerkUser } from '@clerk/clerk-react';
import { useUser } from '@/hooks/useUser';

export function Dashboard() {
  const { user: clerkUser } = useClerkUser();
  const { data: dashboardData, isLoading, error } = useUser();

  return (
    <ProtectedRoute>
      <Layout>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold">
              Welcome back, {clerkUser?.firstName || 'there'}!
            </h1>
            <p className="text-muted-foreground">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading your dashboard...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-md">
              <p>Error loading dashboard data. Please try refreshing the page.</p>
            </div>
          )}

          {/* Dashboard Content */}
          {dashboardData && !isLoading && (
            <div className="space-y-6">
              {/* Show WelcomeCard if no team, TeamInfoCard if has team */}
              {!dashboardData.teamMember ? (
                <WelcomeCard />
              ) : (
                <TeamInfoCard data={dashboardData} />
              )}

              {/* Quick Actions Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 border rounded-lg">
                  <h3 className="font-semibold mb-2">Recent Activity</h3>
                  <p className="text-sm text-muted-foreground">
                    No recent activities yet. Check back after your first event!
                  </p>
                </div>
                <div className="p-6 border rounded-lg">
                  <h3 className="font-semibold mb-2">Your Feedback</h3>
                  <p className="text-sm text-muted-foreground">
                    You haven't submitted any feedback yet.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
