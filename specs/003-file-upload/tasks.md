# Tasks: Team Materials Upload

**Input**: Design documents from `/specs/003-file-upload/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not included (not requested in feature specification)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `frontend/src/` for React components, `backend/app/` for FastAPI
- Backend API already exists - this feature is frontend-only

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and create project structure for Materials feature

- [X] T001 Install react-dropzone dependency via `npm install react-dropzone` in frontend/
- [X] T002 Create materials components directory at frontend/src/components/materials/
- [X] T003 [P] Add Material types to frontend/src/types/index.ts (Material, UploadMaterialResponse, file type constants)
- [X] T004 [P] Add materials API functions to frontend/src/lib/api.ts (uploadMaterial, getTeamMaterials, deleteMaterial)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Create MaterialsRoute wrapper component in frontend/src/components/layout/MaterialsRoute.tsx (checks role + subscription)
- [X] T006 Add /materials route to frontend/src/App.tsx with ProtectedRoute and MaterialsRoute wrappers
- [X] T007 Add Materials navigation link to frontend/src/components/layout/Navbar.tsx (visible only for managers/admins)
- [X] T008 Create barrel export file at frontend/src/components/materials/index.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Upload Team Materials (Priority: P1) 🎯 MVP

**Goal**: Allow managers/admins to upload PDF, DOCX, PPTX, XLSX files via drag-and-drop with progress indicator

**Independent Test**: Drag a PDF file onto dropzone → see progress bar → file appears in list after completion

### Implementation for User Story 1

- [X] T009 [P] [US1] Create FileDropzone component with react-dropzone in frontend/src/components/materials/FileDropzone.tsx
- [X] T010 [P] [US1] Create UploadProgress component with progress bar in frontend/src/components/materials/UploadProgress.tsx
- [X] T011 [US1] Create useUploadMaterial hook with XHR progress tracking in frontend/src/hooks/useUploadMaterial.ts
- [X] T012 [US1] Create Materials page scaffold with dropzone and upload state in frontend/src/pages/Materials.tsx
- [X] T013 [US1] Integrate FileDropzone with useUploadMaterial hook for complete upload flow in frontend/src/pages/Materials.tsx
- [X] T014 [US1] Add file type validation (PDF, DOCX, PPTX, XLSX) in FileDropzone with error messages
- [X] T015 [US1] Add file size validation (10MB max) in FileDropzone with error messages
- [X] T016 [US1] Add retry button in UploadProgress component for network failure recovery in frontend/src/components/materials/UploadProgress.tsx
- [X] T017 [US1] Update barrel export with FileDropzone and UploadProgress in frontend/src/components/materials/index.ts

**Checkpoint**: At this point, User Story 1 should be fully functional - users can upload files with progress

---

## Phase 4: User Story 2 - View Uploaded Materials (Priority: P2)

**Goal**: Display all team materials in a card-based list with file type icons and AI-generated summaries

**Independent Test**: Navigate to /materials → see list of uploaded materials with icons and summaries

### Implementation for User Story 2

- [X] T018 [P] [US2] Create MaterialCard component with file icon, name, date, summary preview in frontend/src/components/materials/MaterialCard.tsx
- [X] T019 [P] [US2] Create MaterialsList component with loading skeleton and empty state in frontend/src/components/materials/MaterialsList.tsx
- [X] T020 [US2] Create useTeamMaterials hook with TanStack Query in frontend/src/hooks/useTeamMaterials.ts
- [X] T021 [US2] Add file type icon mapping (PDF=red, DOCX=blue, PPTX=orange, XLSX=green) to MaterialCard component
- [X] T022 [US2] Integrate MaterialsList into Materials page with useTeamMaterials hook in frontend/src/pages/Materials.tsx
- [X] T023 [US2] Create empty state UI for when no materials exist in MaterialsList component
- [X] T024 [US2] Add TanStack Query cache invalidation after successful upload in useUploadMaterial hook
- [X] T025 [US2] Update barrel export with MaterialCard and MaterialsList in frontend/src/components/materials/index.ts

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - upload and view materials

---

## Phase 5: User Story 3 - Delete Materials (Priority: P3)

**Goal**: Allow managers/admins to delete materials with a confirmation dialog

**Independent Test**: Click delete on a material → see confirmation dialog → confirm → material removed from list

### Implementation for User Story 3

- [X] T026 [US3] Create useDeleteMaterial hook with TanStack Query mutation in frontend/src/hooks/useDeleteMaterial.ts
- [X] T027 [US3] Add delete button to MaterialCard component in frontend/src/components/materials/MaterialCard.tsx
- [X] T028 [US3] Create DeleteConfirmDialog using AlertDialog from shadcn/ui in frontend/src/components/materials/MaterialCard.tsx
- [X] T029 [US3] Integrate delete functionality with confirmation into MaterialsList in frontend/src/components/materials/MaterialsList.tsx
- [X] T030 [US3] Add TanStack Query cache invalidation after successful delete in useDeleteMaterial hook
- [X] T031 [US3] Add loading state to delete button while deletion in progress

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T032 [P] Add error toast notifications for upload/delete failures using existing toast system
- [ ] T033 [P] Add success toast notifications for upload/delete success
- [X] T034 Add loading states during initial materials fetch in Materials page
- [X] T035 Run quickstart.md verification checklist to validate all functionality
- [X] T036 Test complete flow: upload → view → delete as manager role

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can proceed in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Builds on US1 (uses upload result for cache invalidation)
- **User Story 3 (P3)**: Can start after US2 (needs MaterialCard from US2)

### Within Each User Story

- Components before hooks that use them
- Hooks before pages that integrate them
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

**Phase 1 (Setup):**
```bash
# Can run in parallel:
Task T003: "Add Material types to frontend/src/types/index.ts"
Task T004: "Add materials API functions to frontend/src/lib/api.ts"
```

**Phase 3 (User Story 1):**
```bash
# Can run in parallel:
Task T009: "Create FileDropzone component in frontend/src/components/materials/FileDropzone.tsx"
Task T010: "Create UploadProgress component in frontend/src/components/materials/UploadProgress.tsx"
```

**Phase 4 (User Story 2):**
```bash
# Can run in parallel:
Task T018: "Create MaterialCard component in frontend/src/components/materials/MaterialCard.tsx"
Task T019: "Create MaterialsList component in frontend/src/components/materials/MaterialsList.tsx"
```

**Phase 6 (Polish):**
```bash
# Can run in parallel:
Task T032: "Add error toast notifications"
Task T033: "Add success toast notifications"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T008)
3. Complete Phase 3: User Story 1 (T009-T017)
4. **STOP and VALIDATE**: Test upload with progress independently
5. Deploy/demo if ready - core value delivered!

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test upload → Deploy (MVP!)
3. Add User Story 2 → Test view list → Deploy
4. Add User Story 3 → Test delete → Deploy
5. Add Polish → Final validation → Ship!

### Task Count Summary

| Phase | Tasks | Parallel Tasks |
|-------|-------|----------------|
| Phase 1: Setup | 4 | 2 |
| Phase 2: Foundational | 4 | 0 |
| Phase 3: US1 Upload | 9 | 2 |
| Phase 4: US2 View | 8 | 2 |
| Phase 5: US3 Delete | 6 | 0 |
| Phase 6: Polish | 5 | 2 |
| **Total** | **36** | **8** |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Backend API already exists - no backend tasks needed
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- File validation (US4 in spec) is integrated into US1 since it's critical for upload UX
