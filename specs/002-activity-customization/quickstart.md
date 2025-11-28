# Quickstart: Activity Customization Flow

**Feature**: 002-activity-customization
**Date**: 2025-11-27

## Prerequisites

Before implementing this feature, ensure:

1. **Backend is running** with all required services:
   ```bash
   # Terminal 1: Redis
   redis-server

   # Terminal 2: Celery Worker
   cd backend && uv run celery -A celery_worker worker --loglevel=info

   # Terminal 3: FastAPI
   cd backend && uv run uvicorn app.main:app --reload --port 8000
   ```

2. **Frontend environment** is configured:
   ```bash
   # .env.local must have:
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
   VITE_SUPABASE_URL=https://...supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   VITE_API_URL=http://localhost:8000
   ```

3. **Test data exists**:
   - At least one user with team membership (manager or admin role)
   - Team profile created for the test team
   - Public activities seeded in database

## Implementation Steps

### Step 1: Add shadcn/ui Components (5 min)

```bash
cd frontend
npx shadcn@latest add radio-group
npx shadcn@latest add progress
```

### Step 2: Create API Client (10 min)

Create `frontend/src/lib/api.ts`:

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface CustomizeRequest {
  team_id: string;
  organization_id: string;
  public_activity_id: string;
  duration_minutes: 15 | 30 | 45;
}

export interface CustomizeResponse {
  success: boolean;
  activity_id: string;
  activity: Record<string, unknown>;
  quotas_remaining: {
    public_used: number;
    public_limit: number;
  };
}

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
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}
```

### Step 3: Create Hooks (15 min)

Create `frontend/src/hooks/useCustomizeActivity.ts`:

```typescript
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { customizeActivity, CustomizeRequest, CustomizeResponse } from '@/lib/api';

export function useCustomizeActivity() {
  const { getToken } = useAuth();

  return useMutation<CustomizeResponse, Error, CustomizeRequest>({
    mutationFn: async (data) => {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      return customizeActivity(token, data);
    },
    retry: 1
  });
}
```

Create `frontend/src/hooks/useTeamProfile.ts`:

```typescript
import { useQuery } from '@tanstack/react-query';
import { useSupabaseClient } from '@/lib/supabase';

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
      return data;
    },
    enabled: !!teamId
  });
}
```

Create `frontend/src/hooks/useUserTeams.ts`:

```typescript
import { useQuery } from '@tanstack/react-query';
import { useUser as useClerkUser } from '@clerk/clerk-react';
import { useSupabaseClient } from '@/lib/supabase';

export function useUserTeams() {
  const { user: clerkUser } = useClerkUser();
  const supabase = useSupabaseClient();

  return useQuery({
    queryKey: ['user-teams', clerkUser?.id],
    queryFn: async () => {
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_user_id', clerkUser!.id)
        .single();

      if (!user) return [];

      const { data } = await supabase
        .from('team_members')
        .select('*, teams(*), organizations(*)')
        .eq('user_id', user.id)
        .in('role', ['manager', 'admin']);

      return data || [];
    },
    enabled: !!clerkUser
  });
}
```

### Step 4: Create Components (20 min)

Create `frontend/src/components/activities/DurationSelector.tsx`:

```typescript
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface DurationSelectorProps {
  value: 15 | 30 | 45;
  onChange: (value: 15 | 30 | 45) => void;
  disabled?: boolean;
}

export function DurationSelector({ value, onChange, disabled }: DurationSelectorProps) {
  return (
    <RadioGroup
      value={String(value)}
      onValueChange={(v) => onChange(Number(v) as 15 | 30 | 45)}
      disabled={disabled}
      className="flex gap-4"
    >
      {[15, 30, 45].map((duration) => (
        <div key={duration} className="flex items-center space-x-2">
          <RadioGroupItem value={String(duration)} id={`duration-${duration}`} />
          <Label htmlFor={`duration-${duration}`}>{duration} min</Label>
        </div>
      ))}
    </RadioGroup>
  );
}
```

### Step 5: Update Page (30 min)

Replace `frontend/src/pages/CustomizePlaceholder.tsx` with full implementation. See `data-model.md` for state management and `research.md` for patterns.

### Step 6: Update Exports (5 min)

Update `frontend/src/components/activities/index.ts` to export new components.

## Verification Checklist

After implementation, verify:

- [ ] Route `/customize/:activityId` loads the page
- [ ] Team selector appears if user has multiple teams
- [ ] Team profile displays when team is selected
- [ ] Duration options (15/30/45) are selectable
- [ ] "Generate Customization" button triggers API call
- [ ] Loading state shows during AI processing
- [ ] Success animation plays when complete
- [ ] Customized result displays with save option
- [ ] Quota display shows usage/limit
- [ ] Error states show retry option
- [ ] Navigation warning appears during processing
- [ ] "Save" redirects to team activities
- [ ] "Back to Library" returns to activity library

## Common Issues

### "Not authenticated" error
- Check Clerk session is active
- Verify `getToken()` returns valid JWT

### "Team profile not found" error
- Create team profile via POST /api/activities/team-profile
- Or check user has manager/admin role on selected team

### API timeout
- Backend AI processing can take 30+ seconds
- Increase timeout in fetch or mutation config

### Quota exceeded (429)
- Monthly limit reached
- Check `usage_quotas` table for current period

## Files Changed

| File | Action | Purpose |
|------|--------|---------|
| `frontend/src/lib/api.ts` | Create | FastAPI client |
| `frontend/src/hooks/useCustomizeActivity.ts` | Create | Mutation hook |
| `frontend/src/hooks/useTeamProfile.ts` | Create | Profile query |
| `frontend/src/hooks/useUserTeams.ts` | Create | Teams query |
| `frontend/src/components/activities/DurationSelector.tsx` | Create | Duration UI |
| `frontend/src/components/activities/TeamSelector.tsx` | Create | Team dropdown |
| `frontend/src/components/activities/TeamProfilePreview.tsx` | Create | Profile display |
| `frontend/src/components/activities/CustomizationResult.tsx` | Create | Result display |
| `frontend/src/components/activities/QuotaDisplay.tsx` | Create | Quota badge |
| `frontend/src/pages/CustomizeActivity.tsx` | Replace | Main page |
| `frontend/src/components/activities/index.ts` | Update | Exports |
| `frontend/src/types/index.ts` | Update | New types |
| `frontend/src/components/ui/radio-group.tsx` | Create | shadcn |
| `frontend/src/components/ui/progress.tsx` | Create | shadcn |

## Next Steps

After implementation:
1. Run `/speckit.tasks` to generate detailed task checklist
2. Run `npm run build` to verify no TypeScript errors
3. Run `npm run test` to verify component tests pass
4. Manual testing with real backend
