# Implementation Plan: Activity Library Page

**Branch**: `001-activity-library` | **Date**: 2025-11-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-activity-library/spec.md`

## Summary

Build an Activity Library page for TEAMFIT that displays all 45 public team-building activities from Supabase. Users can browse activities in a responsive grid, filter by category/duration/complexity client-side, view full details in a modal, and initiate customization (navigates to placeholder). Uses TanStack Query for data fetching, shadcn/ui components for UI, and follows existing frontend patterns.

## Technical Context

**Language/Version**: TypeScript 5.3.3, React 18.2.0
**Primary Dependencies**: TanStack Query v5, Supabase JS v2, shadcn/ui, Tailwind CSS, React Router v6
**Storage**: Supabase PostgreSQL (public_activities table - 45 activities, 5 categories)
**Testing**: Vitest 1.6.1, Testing Library React 14.3.1
**Target Platform**: Web (Chrome, Firefox, Safari, Edge - desktop and mobile)
**Project Type**: Web application (existing frontend)
**Performance Goals**:
- Page load < 3 seconds
- Filter updates < 100ms (client-side)
- 60fps scroll performance
**Constraints**:
- Client-side filtering only (no backend API for filtering)
- Must use existing Supabase client patterns
- Must follow existing component/hook patterns
**Scale/Scope**: 45 activities, 5 categories, 3 duration options, 3 complexity levels

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Implementation |
|-----------|--------|----------------|
| I. Event-Driven Architecture | ✅ PASS | Read-only data fetch, no async processing needed |
| II. Product Robustness | ✅ PASS | TanStack Query provides retry/error handling |
| III. Security Implementation | ✅ PASS | Clerk auth required, Supabase RLS enforced |
| IV. Separation of Concerns | ✅ PASS | Hooks for data, Components for UI, Pages for routing |
| V. Logging System | ⚪ N/A | Frontend feature, no backend logging needed |
| VI. Input Validation | ✅ PASS | TypeScript types enforce data shapes |
| VII. Code Simplicity | ✅ PASS | Simple components, client-side filtering |
| VIII. Code Documentation | ✅ PASS | JSDoc comments, type definitions |

**All gates passed. Proceeding to Phase 0.**

## Project Structure

### Documentation (this feature)

```text
specs/001-activity-library/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (not needed - frontend only)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── components/
│   │   ├── activities/           # NEW - Activity Library components
│   │   │   ├── ActivityCard.tsx
│   │   │   ├── ActivityFilters.tsx
│   │   │   ├── ActivityGrid.tsx
│   │   │   ├── ActivityDetailModal.tsx
│   │   │   └── EmptyState.tsx
│   │   ├── layout/               # EXISTING
│   │   └── ui/                   # EXISTING + new shadcn components
│   │       ├── button.tsx        # EXISTING
│   │       ├── card.tsx          # EXISTING
│   │       ├── dialog.tsx        # NEW - for modal
│   │       ├── select.tsx        # NEW - for filters
│   │       ├── badge.tsx         # NEW - for tags
│   │       └── skeleton.tsx      # NEW - for loading
│   ├── hooks/
│   │   ├── useUser.ts            # EXISTING
│   │   └── useActivities.ts      # NEW - TanStack Query hook
│   ├── pages/
│   │   ├── Dashboard.tsx         # EXISTING
│   │   ├── ActivityLibrary.tsx   # NEW - main page
│   │   └── CustomizePlaceholder.tsx  # NEW - "Coming Soon" page
│   ├── types/
│   │   ├── index.ts              # EXISTING (add Activity types)
│   │   └── database.types.ts     # EXISTING (auto-generated)
│   ├── lib/
│   │   ├── supabase.ts           # EXISTING
│   │   └── utils.ts              # EXISTING
│   └── App.tsx                   # MODIFY - add routes
```

**Structure Decision**: Extend existing frontend structure. Create new `activities/` component directory following the `dashboard/` pattern. Add 4 new shadcn/ui components via CLI.

## Database Schema Analysis

**Table**: `public_activities` (45 rows)

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | uuid | NO | Primary key |
| title | text | NO | Activity name |
| description | text | YES | Short description |
| category | text | NO | Filter: tech_it, finance_accounting, marketing_creative, business_services, customer_service |
| duration_minutes | integer | YES | Filter: 15, 30, 45 |
| complexity | text | YES | Filter: easy, medium, hard |
| required_tools | text[] | YES | Array of tools needed |
| instructions | text | YES | Full activity instructions |
| is_active | boolean | YES | Only show active activities |
| created_at | timestamptz | YES | Audit |
| updated_at | timestamptz | YES | Audit |

**Note**: Spec mentioned sector_tags, objectives, min/max_participants which don't exist in actual schema. Will use `category` as sector filter and omit participant range from UI.

## Complexity Tracking

> No violations requiring justification. Implementation uses standard patterns.

## Implementation Phases

### Phase 0: Research (research.md)
- Confirm shadcn/ui component patterns
- TanStack Query caching strategy for static data
- Client-side filtering best practices

### Phase 1: Design (data-model.md, quickstart.md)
- TypeScript interfaces for Activity and FilterState
- Component hierarchy and props
- Hook design with filtering logic
- Route configuration

### Phase 2: Tasks (tasks.md via /speckit.tasks)
- Detailed implementation tasks with dependencies
- Test scenarios
- Acceptance criteria mapping
