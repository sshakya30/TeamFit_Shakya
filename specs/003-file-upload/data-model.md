# Data Model: Team Materials Upload

**Feature**: 003-file-upload
**Date**: 2025-11-28

## Entity Definitions

### Material (Frontend Type)

```typescript
/**
 * Uploaded material file record
 * Maps to `uploaded_materials` table in Supabase
 */
export interface Material {
  id: string;
  team_id: string;
  organization_id: string;
  file_name: string;
  file_type: 'pdf' | 'docx' | 'pptx' | 'xlsx';
  file_size_bytes: number;
  file_url: string;
  storage_path: string | null;
  extracted_text: string | null;
  content_summary: string | null;
  uploaded_by: string;
  created_at: string | null;
}
```

### Upload Response

```typescript
/**
 * Response from POST /api/materials/upload
 */
export interface UploadMaterialResponse {
  material_id: string;
  file_name: string;
  content_summary: string;
  storage_url: string;
  file_size_bytes: number;
}
```

### Upload Progress State

```typescript
/**
 * Local state for tracking upload progress
 * Used by useUploadMaterial hook
 */
export interface UploadProgressState {
  file: File;
  progress: number;        // 0-100
  status: 'pending' | 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}
```

### File Validation

```typescript
/**
 * Allowed file types with MIME mappings
 */
export const ALLOWED_FILE_TYPES: Record<string, string> = {
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
};

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
```

### File Type Icons

```typescript
/**
 * Icon mapping for material file types
 */
export const FILE_TYPE_ICONS: Record<string, string> = {
  pdf: 'FileText',      // lucide-react icon name
  docx: 'FileText',
  pptx: 'Presentation',
  xlsx: 'Sheet',
};

export const FILE_TYPE_COLORS: Record<string, string> = {
  pdf: 'text-red-500',
  docx: 'text-blue-500',
  pptx: 'text-orange-500',
  xlsx: 'text-green-500',
};
```

---

## Database Schema

### Table: `uploaded_materials`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| team_id | uuid | NO | - | FK to teams.id |
| organization_id | uuid | NO | - | FK to organizations.id |
| file_name | text | NO | - | Original filename |
| file_type | text | NO | - | File extension (pdf, docx, etc.) |
| file_size_bytes | integer | NO | - | File size in bytes |
| file_url | text | NO | - | Public URL for file access |
| storage_path | text | YES | - | Path in Supabase Storage |
| extracted_text | text | YES | - | Extracted text content (first 10k chars) |
| content_summary | text | YES | - | AI-generated summary |
| uploaded_by | uuid | NO | - | FK to users.id |
| created_at | timestamptz | YES | now() | Upload timestamp |

**Relationships:**
- `team_id` → `teams.id` (many-to-one)
- `organization_id` → `organizations.id` (many-to-one)
- `uploaded_by` → `users.id` (many-to-one)

---

## API Contracts

### POST /api/materials/upload

**Request:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| team_id | string | Yes | UUID of the team |
| organization_id | string | Yes | UUID of the organization |
| file | File | Yes | The file to upload |

**Response:** `200 OK`

```json
{
  "material_id": "uuid",
  "file_name": "document.pdf",
  "content_summary": "This document covers...",
  "storage_url": "https://...",
  "file_size_bytes": 1234567
}
```

**Error Responses:**

| Status | Condition |
|--------|-----------|
| 400 | Invalid file type, file too large, empty content |
| 403 | No paid subscription |
| 500 | Storage or database error |

---

### GET /api/materials/{team_id}

**Response:** `200 OK`

```json
[
  {
    "id": "uuid",
    "team_id": "uuid",
    "organization_id": "uuid",
    "file_name": "document.pdf",
    "file_type": "pdf",
    "file_size_bytes": 1234567,
    "file_url": "https://...",
    "storage_path": "org_id/team_id/document.pdf",
    "extracted_text": "...",
    "content_summary": "This document covers...",
    "uploaded_by": "uuid",
    "created_at": "2025-11-28T10:00:00Z"
  }
]
```

---

### DELETE /api/materials/{material_id}

**Response:** `200 OK`

```json
{
  "message": "Material deleted successfully"
}
```

**Error Responses:**

| Status | Condition |
|--------|-----------|
| 404 | Material not found |
| 500 | Deletion failed |

---

## Component Props Types

```typescript
/**
 * Props for FileDropzone component
 */
export interface FileDropzoneProps {
  onFilesAccepted: (files: File[]) => void;
  onFilesRejected: (errors: FileRejection[]) => void;
  disabled?: boolean;
  maxSize?: number;
  accept?: Record<string, string[]>;
}

/**
 * Props for UploadProgress component
 */
export interface UploadProgressProps {
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
  onCancel?: () => void;
}

/**
 * Props for MaterialCard component
 */
export interface MaterialCardProps {
  material: Material;
  onDelete: (materialId: string) => void;
  isDeleting?: boolean;
}

/**
 * Props for MaterialsList component
 */
export interface MaterialsListProps {
  materials: Material[];
  isLoading: boolean;
  onDeleteMaterial: (materialId: string) => void;
  deletingId?: string | null;
}
```

---

## Hook Return Types

```typescript
/**
 * Return type for useUploadMaterial hook
 */
export interface UseUploadMaterialReturn {
  upload: (file: File, teamId: string, organizationId: string) => Promise<UploadMaterialResponse>;
  progress: number;
  isUploading: boolean;
  error: Error | null;
  reset: () => void;
}

/**
 * Return type for useTeamMaterials hook
 */
export interface UseTeamMaterialsReturn {
  data: Material[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Return type for useDeleteMaterial hook
 */
export interface UseDeleteMaterialReturn {
  mutate: (materialId: string) => void;
  isLoading: boolean;
  error: Error | null;
}
```

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Materials Page                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────┐         ┌──────────────────────────────────┐  │
│  │  FileDropzone   │         │         MaterialsList            │  │
│  │                 │         │                                  │  │
│  │  react-dropzone │         │  ┌────────────┐ ┌────────────┐  │  │
│  │  validation     │         │  │MaterialCard│ │MaterialCard│  │  │
│  │                 │         │  └────────────┘ └────────────┘  │  │
│  └────────┬────────┘         └──────────────────────────────────┘  │
│           │                                                         │
│           │ onFilesAccepted                                        │
│           ▼                                                         │
│  ┌─────────────────┐                                               │
│  │ UploadProgress  │                                               │
│  │                 │                                               │
│  │ XHR + onprogress│                                               │
│  └────────┬────────┘                                               │
│           │                                                         │
└───────────┼─────────────────────────────────────────────────────────┘
            │
            ▼
┌───────────────────────────────────────────────────────────────────┐
│                    Backend API                                     │
│  POST /api/materials/upload                                        │
│  - Validates subscription                                          │
│  - Validates file type/size                                        │
│  - Checks storage quota                                            │
│  - Extracts text content                                           │
│  - Generates AI summary                                            │
│  - Uploads to Supabase Storage                                     │
│  - Creates database record                                         │
└───────────────────────────────────────────────────────────────────┘
            │
            ▼
┌───────────────────────────────────────────────────────────────────┐
│                  Supabase                                          │
│  ┌─────────────────────┐    ┌─────────────────────┐               │
│  │ uploaded_materials  │    │   Supabase Storage  │               │
│  │ (database table)    │    │   (team-materials)  │               │
│  └─────────────────────┘    └─────────────────────┘               │
└───────────────────────────────────────────────────────────────────┘
```

---

## Validation Rules

| Rule | Client-Side | Server-Side |
|------|-------------|-------------|
| File type (PDF, DOCX, PPTX, XLSX) | react-dropzone `accept` prop | FileService.validate_file() |
| File size (max 10MB) | react-dropzone `maxSize` prop | FileService.validate_file() |
| Team storage quota (50MB) | N/A | Backend checks before upload |
| Subscription status (paid only) | MaterialsRoute guard | Backend validates subscription |
| User role (manager/admin) | MaterialsRoute guard | Backend can enforce via RLS |
| Non-empty content | N/A | Backend checks extracted text |
