/**
 * Main dashboard page
 * Shows different content based on user role (admin, manager, member)
 * Includes quota usage, recent activities, team profile, and quick actions
 */

import { Layout } from '@/components/layout/Layout';
import { TeamInfoCard } from '@/components/dashboard/TeamInfoCard';
import { QuickActionsCard } from '@/components/dashboard/QuickActionsCard';
import { QuotaCard } from '@/components/dashboard/QuotaCard';
import { RecentActivitiesCard } from '@/components/dashboard/RecentActivitiesCard';
import { TeamProfileCard } from '@/components/dashboard/TeamProfileCard';
import { useUser as useClerkUser } from '@clerk/clerk-react';
import { useUser } from '@/hooks/useUser';
import { Badge } from '@/components/ui/badge';

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

            {/* Quota and Team Profile Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <QuotaCard
                organizationId={dashboardData.organization?.id || null}
                subscriptionPlan={dashboardData.organization?.subscription_plan || 'free'}
              />
              <TeamProfileCard
                teamId={dashboardData.team?.id || null}
                teamName={dashboardData.team?.name || 'Your Team'}
              />
            </div>

            {/* Role-based Quick Actions */}
            <QuickActionsCard
              isManagerOrAdmin={isManagerOrAdmin}
              isAdmin={isAdmin}
              teamId={dashboardData.team?.id || null}
              organizationId={dashboardData.organization?.id || null}
              subscriptionPlan={dashboardData.organization?.subscription_plan}
            />

            {/* Recent Activities - Full Width */}
            <RecentActivitiesCard teamId={dashboardData.team?.id || null} />
          </div>
        )}
      </div>
    </Layout>
  );
}
