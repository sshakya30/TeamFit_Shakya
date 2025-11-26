/plan

Based on the Activity Library specification, create an implementation plan.

## Constraints
- Use existing TanStack Query setup
- Use existing Supabase client from src/lib/supabase.ts
- Extend existing shadcn/ui components (may need to add more)
- Follow existing folder structure pattern
- Use existing types from src/types/database.types.ts

## Required shadcn/ui Components to Add
- Dialog (for modal)
- Select (for filters)
- Badge (for tags)
- Skeleton (for loading states)

## File Structure
src/
├── pages/
│   └── ActivityLibrary.tsx (new)
├── components/
│   └── activities/ (new folder)
│       ├── ActivityCard.tsx
│       ├── ActivityFilters.tsx
│       ├── ActivityDetailModal.tsx
│       └── ActivityGrid.tsx
├── hooks/
│   └── useActivities.ts (new - TanStack Query hook)
└── types/
    └── activities.ts (new - activity interfaces)

## Implementation Order
1. Add required shadcn/ui components
2. Create TypeScript interfaces
3. Create useActivities hook with TanStack Query
4. Build ActivityCard component
5. Build ActivityFilters component
6. Build ActivityGrid component
7. Build ActivityDetailModal component
8. Create ActivityLibrary page
9. Add route to App.tsx
10. Add navigation link to Navbar

## API Endpoint (for reference)
Currently using direct Supabase query:
```typescript
const { data } = await supabase
  .from('public_activities')
  .select('*')
  .order('created_at', { ascending: false });
```