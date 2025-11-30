# Research: Dashboard Enhancements

**Feature**: 005-dashboard-enhancements
**Date**: 2025-11-30

## Overview

This document captures research findings for the Dashboard Enhancements feature. Since this is a frontend-only enhancement leveraging existing infrastructure, research focused on validating existing patterns and confirming available data.

## Research Items

### R-001: Existing Quota Hook Validation

**Question**: Can we reuse the existing `useQuota` hook for the dashboard?

**Finding**: YES - The existing `useQuota` hook at `frontend/src/hooks/useQuota.ts` provides all required functionality:
- Fetches from `usage_quotas` table via Supabase
- Returns `UsageQuota` type with all needed fields:
  - `public_customizations_used` / `public_customizations_limit`
  - `custom_generations_used` / `custom_generations_limit`
  - `quota_period_start` / `quota_period_end`
- Handles PGRST116 (no rows found) gracefully
- Uses 2-minute stale time for reasonable caching

**Decision**: Reuse `useQuota` hook without modification.

---

### R-002: Team Profile Hook Validation

**Question**: Can we reuse the existing `useTeamProfile` hook for the dashboard?

**Finding**: YES - The existing `useTeamProfile` hook at `frontend/src/hooks/useTeamProfile.ts` provides:
- Fetches from `team_profiles` table via Supabase
- Returns `TeamProfile` type with fields needed for summary:
  - `industry_sector`
  - `team_size`
  - `team_role_description`
- Handles PGRST116 gracefully (profile may not exist)
- Uses 5-minute stale time

**Decision**: Reuse `useTeamProfile` hook without modification.

---

### R-003: Progress Bar Color Implementation

**Question**: How to implement color-coded progress bars with existing shadcn/ui Progress component?

**Finding**: The existing `Progress` component at `frontend/src/components/ui/progress.tsx`:
- Uses Radix UI primitive with Tailwind styling
- Default color is `bg-primary` via CSS variable
- Supports `className` prop for customization

**Implementation Approach**:
```typescript
// Compute color class based on percentage
const getProgressColor = (percentage: number): string => {
  if (percentage >= 90) return 'bg-red-500';
  if (percentage >= 70) return 'bg-yellow-500';
  return 'bg-green-500';
};

// Override indicator color via className or inline style
<Progress
  value={percentage}
  className={cn('[&>div]:' + getProgressColor(percentage))}
/>
```

**Decision**: Use Tailwind arbitrary variant `[&>div]:` to target the indicator child element.

---

### R-004: Recent Activities Query Structure

**Question**: What fields are available in `customized_activities` table for recent activities display?

**Finding**: Based on `CustomizedActivity` type in `frontend/src/types/index.ts`:
- `id: string` - for navigation
- `title: string` - for display
- `customization_type: 'public_customized' | 'custom_generated'` - for type badge
- `status: 'suggested' | 'saved' | 'scheduled' | 'expired'` - for status badge
- `created_at: string | null` - for date display

**Decision**: Query these 5 fields only for optimal performance. Use `limit(5)` for dashboard preview.

---

### R-005: Activity Details Navigation Route

**Question**: What route exists for viewing activity details?

**Finding**: Examined existing routes and components:
- Activity Library exists at `/activities`
- Customization exists at `/customize/:activityId` for public activities
- No dedicated detail view page exists for customized activities

**Decision**: For MVP, clicking a recent activity will navigate to Activity Library (`/activities`) with the activity ID as a URL parameter. A dedicated detail view can be added in a future feature if needed.

**Alternative considered**: Create new `/my-activities/:activityId` route - rejected as out of scope for this feature.

---

### R-006: Skeleton Component Usage

**Question**: How to implement loading skeletons consistently?

**Finding**: The existing `Skeleton` component at `frontend/src/components/ui/skeleton.tsx`:
- Simple div with `animate-pulse rounded-md bg-muted` classes
- Accepts standard div props including `className`

**Best Practice Pattern** (from existing codebase):
```typescript
{isLoading ? (
  <div className="space-y-2">
    <Skeleton className="h-4 w-[200px]" />
    <Skeleton className="h-4 w-[150px]" />
  </div>
) : (
  <ActualContent />
)}
```

**Decision**: Follow existing loading state pattern with Skeleton components matching content dimensions.

---

### R-007: Quick Actions Enhancement Scope

**Question**: What modifications are needed to existing QuickActionsCard?

**Finding**: Current `QuickActionsCard.tsx` structure:
- Already has "Browse Activities" linking to `/activities`
- Has role-based conditional rendering (isManagerOrAdmin, isAdmin)
- Has disabled placeholders for "My Events" and "Give Feedback"

**Required Changes**:
1. Add "Generate Activities" button linking to `/generate` (for managers/admins)
2. Add "Manage Materials" button linking to `/materials` (for managers/admins with paid subscription)
3. Remove or update "Coming soon" message since features now exist

**Decision**: Minimal enhancement to existing component. No structural changes needed.

---

### R-008: Subscription Plan Detection

**Question**: How to detect paid vs. free subscription for conditional UI?

**Finding**: From `Organization` type in `frontend/src/types/index.ts`:
- `subscription_plan: string` - available via `useUser` hook
- `subscription_status: string` - available via `useUser` hook

Current assumption: `subscription_plan === 'free'` indicates free tier.

**Decision**: Use `organization?.subscription_plan !== 'free'` to determine paid tier status.

---

## Summary

All research items resolved. No blocking issues found. Implementation can proceed using:
- Existing hooks: `useQuota`, `useTeamProfile`
- Existing components: `Progress`, `Skeleton`, `Card`, `Badge`
- One new hook: `useRecentActivities`
- Three new components: `QuotaCard`, `RecentActivitiesCard`, `TeamProfileCard`
- One enhanced component: `QuickActionsCard`

## Alternatives Considered

| Decision | Alternative | Rejected Because |
|----------|-------------|------------------|
| Reuse existing hooks | Create new dashboard-specific hooks | Duplication, existing hooks sufficient |
| Color via Tailwind arbitrary variant | Custom Progress component | Unnecessary complexity |
| Navigate to Activity Library | Create new detail page | Out of scope, YAGNI principle |
| Enhance QuickActionsCard | Create separate component | Preserve existing structure per FR-015 |
