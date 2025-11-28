# Research: Activity Customization Flow

**Feature**: 002-activity-customization
**Date**: 2025-11-27

## Research Tasks

### 1. FastAPI Client Pattern for React

**Decision**: Create a dedicated API client module (`src/lib/api.ts`) using native `fetch` with Clerk JWT authentication.

**Rationale**:
- Existing codebase uses direct Supabase client for database queries
- Backend API calls need different authentication (Clerk JWT in Authorization header)
- Native fetch is simpler than adding axios dependency
- Matches the pattern shown in the user-provided plan reference

**Alternatives Considered**:
- **Axios**: More features but unnecessary dependency; fetch is sufficient
- **React Query's fetch**: Works well with TanStack Query mutation pattern
- **Supabase Edge Functions**: Backend already uses FastAPI, not Supabase functions

**Implementation Pattern**:
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function customizeActivity(
  token: string,
  data: CustomizeRequest
): Promise<CustomizeResponse> {
  const response = await fetch(`${API_URL}/api/activities/customize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Customization failed');
  }
  return response.json();
}
```

### 2. TanStack Query Mutation Pattern

**Decision**: Use `useMutation` hook with explicit error handling and retry configuration.

**Rationale**:
- Existing `useActivities` hook demonstrates TanStack Query usage pattern
- Mutations are ideal for POST requests that modify server state
- Built-in loading/error/success states match UI requirements
- Supports retry logic and timeout configuration

**Alternatives Considered**:
- **useState + useEffect**: More boilerplate, less standardized
- **Custom hook without TanStack**: Loses caching and devtools benefits

**Implementation Pattern**:
```typescript
export function useCustomizeActivity() {
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (data: CustomizeRequest) => {
      const token = await getToken();
      return customizeActivity(token!, data);
    },
    retry: 1,
    onError: (error) => {
      console.error('Customization failed:', error);
    }
  });
}
```

### 3. Multi-Team User Flow

**Decision**: Fetch all user team memberships upfront; show selector if > 1 team.

**Rationale**:
- Current `useUser` hook fetches single team membership
- Need new hook to fetch all `team_members` records for user
- Team selector should pre-select the team from current context if available
- Follows clarification decision from spec

**Alternatives Considered**:
- **Modify useUser**: Would bloat existing hook; better to create focused hook
- **Lazy load teams on selector open**: Adds unnecessary delay

**Implementation Pattern**:
```typescript
export function useUserTeams() {
  const { user: clerkUser } = useClerkUser();
  const supabase = useSupabaseClient();

  return useQuery({
    queryKey: ['user-teams', clerkUser?.id],
    queryFn: async () => {
      // Get user's internal ID first
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_user_id', clerkUser!.id)
        .single();

      // Get all team memberships with team details
      const { data: memberships } = await supabase
        .from('team_members')
        .select('*, teams(*), organizations(*)')
        .eq('user_id', user!.id);

      return memberships;
    },
    enabled: !!clerkUser
  });
}
```

### 4. Team Profile Fetching Strategy

**Decision**: Fetch team profile via Supabase when team is selected; handle missing profile with UI prompt.

**Rationale**:
- Team profiles are stored in `team_profiles` table with RLS policies
- Backend requires team profile to exist before customization
- Frontend should show clear guidance if profile is missing

**Alternatives Considered**:
- **Fetch via backend API**: Unnecessary; direct Supabase query is simpler
- **Create profile inline**: Out of scope; spec says profiles are created separately

**Implementation Pattern**:
```typescript
export function useTeamProfile(teamId: string | null) {
  const supabase = useSupabaseClient();

  return useQuery({
    queryKey: ['team-profile', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_profiles')
        .select('*')
        .eq('team_id', teamId!)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data; // null if not found
    },
    enabled: !!teamId
  });
}
```

### 5. Quota Display Strategy

**Decision**: Fetch quota from backend API endpoint; display usage/limit with visual progress.

**Rationale**:
- Quota data is in `usage_quotas` table, linked to organization
- Backend already calculates and returns quota in customization response
- Need separate endpoint to show quota before customization

**Research Finding**: Backend doesn't expose a dedicated quota endpoint. Options:
1. Add new endpoint `GET /api/quotas/{organization_id}`
2. Query `usage_quotas` directly via Supabase (if RLS allows)
3. Show quota only after first customization attempt

**Decision**: Query Supabase directly for initial load; use response data for updates.

### 6. Navigation Warning Implementation

**Decision**: Use `beforeunload` event and React Router's `useBlocker` for navigation warnings.

**Rationale**:
- `beforeunload` handles browser close/refresh during processing
- React Router's `useBlocker` handles in-app navigation
- Combined approach covers all navigation scenarios

**Implementation Pattern**:
```typescript
// Browser close/refresh
useEffect(() => {
  if (isProcessing) {
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }
}, [isProcessing]);

// In-app navigation
const blocker = useBlocker(
  ({ currentLocation, nextLocation }) =>
    isProcessing && currentLocation.pathname !== nextLocation.pathname
);
```

### 7. Success Animation Implementation

**Decision**: Use CSS transitions with a checkmark icon and subtle glow effect.

**Rationale**:
- Clarification specified "subtle success animation (checkmark/glow effect, no sound)"
- CSS animations are performant and don't require additional dependencies
- Lucide React already has Check icon

**Alternatives Considered**:
- **Framer Motion**: Overkill for simple animation; adds bundle size
- **Confetti library**: Explicitly rejected in clarification
- **Lottie**: Too complex for simple checkmark animation

**Implementation Pattern**:
```tsx
// Success state with animation
<div className={cn(
  "transition-all duration-500",
  isSuccess && "animate-success-glow"
)}>
  <CheckCircle className="w-16 h-16 text-green-500" />
</div>

// Tailwind animation in config
animation: {
  'success-glow': 'successGlow 1s ease-in-out'
},
keyframes: {
  successGlow: {
    '0%': { transform: 'scale(0.8)', opacity: 0 },
    '50%': { transform: 'scale(1.1)', boxShadow: '0 0 20px rgba(34, 197, 94, 0.5)' },
    '100%': { transform: 'scale(1)', opacity: 1 }
  }
}
```

### 8. shadcn/ui Components Needed

**Decision**: Add RadioGroup and Progress components via shadcn CLI.

**Rationale**:
- Duration selector needs radio buttons with visual styling
- Loading state needs progress indicator
- shadcn/ui is already configured in the project

**Installation Commands**:
```bash
npx shadcn@latest add radio-group
npx shadcn@latest add progress
```

### 9. Error Handling Strategy

**Decision**: Categorize errors into types (timeout, quota, network, server) with specific user messages.

**Rationale**:
- Different errors need different user guidance
- Timeout needs "Try again" messaging
- Quota exceeded needs "Upgrade" messaging
- Network errors need "Check connection" messaging

**Error Categories**:
| Error Type | HTTP Status | User Message | Action |
|------------|-------------|--------------|--------|
| Timeout | 408 or timeout | "The AI is taking longer than expected" | Retry button |
| Quota Exceeded | 429 | "Monthly limit reached" | Upgrade link |
| No Team Profile | 404 | "Complete your team profile first" | Link to profile |
| Network | N/A | "Connection lost" | Auto-retry on reconnect |
| Server Error | 500 | "Something went wrong" | Retry button |

### 10. State Management Within Page

**Decision**: Use local component state with `useState`; no need for global state management.

**Rationale**:
- All state is local to customization page
- State includes: selectedTeam, selectedDuration, isProcessing, result, error
- No other components need access to this state
- TanStack Query handles server state

**Alternatives Considered**:
- **Zustand/Redux**: Overkill for single-page local state
- **React Context**: Not needed; state doesn't span component tree

## Summary

All technical decisions follow existing patterns in the codebase:
- TanStack Query for data fetching (matches `useActivities`, `useUser`)
- Direct Supabase queries for database reads (matches existing hooks)
- Dedicated API client for FastAPI backend calls (new pattern, well-documented)
- shadcn/ui components for UI elements (matches existing component library)
- Local state for page-level state management (matches existing pages)

No NEEDS CLARIFICATION items remain. All decisions are grounded in codebase analysis.
