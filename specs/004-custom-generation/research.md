# Research: Custom Activity Generation

**Feature**: 004-custom-generation
**Date**: 2025-11-30

## Executive Summary

This document captures research findings for implementing the Custom Activity Generation frontend feature. The backend APIs already exist and are functional (POST /api/activities/generate-custom, GET /api/jobs/{job_id}). The implementation follows established patterns from Features 1-3.

---

## 1. TanStack Query Polling Pattern

### Decision
Use TanStack Query's `refetchInterval` with conditional stopping based on job status.

### Rationale
- Built-in support for polling via `refetchInterval` option
- Conditional polling allows automatic stop when job completes
- Integrates seamlessly with existing TanStack Query setup
- Provides automatic caching and deduplication

### Alternatives Considered

| Alternative | Rejected Because |
|-------------|------------------|
| setInterval + fetch | Manual state management, no caching, cleanup complexity |
| WebSocket | Overkill for 5-second polling; backend doesn't support WebSocket |
| Server-Sent Events | Backend doesn't support SSE; polling is simpler |

### Implementation Pattern

```typescript
// useJobStatus.ts
export function useJobStatus(jobId: string | null) {
  return useQuery({
    queryKey: ['job-status', jobId],
    queryFn: () => getJobStatus(jobId!, token),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      // Stop polling when completed or failed
      if (status === 'completed' || status === 'failed') {
        return false;
      }
      return 5000; // Poll every 5 seconds
    },
    staleTime: 0, // Always refetch on poll
  });
}
```

---

## 2. Collapsible Sections Pattern

### Decision
Use native HTML `<details>` / `<summary>` elements styled with Tailwind, or shadcn/ui Collapsible if available.

### Rationale
- Lightweight, no additional dependencies
- Accessible by default (keyboard navigation, screen readers)
- Consistent with single-page layout requirement from spec
- Can be enhanced with CSS transitions

### Alternatives Considered

| Alternative | Rejected Because |
|-------------|------------------|
| shadcn/ui Accordion | Heavier; only one section open at a time (not desired) |
| Custom useState toggle | More code, accessibility concerns |
| Third-party library | Unnecessary dependency |

### Implementation Pattern

```tsx
// Simple collapsible section
<div className="border rounded-lg">
  <button
    onClick={() => setIsOpen(!isOpen)}
    className="w-full p-4 flex justify-between items-center"
  >
    <span className="font-medium">Requirements</span>
    <ChevronDown className={cn("transition-transform", isOpen && "rotate-180")} />
  </button>
  {isOpen && (
    <div className="p-4 pt-0 border-t">
      {/* Content */}
    </div>
  )}
</div>
```

---

## 3. Page State Machine

### Decision
Use React useState with discriminated union type for page states.

### Rationale
- Simple, explicit state management
- TypeScript ensures exhaustive handling
- No external state library needed
- Follows existing patterns in CustomizeActivity page

### States

```typescript
type GenerationState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'polling'; jobId: string; startTime: number }
  | { status: 'completed'; jobId: string; activities: GeneratedActivity[] }
  | { status: 'error'; errorType: 'timeout' | 'failed' | 'network'; message: string };
```

### State Transitions

```
idle → submitting (on form submit)
submitting → polling (on job created successfully)
submitting → error (on submission failure)
polling → completed (when status === 'completed')
polling → error (when status === 'failed' or timeout)
completed → idle (on "Generate More")
error → idle (on retry)
```

---

## 4. Material Selection

### Decision
Reuse existing `useTeamMaterials` hook with checkbox UI.

### Rationale
- Hook already exists and is tested
- Material type already defined
- Consistent data fetching pattern

### Implementation Pattern

```tsx
// MaterialsSection.tsx
const { data: materials, isLoading } = useTeamMaterials(teamId);
const [selectedIds, setSelectedIds] = useState<string[]>([]);

const toggleMaterial = (id: string) => {
  setSelectedIds(prev =>
    prev.includes(id)
      ? prev.filter(x => x !== id)
      : [...prev, id]
  );
};
```

---

## 5. Timeout Handling

### Decision
Track job start time and check against 2-minute threshold on each poll response.

### Rationale
- Simple implementation
- Spec requires 2-minute timeout
- Frontend timeout independent of backend (backend may have its own)

### Implementation Pattern

```typescript
const TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

// In polling logic
const elapsed = Date.now() - startTime;
if (elapsed > TIMEOUT_MS && status !== 'completed') {
  setState({
    status: 'error',
    errorType: 'timeout',
    message: 'Generation is taking longer than expected. Please try again.'
  });
}
```

---

## 6. Quota Display

### Decision
Reuse existing `useQuota` hook, display custom_used / custom_limit.

### Rationale
- Hook already exists
- QuotaInfo type includes custom generation fields
- Consistent display pattern

### Display Format

```tsx
<div className="text-sm text-muted-foreground">
  {quota.custom_used} / {quota.custom_limit} custom generations used this month
</div>
```

---

## 7. Save Activity Pattern

### Decision
Reuse existing `useSaveActivity` hook which calls PATCH /api/activities/{id}/status.

### Rationale
- Endpoint already exists
- Generated activities have status "suggested" by default
- Saving sets status to "saved"
- Hook already handles auth and error states

### Implementation Pattern

```typescript
const { mutateAsync: saveActivity } = useSaveActivity();

const handleSave = async (activityId: string) => {
  await saveActivity({ activityId, status: 'saved' });
  // Update local state to show saved indicator
};
```

---

## 8. Error Display

### Decision
Use existing Alert component with destructive variant for errors.

### Rationale
- Consistent with existing error patterns
- AlertDialog not needed (no confirmation required for viewing errors)
- Retry button included in error display

### Error Types

| Error Type | Message | Action |
|------------|---------|--------|
| timeout | "Generation is taking longer than expected..." | Retry button |
| failed | Backend error message | Retry button |
| network | "Network error. Please check your connection." | Retry button |
| quota | "Monthly limit reached..." | Link to upgrade |

---

## 9. Success Celebration

### Decision
Simple animated success message with confetti-style visual (CSS only).

### Rationale
- Spec requires "celebration/success message"
- Keep it lightweight - no animation library
- CSS keyframe animation sufficient

### Implementation

```tsx
// Simple celebration
<div className="text-center py-8 animate-in fade-in zoom-in duration-500">
  <div className="text-4xl mb-4">🎉</div>
  <h2 className="text-2xl font-bold text-green-600">Activities Generated!</h2>
  <p className="text-muted-foreground">3 custom activities are ready for review.</p>
</div>
```

---

## 10. Navigation Entry Point

### Decision
Add "Generate Custom" button/link to Activity Library page header area.

### Rationale
- Natural flow: browse library → generate custom if nothing fits
- Maintains existing navigation structure
- No changes to main Navbar needed

### Implementation

Activity Library page already has a header area. Add conditional link:

```tsx
{canGenerate && (
  <Link to="/generate">
    <Button variant="outline">
      <Sparkles className="mr-2 h-4 w-4" />
      Generate Custom
    </Button>
  </Link>
)}
```

---

## Summary of Decisions

| Topic | Decision |
|-------|----------|
| Polling | TanStack Query refetchInterval with conditional stop |
| Collapsible | Native details/summary or useState toggle |
| State Machine | useState with discriminated union |
| Materials | Reuse useTeamMaterials hook |
| Timeout | Frontend 2-minute check |
| Quota | Reuse useQuota hook |
| Save | Reuse useSaveActivity hook |
| Errors | Alert component with retry |
| Celebration | CSS animation, no library |
| Navigation | Link from Activity Library |
