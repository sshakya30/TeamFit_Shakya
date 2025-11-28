# Data Model: Activity Customization Flow

**Feature**: 002-activity-customization
**Date**: 2025-11-27

## Overview

This document defines TypeScript interfaces for the Activity Customization feature. All types align with existing database schema (`database.types.ts`) and backend API contracts.

## Frontend Types

### API Request/Response Types

```typescript
// src/types/index.ts (additions)

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
```

### Component Props Types

```typescript
// Component prop interfaces

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
```

### Hook Return Types

```typescript
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
```

### Page State Type

```typescript
/**
 * Local state for CustomizeActivity page
 */
export interface CustomizePageState {
  selectedTeamId: string | null;
  selectedDuration: 15 | 30 | 45;
  step: 'setup' | 'processing' | 'result' | 'error';
  errorType: 'timeout' | 'quota' | 'network' | 'profile' | 'server' | null;
}
```

## Entity Relationships

```text
┌─────────────────┐     ┌──────────────────┐
│ public_activity │────▶│ customized_      │
│                 │     │ activity         │
└─────────────────┘     └──────────────────┘
                              │
                              │ belongs_to
                              ▼
┌─────────────────┐     ┌──────────────────┐
│ team_profile    │────▶│     team         │
│ (AI context)    │     │                  │
└─────────────────┘     └──────────────────┘
                              │
                              │ has_many
                              ▼
┌─────────────────┐     ┌──────────────────┐
│ organization    │◀────│ team_members     │
│                 │     │ (user access)    │
└─────────────────┘     └──────────────────┘
        │                     │
        │ has_one             │ belongs_to
        ▼                     ▼
┌─────────────────┐     ┌──────────────────┐
│ usage_quotas    │     │     user         │
│ (limits)        │     │                  │
└─────────────────┘     └──────────────────┘
```

## Data Flow

```text
1. Page Load
   ├─▶ useUserTeams() ──▶ team_members + teams + organizations
   └─▶ useActivities() ──▶ public_activities (for activityId)

2. Team Selection (if multi-team)
   ├─▶ useTeamProfile(teamId) ──▶ team_profiles
   └─▶ useQuota(organizationId) ──▶ usage_quotas

3. Customization Submit
   └─▶ useCustomizeActivity.mutate() ──▶ POST /api/activities/customize
       ├─▶ Backend validates quota
       ├─▶ Backend fetches team_profile
       ├─▶ Backend calls AI service
       ├─▶ Backend saves to customized_activities
       └─▶ Returns CustomizeActivityResponse

4. Save Result
   └─▶ Status update via backend PATCH /api/activities/{id}/status
```

## Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| `duration_minutes` | Must be 15, 30, or 45 | "Invalid duration selected" |
| `team_id` | Must be UUID from user's teams | "Invalid team selected" |
| `organization_id` | Must match team's organization | "Organization mismatch" |
| `public_activity_id` | Must exist in public_activities | "Activity not found" |

## State Transitions

### Page Step State

```text
┌─────────┐    team selected    ┌────────────┐
│  setup  │───────────────────▶│  setup     │ (with profile)
└─────────┘                     └────────────┘
     │                                │
     │ submit                         │ submit
     ▼                                ▼
┌────────────┐                  ┌────────────┐
│ processing │                  │ processing │
└────────────┘                  └────────────┘
     │                                │
     ├─── success ───▶ ┌────────┐     │
     │                 │ result │◀────┘
     │                 └────────┘
     │                      │
     │                      ├── save ──▶ redirect to activities
     │                      └── discard ──▶ redirect to library
     │
     └─── error ───▶ ┌────────┐
                     │ error  │──▶ retry ──▶ setup
                     └────────┘
```

### Customized Activity Status

```text
┌───────────┐    save action    ┌─────────┐
│ suggested │──────────────────▶│  saved  │
└───────────┘                   └─────────┘
     │                               │
     │ 30 days expire                │ schedule event
     ▼                               ▼
┌───────────┐                  ┌───────────┐
│  expired  │                  │ scheduled │
└───────────┘                  └───────────┘
```

## Notes

- All database types are already defined in `frontend/src/types/database.types.ts`
- New types extend existing patterns; no conflicts with current implementation
- Backend API contracts are defined in `backend/app/models/schemas.py`
- TypeScript strict mode enforces type safety throughout
