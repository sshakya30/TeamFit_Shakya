/**
 * FastAPI client for TEAMFIT backend
 * Uses native fetch with Clerk JWT authentication
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Request payload for customizing a public activity
 * Sent to POST /api/activities/customize
 */
export interface CustomizeActivityRequest {
  team_id: string;
  organization_id: string;
  public_activity_id: string;
  duration_minutes: 15 | 30 | 45;
  additional_context?: string;
}

/**
 * Customized activity data returned from API
 */
export interface CustomizedActivityData {
  id: string;
  team_id: string;
  organization_id: string;
  title: string;
  description: string | null;
  category: string | null;
  duration_minutes: number | null;
  complexity: string | null;
  required_tools: string[] | null;
  instructions: string | null;
  customization_notes: string | null;
  customization_type: 'public_customized' | 'custom_generated';
  source_public_activity_id: string | null;
  status: 'suggested' | 'saved' | 'scheduled' | 'expired';
  created_at: string | null;
  expires_at: string | null;
}

/**
 * Quota information returned in customization response
 */
export interface QuotaInfo {
  public_used: number;
  public_limit: number;
  custom_used: number;
  custom_limit: number;
}

/**
 * Response from activity customization endpoint
 */
export interface CustomizeActivityResponse {
  success: boolean;
  activity_id: string;
  activity: CustomizedActivityData;
  quotas_remaining: QuotaInfo;
}

/**
 * Request payload for updating activity status
 */
export interface UpdateActivityStatusRequest {
  status: 'suggested' | 'saved' | 'scheduled' | 'expired';
}

/**
 * Customize a public activity for a team using AI
 * @param token - Clerk JWT token
 * @param data - Customization request payload
 * @returns Customized activity response
 */
export async function customizeActivity(
  token: string,
  data: CustomizeActivityRequest
): Promise<CustomizeActivityResponse> {
  const response = await fetch(`${API_URL}/api/activities/customize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Update the status of a customized activity
 * @param token - Clerk JWT token
 * @param activityId - ID of the customized activity
 * @param status - New status
 * @returns Updated activity data
 */
export async function updateActivityStatus(
  token: string,
  activityId: string,
  status: UpdateActivityStatusRequest['status']
): Promise<{ success: boolean; activity: CustomizedActivityData }> {
  const response = await fetch(`${API_URL}/api/activities/${activityId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ status })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

// ============================================================================
// Onboarding API
// ============================================================================

import type {
  OnboardingState,
  CreateOrganizationRequest,
  CreateOrganizationResponse,
  CreateTeamRequest,
  CreateTeamResponse,
  CreateTeamProfileRequest,
  InviteMemberRequest,
  InviteMemberResponse,
  PendingInvitation,
  OnboardingStep,
} from '@/types';

/**
 * Get current user's onboarding status
 */
export async function getOnboardingStatus(token: string): Promise<OnboardingState> {
  const response = await fetch(`${API_URL}/api/onboarding/status`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  const data = await response.json();
  return {
    currentStep: data.current_step as OnboardingStep,
    organizationId: data.organization_id,
    teamId: data.team_id,
    isComplete: data.is_complete,
    userRole: data.user_role
  };
}

/**
 * Create a new organization during onboarding
 */
export async function createOrganization(
  token: string,
  data: CreateOrganizationRequest
): Promise<CreateOrganizationResponse> {
  const response = await fetch(`${API_URL}/api/onboarding/organization`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Create a new team during onboarding
 */
export async function createTeam(
  token: string,
  data: CreateTeamRequest
): Promise<CreateTeamResponse> {
  const response = await fetch(`${API_URL}/api/onboarding/team`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Helper to extract error message from FastAPI response
 * FastAPI validation errors return { detail: [{ msg: "...", loc: [...] }] }
 */
function extractErrorMessage(error: unknown, statusCode: number): string {
  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;
    // Handle FastAPI validation errors (422)
    if (Array.isArray(err.detail)) {
      const messages = err.detail
        .map((d: { msg?: string; loc?: string[] }) => {
          const field = d.loc?.slice(-1)[0] || 'field';
          return `${field}: ${d.msg || 'validation error'}`;
        })
        .join(', ');
      return messages || `Validation error (HTTP ${statusCode})`;
    }
    // Handle standard error response
    if (typeof err.detail === 'string') {
      return err.detail;
    }
  }
  return `Request failed (HTTP ${statusCode})`;
}

/**
 * Create or update team profile during onboarding
 */
export async function createTeamProfile(
  token: string,
  data: CreateTeamProfileRequest
): Promise<{ success: boolean; profile: Record<string, unknown> }> {
  const response = await fetch(`${API_URL}/api/onboarding/team-profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(extractErrorMessage(error, response.status));
  }

  return response.json();
}

/**
 * Invite a member to a team
 */
export async function inviteMember(
  token: string,
  data: InviteMemberRequest
): Promise<InviteMemberResponse> {
  const response = await fetch(`${API_URL}/api/onboarding/invite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Get pending invitations for a team
 */
export async function getPendingInvitations(
  token: string,
  teamId: string
): Promise<PendingInvitation[]> {
  const response = await fetch(`${API_URL}/api/onboarding/invitations/${teamId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Cancel a pending invitation
 */
export async function cancelInvitation(
  token: string,
  invitationId: string
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_URL}/api/onboarding/invitations/${invitationId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Update onboarding step
 */
export async function updateOnboardingStep(
  token: string,
  step: OnboardingStep
): Promise<{ success: boolean; step: string }> {
  const response = await fetch(`${API_URL}/api/onboarding/step`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ step })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Complete onboarding
 */
export async function completeOnboarding(
  token: string
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_URL}/api/onboarding/complete`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

// ============================================================================
// Management API (Post-Onboarding)
// ============================================================================

import type { Organization, Team, TeamMember, TeamProfile, User, UserRole } from '@/types';

/**
 * User profile data returned from /api/manage/me/profile
 */
export interface UserProfileData {
  user: User;
  teamMember: TeamMember | null;
  team: Team | null;
  organization: Organization | null;
  teamMembersCount: number;
  upcomingEventsCount: number;
}

/**
 * Get current user's complete profile via backend API
 * This bypasses Supabase RLS by using the service client on the backend
 */
export async function getMyProfile(token: string): Promise<UserProfileData> {
  const response = await fetch(`${API_URL}/api/manage/me/profile`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(extractErrorMessage(error, response.status));
  }

  return response.json();
}

/**
 * Team with profile and member count
 */
export interface TeamWithProfile extends Team {
  member_count: number;
  profile: TeamProfile | null;
}

/**
 * Team member with user details
 */
export interface TeamMemberWithUser {
  id: string;
  user_id: string;
  role: UserRole;
  joined_at: string | null;
  user: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

/**
 * Get organization details
 */
export async function getOrganization(
  token: string,
  organizationId: string
): Promise<{ organization: Organization }> {
  const response = await fetch(`${API_URL}/api/manage/organization/${organizationId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(extractErrorMessage(error, response.status));
  }

  return response.json();
}

/**
 * Update organization details
 */
export async function updateOrganization(
  token: string,
  organizationId: string,
  data: { name: string }
): Promise<{ success: boolean; organization: Organization }> {
  const response = await fetch(`${API_URL}/api/manage/organization/${organizationId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(extractErrorMessage(error, response.status));
  }

  return response.json();
}

/**
 * List all teams in an organization
 */
export async function listOrganizationTeams(
  token: string,
  organizationId: string
): Promise<{ teams: TeamWithProfile[]; is_admin: boolean }> {
  const response = await fetch(`${API_URL}/api/manage/organization/${organizationId}/teams`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(extractErrorMessage(error, response.status));
  }

  return response.json();
}

/**
 * Create a new team (post-onboarding)
 */
export async function createTeamManagement(
  token: string,
  data: { organization_id: string; name: string; description?: string }
): Promise<{ success: boolean; team: Team }> {
  const response = await fetch(`${API_URL}/api/manage/teams`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(extractErrorMessage(error, response.status));
  }

  return response.json();
}

/**
 * Get team details with profile
 */
export async function getTeam(
  token: string,
  teamId: string
): Promise<{ team: TeamWithProfile; can_edit: boolean }> {
  const response = await fetch(`${API_URL}/api/manage/teams/${teamId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(extractErrorMessage(error, response.status));
  }

  return response.json();
}

/**
 * Update team details
 */
export async function updateTeam(
  token: string,
  teamId: string,
  data: { name: string; description?: string }
): Promise<{ success: boolean; team: Team }> {
  const response = await fetch(`${API_URL}/api/manage/teams/${teamId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(extractErrorMessage(error, response.status));
  }

  return response.json();
}

/**
 * Delete a team
 */
export async function deleteTeam(
  token: string,
  teamId: string
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_URL}/api/manage/teams/${teamId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(extractErrorMessage(error, response.status));
  }

  return response.json();
}

/**
 * Update team profile
 */
export async function updateTeamProfile(
  token: string,
  teamId: string,
  data: {
    team_role_description?: string;
    member_responsibilities?: string;
    past_activities_summary?: string;
    industry_sector?: string;
    team_size?: string;
  }
): Promise<{ success: boolean; profile: TeamProfile }> {
  const response = await fetch(`${API_URL}/api/manage/teams/${teamId}/profile`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(extractErrorMessage(error, response.status));
  }

  return response.json();
}

/**
 * List team members
 */
export async function listTeamMembers(
  token: string,
  teamId: string
): Promise<{ members: TeamMemberWithUser[]; can_manage: boolean }> {
  const response = await fetch(`${API_URL}/api/manage/teams/${teamId}/members`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(extractErrorMessage(error, response.status));
  }

  return response.json();
}

/**
 * Update team member role
 */
export async function updateMemberRole(
  token: string,
  teamId: string,
  memberId: string,
  newRole: 'member' | 'manager'
): Promise<{ success: boolean; member: Record<string, unknown> }> {
  const response = await fetch(`${API_URL}/api/manage/teams/${teamId}/members/${memberId}/role`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ new_role: newRole })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(extractErrorMessage(error, response.status));
  }

  return response.json();
}

/**
 * Remove team member
 */
export async function removeTeamMember(
  token: string,
  teamId: string,
  memberId: string
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_URL}/api/manage/teams/${teamId}/members/${memberId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(extractErrorMessage(error, response.status));
  }

  return response.json();
}

/**
 * List team invitations
 */
export async function listTeamInvitations(
  token: string,
  teamId: string
): Promise<{ invitations: PendingInvitation[]; can_manage: boolean }> {
  const response = await fetch(`${API_URL}/api/manage/teams/${teamId}/invitations`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(extractErrorMessage(error, response.status));
  }

  return response.json();
}
