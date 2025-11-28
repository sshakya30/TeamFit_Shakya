/**
 * Team Management page
 * Allows managers and admins to manage their team
 */

import { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUser } from '@/hooks/useUser';
import { useInviteMember } from '@/hooks/useInviteMember';
import { usePendingInvitations } from '@/hooks/usePendingInvitations';
import { useCancelInvitation } from '@/hooks/useCancelInvitation';
import type { UserRole } from '@/types';

export function TeamManagement() {
  const { teamId } = useParams<{ teamId: string }>();
  const { data: dashboardData, isLoading: isLoadingUser } = useUser();

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<'manager' | 'member'>('member');
  const [lastInviteMessage, setLastInviteMessage] = useState<string | null>(null);
  const [showCopied, setShowCopied] = useState(false);

  const inviteMember = useInviteMember();
  const { data: pendingInvitations, isLoading: loadingInvitations } = usePendingInvitations(teamId || null);
  const cancelInvitation = useCancelInvitation();

  // Check if user has permission to manage this team
  const userRole = dashboardData?.teamMember?.role;
  const isManagerOrAdmin = userRole === 'manager' || userRole === 'admin';
  const isAdmin = userRole === 'admin';
  const userTeamId = dashboardData?.team?.id;

  // Redirect if not authorized
  if (!isLoadingUser && (!isManagerOrAdmin || (teamId && userTeamId !== teamId))) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !teamId || !dashboardData?.organization?.id) return;

    try {
      const result = await inviteMember.mutateAsync({
        team_id: teamId,
        organization_id: dashboardData.organization.id,
        email: email.trim(),
        full_name: fullName.trim() || undefined,
        role: selectedRole
      });

      if (result.success) {
        setLastInviteMessage(result.invite_message);
        setEmail('');
        setFullName('');
        setSelectedRole('member');
      }
    } catch (error) {
      console.error('Failed to invite member:', error);
    }
  };

  const handleCopyMessage = async () => {
    if (lastInviteMessage) {
      await navigator.clipboard.writeText(lastInviteMessage);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!teamId) return;
    try {
      await cancelInvitation.mutateAsync({ invitationId, teamId });
    } catch (error) {
      console.error('Failed to cancel invitation:', error);
    }
  };

  if (isLoadingUser) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Team Management</h1>
          <p className="text-muted-foreground">
            {dashboardData?.team?.name} &bull; {dashboardData?.organization?.name}
          </p>
        </div>

        {/* Team Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold">{dashboardData?.teamMembersCount || 0}</p>
              <p className="text-sm text-muted-foreground">Team Members</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold">{pendingInvitations?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Pending Invites</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold">{dashboardData?.upcomingEventsCount || 0}</p>
              <p className="text-sm text-muted-foreground">Upcoming Events</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Badge variant={isAdmin ? 'default' : 'secondary'} className="text-sm">
                {userRole?.charAt(0).toUpperCase()}{userRole?.slice(1)}
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">Your Role</p>
            </CardContent>
          </Card>
        </div>

        {/* Invite New Member */}
        <Card>
          <CardHeader>
            <CardTitle>Invite Team Member</CardTitle>
            <CardDescription>
              Send an invitation to add someone to your team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="invite-email">Email Address</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="teammate@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={inviteMember.isPending}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invite-name">
                    Name <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="invite-name"
                    type="text"
                    placeholder="Jane Smith"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={inviteMember.isPending}
                  />
                </div>
              </div>

              {/* Role selection - only admins can invite managers */}
              {isAdmin && (
                <div className="space-y-2">
                  <Label>Role</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="role"
                        value="member"
                        checked={selectedRole === 'member'}
                        onChange={() => setSelectedRole('member')}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Member</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="role"
                        value="manager"
                        checked={selectedRole === 'manager'}
                        onChange={() => setSelectedRole('manager')}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Manager</span>
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Managers can invite members and manage team settings.
                  </p>
                </div>
              )}

              {inviteMember.error && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {inviteMember.error.message}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={!email.trim() || inviteMember.isPending}
              >
                {inviteMember.isPending ? 'Sending...' : 'Send Invitation'}
              </Button>
            </form>

            {/* Copyable invite message */}
            {lastInviteMessage && (
              <div className="mt-6 p-4 bg-muted/50 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Share this invite message:</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyMessage}
                  >
                    {showCopied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                <pre className="text-xs whitespace-pre-wrap font-mono bg-background p-3 rounded border">
                  {lastInviteMessage}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Invitations */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations</CardTitle>
            <CardDescription>
              Invitations waiting to be accepted
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingInvitations ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : pendingInvitations && pendingInvitations.length > 0 ? (
              <div className="space-y-3">
                {pendingInvitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-sm font-medium">
                          {invitation.full_name || invitation.email}
                        </p>
                        {invitation.full_name && (
                          <p className="text-xs text-muted-foreground">
                            {invitation.email}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {invitation.role}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancelInvitation(invitation.id)}
                      disabled={cancelInvitation.isPending}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      Cancel
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No pending invitations
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
