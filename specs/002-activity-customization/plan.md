# Implementation Plan: Activity Customization Flow

**Branch**: `002-activity-customization` | **Date**: 2025-11-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-activity-customization/spec.md`

## Summary

Implement a frontend UI flow that allows team managers/admins to customize public activities for their team using AI. The flow includes team selection (for multi-team users), duration selection, team profile preview, AI processing with loading states, result display with success animation, and the ability to save or discard customized activities. Integrates with existing FastAPI backend endpoint `POST /api/activities/customize`.

## Technical Context

**Language/Version**: TypeScript 5.3, React 18.2
**Primary Dependencies**: React Router 6.30, TanStack Query 5.90, Clerk React 4.32, Supabase JS 2.84, shadcn/ui (Radix primitives), Tailwind CSS 3.4, Lucide React icons
**Storage**: Supabase PostgreSQL (via existing tables: `public_activities`, `customized_activities`, `team_profiles`, `usage_quotas`, `team_members`)
**Testing**: Vitest 1.6, React Testing Library
**Target Platform**: Web (modern browsers)
**Project Type**: Web application (frontend-only changes for this feature)
**Performance Goals**: < 2 minutes for complete customization flow (excluding AI processing)
**Constraints**: AI processing takes 10-30 seconds; 60 second timeout; quota limits (free: 5/month)
**Scale/Scope**: Single page with 5 new components, 2 new hooks, 1 API client module

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Event-Driven Architecture | ✅ PASS | Uses TanStack Query mutations for async API calls; loading states handle AI processing time |
| II. Product Robustness | ✅ PASS | Error handling with retry, timeout handling (60s), network connection detection, navigation warning |
| III. Security Implementation | ✅ PASS | Clerk JWT authentication; backend enforces quotas and RLS; no sensitive data in frontend |
| IV. Separation of Concerns | ✅ PASS | Components (UI) → Hooks (data) → API client (network); follows existing patterns |
| V. Logging System | ✅ PASS | Frontend uses console for dev; production errors sent via existing error boundaries |
| VI. Input Validation | ✅ PASS | Duration validated via TypeScript literal types; team/org IDs from authenticated context |
| VII. Code Simplicity | ✅ PASS | Small focused components; hooks extract data logic; no complex abstractions needed |
| VIII. Code Documentation | ✅ PASS | JSDoc for hooks and complex logic; TypeScript provides type documentation |

## Project Structure

### Documentation (this feature)

```text
specs/002-activity-customization/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── components/
│   │   ├── activities/
│   │   │   ├── DurationSelector.tsx      # NEW: Radio group for 15/30/45 min
│   │   │   ├── TeamProfilePreview.tsx    # NEW: Display team context
│   │   │   ├── TeamSelector.tsx          # NEW: Dropdown for multi-team users
│   │   │   ├── CustomizationResult.tsx   # NEW: Display AI result with save option
│   │   │   ├── QuotaDisplay.tsx          # NEW: Show usage/limit
│   │   │   └── index.ts                  # Update exports
│   │   └── ui/
│   │       ├── radio-group.tsx           # NEW: shadcn/ui component
│   │       └── progress.tsx              # NEW: shadcn/ui component (for loading)
│   ├── pages/
│   │   └── CustomizeActivity.tsx         # REPLACE: Full implementation (currently placeholder)
│   ├── hooks/
│   │   ├── useCustomizeActivity.ts       # NEW: TanStack mutation hook
│   │   ├── useTeamProfile.ts             # NEW: Fetch team profile
│   │   ├── useUserTeams.ts               # NEW: Fetch user's teams for selector
│   │   └── useQuota.ts                   # NEW: Fetch quota status
│   ├── lib/
│   │   └── api.ts                        # NEW: FastAPI client for backend calls
│   └── types/
│       └── index.ts                      # UPDATE: Add customization types
└── tests/
    └── components/
        └── activities/
            └── CustomizationResult.test.tsx  # NEW: Component tests
```

**Structure Decision**: Web application structure following existing patterns. All changes are frontend-only. Backend API endpoints already exist.

## Complexity Tracking

No constitution violations requiring justification. Implementation follows existing patterns.
