# Quickstart: Activity Library Page

**Feature**: 001-activity-library
**Date**: 2025-11-26

## Prerequisites

- Node.js 18+ installed
- Frontend dev server running (`npm run dev` in `frontend/`)
- Supabase project accessible with `public_activities` table populated

## Quick Setup

### 1. Install Required shadcn/ui Components

```bash
cd frontend
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add select
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add skeleton
```

### 2. Create Directory Structure

```bash
mkdir -p src/components/activities
```

### 3. Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/useActivities.ts` | TanStack Query hook for fetching activities |
| `src/components/activities/ActivityCard.tsx` | Activity card component |
| `src/components/activities/ActivityFilters.tsx` | Filter controls component |
| `src/components/activities/ActivityGrid.tsx` | Responsive grid layout |
| `src/components/activities/ActivityDetailModal.tsx` | Detail modal component |
| `src/components/activities/EmptyState.tsx` | Empty/error state component |
| `src/components/activities/index.ts` | Barrel export |
| `src/pages/ActivityLibrary.tsx` | Main page component |
| `src/pages/CustomizePlaceholder.tsx` | Coming soon placeholder |

### 4. Files to Modify

| File | Changes |
|------|---------|
| `src/types/index.ts` | Add FilterState interface and constants |
| `src/App.tsx` | Add routes for /activities and /customize/:activityId |
| `src/components/layout/Navbar.tsx` | Add "Activities" navigation link |

## Implementation Order

```
1. Add shadcn components (Dialog, Select, Badge, Skeleton)
   │
2. Add types to src/types/index.ts
   │
3. Create useActivities hook
   │
4. Create EmptyState component
   │
5. Create ActivityCard component
   │
6. Create ActivityFilters component
   │
7. Create ActivityGrid component
   │
8. Create ActivityDetailModal component
   │
9. Create ActivityLibrary page
   │
10. Create CustomizePlaceholder page
    │
11. Add routes to App.tsx
    │
12. Add nav link to Navbar.tsx
```

## Key Code Snippets

### useActivities Hook

```typescript
// src/hooks/useActivities.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';

type PublicActivity = Database['public']['Tables']['public_activities']['Row'];

export function useActivities() {
  return useQuery({
    queryKey: ['public-activities'],
    queryFn: async (): Promise<PublicActivity[]> => {
      const { data, error } = await supabase
        .from('public_activities')
        .select('*')
        .eq('is_active', true)
        .order('category')
        .order('duration_minutes');

      if (error) throw error;
      return data ?? [];
    },
    staleTime: Infinity, // Static data, never refetch
  });
}
```

### Route Configuration

```typescript
// In App.tsx, add to Routes:
<Route path="/activities" element={
  <ProtectedRoute>
    <Layout>
      <ActivityLibrary />
    </Layout>
  </ProtectedRoute>
} />
<Route path="/customize/:activityId" element={
  <ProtectedRoute>
    <Layout>
      <CustomizePlaceholder />
    </Layout>
  </ProtectedRoute>
} />
```

### Navbar Link

```typescript
// In Navbar.tsx, add to navigation:
<Link to="/activities" className="...">
  Activities
</Link>
```

## Verification Checklist

- [ ] shadcn components installed (4 total)
- [ ] `/activities` route accessible
- [ ] Activities load and display in grid
- [ ] Filters update results client-side
- [ ] Modal opens on "View Details"
- [ ] "Customize" navigates to `/customize/:id`
- [ ] Placeholder page shows "Coming Soon"
- [ ] Loading skeleton shown while fetching
- [ ] Error state shown on fetch failure
- [ ] Empty state shown when filters match nothing
- [ ] Responsive grid (1/2/3 columns)

## Testing Commands

```bash
# Run frontend dev server
cd frontend
npm run dev

# Run tests
npm run test

# Type check
npm run build
```

## Database Verification

Check activities exist:
```sql
SELECT COUNT(*) FROM public_activities WHERE is_active = true;
-- Expected: 45 rows
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| shadcn install fails | Ensure `components.json` exists, run from `frontend/` dir |
| Types not found | Run `mcp__supabase__generate_typescript_types` |
| Activities don't load | Check Supabase URL/key in `.env.local` |
| Auth required error | Ensure Clerk provider wrapping routes |
