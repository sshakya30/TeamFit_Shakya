/**
 * User profile page with tabs for:
 * - Personal Info
 * - Organization Settings (admin only can edit)
 * - Team Management (admin: all teams, manager: own team)
 *
 * Uses backend API to fetch user profile data (bypasses Supabase RLS)
 */

import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser as useClerkUser, useAuth } from '@clerk/clerk-react';
import { useQuery } from '@tanstack/react-query';
import { getMyProfile } from '@/lib/api';
import { OrganizationSettingsTab } from '@/components/profile/OrganizationSettingsTab';
import { TeamManagementTab } from '@/components/profile/TeamManagementTab';

export function Profile() {
  const { user: clerkUser } = useClerkUser();
  const { getToken, isSignedIn } = useAuth();

  // Fetch profile data from backend API (bypasses RLS)
  const { data: profileData, isLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      return getMyProfile(token);
    },
    enabled: isSignedIn,
  });

  const userRole = profileData?.teamMember?.role || null;
  const isAdmin = userRole === 'admin';
  const isManager = userRole === 'manager';
  const canManageTeams = isAdmin || isManager;

  if (isLoading) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading profile...</p>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-muted-foreground">
                Manage your profile, organization, and teams
              </p>
            </div>
            {userRole && (
              <Badge variant={isAdmin ? 'default' : isManager ? 'secondary' : 'outline'}>
                {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
              </Badge>
            )}
          </div>

          <Tabs defaultValue="personal" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="personal">Personal Info</TabsTrigger>
              <TabsTrigger value="organization">Organization</TabsTrigger>
              <TabsTrigger value="teams" disabled={!canManageTeams}>
                Team Management
              </TabsTrigger>
            </TabsList>

            {/* Personal Info Tab */}
            <TabsContent value="personal" className="space-y-6">
              <Card>
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
                      <span className="text-sm font-medium">Organization</span>
                      <span className="text-sm text-muted-foreground">
                        {profileData?.organization?.name || 'Not assigned'}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-sm font-medium">Team</span>
                      <span className="text-sm text-muted-foreground">
                        {profileData?.team?.name || 'Not assigned'}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-sm font-medium">Role</span>
                      <span className="text-sm text-muted-foreground capitalize">
                        {profileData?.teamMember?.role || 'None'}
                      </span>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full" disabled>
                    Edit Profile (Managed by Clerk)
                  </Button>
                </CardContent>
              </Card>

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
            </TabsContent>

            {/* Organization Settings Tab */}
            <TabsContent value="organization">
              <OrganizationSettingsTab
                organization={profileData?.organization || null}
                isAdmin={isAdmin}
              />
            </TabsContent>

            {/* Team Management Tab */}
            <TabsContent value="teams">
              {canManageTeams ? (
                <TeamManagementTab
                  organization={profileData?.organization || null}
                  userRole={userRole}
                  currentTeamId={profileData?.team?.id || null}
                />
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">
                      Only managers and admins can access team management.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
