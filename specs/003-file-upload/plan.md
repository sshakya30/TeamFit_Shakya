# Implementation Plan: Team Materials Upload

**Branch**: `003-file-upload` | **Date**: 2025-11-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-file-upload/spec.md`

## Summary

Implement a Materials page allowing team managers and admins (with paid subscriptions) to upload documents (PDF, DOCX, PPTX, XLSX up to 10MB) via drag-and-drop or file browser. The page displays uploaded materials in a card-based list with AI-generated summaries, file type icons, and delete functionality with confirmation dialogs.

**Technical Approach**: Build frontend-only React components using react-dropzone for file handling, TanStack Query for data fetching/mutations, and existing shadcn/ui components. The backend API endpoints already exist (`/api/materials/upload`, `/api/materials/{team_id}`, `/api/materials/{material_id}`).

## Technical Context

**Language/Version**: TypeScript 5.x, React 18.x
**Primary Dependencies**: React, TanStack Query, react-dropzone (new), shadcn/ui (existing), Clerk (existing)
**Storage**: Supabase Storage (via backend API - no direct frontend access)
**Testing**: Vitest (existing setup)
**Target Platform**: Web (modern browsers)
**Project Type**: Web application (frontend + backend)
**Performance Goals**: Upload progress visible within 100ms, materials list loads within 1s
**Constraints**: Max file size 10MB, max team storage 50MB (enforced by backend)
**Scale/Scope**: Single new page with 5 components, 3 custom hooks, 1 type definition file

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Event-Driven Architecture | ✅ PASS | AI summary generation is async (backend handles via Celery); frontend uses TanStack Query for reactive updates |
| II. Product Robustness | ✅ PASS | Error handling for upload failures, network issues, validation errors; retry via re-upload |
| III. Security Implementation | ✅ PASS | Role-based access (manager/admin only); subscription validation on backend; file validation client + server side |
| IV. Separation of Concerns | ✅ PASS | Components for UI, hooks for data, pages for routing; follows existing patterns |
| V. Logging System | ✅ PASS | Backend already logs uploads; frontend console logs for dev debugging |
| VI. Input Validation | ✅ PASS | Client-side file type/size validation; server-side re-validation; Pydantic models on backend |
| VII. Code Simplicity | ✅ PASS | Small focused components; max ~50 lines per component; composition pattern |
| VIII. Code Documentation | ✅ PASS | JSDoc comments for hooks and complex logic; TypeScript types for all interfaces |

**Gate Result**: PASS - Proceed to Phase 0

## Project Structure

### Documentation (this feature)

```text
specs/003-file-upload/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── contracts/           # Phase 1 output (API contracts)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── pages/
│   │   └── Materials.tsx              # NEW - Main materials page
│   ├── components/
│   │   └── materials/                 # NEW folder
│   │       ├── index.ts               # Barrel export
│   │       ├── FileDropzone.tsx       # Drag-drop upload area
│   │       ├── UploadProgress.tsx     # Upload progress indicator
│   │       ├── MaterialsList.tsx      # List container with empty state
│   │       └── MaterialCard.tsx       # Individual material display
│   ├── hooks/
│   │   ├── useUploadMaterial.ts       # NEW - Upload mutation hook
│   │   └── useTeamMaterials.ts        # NEW - Fetch materials query hook
│   ├── lib/
│   │   └── api.ts                     # MODIFY - Add materials API functions
│   └── types/
│       └── index.ts                   # MODIFY - Add Material interface
├── App.tsx                            # MODIFY - Add /materials route
└── package.json                       # MODIFY - Add react-dropzone

backend/
└── app/routers/materials.py           # EXISTS - No changes needed
```

**Structure Decision**: Web application structure, following existing patterns. All new files in frontend only; backend already complete.

## Complexity Tracking

No violations - all Constitution gates pass.
