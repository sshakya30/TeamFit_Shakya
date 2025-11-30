# Quickstart: Custom Activity Generation

**Feature**: 004-custom-generation
**Date**: 2025-11-30

## Prerequisites

- Node.js 18+ installed
- Frontend dependencies installed (`cd frontend && npm install`)
- Backend running on http://localhost:8000
- Celery worker running (for async job processing)
- Redis running (for Celery message broker)
- User logged in with manager/admin role and paid subscription

## Quick Verification

After implementation, verify the feature works:

1. **Start the servers:**
   ```bash
   # Terminal 1: Redis
   redis-server

   # Terminal 2: Celery Worker
   cd backend && uv run celery -A celery_worker worker --loglevel=info

   # Terminal 3: Backend
   cd backend && uv run uvicorn app.main:app --reload --port 8000

   # Terminal 4: Frontend
   cd frontend && npm run dev
   ```

2. **Navigate to the feature:**
   - Go to http://localhost:5173
   - Sign in as a manager/admin with paid subscription
   - Click "Activities" in navigation
   - Click "Generate Custom" button
   - Or navigate directly to http://localhost:5173/generate

3. **Test the generation flow:**
   - Enter requirements (at least 10 characters)
   - Optionally select uploaded materials
   - Click "Generate Activities"
   - Wait for generation to complete (~30-60 seconds)
   - View the 3 generated activities
   - Click "Save" on activities you want to keep

## File Checklist

### New Files to Create

| File | Purpose |
|------|---------|
| `frontend/src/pages/GenerateActivity.tsx` | Main page component |
| `frontend/src/components/generate/RequirementsSection.tsx` | Requirements input with validation |
| `frontend/src/components/generate/MaterialsSection.tsx` | Material selection checkboxes |
| `frontend/src/components/generate/GenerationProgress.tsx` | Progress indicator during polling |
| `frontend/src/components/generate/GeneratedActivityCard.tsx` | Display single activity |
| `frontend/src/components/generate/GenerationResults.tsx` | Display all results |
| `frontend/src/hooks/useGenerateActivities.ts` | TanStack mutation hook |
| `frontend/src/hooks/useJobStatus.ts` | TanStack query with polling |

### Existing Files to Modify

| File | Changes |
|------|---------|
| `frontend/src/types/index.ts` | Add generation types |
| `frontend/src/lib/api.ts` | Add API functions |
| `frontend/src/App.tsx` | Add /generate route |
| `frontend/src/pages/ActivityLibrary.tsx` | Add "Generate Custom" link |

## Implementation Order

### Phase 1: Types & API (Foundation)

1. Add types to `frontend/src/types/index.ts`
2. Add API functions to `frontend/src/lib/api.ts`

### Phase 2: Hooks (Data Layer)

3. Create `useGenerateActivities.ts` hook
4. Create `useJobStatus.ts` hook with polling

### Phase 3: Components (UI Layer)

5. Create `RequirementsSection.tsx`
6. Create `MaterialsSection.tsx`
7. Create `GenerationProgress.tsx`
8. Create `GeneratedActivityCard.tsx`
9. Create `GenerationResults.tsx`

### Phase 4: Page & Routing (Integration)

10. Create `GenerateActivity.tsx` page
11. Add route to `App.tsx`
12. Add navigation link to `ActivityLibrary.tsx`

## Key Code Snippets

### API Functions

```typescript
// frontend/src/lib/api.ts

export async function generateCustomActivities(
  token: string,
  data: GenerateCustomActivitiesRequest
): Promise<GenerateCustomActivitiesResponse> {
  const response = await fetch(`${API_URL}/api/activities/generate-custom`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function getJobStatus(
  token: string,
  jobId: string
): Promise<JobStatusResponse> {
  const response = await fetch(`${API_URL}/api/jobs/${jobId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}
```

### Polling Hook

```typescript
// frontend/src/hooks/useJobStatus.ts

export function useJobStatus(jobId: string | null) {
  const { getToken } = useAuth();

  return useQuery<JobStatusResponse, Error>({
    queryKey: ['job-status', jobId],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      return getJobStatus(token, jobId!);
    },
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'completed' || status === 'failed') {
        return false;
      }
      return 5000;
    },
    staleTime: 0,
  });
}
```

### Route Configuration

```tsx
// frontend/src/App.tsx

import { GenerateActivity } from './pages/GenerateActivity';

// Inside Routes component
<Route
  path="/generate"
  element={
    <OnboardingRoute>
      <MaterialsRoute>
        <GenerateActivity />
      </MaterialsRoute>
    </OnboardingRoute>
  }
/>
```

## Testing Checklist

### Manual Testing

- [ ] Page loads for manager/admin with paid subscription
- [ ] Page shows access denied for members or free tier
- [ ] Requirements validation works (min 10 chars)
- [ ] Materials list loads (if team has materials)
- [ ] Generate button triggers job creation
- [ ] Progress indicator shows during polling
- [ ] Timeout error shows after 2 minutes
- [ ] Success message shows when completed
- [ ] 3 activities display with full details
- [ ] Save button updates activity status
- [ ] "Generate More" resets the form
- [ ] Error messages display with retry option

### Edge Cases

- [ ] Empty requirements shows validation error
- [ ] Quota exceeded shows error before submit
- [ ] Network error during polling shows retry
- [ ] Navigation away and back preserves nothing (fresh state)
- [ ] Backend failure shows error with retry

## Troubleshooting

### "Not authenticated" error
- Ensure user is signed in
- Check Clerk token is valid
- Verify backend is running on port 8000

### "Requires paid subscription" error
- Verify user's organization has active paid subscription
- Check subscriptions table in Supabase

### Job stuck in "processing"
- Check Celery worker is running
- Check Redis is running
- Check backend logs for errors

### Activities not saving
- Verify the activity ID is valid
- Check PATCH endpoint is working
- Look for RLS policy issues in Supabase logs
