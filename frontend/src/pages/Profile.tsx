/**
 * User profile page
 * Shows user information from Clerk and Supabase
 */

import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUser as useClerkUser } from '@clerk/clerk-react';
import { useUser } from '@/hooks/useUser';

export function Profile() {
  const { user: clerkUser } = useClerkUser();
  const { data: dashboardData } = useUser();

  return (
    <ProtectedRoute>
      <Layout>
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Your Profile</h1>

          {/* User Info Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Your TEAMFIT profile details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <img
                  src={clerkUser?.imageUrl}
                  alt={clerkUser?.fullName || 'User'}
                  className="w-16 h-16 rounded-full"
                />
                <div>
                  <p className="font-semibold text-lg">
                    {clerkUser?.fullName || 'No name set'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {clerkUser?.emailAddresses[0]?.emailAddress}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm font-medium">Member Since</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(clerkUser?.createdAt || '').toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm font-medium">Team</span>
                  <span className="text-sm text-muted-foreground">
                    {dashboardData?.team?.name || 'Not assigned'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm font-medium">Role</span>
                  <span className="text-sm text-muted-foreground capitalize">
                    {dashboardData?.teamMember?.role || 'None'}
                  </span>
                </div>
              </div>

              <Button variant="outline" className="w-full" disabled>
                Edit Profile (Coming Soon)
              </Button>
            </CardContent>
          </Card>

          {/* Account Settings Card */}
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your account preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Account settings and preferences will be available in a future update.
              </p>
              <Button variant="outline" disabled>
                Manage Settings (Coming Soon)
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
