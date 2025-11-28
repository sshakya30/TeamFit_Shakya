/**
 * Main dashboard page
 * Shows different content based on user role (admin, manager, member)
 */

import { Layout } from '@/components/layout/Layout';
import { TeamInfoCard } from '@/components/dashboard/TeamInfoCard';
import { QuickActionsCard } from '@/components/dashboard/QuickActionsCard';
import { useUser as useClerkUser } from '@clerk/clerk-react';
import { useUser } from '@/hooks/useUser';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function Dashboard() {
  const { user: clerkUser } = useClerkUser();
  const { data: dashboardData, isLoading, error } = useUser();

  const userRole = dashboardData?.teamMember?.role || null;
  const isManagerOrAdmin = userRole === 'manager' || userRole === 'admin';
  const isAdmin = userRole === 'admin';

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">
                Welcome back, {clerkUser?.firstName || 'there'}!
              </h1>
              {userRole && (
                <Badge variant={isAdmin ? 'default' : isManagerOrAdmin ? 'secondary' : 'outline'}>
                  {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
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
            {/* Team Info */}
            {dashboardData.teamMember && (
              <TeamInfoCard data={dashboardData} />
            )}

            {/* Role-based Quick Actions */}
            <QuickActionsCard
              isManagerOrAdmin={isManagerOrAdmin}
              isAdmin={isAdmin}
              teamId={dashboardData.team?.id || null}
              organizationId={dashboardData.organization?.id || null}
            />

            {/* Activity Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    No recent activities yet. Check back after your first event!
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Your Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    You haven't submitted any feedback yet.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
