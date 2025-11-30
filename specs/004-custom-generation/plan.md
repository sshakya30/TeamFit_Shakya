# Implementation Plan: Custom Activity Generation

**Branch**: `004-custom-generation` | **Date**: 2025-11-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-custom-generation/spec.md`

## Summary

Implement a frontend page that allows managers/admins with paid subscriptions to generate 3 custom AI-powered activities. The page uses a single-page layout with collapsible sections for requirements input and optional material selection. Generation is handled asynchronously via backend Celery tasks, with job status polling every 5 seconds until completion.

## Technical Context

**Language/Version**: TypeScript 5.x, React 18.x
**Primary Dependencies**: React, TanStack Query, Clerk Auth, shadcn/ui, Tailwind CSS, Lucide Icons
**Storage**: N/A (frontend only - backend handles persistence)
**Testing**: Vitest (project standard, currently not implemented)
**Target Platform**: Web browser (Chrome, Firefox, Safari, Edge)
**Project Type**: Web application (React + Vite frontend)
**Performance Goals**: 3s initial render, 5s polling interval, <100ms UI interactions
**Constraints**: Must work with existing backend API, no changes to backend required
**Scale/Scope**: Single page addition with ~5 new components and 2-3 new hooks

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Implementation |
|-----------|--------|----------------|
| I. Event-Driven Architecture | ✅ Pass | Uses backend Celery + Redis for async generation; frontend polls for status |
| II. Product Robustness | ✅ Pass | Error handling with retry, timeout handling (2 min), polling retry logic |
| III. Security Implementation | ✅ Pass | Uses Clerk JWT auth, role-based access via MaterialsRoute wrapper |
| IV. Separation of Concerns | ✅ Pass | Components (UI), Hooks (data fetching), Pages (orchestration) |
| V. Logging System | ✅ Pass | Frontend console logging for development; backend handles production logs |
| VI. Input Validation | ✅ Pass | Validate requirements (10-2000 chars), role/subscription checks |
| VII. Code Simplicity | ✅ Pass | Small focused components (~50 lines), single responsibility |
| VIII. Code Documentation | ✅ Pass | JSDoc comments, TypeScript types, inline comments for complex logic |

## Project Structure

### Documentation (this feature)

```text
specs/004-custom-generation/
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
│   ├── pages/
│   │   └── GenerateActivity.tsx         # New page
│   ├── components/
│   │   └── generate/                    # New folder
│   │       ├── RequirementsSection.tsx  # Collapsible requirements input
│   │       ├── MaterialsSection.tsx     # Collapsible material selection
│   │       ├── GenerationProgress.tsx   # Progress indicator during job
│   │       ├── GeneratedActivityCard.tsx # Display single generated activity
│   │       └── GenerationResults.tsx    # Display all results with save buttons
│   ├── hooks/
│   │   ├── useGenerateActivities.ts     # TanStack Query mutation for generation
│   │   └── useJobStatus.ts              # TanStack Query with polling
│   ├── types/
│   │   └── index.ts                     # Add generation types (extend existing)
│   └── lib/
│       └── api.ts                       # Add generateCustomActivities, getJobStatus
└── App.tsx                              # Add /generate route
```

**Structure Decision**: Web application pattern using existing frontend architecture. New components follow established patterns from Materials and CustomizeActivity features.

## Integration Points

### Backend APIs (Already Exist)

1. **POST /api/activities/generate-custom**
   - Request: `{ team_id, organization_id, requirements, material_ids? }`
   - Response: `{ success, job_id, status, message }`

2. **GET /api/jobs/{job_id}**
   - Response: `{ status, job, activities?, error? }`

### Existing Hooks to Reuse

- `useUser` - Get team_id, organization_id, role
- `useTeamMaterials` - Fetch team materials for selection
- `useQuota` - Display quota status
- `useSaveActivity` - Save generated activities (status update)

### Existing Components to Reuse

- `Layout` - Page layout wrapper
- `Card`, `Button`, `Badge` - UI primitives
- `Textarea` - Requirements input
- `Progress` - Progress indicator
- `Alert`, `AlertDialog` - Error display, confirmations
- `Skeleton` - Loading states

### Access Control

- Route wrapped with `OnboardingRoute` (auth required)
- Route wrapped with `MaterialsRoute` (manager/admin + paid subscription)

## Complexity Tracking

> No violations requiring justification. Design follows existing patterns.

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| Single-page layout | Collapsible sections | Clarified in spec - reduces friction vs wizard |
| Polling interval | 5 seconds | Spec requirement, balances UX and server load |
| Timeout | 2 minutes | Spec requirement, based on typical job duration |
| Generated activities | Display 3 | Backend always generates exactly 3 |

## Key Implementation Decisions

1. **Page State Machine**: `idle` → `submitting` → `polling` → `completed`/`error`
2. **Material Selection**: Optional - reuses useTeamMaterials hook
3. **Quota Display**: Shows remaining custom generations using existing useQuota hook
4. **Save Mechanism**: Reuses useSaveActivity hook to update status to "saved"
5. **Navigation Entry**: Link from Activity Library page (existing CTA area)
