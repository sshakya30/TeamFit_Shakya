# Quickstart: Team Materials Upload

**Feature**: 003-file-upload
**Date**: 2025-11-28

## Prerequisites

- Node.js 18+ and npm
- Backend server running (`uv run uvicorn app.main:app --reload --port 8000`)
- Frontend dev server (`npm run dev`)
- Supabase project with `uploaded_materials` table
- Supabase Storage bucket `team-materials` configured

## Setup Steps

### 1. Install Dependencies

```bash
cd frontend
npm install react-dropzone
```

### 2. Add Material Types

Add to `frontend/src/types/index.ts`:

```typescript
// ============================================================================
// Materials Types
// ============================================================================

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

export interface UploadMaterialResponse {
  material_id: string;
  file_name: string;
  content_summary: string;
  storage_url: string;
  file_size_bytes: number;
}

export const ALLOWED_FILE_TYPES: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
};

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
```

### 3. Add API Functions

Add to `frontend/src/lib/api.ts`:

```typescript
import { Material, UploadMaterialResponse } from '@/types';

export async function uploadMaterial(
  file: File,
  teamId: string,
  organizationId: string,
  token: string,
  onProgress?: (percent: number) => void
): Promise<UploadMaterialResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(JSON.parse(xhr.responseText).detail || 'Upload failed'));
      }
    };

    xhr.onerror = () => reject(new Error('Network error'));

    const formData = new FormData();
    formData.append('file', file);
    formData.append('team_id', teamId);
    formData.append('organization_id', organizationId);

    xhr.open('POST', `${API_URL}/api/materials/upload`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
  });
}

export async function getTeamMaterials(teamId: string, token: string): Promise<Material[]> {
  const response = await fetch(`${API_URL}/api/materials/${teamId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to fetch materials');
  return response.json();
}

export async function deleteMaterial(materialId: string, token: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/materials/${materialId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to delete material');
}
```

### 4. Create Components Directory

```bash
mkdir -p frontend/src/components/materials
```

### 5. Add Route

Add to `frontend/src/App.tsx`:

```typescript
import Materials from '@/pages/Materials';

// In routes array:
<Route path="/materials" element={
  <ProtectedRoute>
    <MaterialsRoute>
      <Materials />
    </MaterialsRoute>
  </ProtectedRoute>
} />
```

### 6. Add Navigation Link

Add to `frontend/src/components/layout/Navbar.tsx` (for managers/admins only):

```typescript
{(userRole === 'manager' || userRole === 'admin') && (
  <Link to="/materials">Materials</Link>
)}
```

## Verification Steps

1. **Install dependency**: `npm install react-dropzone` completes without errors
2. **Build passes**: `npm run build` completes successfully
3. **Route accessible**: Navigate to `/materials` as a manager/admin
4. **Dropzone renders**: File dropzone area visible with dashed border
5. **File validation**: Dragging unsupported file shows error message
6. **Upload works**: Valid file uploads with progress indicator
7. **Materials list**: Uploaded material appears in list with summary
8. **Delete works**: Can delete material with confirmation dialog

## Component Checklist

| Component | File | Status |
|-----------|------|--------|
| Materials page | `pages/Materials.tsx` | TODO |
| FileDropzone | `components/materials/FileDropzone.tsx` | TODO |
| UploadProgress | `components/materials/UploadProgress.tsx` | TODO |
| MaterialsList | `components/materials/MaterialsList.tsx` | TODO |
| MaterialCard | `components/materials/MaterialCard.tsx` | TODO |
| MaterialsRoute | `components/layout/MaterialsRoute.tsx` | TODO |
| useUploadMaterial | `hooks/useUploadMaterial.ts` | TODO |
| useTeamMaterials | `hooks/useTeamMaterials.ts` | TODO |
| Barrel export | `components/materials/index.ts` | TODO |

## Files to Modify

| File | Change |
|------|--------|
| `types/index.ts` | Add Material types |
| `lib/api.ts` | Add materials API functions |
| `App.tsx` | Add /materials route |
| `components/layout/Navbar.tsx` | Add Materials nav link |
| `package.json` | Add react-dropzone |

## Testing Checklist

- [ ] Navigate to /materials as manager - should load
- [ ] Navigate to /materials as member - should redirect
- [ ] Drag PDF file - should upload with progress
- [ ] Drag .exe file - should show error
- [ ] Drag 15MB file - should show size error
- [ ] View materials list - should show all team materials
- [ ] Click delete - should show confirmation dialog
- [ ] Confirm delete - should remove material
- [ ] Cancel delete - should keep material
