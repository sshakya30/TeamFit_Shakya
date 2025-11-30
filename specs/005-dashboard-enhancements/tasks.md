# Tasks: Dashboard Enhancements

**Input**: Design documents from `/specs/005-dashboard-enhancements/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: No automated tests requested (manual testing per Technical Context)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `frontend/src/` for React components and hooks
- All paths relative to repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify existing infrastructure and prepare for implementation

- [X] T001 Verify existing shadcn/ui components are installed (Progress, Skeleton, Card, Badge) in `frontend/src/components/ui/`
- [X] T002 Verify existing hooks work correctly: useQuota and useTeamProfile (run frontend, check console for errors)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core hook that MUST be complete before User Story 2 components can be implemented

**⚠️ CRITICAL**: The useRecentActivities hook must be complete before User Story 2 implementation

- [X] T003 [P] Create and implement useRecentActivities hook with TanStack Query, Supabase query, and proper error handling in `frontend/src/hooks/useRecentActivities.ts`

**Checkpoint**: Foundation ready - user story component implementation can now begin in parallel

---

## Phase 3: User Story 1 - View Quota Usage (Priority: P1) 🎯 MVP

**Goal**: Display organization quota usage with color-coded progress bars showing customization limits

**Independent Test**: Load dashboard, verify quota card shows "X of Y customizations used" with progress bar that changes color based on usage percentage

### Implementation for User Story 1

- [X] T004 [US1] Create QuotaCard component skeleton with loading state in `frontend/src/components/dashboard/QuotaCard.tsx`
- [X] T005 [US1] Implement QuotaCard progress bar with color coding (green <70%, yellow 70-90%, red >90%) in `frontend/src/components/dashboard/QuotaCard.tsx`
- [X] T006 [US1] Add error state with retry button to QuotaCard in `frontend/src/components/dashboard/QuotaCard.tsx`
- [X] T007 [US1] Add paid tier detection to show custom generation quota (subscription_plan check) in `frontend/src/components/dashboard/QuotaCard.tsx`
- [X] T008 [US1] Integrate QuotaCard into Dashboard.tsx in responsive grid layout (`grid grid-cols-1 md:grid-cols-2 gap-4`) after welcome header in `frontend/src/pages/Dashboard.tsx`

**Checkpoint**: User Story 1 complete - quota card visible with progress bars and proper states

---

## Phase 4: User Story 2 - View Recent Customized Activities (Priority: P2)

**Goal**: Display 5 most recent customized activities with navigation and empty state

**Independent Test**: Load dashboard, verify recent activities list shows activities with title, type badge, status badge, and date; or empty state with CTA

### Implementation for User Story 2

- [X] T009 [US2] Create RecentActivitiesCard component skeleton with loading state in `frontend/src/components/dashboard/RecentActivitiesCard.tsx`
- [X] T010 [US2] Implement activity list with title, type badge (Customized/Generated), status badge, and date in `frontend/src/components/dashboard/RecentActivitiesCard.tsx`
- [X] T011 [US2] Add empty state with "Browse Activity Library" CTA button in `frontend/src/components/dashboard/RecentActivitiesCard.tsx`
- [X] T012 [US2] Add error state with retry button to RecentActivitiesCard in `frontend/src/components/dashboard/RecentActivitiesCard.tsx`
- [X] T013 [US2] Make activity items clickable with navigation to Activity Library in `frontend/src/components/dashboard/RecentActivitiesCard.tsx`
- [X] T014 [US2] Integrate RecentActivitiesCard into Dashboard.tsx with full-width layout replacing placeholder "Recent Activity" card in `frontend/src/pages/Dashboard.tsx`

**Checkpoint**: User Story 2 complete - recent activities list visible with navigation and empty state

---

## Phase 5: User Story 3 - Quick Access to Key Features (Priority: P3)

**Goal**: Enhance quick actions with "Generate Activities" button for managers/admins

**Independent Test**: Load dashboard as manager/admin, verify "Generate Activities" button appears and navigates to `/generate`

### Implementation for User Story 3

- [X] T015 [US3] Add "Generate Activities" button for managers/admins in `frontend/src/components/dashboard/QuickActionsCard.tsx`
- [X] T016 [US3] Add "Manage Materials" button for paid subscription managers/admins in `frontend/src/components/dashboard/QuickActionsCard.tsx`
- [X] T017 [US3] Update or remove "Coming soon" notice since features now exist in `frontend/src/components/dashboard/QuickActionsCard.tsx`
- [X] T018 [US3] Verify navigation routes work correctly (/activities, /generate, /materials)

**Checkpoint**: User Story 3 complete - enhanced quick actions visible for managers/admins

---

## Phase 6: User Story 4 - View Team Profile Summary (Priority: P4)

**Goal**: Display team profile summary with industry, team size, role description, and edit access

**Independent Test**: Load dashboard, verify team profile card shows profile summary or "Complete Profile" CTA if missing

### Implementation for User Story 4

- [X] T019 [US4] Create TeamProfileCard component skeleton with loading state in `frontend/src/components/dashboard/TeamProfileCard.tsx`
- [X] T020 [US4] Implement profile summary display (industry_sector, team_size, role description preview) in `frontend/src/components/dashboard/TeamProfileCard.tsx`
- [X] T021 [US4] Add "Complete Profile" CTA for missing profile state in `frontend/src/components/dashboard/TeamProfileCard.tsx`
- [X] T022 [US4] Add "Edit" button that navigates to team management page in `frontend/src/components/dashboard/TeamProfileCard.tsx`
- [X] T023 [US4] Integrate TeamProfileCard into Dashboard.tsx using responsive grid (`grid grid-cols-1 md:grid-cols-2 gap-4`) alongside QuotaCard in `frontend/src/pages/Dashboard.tsx`

**Checkpoint**: User Story 4 complete - team profile summary visible with edit access

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Layout refinement and mobile responsiveness

- [X] T024 Verify responsive layout on mobile (sections stack vertically) in `frontend/src/pages/Dashboard.tsx`
- [X] T025 Add TSDoc comments to all new components in `frontend/src/components/dashboard/`
- [X] T026 Remove placeholder "Your Feedback" card from Dashboard in `frontend/src/pages/Dashboard.tsx`
- [X] T027 Run quickstart.md validation steps to verify all features work
- [X] T028 Verify existing dashboard functionality preserved (WelcomeCard, TeamInfoCard, role badge)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS User Story 2 (needs useRecentActivities hook)
- **User Stories (Phase 3-6)**:
  - User Story 1 (P1): Can start after Setup (uses existing useQuota hook)
  - User Story 2 (P2): Depends on Foundational (Phase 2) for useRecentActivities hook
  - User Story 3 (P3): Can start after Setup (enhances existing component)
  - User Story 4 (P4): Can start after Setup (uses existing useTeamProfile hook)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Uses existing `useQuota` hook - No foundational dependencies
- **User Story 2 (P2)**: Requires `useRecentActivities` hook from Phase 2
- **User Story 3 (P3)**: Modifies existing `QuickActionsCard` - No foundational dependencies
- **User Story 4 (P4)**: Uses existing `useTeamProfile` hook - No foundational dependencies

### Parallel Opportunities

**Phase 1 (Setup):**
- T001 and T002 can run in parallel

**After Phase 2 (Foundational):**
- User Story 1 (T004-T008), User Story 3 (T015-T018), and User Story 4 (T019-T023) can all start in parallel
- User Story 2 (T009-T014) can start once T003 is complete

**Within User Stories:**
- Most tasks within a user story are sequential (same file modifications)

---

## Parallel Example: After Foundational Phase

```bash
# These can run in parallel (different components/files):
Task: "T004 [US1] Create QuotaCard component in frontend/src/components/dashboard/QuotaCard.tsx"
Task: "T009 [US2] Create RecentActivitiesCard component in frontend/src/components/dashboard/RecentActivitiesCard.tsx"
Task: "T015 [US3] Enhance QuickActionsCard in frontend/src/components/dashboard/QuickActionsCard.tsx"
Task: "T019 [US4] Create TeamProfileCard component in frontend/src/components/dashboard/TeamProfileCard.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (verify components exist)
2. Complete Phase 2: Foundational (create useRecentActivities hook)
3. Complete Phase 3: User Story 1 (QuotaCard)
4. **STOP and VALIDATE**: Test quota card independently on dashboard
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 (QuotaCard) → Test → Deploy (MVP!)
3. Add User Story 2 (RecentActivitiesCard) → Test → Deploy
4. Add User Story 3 (Quick Actions) → Test → Deploy
5. Add User Story 4 (TeamProfileCard) → Test → Deploy
6. Complete Polish phase → Final validation

### Single Developer Recommended Order

1. T001, T002, T003 (Setup + Foundational)
2. T004-T008 (User Story 1 - Quota)
3. T009-T014 (User Story 2 - Recent Activities)
4. T015-T018 (User Story 3 - Quick Actions)
5. T019-T023 (User Story 4 - Team Profile)
6. T024-T028 (Polish)

---

## Notes

- [P] tasks = different files, no dependencies on each other
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All new components follow existing patterns in `frontend/src/components/dashboard/`
- Preserve existing Features 1-4 (Activity Library, Customization, File Upload, Custom Generation)
