/plan

Based on the Activity Customization specification, create an implementation plan.

## Key Integration Points
1. Backend API: POST http://localhost:8000/api/activities/customize
2. Need to get team_id and organization_id from user context
3. Activity ID from URL params

## API Client Setup
Create src/lib/api.ts for FastAPI backend calls:
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = {
  customizeActivity: async (data: CustomizeRequest) => {
    const response = await fetch(`${API_URL}/api/activities/customize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }
};
```

## Required shadcn/ui Components
- RadioGroup (for duration selection)
- Progress (for loading indicator)
- Alert (for success/error states)
- Separator

## File Structure
src/
├── pages/
│   └── CustomizeActivity.tsx (new)
├── components/
│   └── activities/
│       ├── DurationSelector.tsx (new)
│       ├── TeamProfilePreview.tsx (new)
│       ├── CustomizationResult.tsx (new)
│       └── QuotaDisplay.tsx (new)
├── hooks/
│   └── useCustomizeActivity.ts (new - TanStack Query mutation)
└── lib/
    └── api.ts (new - FastAPI client)

## Implementation Order
1. Create API client (src/lib/api.ts)
2. Add required shadcn/ui components
3. Create useCustomizeActivity mutation hook
4. Build DurationSelector component
5. Build TeamProfilePreview component
6. Build QuotaDisplay component
7. Build CustomizationResult component
8. Create CustomizeActivity page
9. Add route to App.tsx
10. Connect "Customize" button from ActivityCard