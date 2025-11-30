# Research: Team Materials Upload

**Feature**: 003-file-upload
**Date**: 2025-11-28

## Research Summary

This document captures technical decisions and research findings for the Team Materials Upload feature. All clarifications have been resolved - no blockers remain.

---

## 1. File Upload Library Selection

### Decision: react-dropzone

### Rationale
- **Lightweight**: ~10KB bundle size, no heavy dependencies
- **React-native**: Built specifically for React with hooks API (`useDropzone`)
- **Feature-rich**: Supports drag-and-drop, click-to-browse, file validation, multiple files
- **Customizable**: Headless component pattern allows full UI control with existing shadcn/ui components
- **Well-maintained**: 10k+ GitHub stars, active development, TypeScript support
- **Existing pattern**: Similar to other lightweight libraries already in use (e.g., @radix-ui primitives)

### Alternatives Considered

| Library | Bundle Size | Rejected Because |
|---------|-------------|------------------|
| react-dropzone | ~10KB | ✅ SELECTED |
| react-dropzone-uploader | ~25KB | Too opinionated UI, harder to customize |
| filepond | ~50KB | Overkill for this use case, brings own UI system |
| uppy | ~150KB | Too heavy, designed for complex multi-source uploads |
| native HTML5 drag-drop | 0KB | Requires significant boilerplate for good UX |

---

## 2. Upload Progress Tracking

### Decision: XMLHttpRequest with onProgress event

### Rationale
- **Native progress tracking**: `XMLHttpRequest.upload.onprogress` provides real-time byte-level progress
- **Fetch limitation**: Native `fetch()` API doesn't support upload progress in most browsers
- **FormData support**: Works seamlessly with multipart/form-data uploads
- **Existing pattern**: Common approach in file upload implementations

### Implementation Approach
```typescript
// Wrapper function for upload with progress
const uploadWithProgress = (
  formData: FormData,
  onProgress: (percent: number) => void
): Promise<Response> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    // ... rest of XHR setup
  });
};
```

### Alternatives Considered

| Approach | Rejected Because |
|----------|------------------|
| fetch() with streams | Limited browser support, complex implementation |
| axios with onUploadProgress | Would add new dependency; XHR does the same thing |
| Fake progress | Poor UX, doesn't reflect actual upload state |

---

## 3. File Type Validation Strategy

### Decision: Client-side validation first, server-side re-validation

### Rationale
- **Immediate feedback**: Users see validation errors before upload attempt (within 2 seconds per SC-003)
- **Defense in depth**: Server validates again to prevent bypassed client validation
- **MIME type + extension**: Check both to prevent renamed files bypassing validation
- **User-friendly messages**: Clear error messages listing supported types

### Implementation Approach
```typescript
const ALLOWED_TYPES = {
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx'
};

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

// react-dropzone accept prop handles MIME validation
// onDrop callback handles size and additional validation
```

---

## 4. State Management for Uploads

### Decision: TanStack Query mutations + local React state

### Rationale
- **Consistency**: Follows existing patterns in the codebase (useUser, useActivities, etc.)
- **Optimistic updates**: Can show new material immediately while server confirms
- **Cache invalidation**: Automatic refetch of materials list after successful upload
- **Error handling**: Built-in retry and error state management

### Implementation Pattern
```typescript
// useUploadMaterial.ts
const uploadMutation = useMutation({
  mutationFn: uploadMaterial,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['team-materials'] });
  },
});

// Local state for upload progress
const [uploadProgress, setUploadProgress] = useState<number>(0);
```

---

## 5. Role-Based Access Control

### Decision: Route guard + component-level checks

### Rationale
- **Existing pattern**: ProtectedRoute already handles authentication
- **New guard needed**: MaterialsRoute wrapper for role + subscription check
- **Backend validation**: Server enforces same rules as final gate
- **Graceful handling**: Redirect unauthorized users with clear message

### Implementation Approach
```typescript
// MaterialsRoute wrapper (similar to OnboardingRoute pattern)
<MaterialsRoute>
  <Materials />
</MaterialsRoute>

// MaterialsRoute checks:
// 1. User is authenticated (via ProtectedRoute)
// 2. User has manager or admin role
// 3. User's organization has active paid subscription
```

---

## 6. Empty State and Loading States

### Decision: Consistent with existing patterns

### Rationale
- **Existing EmptyState component**: Can be reused/adapted from activities feature
- **Loading skeleton**: Use existing Skeleton component from shadcn/ui
- **Error boundaries**: Follow existing error handling patterns

### States to Handle
1. **Loading**: Skeleton cards while fetching materials
2. **Empty**: Encouraging message with upload CTA
3. **Error**: Error message with retry option
4. **Uploading**: Progress bar with cancel option
5. **Success**: Material appears in list, success toast

---

## 7. Delete Confirmation Pattern

### Decision: AlertDialog from shadcn/ui

### Rationale
- **Existing component**: AlertDialog already available in the codebase
- **Accessible**: Proper focus management, keyboard navigation
- **Consistent styling**: Matches existing modal patterns
- **Destructive action styling**: Red button for delete confirmation

---

## 8. Navigation Integration

### Decision: Add to Navbar for managers/admins only

### Rationale
- **Role-based visibility**: Only show Materials link if user is manager/admin
- **Existing pattern**: Navbar already has role-based rendering logic
- **Route protection**: Even if URL is accessed directly, MaterialsRoute redirects

---

## Resolved Clarifications

All technical unknowns have been resolved:

| Item | Resolution |
|------|------------|
| File upload library | react-dropzone (lightweight, React-native) |
| Upload progress tracking | XMLHttpRequest with onprogress event |
| File validation | Client + server validation with MIME + extension checks |
| State management | TanStack Query mutations + local React state |
| Access control | MaterialsRoute wrapper + backend validation |
| UI patterns | Reuse existing shadcn/ui components |

---

## Dependencies to Install

```bash
npm install react-dropzone
```

No other new dependencies required - all other components exist in the codebase.
