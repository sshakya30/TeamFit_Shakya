/**
 * TypeScript types for TEAMFIT application
 * These match the Supabase database schema
 */

export type UserRole = 'member' | 'manager' | 'admin';

export interface User {
  id: string;
  clerk_user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  settings: Record<string, any>;
  subscription_plan: string;
  subscription_status: string;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  organization_id: string;
  role: UserRole;
  joined_at: string;
}

// Extended types for UI
export interface UserWithTeam extends User {
  team_member?: TeamMember;
  team?: Team;
  organization?: Organization;
}

export interface DashboardData {
  user: User;
  teamMember: TeamMember | null;
  team: Team | null;
  organization: Organization | null;
  teamMembersCount: number;
  upcomingEventsCount: number;
}

// Activity Library types
export interface FilterState {
  category: string | null;
  duration: number | null;
  complexity: string | null;
}

export const CATEGORY_OPTIONS = [
  { value: 'tech_it', label: 'Tech/IT' },
  { value: 'finance_accounting', label: 'Finance' },
  { value: 'marketing_creative', label: 'Marketing' },
  { value: 'business_services', label: 'Business Services' },
  { value: 'customer_service', label: 'Customer Service' },
] as const;

export const DURATION_OPTIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
] as const;

export const COMPLEXITY_OPTIONS = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
] as const;

export const CATEGORY_LABELS: Record<string, string> = {
  tech_it: 'Tech/IT',
  finance_accounting: 'Finance',
  marketing_creative: 'Marketing',
  business_services: 'Business Services',
  customer_service: 'Customer Service',
};

export const COMPLEXITY_LABELS: Record<string, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

// ============================================================================
// Activity Customization Types
// ============================================================================

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
 * Response from activity customization endpoint
 */
export interface CustomizeActivityResponse {
  success: boolean;
  activity_id: string;
  activity: CustomizedActivity;
  quotas_remaining: QuotaInfo;
}

/**
 * Customized activity data returned from API
 */
export interface CustomizedActivity {
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
 * Team profile for AI context display
 * Matches team_profiles table schema
 */
export interface TeamProfile {
  id: string;
  team_id: string;
  organization_id: string;
  team_role_description: string | null;
  member_responsibilities: string | null;
  past_activities_summary: string | null;
  industry_sector: string | null;
  team_size: number | null;
  preferences: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
}

/**
 * Team membership with related team and org data
 * Used for team selector dropdown
 */
export interface TeamMembershipWithDetails {
  id: string;
  team_id: string;
  user_id: string;
  organization_id: string;
  role: 'member' | 'manager' | 'admin';
  joined_at: string | null;
  teams: Team;
  organizations: Organization;
}

/**
 * Usage quota for an organization
 * Matches usage_quotas table schema
 */
export interface UsageQuota {
  id: string;
  organization_id: string;
  public_customizations_used: number | null;
  public_customizations_limit: number | null;
  custom_generations_used: number | null;
  custom_generations_limit: number | null;
  trust_score: number | null;
  requires_verification: boolean | null;
  quota_period_start: string | null;
  quota_period_end: string | null;
}

// ============================================================================
// Component Props Types
// ============================================================================

/**
 * Props for DurationSelector component
 */
export interface DurationSelectorProps {
  value: 15 | 30 | 45;
  onChange: (duration: 15 | 30 | 45) => void;
  disabled?: boolean;
}

/**
 * Props for TeamSelector component
 */
export interface TeamSelectorProps {
  teams: TeamMembershipWithDetails[];
  selectedTeamId: string | null;
  onSelect: (teamId: string) => void;
  disabled?: boolean;
}

/**
 * Props for TeamProfilePreview component
 */
export interface TeamProfilePreviewProps {
  profile: TeamProfile | null;
  isLoading: boolean;
  teamName: string;
  onSetupProfile?: () => void;
}

/**
 * Props for CustomizationResult component
 */
export interface CustomizationResultProps {
  activity: CustomizedActivity;
  quotas: QuotaInfo;
  onSave: () => void;
  onDiscard: () => void;
  isSaving?: boolean;
}

/**
 * Props for QuotaDisplay component
 */
export interface QuotaDisplayProps {
  used: number;
  limit: number;
  type?: 'public' | 'custom';
}

// ============================================================================
// Hook Return Types
// ============================================================================

/**
 * Return type for useCustomizeActivity hook
 */
export interface UseCustomizeActivityReturn {
  mutate: (request: CustomizeActivityRequest) => void;
  mutateAsync: (request: CustomizeActivityRequest) => Promise<CustomizeActivityResponse>;
  data: CustomizeActivityResponse | undefined;
  error: Error | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  reset: () => void;
}

/**
 * Return type for useTeamProfile hook
 */
export interface UseTeamProfileReturn {
  data: TeamProfile | null | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

/**
 * Return type for useUserTeams hook
 */
export interface UseUserTeamsReturn {
  data: TeamMembershipWithDetails[] | undefined;
  isLoading: boolean;
  isError: boolean;
}

/**
 * Return type for useQuota hook
 */
export interface UseQuotaReturn {
  data: UsageQuota | null | undefined;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

// ============================================================================
// Page State Types
// ============================================================================

/**
 * Local state for CustomizeActivity page
 */
export interface CustomizePageState {
  selectedTeamId: string | null;
  selectedDuration: 15 | 30 | 45;
  step: 'setup' | 'processing' | 'result' | 'error';
  errorType: 'timeout' | 'quota' | 'network' | 'profile' | 'server' | null;
}

// ============================================================================
// Onboarding Types
// ============================================================================

/**
 * Onboarding step names
 */
export type OnboardingStep =
  | 'welcome'
  | 'create_organization'
  | 'create_team'
  | 'delegate_manager'
  | 'team_profile'
  | 'invite_members'
  | 'complete';

/**
 * Onboarding state from API
 */
export interface OnboardingState {
  currentStep: OnboardingStep;
  organizationId: string | null;
  teamId: string | null;
  isComplete: boolean;
  userRole: UserRole | null;
}

/**
 * Invitation status
 */
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled';

/**
 * Pending invitation record
 */
export interface PendingInvitation {
  id: string;
  email: string;
  full_name: string | null;
  organization_id: string;
  team_id: string;
  role: UserRole;
  invited_by: string;
  status: InvitationStatus;
  expires_at: string;
  created_at: string;
  accepted_at: string | null;
}

/**
 * Request to create organization
 */
export interface CreateOrganizationRequest {
  name: string;
}

/**
 * Response from create organization
 */
export interface CreateOrganizationResponse {
  success: boolean;
  organization: Organization;
}

/**
 * Request to create team
 */
export interface CreateTeamRequest {
  organization_id: string;
  name: string;
  description?: string;
}

/**
 * Response from create team
 */
export interface CreateTeamResponse {
  success: boolean;
  team: Team;
}

/**
 * Request to create/update team profile during onboarding
 */
export interface CreateTeamProfileRequest {
  team_id: string;
  organization_id: string;
  team_role_description?: string;
  member_responsibilities?: string;
  past_activities_summary?: string;
  industry_sector?: string;
  team_size?: string; // String like "2-5", "6-10", etc.
}

/**
 * Request to invite a member
 */
export interface InviteMemberRequest {
  email: string;
  full_name?: string;
  team_id: string;
  organization_id: string;
  role: 'manager' | 'member';
}

/**
 * Response from invite member
 */
export interface InviteMemberResponse {
  success: boolean;
  invitation: PendingInvitation;
  invite_message: string;
}

// ============================================================================
// Onboarding Component Props
// ============================================================================

export interface OnboardingWizardProps {
  initialStep?: OnboardingStep;
}

export interface OrganizationFormData {
  name: string;
}

export interface TeamFormData {
  name: string;
  description: string;
}

export interface TeamProfileFormData {
  team_role_description: string;
  member_responsibilities: string;
  past_activities_summary: string;
  industry_sector: string;
  team_size: string | null;
}

export interface InvitationFormData {
  email: string;
  full_name: string;
  role: 'manager' | 'member';
}

// ============================================================================
// Materials Types
// ============================================================================

/**
 * Uploaded material file record
 * Maps to `uploaded_materials` table in Supabase
 */
export interface Material {
  id: string;
  team_id: string;
  organization_id: string;
  file_name: string;
  file_type: 'pdf' | 'docx' | 'pptx' | 'xlsx';
  file_size_bytes: number;
  file_url: string;
  storage_path: string | null;
  extracted_text: string | null;
  content_summary: string | null;
  uploaded_by: string;
  created_at: string | null;
}

/**
 * Response from POST /api/materials/upload
 */
export interface UploadMaterialResponse {
  material_id: string;
  file_name: string;
  content_summary: string;
  storage_url: string;
  file_size_bytes: number;
}

/**
 * Allowed file types with MIME mappings
 */
export const ALLOWED_FILE_TYPES: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
};

/**
 * Maximum file size in bytes (10MB)
 */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/**
 * File type color mapping for UI display
 */
export const FILE_TYPE_COLORS: Record<string, string> = {
  pdf: 'text-red-500',
  docx: 'text-blue-500',
  pptx: 'text-orange-500',
  xlsx: 'text-green-500',
};

// ============================================================================
// Custom Generation Types
// ============================================================================

/**
 * Request payload for generating custom activities
 * Sent to POST /api/activities/generate-custom
 */
export interface GenerateCustomActivitiesRequest {
  team_id: string;
  organization_id: string;
  requirements: string;
  material_ids?: string[];
}

/**
 * Response from custom generation endpoint
 * Returns job_id for status polling
 */
export interface GenerateCustomActivitiesResponse {
  success: boolean;
  job_id: string;
  status: 'pending' | 'processing';
  message: string;
}

/**
 * Job status response from GET /api/jobs/{job_id}
 */
export interface JobStatusResponse {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  job: CustomizationJob;
  activities?: CustomizedActivity[];
  error?: string;
}

/**
 * Customization job record from database
 */
export interface CustomizationJob {
  id: string;
  team_id: string;
  organization_id: string;
  job_type: 'custom_generation' | 'public_customization';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_by: string;
  input_context: {
    team_profile: TeamProfile;
    requirements: string;
    materials_count: number;
  };
  result_data?: {
    activity_ids: string[];
  };
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

/**
 * Page state for GenerateActivity page
 * Discriminated union for type-safe state handling
 */
export type GenerationPageState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'polling'; jobId: string; startTime: number }
  | { status: 'completed'; jobId: string; activities: CustomizedActivity[] }
  | { status: 'error'; errorType: GenerationErrorType; message: string };

/**
 * Error types for generation failures
 */
export type GenerationErrorType = 'timeout' | 'failed' | 'network' | 'quota' | 'validation';

/**
 * Form state for requirements and material selection
 */
export interface GenerationFormState {
  requirements: string;
  selectedMaterialIds: string[];
}

// ============================================================================
// Custom Generation Component Props Types
// ============================================================================

/**
 * Props for RequirementsSection component
 */
export interface RequirementsSectionProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
}

/**
 * Props for MaterialsSection component
 */
export interface MaterialsSectionProps {
  teamId: string;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  disabled?: boolean;
}

/**
 * Props for GenerationProgress component
 */
export interface GenerationProgressProps {
  status: 'pending' | 'processing';
  startTime: number;
  onCancel?: () => void;
}

/**
 * Props for GeneratedActivityCard component
 */
export interface GeneratedActivityCardProps {
  activity: CustomizedActivity;
  onSave: () => void;
  isSaving?: boolean;
  isSaved?: boolean;
}

/**
 * Props for GenerationResults component
 */
export interface GenerationResultsProps {
  activities: CustomizedActivity[];
  onSaveActivity: (activityId: string) => Promise<void>;
  onGenerateMore: () => void;
  savedActivityIds: Set<string>;
}

// ============================================================================
// Custom Generation Hook Return Types
// ============================================================================

/**
 * Return type for useGenerateActivities hook
 */
export interface UseGenerateActivitiesReturn {
  mutate: (request: GenerateCustomActivitiesRequest) => void;
  mutateAsync: (request: GenerateCustomActivitiesRequest) => Promise<GenerateCustomActivitiesResponse>;
  data: GenerateCustomActivitiesResponse | undefined;
  error: Error | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  reset: () => void;
}

/**
 * Return type for useJobStatus hook
 */
export interface UseJobStatusReturn {
  data: JobStatusResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isPolling: boolean;
}
