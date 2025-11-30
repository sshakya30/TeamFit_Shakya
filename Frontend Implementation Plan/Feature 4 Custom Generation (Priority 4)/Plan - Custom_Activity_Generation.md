/plan

Based on the Custom Activity Generation specification, create an implementation plan.

## Key Integration Points
1. Backend API: POST http://localhost:8000/api/activities/generate-custom
2. Backend API: GET http://localhost:8000/api/jobs/{job_id}
3. Async job processing - need polling mechanism
4. Need team_id and organization_id from user context

## API Client Addition
Add to src/lib/api.ts:
```typescript
export const api = {
  // ... existing methods
  
  generateCustomActivities: async (data: GenerateRequest) => {
    const response = await fetch(`${API_URL}/api/activities/generate-custom`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },
  
  checkJobStatus: async (jobId: string) => {
    const response = await fetch(`${API_URL}/api/jobs/${jobId}`);
    return response.json();
  }
};
```

## Required shadcn/ui Components to Add
- Textarea (for requirements input)
- Checkbox (for material selection)
- Progress (for job progress)
- Tabs (for step wizard - optional)

## File Structure
src/
├── pages/
│   └── GenerateActivity.tsx (new)
├── components/
│   └── generate/ (new folder)
│       ├── RequirementsForm.tsx
│       ├── MaterialSelector.tsx
│       ├── JobProgressTracker.tsx
│       └── GeneratedActivitiesList.tsx
├── hooks/
│   ├── useGenerateActivities.ts (new - TanStack Query mutation)
│   └── useJobStatus.ts (new - TanStack Query with polling)
└── types/
    └── generation.ts (new - generation interfaces)

## TypeScript Interfaces
```typescript
interface GenerateRequest {
  team_id: string;
  organization_id: string;
  requirements: string;
  material_ids?: string[];
}

interface GenerateResponse {
  success: boolean;
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message: string;
}

interface JobStatusResponse {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  job?: {
    id: string;
    created_at: string;
  };
  activities?: GeneratedActivity[];
  error?: string;
}

interface GeneratedActivity {
  id: string;
  title: string;
  description: string;
  objectives: string[];
  instructions: string;
  duration_minutes: number;
}
```

## Polling Implementation with TanStack Query
```typescript
// useJobStatus.ts
export function useJobStatus(jobId: string | null) {
  return useQuery({
    queryKey: ['job-status', jobId],
    queryFn: () => api.checkJobStatus(jobId!),
    enabled: !!jobId,
    refetchInterval: (data) => {
      // Stop polling when completed or failed
      if (data?.status === 'completed' || data?.status === 'failed') {
        return false;
      }
      return 5000; // Poll every 5 seconds
    }
  });
}
```

## Implementation Order
1. Add required shadcn/ui components (Textarea, Checkbox, Progress)
2. Create TypeScript interfaces in src/types/generation.ts
3. Add API methods to src/lib/api.ts
4. Create useGenerateActivities mutation hook
5. Create useJobStatus query hook with polling
6. Build RequirementsForm component (textarea + submit)
7. Build MaterialSelector component (checkbox list)
8. Build JobProgressTracker component (animated progress)
9. Build GeneratedActivitiesList component (display results)
10. Create GenerateActivity page with state machine logic
11. Add route /generate to App.tsx
12. Add navigation link to Navbar

## Page State Machine
```typescript
type PageState = 
  | 'input'      // Show form
  | 'submitting' // Creating job
  | 'processing' // Job running, polling
  | 'completed'  // Show results
  | 'failed';    // Show error

const [pageState, setPageState] = useState<PageState>('input');
const [jobId, setJobId] = useState<string | null>(null);
```

## Component Responsibilities
- RequirementsForm: Text input for activity requirements
- MaterialSelector: List uploaded materials with checkboxes
- JobProgressTracker: Animated progress, status messages, elapsed time
- GeneratedActivitiesList: Display 3 generated activities, save buttons
- GenerateActivity page: Orchestrate flow, manage state transitions