# Data Model: Dashboard Enhancements

**Feature**: 005-dashboard-enhancements
**Date**: 2025-11-30

## Overview

This document describes the data models used by the Dashboard Enhancements feature. All types leverage existing definitions from `frontend/src/types/index.ts` - no new database tables or backend changes are required.

## Entities Used

### UsageQuota (Existing)

**Source**: `usage_quotas` table via `useQuota` hook
**TypeScript Interface**: Already defined in `types/index.ts`

```typescript
interface UsageQuota {
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

**Dashboard Usage**:
- `public_customizations_used` / `public_customizations_limit` → QuotaCard progress bar
- `custom_generations_used` / `custom_generations_limit` → QuotaCard progress bar (paid only)
- `quota_period_end` → Display reset date when quota exhausted

---

### CustomizedActivity (Existing)

**Source**: `customized_activities` table via new `useRecentActivities` hook
**TypeScript Interface**: Already defined in `types/index.ts`

```typescript
interface CustomizedActivity {
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
```

**Dashboard Usage** (subset for RecentActivitiesCard):
- `id` → Navigation key
- `title` → Display text
- `customization_type` → Type badge
- `status` → Status badge
- `created_at` → Relative date display

---

### TeamProfile (Existing)

**Source**: `team_profiles` table via `useTeamProfile` hook
**TypeScript Interface**: Already defined in `types/index.ts`

```typescript
interface TeamProfile {
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
```

**Dashboard Usage** (subset for TeamProfileCard):
- `industry_sector` → Summary display
- `team_size` → Summary display
- `team_role_description` → Truncated preview

---

### DashboardData (Existing)

**Source**: Backend API via `useUser` hook
**TypeScript Interface**: Already defined in `types/index.ts`

```typescript
interface DashboardData {
  user: User;
  teamMember: TeamMember | null;
  team: Team | null;
  organization: Organization | null;
  teamMembersCount: number;
  upcomingEventsCount: number;
}
```

**Dashboard Usage**:
- `organization?.id` → Pass to QuotaCard
- `organization?.subscription_plan` → Determine paid tier
- `team?.id` → Pass to RecentActivitiesCard, TeamProfileCard
- `team?.name` → Pass to TeamProfileCard
- `teamMember?.role` → Role-based quick actions

---

## New Component Props Types

### QuotaCardProps

```typescript
interface QuotaCardProps {
  organizationId: string | null;
  subscriptionPlan: string | null;
}
```

### RecentActivitiesCardProps

```typescript
interface RecentActivitiesCardProps {
  teamId: string | null;
}
```

### TeamProfileCardProps

```typescript
interface TeamProfileCardProps {
  teamId: string | null;
  teamName: string | null;
}
```

---

## Data Flow

```
Dashboard.tsx
    │
    ├── useUser() ────────────────────────► DashboardData
    │       │
    │       ├── organization.id ──────────► QuotaCard ──► useQuota() ──► UsageQuota
    │       ├── organization.subscription_plan ──► QuotaCard (tier detection)
    │       │
    │       ├── team.id ──────────────────► RecentActivitiesCard ──► useRecentActivities() ──► CustomizedActivity[]
    │       │
    │       ├── team.id ──────────────────► TeamProfileCard ──► useTeamProfile() ──► TeamProfile
    │       └── team.name ────────────────► TeamProfileCard
    │
    └── Existing components (no data changes)
        ├── TeamInfoCard ◄───── DashboardData
        └── QuickActionsCard ◄── isManagerOrAdmin, isAdmin, teamId, organizationId
```

---

## State Transitions

### Quota Display States

| State | Condition | Display |
|-------|-----------|---------|
| Loading | `isLoading === true` | Skeleton placeholder |
| Error | `isError === true` | Error message + Retry button |
| No Data | `data === null` | "No quota data" message |
| Normal | `percentage < 70` | Green progress bar |
| Warning | `70 <= percentage < 90` | Yellow progress bar |
| Critical | `percentage >= 90` | Red progress bar |
| Exhausted | `used >= limit` | Red bar + reset date message |

### Recent Activities Display States

| State | Condition | Display |
|-------|-----------|---------|
| Loading | `isLoading === true` | 5 skeleton rows |
| Error | `isError === true` | Error message + Retry button |
| Empty | `data?.length === 0` | Empty state + CTA |
| Normal | `data?.length > 0` | Activity list |

### Team Profile Display States

| State | Condition | Display |
|-------|-----------|---------|
| Loading | `isLoading === true` | Skeleton placeholder |
| Error | `isError === true` | Error message + Retry button |
| Missing | `data === null` | "Complete Profile" CTA |
| Incomplete | Profile has null fields | Partial display + "Update" prompt |
| Complete | All key fields present | Full summary |

---

## Validation Rules

No input validation required - this feature is display-only. All data comes from authenticated, RLS-protected database queries.

---

## Relationships

```
Organization (1) ──────────► (1) UsageQuota
     │
     └──────────► (N) Team
                      │
                      ├────────► (1) TeamProfile
                      │
                      └────────► (N) CustomizedActivity
```

All relationships are already enforced by existing database schema and RLS policies.
