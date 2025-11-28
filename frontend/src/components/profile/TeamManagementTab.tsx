/**
 * Team Management Tab Component
 * Allows admins to create/edit teams and managers to edit their team
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  listOrganizationTeams,
  createTeamManagement,
  updateTeam,
  updateTeamProfile,
  listTeamMembers,
  updateMemberRole,
  removeTeamMember,
  inviteMember,
  listTeamInvitations,
  cancelInvitation,
  type TeamWithProfile,
  type TeamMemberWithUser,
} from '@/lib/api';
import type { Organization, PendingInvitation, UserRole } from '@/types';

interface TeamManagementTabProps {
  organization: Organization | null;
  userRole: UserRole | null;
  currentTeamId: string | null;
}

const INDUSTRY_OPTIONS = [
  { value: 'technology', label: 'Technology / Software' },
  { value: 'finance', label: 'Finance / Banking' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'retail', label: 'Retail / E-commerce' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'consulting', label: 'Consulting / Professional Services' },
  { value: 'media', label: 'Media / Entertainment' },
  { value: 'nonprofit', label: 'Non-profit' },
  { value: 'government', label: 'Government' },
  { value: 'other', label: 'Other' },
];

const TEAM_SIZE_OPTIONS = [
  { value: '2-5', label: '2-5 members' },
  { value: '6-10', label: '6-10 members' },
  { value: '11-20', label: '11-20 members' },
  { value: '21-50', label: '21-50 members' },
  { value: '50+', label: '50+ members' },
];

export function TeamManagementTab({ organization, userRole, currentTeamId }: TeamManagementTabProps) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = userRole === 'admin';

  // State
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(currentTeamId);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showEditTeam, setShowEditTeam] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [editTeamName, setEditTeamName] = useState('');
  const [editTeamDescription, setEditTeamDescription] = useState('');
  const [profileData, setProfileData] = useState({
    team_role_description: '',
    member_responsibilities: '',
    past_activities_summary: '',
    industry_sector: '',
    team_size: '',
  });
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'manager'>('member');
  const [lastInviteMessage, setLastInviteMessage] = useState<string | null>(null);

  // Queries
  const { data: teamsData, isLoading: loadingTeams } = useQuery({
    queryKey: ['organization-teams', organization?.id],
    queryFn: async () => {
      const token = await getToken();
      if (!token || !organization) throw new Error('Not authenticated');
      return listOrganizationTeams(token, organization.id);
    },
    enabled: !!organization
  });

  const selectedTeam = teamsData?.teams.find(t => t.id === selectedTeamId);

  const { data: membersData, isLoading: loadingMembers } = useQuery({
    queryKey: ['team-members', selectedTeamId],
    queryFn: async () => {
      const token = await getToken();
      if (!token || !selectedTeamId) throw new Error('Not authenticated');
      return listTeamMembers(token, selectedTeamId);
    },
    enabled: !!selectedTeamId
  });

  const { data: invitationsData } = useQuery({
    queryKey: ['team-invitations', selectedTeamId],
    queryFn: async () => {
      const token = await getToken();
      if (!token || !selectedTeamId) throw new Error('Not authenticated');
      return listTeamInvitations(token, selectedTeamId);
    },
    enabled: !!selectedTeamId && (isAdmin || userRole === 'manager')
  });

  // Set initial selected team
  useEffect(() => {
    if (!selectedTeamId && teamsData?.teams.length) {
      setSelectedTeamId(currentTeamId || teamsData.teams[0].id);
    }
  }, [teamsData, currentTeamId, selectedTeamId]);

  // Populate edit forms when team changes
  useEffect(() => {
    if (selectedTeam) {
      setEditTeamName(selectedTeam.name);
      setEditTeamDescription(selectedTeam.description || '');
      if (selectedTeam.profile) {
        setProfileData({
          team_role_description: selectedTeam.profile.team_role_description || '',
          member_responsibilities: selectedTeam.profile.member_responsibilities || '',
          past_activities_summary: selectedTeam.profile.past_activities_summary || '',
          industry_sector: selectedTeam.profile.industry_sector || '',
          team_size: selectedTeam.profile.team_size ? String(selectedTeam.profile.team_size) : '',
        });
      } else {
        setProfileData({
          team_role_description: '',
          member_responsibilities: '',
          past_activities_summary: '',
          industry_sector: '',
          team_size: '',
        });
      }
    }
  }, [selectedTeam]);

  // Mutations
  const createTeamMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      if (!token || !organization) throw new Error('Not authenticated');
      return createTeamManagement(token, {
        organization_id: organization.id,
        name: newTeamName.trim(),
        description: newTeamDescription.trim() || undefined
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['organization-teams'] });
      setShowCreateTeam(false);
      setNewTeamName('');
      setNewTeamDescription('');
      setSelectedTeamId(data.team.id);
      setError(null);
    },
    onError: (err: Error) => setError(err.message)
  });

  const updateTeamMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      if (!token || !selectedTeamId) throw new Error('Not authenticated');
      return updateTeam(token, selectedTeamId, {
        name: editTeamName.trim(),
        description: editTeamDescription.trim() || undefined
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-teams'] });
      queryClient.invalidateQueries({ queryKey: ['user-dashboard'] });
      setShowEditTeam(false);
      setError(null);
    },
    onError: (err: Error) => setError(err.message)
  });

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      if (!token || !selectedTeamId) throw new Error('Not authenticated');
      return updateTeamProfile(token, selectedTeamId, {
        team_role_description: profileData.team_role_description || undefined,
        member_responsibilities: profileData.member_responsibilities || undefined,
        past_activities_summary: profileData.past_activities_summary || undefined,
        industry_sector: profileData.industry_sector || undefined,
        team_size: profileData.team_size || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-teams'] });
      setShowEditProfile(false);
      setError(null);
    },
    onError: (err: Error) => setError(err.message)
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ memberId, newRole }: { memberId: string; newRole: 'member' | 'manager' }) => {
      const token = await getToken();
      if (!token || !selectedTeamId) throw new Error('Not authenticated');
      return updateMemberRole(token, selectedTeamId, memberId, newRole);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      setError(null);
    },
    onError: (err: Error) => setError(err.message)
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const token = await getToken();
      if (!token || !selectedTeamId) throw new Error('Not authenticated');
      return removeTeamMember(token, selectedTeamId, memberId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      queryClient.invalidateQueries({ queryKey: ['organization-teams'] });
      setError(null);
    },
    onError: (err: Error) => setError(err.message)
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      if (!token || !selectedTeamId || !organization) throw new Error('Not authenticated');
      return inviteMember(token, {
        email: inviteEmail.trim(),
        full_name: inviteName.trim() || undefined,
        team_id: selectedTeamId,
        organization_id: organization.id,
        role: inviteRole
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['team-invitations'] });
      setLastInviteMessage(data.invite_message);
      setInviteEmail('');
      setInviteName('');
      setInviteRole('member');
      setError(null);
    },
    onError: (err: Error) => setError(err.message)
  });

  const cancelInviteMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      return cancelInvitation(token, invitationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-invitations'] });
      setError(null);
    },
    onError: (err: Error) => setError(err.message)
  });

  const canEditTeam = isAdmin || (userRole === 'manager' && selectedTeamId === currentTeamId);

  if (!organization) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No organization found</p>
        </CardContent>
      </Card>
    );
  }

  if (loadingTeams) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading teams...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Team Selector */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Teams</CardTitle>
              <CardDescription>
                {isAdmin ? 'Manage all teams in your organization' : 'Manage your team'}
              </CardDescription>
            </div>
            {isAdmin && (
              <Button onClick={() => setShowCreateTeam(true)}>
                Create Team
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {teamsData?.teams && teamsData.teams.length > 0 ? (
            <div className="space-y-4">
              {/* Team selector for admins or display for managers */}
              {isAdmin && teamsData.teams.length > 1 ? (
                <div className="space-y-2">
                  <Label>Select Team</Label>
                  <Select value={selectedTeamId || ''} onValueChange={setSelectedTeamId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a team" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamsData.teams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name} ({team.member_count} members)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-medium">{selectedTeam?.name}</span>
                  <Badge variant="outline">{selectedTeam?.member_count} members</Badge>
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">No teams found</p>
          )}
        </CardContent>
      </Card>

      {/* Selected Team Details */}
      {selectedTeam && (
        <>
          {/* Team Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{selectedTeam.name}</CardTitle>
                  <CardDescription>
                    {selectedTeam.description || 'No description'}
                  </CardDescription>
                </div>
                {canEditTeam && (
                  <Button variant="outline" onClick={() => setShowEditTeam(true)}>
                    Edit Team
                  </Button>
                )}
              </div>
            </CardHeader>
          </Card>

          {/* Team Profile */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Team Profile</CardTitle>
                  <CardDescription>
                    Context used for AI activity customization
                  </CardDescription>
                </div>
                {canEditTeam && (
                  <Button variant="outline" onClick={() => setShowEditProfile(true)}>
                    Edit Profile
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {selectedTeam.profile ? (
                <div className="space-y-3">
                  {selectedTeam.profile.industry_sector && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-sm font-medium">Industry</span>
                      <span className="text-sm text-muted-foreground capitalize">
                        {selectedTeam.profile.industry_sector.replace('_', ' ')}
                      </span>
                    </div>
                  )}
                  {selectedTeam.profile.team_size && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-sm font-medium">Team Size</span>
                      <span className="text-sm text-muted-foreground">
                        {selectedTeam.profile.team_size}+ members
                      </span>
                    </div>
                  )}
                  {selectedTeam.profile.team_role_description && (
                    <div className="py-2 border-b">
                      <span className="text-sm font-medium">What the team does</span>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedTeam.profile.team_role_description}
                      </p>
                    </div>
                  )}
                  {selectedTeam.profile.member_responsibilities && (
                    <div className="py-2 border-b">
                      <span className="text-sm font-medium">Member responsibilities</span>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedTeam.profile.member_responsibilities}
                      </p>
                    </div>
                  )}
                  {selectedTeam.profile.past_activities_summary && (
                    <div className="py-2">
                      <span className="text-sm font-medium">Past activities</span>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedTeam.profile.past_activities_summary}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No profile information yet. {canEditTeam && 'Click "Edit Profile" to add details.'}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Team Members */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>
                    {selectedTeam.member_count} member{selectedTeam.member_count !== 1 ? 's' : ''}
                  </CardDescription>
                </div>
                {canEditTeam && (
                  <Button onClick={() => setShowInvite(true)}>
                    Invite Member
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loadingMembers ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : membersData?.members && membersData.members.length > 0 ? (
                <div className="space-y-3">
                  {membersData.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          {member.user.avatar_url ? (
                            <img
                              src={member.user.avatar_url}
                              alt={member.user.full_name || 'User'}
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <span className="text-sm font-medium">
                              {(member.user.full_name || member.user.email).charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {member.user.full_name || 'No name'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {member.user.email}
                          </p>
                        </div>
                        <Badge
                          variant={member.role === 'admin' ? 'default' : member.role === 'manager' ? 'secondary' : 'outline'}
                        >
                          {member.role}
                        </Badge>
                      </div>

                      {canEditTeam && member.role !== 'admin' && (
                        <div className="flex gap-2">
                          {member.role === 'member' ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateRoleMutation.mutate({ memberId: member.id, newRole: 'manager' })}
                              disabled={updateRoleMutation.isPending}
                            >
                              Promote
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateRoleMutation.mutate({ memberId: member.id, newRole: 'member' })}
                              disabled={updateRoleMutation.isPending}
                            >
                              Demote
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => removeMemberMutation.mutate(member.id)}
                            disabled={removeMemberMutation.isPending}
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No members found</p>
              )}
            </CardContent>
          </Card>

          {/* Pending Invitations */}
          {canEditTeam && invitationsData && invitationsData.invitations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Pending Invitations</CardTitle>
                <CardDescription>
                  {invitationsData.invitations.length} pending invitation{invitationsData.invitations.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {invitationsData.invitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {invitation.full_name || invitation.email}
                        </p>
                        {invitation.full_name && (
                          <p className="text-xs text-muted-foreground">{invitation.email}</p>
                        )}
                        <Badge variant="outline" className="mt-1">{invitation.role}</Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => cancelInviteMutation.mutate(invitation.id)}
                        disabled={cancelInviteMutation.isPending}
                      >
                        Cancel
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Create Team Dialog */}
      <Dialog open={showCreateTeam} onOpenChange={setShowCreateTeam}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Team</DialogTitle>
            <DialogDescription>
              Add a new team to your organization
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-team-name">Team Name</Label>
              <Input
                id="new-team-name"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="e.g., Engineering Team"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-team-desc">Description (optional)</Label>
              <Textarea
                id="new-team-desc"
                value={newTeamDescription}
                onChange={(e) => setNewTeamDescription(e.target.value)}
                placeholder="Brief description of the team"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateTeam(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createTeamMutation.mutate()}
              disabled={!newTeamName.trim() || createTeamMutation.isPending}
            >
              {createTeamMutation.isPending ? 'Creating...' : 'Create Team'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Team Dialog */}
      <Dialog open={showEditTeam} onOpenChange={setShowEditTeam}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
            <DialogDescription>
              Update team name and description
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-team-name">Team Name</Label>
              <Input
                id="edit-team-name"
                value={editTeamName}
                onChange={(e) => setEditTeamName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-team-desc">Description</Label>
              <Textarea
                id="edit-team-desc"
                value={editTeamDescription}
                onChange={(e) => setEditTeamDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditTeam(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => updateTeamMutation.mutate()}
              disabled={!editTeamName.trim() || updateTeamMutation.isPending}
            >
              {updateTeamMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Team Profile</DialogTitle>
            <DialogDescription>
              This information helps personalize activity recommendations
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Industry</Label>
                <Select
                  value={profileData.industry_sector}
                  onValueChange={(v) => setProfileData(p => ({ ...p, industry_sector: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Team Size</Label>
                <Select
                  value={profileData.team_size}
                  onValueChange={(v) => setProfileData(p => ({ ...p, team_size: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEAM_SIZE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>What does your team do?</Label>
              <Textarea
                value={profileData.team_role_description}
                onChange={(e) => setProfileData(p => ({ ...p, team_role_description: e.target.value }))}
                placeholder="e.g., We're a product team focused on building mobile apps..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Team member responsibilities</Label>
              <Textarea
                value={profileData.member_responsibilities}
                onChange={(e) => setProfileData(p => ({ ...p, member_responsibilities: e.target.value }))}
                placeholder="e.g., Developers, designers, product managers..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Past team-building activities</Label>
              <Textarea
                value={profileData.past_activities_summary}
                onChange={(e) => setProfileData(p => ({ ...p, past_activities_summary: e.target.value }))}
                placeholder="e.g., Virtual trivia, escape rooms, coffee chats..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditProfile(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => updateProfileMutation.mutate()}
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Member Dialog */}
      <Dialog open={showInvite} onOpenChange={(open) => {
        setShowInvite(open);
        if (!open) setLastInviteMessage(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an invitation to add someone to {selectedTeam?.name}
            </DialogDescription>
          </DialogHeader>
          {lastInviteMessage ? (
            <div className="space-y-4">
              <Alert>
                <AlertDescription>Invitation created successfully!</AlertDescription>
              </Alert>
              <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Share this invite message:</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(lastInviteMessage);
                    }}
                  >
                    Copy
                  </Button>
                </div>
                <pre className="text-xs whitespace-pre-wrap font-mono bg-background p-3 rounded border">
                  {lastInviteMessage}
                </pre>
              </div>
              <DialogFooter>
                <Button onClick={() => {
                  setLastInviteMessage(null);
                  setShowInvite(false);
                }}>
                  Done
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-email">Email Address</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="teammate@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-name">Name (optional)</Label>
                  <Input
                    id="invite-name"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="Jane Smith"
                  />
                </div>
                {isAdmin && (
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={inviteRole} onValueChange={(v: 'member' | 'manager') => setInviteRole(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowInvite(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => inviteMutation.mutate()}
                  disabled={!inviteEmail.trim() || inviteMutation.isPending}
                >
                  {inviteMutation.isPending ? 'Sending...' : 'Send Invitation'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
