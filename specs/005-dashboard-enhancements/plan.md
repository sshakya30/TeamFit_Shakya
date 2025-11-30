# Implementation Plan: Dashboard Enhancements

**Branch**: `005-dashboard-enhancements` | **Date**: 2025-11-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-dashboard-enhancements/spec.md`

## Summary

Enhance the existing Dashboard page to display quota usage with visual progress bars, recent customized activities with navigation, team profile summary, and improved quick actions. This is a frontend-only enhancement that leverages existing hooks (`useQuota`, `useTeamProfile`) and creates one new hook (`useRecentActivities`) while preserving all existing dashboard components.

## Technical Context

**Language/Version**: TypeScript 5.x with React 18
**Primary Dependencies**: React, TanStack Query, shadcn/ui (Card, Progress, Badge, Skeleton), Lucide React icons, React Router DOM
**Storage**: Supabase (PostgreSQL) via existing RLS-protected queries
**Testing**: Manual testing (no test framework currently configured for frontend)
**Target Platform**: Web (Chrome, Firefox, Safari, Edge - responsive design)
**Project Type**: Web application (frontend enhancement only)
**Performance Goals**: Dashboard sections load within 2 seconds, quota visible within 1 second
**Constraints**: Preserve existing Features 1-4, no backend changes required
**Scale/Scope**: Single page enhancement, 3 new components, 1 new hook

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Event-Driven Architecture | N/A | Frontend-only, no async processing needed |
| II. Product Robustness | PASS | Error handling with retry per section, loading states |
| III. Security Implementation | PASS | Uses existing RLS-protected Supabase queries via Clerk JWT |
| IV. Separation of Concerns | PASS | Components for UI, Hooks for data, existing patterns maintained |
| V. Logging System | N/A | Frontend-only, no backend logging changes |
| VI. Input Validation | N/A | Display-only feature, no user input to validate |
| VII. Code Simplicity | PASS | Small focused components, max ~50 lines each |
| VIII. Code Documentation | PASS | TSDoc comments, type hints for all components |

**All gates pass. Proceeding with Phase 0.**

## Project Structure

### Documentation (this feature)

```text
specs/005-dashboard-enhancements/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── WelcomeCard.tsx          # EXISTING - preserve
│   │   │   ├── TeamInfoCard.tsx         # EXISTING - preserve
│   │   │   ├── QuickActionsCard.tsx     # EXISTING - enhance
│   │   │   ├── QuotaCard.tsx            # NEW - quota display
│   │   │   ├── RecentActivitiesCard.tsx # NEW - recent activities
│   │   │   └── TeamProfileCard.tsx      # NEW - profile summary
│   │   └── ui/
│   │       ├── progress.tsx             # EXISTING - use
│   │       ├── skeleton.tsx             # EXISTING - use
│   │       ├── card.tsx                 # EXISTING - use
│   │       └── badge.tsx                # EXISTING - use
│   ├── hooks/
│   │   ├── useUser.ts                   # EXISTING - no changes needed
│   │   ├── useQuota.ts                  # EXISTING - no changes needed
│   │   ├── useTeamProfile.ts            # EXISTING - no changes needed
│   │   └── useRecentActivities.ts       # NEW - fetch recent activities
│   ├── pages/
│   │   └── Dashboard.tsx                # EXISTING - enhance layout
│   └── types/
│       └── index.ts                     # EXISTING - no new types needed
```

**Structure Decision**: Web application frontend structure. All new components follow existing `components/dashboard/` pattern. New hook follows existing `hooks/use*.ts` pattern. No backend changes required.

## Complexity Tracking

> No Constitution Check violations. No complexity justification needed.

## Architecture Decisions

### AD-001: Reuse Existing Hooks
**Decision**: Use existing `useQuota` and `useTeamProfile` hooks instead of creating duplicates.
**Rationale**: These hooks already implement proper caching, error handling, and RLS-protected queries. Reduces code duplication.

### AD-002: Independent Section Error Handling
**Decision**: Each dashboard section handles its own loading/error states independently.
**Rationale**: Per FR-013, dashboard should remain usable when individual sections fail. Prevents single API failure from breaking entire dashboard.

### AD-003: Color-Coded Progress Bar
**Decision**: Implement quota progress with color thresholds: green (<70%), yellow (70-90%), red (>90%).
**Rationale**: Provides immediate visual feedback per SC-006 (95% of users understand quota status from visual indicator).

### AD-004: Enhance Existing QuickActionsCard
**Decision**: Modify existing `QuickActionsCard.tsx` to add "Generate Activities" action rather than creating new component.
**Rationale**: Per FR-015, preserve existing dashboard functionality. Quick actions already exist, just need enhancement.

## Component Specifications

### QuotaCard Component
**Purpose**: Display organization quota usage with visual progress
**Props**: `organizationId: string`, `subscriptionPlan: string`
**Features**:
- Shows public customizations: "X of Y used"
- Shows custom generations (paid tier only): "X of Y used"
- Color-coded progress bars per AD-003
- Loading skeleton when fetching
- Error state with retry button
- Links to upgrade for exhausted quotas

### RecentActivitiesCard Component
**Purpose**: Display 5 most recent customized activities
**Props**: `teamId: string`
**Features**:
- List of 5 most recent activities with title, type badge, status badge, date
- Clickable items navigate to activity details
- Empty state with CTA to browse Activity Library
- Loading skeleton placeholders
- Error state with retry button

### TeamProfileCard Component
**Purpose**: Display team profile summary with edit access
**Props**: `teamId: string`, `teamName: string`
**Features**:
- Shows industry sector, team size, role description preview
- "Edit Profile" button navigates to profile management
- Empty/incomplete state with "Complete Profile" CTA
- Loading skeleton placeholder
- Compact card design

### useRecentActivities Hook
**Purpose**: Fetch 5 most recent customized activities for a team
**Signature**: `useRecentActivities(teamId: string | null)`
**Returns**: `{ data, isLoading, isError, error, refetch }`
**Query**:
```typescript
supabase
  .from('customized_activities')
  .select('id, title, customization_type, status, created_at')
  .eq('team_id', teamId)
  .order('created_at', { ascending: false })
  .limit(5)
```

## Integration Points

1. **Dashboard.tsx Enhancement**:
   - Add QuotaCard after welcome header
   - Add RecentActivitiesCard in place of placeholder "Recent Activity" card
   - Add TeamProfileCard as new section
   - Enhance existing QuickActionsCard with "Generate Activities" button

2. **Data Dependencies**:
   - `useUser()` → provides `organization?.id`, `team?.id`, `organization?.subscription_plan`
   - `useQuota(organizationId)` → provides quota data for QuotaCard
   - `useTeamProfile(teamId)` → provides profile data for TeamProfileCard
   - `useRecentActivities(teamId)` → NEW, provides activities for RecentActivitiesCard

3. **Navigation Routes**:
   - `/activities` - Activity Library (existing)
   - `/generate` - Generate Activities page (existing)
   - `/materials` - Materials management (existing, paid only)
   - Activity details - route TBD based on existing activity detail implementation
