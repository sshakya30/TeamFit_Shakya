/plan

Based on the Team Materials Upload specification, create an implementation plan.

## Key Integration Points
1. Backend API: POST http://localhost:8000/api/materials/upload (multipart/form-data)
2. Backend API: GET http://localhost:8000/api/materials/team/{team_id}
3. Need team_id and organization_id from user context
4. File upload requires FormData, not JSON

## API Client Addition
Add to src/lib/api.ts:
```typescript
export const api = {
  // ... existing methods
  
  uploadMaterial: async (teamId: string, orgId: string, file: File) => {
    const formData = new FormData();
    formData.append('team_id', teamId);
    formData.append('organization_id', orgId);
    formData.append('file', file);
    
    const response = await fetch(`${API_URL}/api/materials/upload`, {
      method: 'POST',
      body: formData // No Content-Type header for FormData
    });
    return response.json();
  },
  
  getTeamMaterials: async (teamId: string) => {
    const response = await fetch(`${API_URL}/api/materials/team/${teamId}`);
    return response.json();
  }
};
```

## Required shadcn/ui Components to Add
- Progress (for upload progress bar)
- Alert (for success/error messages)
- AlertDialog (for delete confirmation)

## Required External Package
- react-dropzone (for drag & drop functionality)

Install command:
```bash
npm install react-dropzone
```

## File Structure
src/
├── pages/
│   └── Materials.tsx (new)
├── components/
│   └── materials/ (new folder)
│       ├── FileDropzone.tsx
│       ├── UploadProgress.tsx
│       ├── MaterialsList.tsx
│       └── MaterialCard.tsx
├── hooks/
│   ├── useUploadMaterial.ts (new - TanStack Query mutation)
│   └── useTeamMaterials.ts (new - TanStack Query query)
└── types/
    └── materials.ts (new - material interfaces)

## TypeScript Interfaces
```typescript
interface UploadedMaterial {
  id: string;
  team_id: string;
  filename: string;
  file_type: 'pdf' | 'docx' | 'pptx' | 'xlsx';
  file_size: number;
  summary: string | null;
  created_at: string;
}

interface UploadResponse {
  success: boolean;
  material_id: string;
  filename: string;
  summary: string;
}
```

## Implementation Order
1. Install react-dropzone package
2. Add required shadcn/ui components (Progress, Alert, AlertDialog)
3. Create TypeScript interfaces in src/types/materials.ts
4. Add API methods to src/lib/api.ts
5. Create useUploadMaterial mutation hook
6. Create useTeamMaterials query hook
7. Build FileDropzone component with react-dropzone
8. Build UploadProgress component
9. Build MaterialCard component
10. Build MaterialsList component
11. Create Materials page combining all components
12. Add route /materials to App.tsx
13. Add navigation link to Navbar

## File Validation Logic
```typescript
const ALLOWED_TYPES = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx'
};
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
```

## Component Responsibilities
- FileDropzone: Handle drag/drop, file selection, validation
- UploadProgress: Show upload percentage, filename, status
- MaterialCard: Display single material with summary, delete button
- MaterialsList: Fetch and display all materials, handle empty state
- Materials page: Combine dropzone + list, manage upload state