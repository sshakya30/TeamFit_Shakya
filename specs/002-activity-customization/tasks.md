# Tasks: Activity Customization Flow

**Input**: Design documents from `/specs/002-activity-customization/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Not explicitly requested - test tasks omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Web app frontend**: `frontend/src/` for source code
- All changes are frontend-only; backend API already exists

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add required shadcn/ui components and create foundational modules

- [X] T001 Add shadcn/ui radio-group component via `npx shadcn@latest add radio-group` in frontend/src/components/ui/radio-group.tsx
- [X] T002 Add shadcn/ui progress component via `npx shadcn@latest add progress` in frontend/src/components/ui/progress.tsx
- [X] T003 Add shadcn/ui label component via `npx shadcn@latest add label` in frontend/src/components/ui/label.tsx (if not exists)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Create FastAPI client module with customizeActivity function in frontend/src/lib/api.ts
- [X] T005 [P] Add TypeScript interfaces for CustomizeActivityRequest, CustomizeActivityResponse, CustomizedActivity, QuotaInfo in frontend/src/types/index.ts
- [X] T006 [P] Add TypeScript interfaces for TeamProfile, TeamMembershipWithDetails, UsageQuota in frontend/src/types/index.ts
- [X] T007 [P] Add component prop interfaces (DurationSelectorProps, TeamSelectorProps, etc.) in frontend/src/types/index.ts
- [X] T008 Create useUserTeams hook to fetch user's team memberships with manager/admin role in frontend/src/hooks/useUserTeams.ts
- [X] T009 Create useTeamProfile hook to fetch team profile by teamId in frontend/src/hooks/useTeamProfile.ts
- [X] T010 Create useCustomizeActivity mutation hook using TanStack Query in frontend/src/hooks/useCustomizeActivity.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Generate AI-Customized Activity (Priority: P1) 🎯 MVP

**Goal**: Allow users to customize a public activity for their team using AI

**Independent Test**: Navigate to /customize/:activityId, select duration, click "Generate Customization", verify AI result displays

### Implementation for User Story 1

- [X] T011 [P] [US1] Create DurationSelector component with radio buttons for 15/30/45 min in frontend/src/components/activities/DurationSelector.tsx
- [X] T012 [P] [US1] Create basic CustomizeActivity page structure with activity loading in frontend/src/pages/CustomizeActivity.tsx
- [X] T013 [US1] Add duration selection UI to CustomizeActivity page in frontend/src/pages/CustomizeActivity.tsx
- [X] T014 [US1] Add "Generate Customization" button with mutation trigger in frontend/src/pages/CustomizeActivity.tsx
- [X] T015 [US1] Implement loading state with progress indicator during AI processing in frontend/src/pages/CustomizeActivity.tsx
- [X] T016 [US1] Add error handling with retry button for failed customization in frontend/src/pages/CustomizeActivity.tsx
- [X] T017 [US1] Implement navigation warning when user tries to leave during processing in frontend/src/pages/CustomizeActivity.tsx
- [X] T018 [US1] Create success animation (checkmark/glow effect) for completed customization in frontend/src/pages/CustomizeActivity.tsx

**Checkpoint**: Users can customize activities with AI - core MVP complete

---

## Phase 4: User Story 2 - Review Team Context Before Customization (Priority: P2)

**Goal**: Display team profile information before customization begins

**Independent Test**: Navigate to customization page, verify team profile information displays correctly

### Implementation for User Story 2

- [X] T019 [P] [US2] Create TeamProfilePreview component showing team context in frontend/src/components/activities/TeamProfilePreview.tsx
- [X] T020 [P] [US2] Create TeamSelector dropdown component for multi-team users in frontend/src/components/activities/TeamSelector.tsx
- [X] T021 [US2] Integrate TeamSelector into CustomizeActivity page (show if user has multiple teams) in frontend/src/pages/CustomizeActivity.tsx
- [X] T022 [US2] Integrate TeamProfilePreview into CustomizeActivity page in frontend/src/pages/CustomizeActivity.tsx
- [X] T023 [US2] Add "missing profile" prompt with link to profile setup when team has no profile in frontend/src/pages/CustomizeActivity.tsx

**Checkpoint**: Users can see team context before customizing

---

## Phase 5: User Story 3 - Save Customized Activity (Priority: P3)

**Goal**: Allow users to save customized activities to their team's collection

**Independent Test**: Complete customization, click "Save to My Activities", verify redirect and activity saved

### Implementation for User Story 3

- [X] T024 [P] [US3] Create CustomizationResult component displaying AI result with save/discard options in frontend/src/components/activities/CustomizationResult.tsx
- [X] T025 [US3] Integrate CustomizationResult into CustomizeActivity page in frontend/src/pages/CustomizeActivity.tsx
- [X] T026 [US3] Implement "Save to My Activities" action calling PATCH /api/activities/{id}/status in frontend/src/pages/CustomizeActivity.tsx
- [X] T027 [US3] Add redirect to team activities after successful save in frontend/src/pages/CustomizeActivity.tsx
- [X] T028 [US3] Implement "Back to Library" action returning to /activities in frontend/src/pages/CustomizeActivity.tsx

**Checkpoint**: Users can save or discard customized activities

---

## Phase 6: User Story 4 - Track Customization Quota (Priority: P4)

**Goal**: Display quota usage/limit to help users plan their customizations

**Independent Test**: View customization page, verify quota displays; complete customization, verify quota updates

### Implementation for User Story 4

- [X] T029 [P] [US4] Create useQuota hook to fetch usage_quotas from Supabase in frontend/src/hooks/useQuota.ts
- [X] T030 [P] [US4] Create QuotaDisplay component showing used/limit as badge in frontend/src/components/activities/QuotaDisplay.tsx
- [X] T031 [US4] Integrate QuotaDisplay into CustomizeActivity page header in frontend/src/pages/CustomizeActivity.tsx
- [X] T032 [US4] Update QuotaDisplay after successful customization from API response in frontend/src/pages/CustomizeActivity.tsx
- [X] T033 [US4] Add quota exceeded state blocking customization with upgrade link in frontend/src/pages/CustomizeActivity.tsx

**Checkpoint**: Users can track their quota usage

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final integration and exports

- [X] T034 [P] Update component exports in frontend/src/components/activities/index.ts to include all new components
- [X] T035 Rename frontend/src/pages/CustomizePlaceholder.tsx to CustomizeActivity.tsx and update route import in frontend/src/App.tsx
- [X] T036 Run `npm run build` to verify no TypeScript errors
- [ ] T037 Manual end-to-end testing following quickstart.md verification checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3 → P4)
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational - Integrates into US1's page but independently testable
- **User Story 3 (P3)**: Can start after Foundational - Integrates into US1's page but independently testable
- **User Story 4 (P4)**: Can start after Foundational - Integrates into US1's page but independently testable

### Within Each User Story

- Components before page integration
- Core functionality before enhancements
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks can run in parallel (T001-T003)
- Foundational tasks marked [P] can run in parallel (T005, T006, T007)
- After T008-T010, all user stories can start in parallel
- Components within stories marked [P] can run in parallel

---

## Parallel Example: Foundational Phase

```bash
# Launch these type definition tasks in parallel:
Task: "Add TypeScript interfaces for CustomizeActivityRequest, CustomizeActivityResponse in frontend/src/types/index.ts"
Task: "Add TypeScript interfaces for TeamProfile, TeamMembershipWithDetails in frontend/src/types/index.ts"
Task: "Add component prop interfaces in frontend/src/types/index.ts"
```

## Parallel Example: User Story 2

```bash
# Launch these component tasks in parallel:
Task: "Create TeamProfilePreview component in frontend/src/components/activities/TeamProfilePreview.tsx"
Task: "Create TeamSelector dropdown component in frontend/src/components/activities/TeamSelector.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (shadcn components)
2. Complete Phase 2: Foundational (API client, types, hooks)
3. Complete Phase 3: User Story 1 (core customization flow)
4. **STOP and VALIDATE**: Test with real backend
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → MVP ready!
3. Add User Story 2 → Team context visible
4. Add User Story 3 → Save functionality
5. Add User Story 4 → Quota tracking
6. Polish phase → Production ready

### Parallel Team Strategy

With multiple developers after Foundational phase:
- Developer A: User Story 1 (DurationSelector, core page)
- Developer B: User Story 2 (TeamSelector, TeamProfilePreview)
- Developer C: User Story 3 (CustomizationResult)
- Developer D: User Story 4 (QuotaDisplay, useQuota)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently testable
- Backend API already exists at POST /api/activities/customize
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
