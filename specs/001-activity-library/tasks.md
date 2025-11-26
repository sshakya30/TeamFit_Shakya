# Tasks: Activity Library Page

**Feature Branch**: `001-activity-library`
**Input**: Design documents from `/specs/001-activity-library/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, quickstart.md ✓

**Tests**: Not explicitly requested in specification - tests are omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and configure project structure

- [X] T001 [P] Install Dialog shadcn component: `cd frontend && npx shadcn-ui@latest add dialog`
- [X] T002 [P] Install Select shadcn component: `cd frontend && npx shadcn-ui@latest add select`
- [X] T003 [P] Install Badge shadcn component: `cd frontend && npx shadcn-ui@latest add badge`
- [X] T004 [P] Install Skeleton shadcn component: `cd frontend && npx shadcn-ui@latest add skeleton`
- [X] T005 Create activities component directory: `mkdir -p frontend/src/components/activities`

**Checkpoint**: All 4 shadcn components installed, activities directory created

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Types, constants, and data fetching hook that ALL user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [X] T006 Add FilterState interface and filter constants to `frontend/src/types/index.ts` (CATEGORY_OPTIONS, DURATION_OPTIONS, COMPLEXITY_OPTIONS, CATEGORY_LABELS, COMPLEXITY_LABELS)
- [X] T007 Create useActivities TanStack Query hook in `frontend/src/hooks/useActivities.ts` with staleTime: Infinity, fetch from public_activities table
- [X] T008 [P] Create EmptyState component in `frontend/src/components/activities/EmptyState.tsx` (handles no-results, no-activities, error types)
- [X] T009 Create barrel export in `frontend/src/components/activities/index.ts`

**Checkpoint**: Foundation ready - types defined, data fetching hook created, empty state component available

---

## Phase 3: User Story 1 - Browse Activity Library (Priority: P1)

**Goal**: Display all public activities in a responsive grid layout with loading states

**Independent Test**: Load /activities page, verify activities display in responsive grid with title, description, duration, complexity visible on cards

**Acceptance Criteria**:
- AC1.1: Authenticated user navigates to library → sees grid of activity cards
- AC1.2: While loading → user sees skeleton loading indicator
- AC1.3: Activities display → each card shows title, truncated description, duration, complexity

### Implementation for User Story 1

- [X] T010 [US1] Create ActivityCard component in `frontend/src/components/activities/ActivityCard.tsx` showing title, description (truncated to ~100 chars), duration badge, complexity badge, category badge
- [X] T011 [US1] Create ActivityGrid component in `frontend/src/components/activities/ActivityGrid.tsx` with responsive CSS grid (1 col mobile, 2 col tablet, 3 col desktop)
- [X] T012 [US1] Create ActivityLibrary page in `frontend/src/pages/ActivityLibrary.tsx` with useActivities hook, loading skeleton, error handling, and ActivityGrid display
- [X] T013 [US1] Add /activities route to `frontend/src/App.tsx` wrapped in ProtectedRoute and Layout
- [X] T014 [US1] Update barrel export in `frontend/src/components/activities/index.ts` with ActivityCard, ActivityGrid

**Checkpoint**: User Story 1 complete - users can browse all activities in a responsive grid with loading states

---

## Phase 4: User Story 2 - Filter Activities (Priority: P2)

**Goal**: Allow users to filter activities by category, duration, and complexity client-side

**Independent Test**: Select filter options, verify displayed activities update immediately to show only matching results

**Acceptance Criteria**:
- AC2.1: User selects category filter → only activities with that category shown
- AC2.2: User selects duration filter → only activities with that duration shown
- AC2.3: User selects complexity filter → only activities with that complexity shown
- AC2.4: Multiple filters with no matches → empty state with "Clear filters" button

### Implementation for User Story 2

- [X] T015 [US2] Create ActivityFilters component in `frontend/src/components/activities/ActivityFilters.tsx` with Select dropdowns for category, duration, complexity, and "Clear filters" button
- [X] T016 [US2] Add useState for FilterState and useMemo for filteredActivities in `frontend/src/pages/ActivityLibrary.tsx`
- [X] T017 [US2] Integrate ActivityFilters component into ActivityLibrary page, pass filters state and onChange handlers
- [X] T018 [US2] Add result count display and empty state for "no results" scenario in ActivityLibrary page
- [X] T019 [US2] Update barrel export in `frontend/src/components/activities/index.ts` with ActivityFilters

**Checkpoint**: User Story 2 complete - users can filter activities with instant client-side filtering (<100ms)

---

## Phase 5: User Story 3 - View Activity Details (Priority: P3)

**Goal**: Display full activity details in a modal when user clicks "View Details"

**Independent Test**: Click "View Details" on activity card, verify modal opens with complete activity information

**Acceptance Criteria**:
- AC3.1: User clicks "View Details" → modal opens with full activity info (title, full description, required_tools, instructions, duration, complexity)
- AC3.2: User clicks outside modal or close button → modal closes
- AC3.3: User clicks "Customize for My Team" in modal → navigates to customization placeholder

### Implementation for User Story 3

- [X] T020 [US3] Create ActivityDetailModal component in `frontend/src/components/activities/ActivityDetailModal.tsx` using shadcn Dialog with all activity fields displayed
- [X] T021 [US3] Add useState for selectedActivity in `frontend/src/pages/ActivityLibrary.tsx` to control modal open/close
- [X] T022 [US3] Add "View Details" button to ActivityCard component, wire up onViewDetails callback
- [X] T023 [US3] Integrate ActivityDetailModal into ActivityLibrary page with open/close handling
- [X] T024 [US3] Update barrel export in `frontend/src/components/activities/index.ts` with ActivityDetailModal

**Checkpoint**: User Story 3 complete - users can view full activity details in modal

---

## Phase 6: User Story 4 - Initiate Activity Customization (Priority: P4)

**Goal**: Navigate to customization placeholder when user clicks "Customize for My Team"

**Independent Test**: Click "Customize for My Team" button, verify navigation to /customize/:activityId with "Coming Soon" message

**Acceptance Criteria**:
- AC4.1: User clicks "Customize for My Team" → navigates to `/customize/:activityId`
- AC4.2: Placeholder page loads → shows "Coming Soon" message with activity title and link back to library

### Implementation for User Story 4

- [X] T025 [US4] Create CustomizePlaceholder page in `frontend/src/pages/CustomizePlaceholder.tsx` with useParams to get activityId, "Coming Soon" message, activity title display, and "Back to Library" link
- [X] T026 [US4] Add /customize/:activityId route to `frontend/src/App.tsx` wrapped in ProtectedRoute and Layout
- [X] T027 [US4] Add "Customize for My Team" button to ActivityCard with navigation to /customize/:id
- [X] T028 [US4] Add "Customize for My Team" button to ActivityDetailModal with navigation to /customize/:id

**Checkpoint**: User Story 4 complete - users can initiate customization flow (placeholder)

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final integration, navigation, and verification

- [X] T029 Add "Activities" navigation link to `frontend/src/components/layout/Navbar.tsx` linking to /activities
- [X] T030 Verify responsive grid behavior (1/2/3 columns) across breakpoints
- [X] T031 Verify loading skeleton displays correctly during fetch
- [X] T032 Verify error state displays with retry button on network failure
- [X] T033 Run TypeScript type check: `cd frontend && npm run build`
- [X] T034 Run verification checklist from quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User stories can proceed in priority order (P1 → P2 → P3 → P4)
  - Some parallelization possible within stories
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after US1 (needs ActivityLibrary page to add filters to)
- **User Story 3 (P3)**: Can start after US1 (needs ActivityCard to add "View Details" to)
- **User Story 4 (P4)**: Can start after US3 (needs modal to add "Customize" button to)

### Within Each User Story

- Components before page integration
- Page modifications before route additions
- Core implementation before polish tasks

### Parallel Opportunities

- All Setup tasks (T001-T004) can run in parallel
- T007 (hook) and T008 (EmptyState) can run in parallel after T006 (types)
- Within US3: T020 (modal) can start while T021-T022 are pending

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T005)
2. Complete Phase 2: Foundational (T006-T009)
3. Complete Phase 3: User Story 1 (T010-T014)
4. **STOP and VALIDATE**: Test browsing functionality independently
5. Deploy/demo if ready

### Full Feature Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently (can users browse?)
3. Add User Story 2 → Test independently (can users filter?)
4. Add User Story 3 → Test independently (can users view details?)
5. Add User Story 4 → Test independently (can users initiate customization?)
6. Complete Polish → Final verification

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Verify each checkpoint before proceeding to next phase
- Commit after each task or logical group
- Client-side filtering must complete in <100ms (per SC-004)
- Page load must complete in <3 seconds (per SC-002)
