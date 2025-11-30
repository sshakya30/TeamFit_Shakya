# Tasks: Custom Activity Generation

**Input**: Design documents from `/specs/004-custom-generation/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Tests**: No automated tests requested in specification. Manual testing checklist in quickstart.md.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `frontend/src/` for all new files
- Hooks in `frontend/src/hooks/`
- Components in `frontend/src/components/generate/`
- Pages in `frontend/src/pages/`
- Types in `frontend/src/types/index.ts`
- API functions in `frontend/src/lib/api.ts`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and folder structure

- [X] T001 Create `frontend/src/components/generate/` directory for new components

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core types, API functions, and hooks that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T002 Add generation request/response types (GenerateCustomActivitiesRequest, GenerateCustomActivitiesResponse, JobStatusResponse, CustomizationJob, GenerationPageState, GenerationErrorType, GenerationFormState) to `frontend/src/types/index.ts`
- [X] T003 Add component props types (RequirementsSectionProps, MaterialsSectionProps, GenerationProgressProps, GeneratedActivityCardProps, GenerationResultsProps) to `frontend/src/types/index.ts`
- [X] T004 [P] Add `generateCustomActivities` API function to `frontend/src/lib/api.ts`
- [X] T005 [P] Add `getJobStatus` API function to `frontend/src/lib/api.ts`
- [X] T006 Create `useGenerateActivities` TanStack Query mutation hook in `frontend/src/hooks/useGenerateActivities.ts`
- [X] T007 Create `useJobStatus` TanStack Query hook with 5-second polling in `frontend/src/hooks/useJobStatus.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Generate Custom Activities (Priority: P1) 🎯 MVP

**Goal**: Allow managers/admins to enter requirements and submit generation request, see progress indicator

**Independent Test**: Navigate to /generate, enter requirements (10+ chars), click Generate, verify progress indicator appears

### Implementation for User Story 1

- [X] T008 [P] [US1] Create RequirementsSection component with textarea (10-2000 char validation), character count, error display in `frontend/src/components/generate/RequirementsSection.tsx`
- [X] T009 [P] [US1] Create GenerationProgress component with animated progress indicator, elapsed time display, status message in `frontend/src/components/generate/GenerationProgress.tsx`
- [X] T010 [US1] Create GenerateActivity page with idle/submitting/polling states, form validation, quota display in `frontend/src/pages/GenerateActivity.tsx`
- [X] T011 [US1] Add /generate route wrapped with OnboardingRoute and MaterialsRoute in `frontend/src/App.tsx`

**Checkpoint**: User Story 1 complete - can submit requirements and see progress

---

## Phase 4: User Story 2 - View Generated Activities (Priority: P1)

**Goal**: Display 3 generated activities with full details when job completes, show success celebration

**Independent Test**: After job completes, verify 3 activity cards display with title, description, duration, complexity, tools, instructions

### Implementation for User Story 2

- [X] T012 [P] [US2] Create GeneratedActivityCard component displaying title, description, duration, complexity, required_tools, instructions in `frontend/src/components/generate/GeneratedActivityCard.tsx`
- [X] T013 [US2] Create GenerationResults component with success celebration, activity cards grid, "Generate More" button in `frontend/src/components/generate/GenerationResults.tsx`
- [X] T014 [US2] Update GenerateActivity page to handle completed state, display GenerationResults component, show "X of 3 activities generated" message if fewer than 3 activities returned in `frontend/src/pages/GenerateActivity.tsx`

**Checkpoint**: User Stories 1 & 2 complete - core generation flow works end-to-end

---

## Phase 5: User Story 3 - Select Materials for Context (Priority: P2)

**Goal**: Allow optional selection of team materials to include in generation request

**Independent Test**: Navigate to /generate, verify materials list loads with checkboxes, select materials, verify selection persists on submit

### Implementation for User Story 3

- [X] T015 [US3] Create MaterialsSection component with checkbox list using useTeamMaterials hook, empty state, loading state in `frontend/src/components/generate/MaterialsSection.tsx`
- [X] T016 [US3] Update GenerateActivity page to include MaterialsSection, pass selectedMaterialIds to generation request in `frontend/src/pages/GenerateActivity.tsx`

**Checkpoint**: User Story 3 complete - material selection functional

---

## Phase 6: User Story 4 - Save Generated Activities (Priority: P2)

**Goal**: Allow users to save individual generated activities to their team library

**Independent Test**: After generation, click Save on an activity card, verify button updates to "Saved", verify activity status changes to "saved"

### Implementation for User Story 4

- [X] T017 [US4] Update GeneratedActivityCard component with Save button, saving/saved states using useSaveActivity hook in `frontend/src/components/generate/GeneratedActivityCard.tsx`
- [X] T018 [US4] Update GenerationResults component to track savedActivityIds, pass save handler to cards in `frontend/src/components/generate/GenerationResults.tsx`

**Checkpoint**: User Story 4 complete - activities can be saved

---

## Phase 7: User Story 5 - Handle Generation Errors (Priority: P2)

**Goal**: Display clear error messages for job failures and timeouts with retry option

**Independent Test**: Simulate job failure/timeout, verify error message displays, click Retry, verify new job starts

### Implementation for User Story 5

- [X] T019 [US5] Update GenerateActivity page with error state handling, 2-minute timeout check, retry button, error display using Alert component in `frontend/src/pages/GenerateActivity.tsx`
- [X] T020 [US5] Update useJobStatus hook to support error state, reset functionality, and auto-retry polling up to 3 times on network failure before showing reconnection error in `frontend/src/hooks/useJobStatus.ts`

**Checkpoint**: User Story 5 complete - error handling functional

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Navigation integration and final polish

- [X] T021 Add "Generate Custom" button/link to Activity Library page header in `frontend/src/pages/ActivityLibrary.tsx`
- [X] T022 Verify quota display shows custom_used/custom_limit from useQuota hook in GenerateActivity page
- [X] T023 Run quickstart.md manual testing checklist for full verification
- [X] T024 Code cleanup: ensure all components have JSDoc comments and proper TypeScript types

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - US1 and US2 are both P1 and can proceed in sequence or parallel
  - US3, US4, US5 are P2 and depend on US1+US2 for context
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

| Story | Priority | Depends On | Can Start After |
|-------|----------|------------|-----------------|
| US1 - Generate Activities | P1 | Foundational | Phase 2 |
| US2 - View Activities | P1 | US1 | Phase 3 |
| US3 - Select Materials | P2 | Foundational | Phase 2 |
| US4 - Save Activities | P2 | US2 | Phase 4 |
| US5 - Error Handling | P2 | US1 | Phase 3 |

### Parallel Opportunities

**Within Phase 2 (Foundational):**
- T004 and T005 (API functions) can run in parallel

**Within Phase 3 (US1):**
- T008 and T009 (RequirementsSection and GenerationProgress) can run in parallel

**Across User Stories:**
- US3 (Materials) can be developed in parallel with US1/US2 if desired
- US5 (Error Handling) can start after US1 is complete

---

## Parallel Example: Phase 2 Foundational

```bash
# Launch API function tasks in parallel:
Task: "Add generateCustomActivities API function to frontend/src/lib/api.ts"
Task: "Add getJobStatus API function to frontend/src/lib/api.ts"
```

## Parallel Example: User Story 1 Components

```bash
# Launch component tasks in parallel:
Task: "Create RequirementsSection component in frontend/src/components/generate/RequirementsSection.tsx"
Task: "Create GenerationProgress component in frontend/src/components/generate/GenerationProgress.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup (1 task)
2. Complete Phase 2: Foundational (6 tasks)
3. Complete Phase 3: User Story 1 (4 tasks)
4. Complete Phase 4: User Story 2 (3 tasks)
5. **STOP and VALIDATE**: Test generation flow end-to-end
6. Deploy/demo if ready - core feature is functional!

### Full Feature (All User Stories)

1. Complete MVP (Phases 1-4)
2. Add Phase 5: User Story 3 - Materials (2 tasks)
3. Add Phase 6: User Story 4 - Save (2 tasks)
4. Add Phase 7: User Story 5 - Errors (2 tasks)
5. Add Phase 8: Polish (4 tasks)

### Task Counts by Phase

| Phase | Description | Tasks |
|-------|-------------|-------|
| 1 | Setup | 1 |
| 2 | Foundational | 6 |
| 3 | US1 - Generate | 4 |
| 4 | US2 - View | 3 |
| 5 | US3 - Materials | 2 |
| 6 | US4 - Save | 2 |
| 7 | US5 - Errors | 2 |
| 8 | Polish | 4 |
| **Total** | | **24** |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Existing hooks (useUser, useTeamMaterials, useQuota, useSaveActivity) are reused - no new hooks for those
- Backend APIs already exist - no backend changes required
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
