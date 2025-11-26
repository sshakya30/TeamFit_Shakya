# Data Model: Activity Library Page

**Feature**: 001-activity-library
**Date**: 2025-11-26

## Entities

### 1. PublicActivity

**Source**: Supabase `public_activities` table
**Purpose**: Pre-defined team-building activity available to all users

```typescript
// Use existing auto-generated type from database.types.ts
import type { Database } from '@/types/database.types';

export type PublicActivity = Database['public']['Tables']['public_activities']['Row'];

// Type shape (for reference):
interface PublicActivity {
  id: string;                    // UUID
  title: string;                 // Activity name
  description: string | null;    // Short description
  category: string;              // tech_it | finance_accounting | marketing_creative | business_services | customer_service
  duration_minutes: number | null; // 15 | 30 | 45
  complexity: string | null;     // easy | medium | hard
  required_tools: string[] | null; // Array of tools needed
  instructions: string | null;   // Full activity instructions
  is_active: boolean | null;     // Only show active activities
  created_at: string | null;     // ISO timestamp
  updated_at: string | null;     // ISO timestamp
}
```

**Validation Rules**:
- `id`: Required, UUID format
- `title`: Required, non-empty string
- `category`: Required, must be one of 5 predefined values
- `is_active`: Only activities where `is_active = true` should be displayed

---

### 2. FilterState

**Source**: React component state
**Purpose**: Current filter selections for client-side filtering

```typescript
export interface FilterState {
  category: string | null;       // Selected category filter (null = all)
  duration: number | null;       // Selected duration filter (null = all)
  complexity: string | null;     // Selected complexity filter (null = all)
}
```

**State Transitions**:
- Initial state: `{ category: null, duration: null, complexity: null }`
- On filter change: Update single field, others unchanged
- On "Clear filters": Reset to initial state

---

### 3. Filter Options (Constants)

**Source**: Static configuration
**Purpose**: Define available filter options

```typescript
export const CATEGORY_OPTIONS = [
  { value: 'tech_it', label: 'Tech/IT' },
  { value: 'finance_accounting', label: 'Finance' },
  { value: 'marketing_creative', label: 'Marketing' },
  { value: 'business_services', label: 'Business Services' },
  { value: 'customer_service', label: 'Customer Service' },
] as const;

export const DURATION_OPTIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
] as const;

export const COMPLEXITY_OPTIONS = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
] as const;

// Display name mapping for categories
export const CATEGORY_LABELS: Record<string, string> = {
  tech_it: 'Tech/IT',
  finance_accounting: 'Finance',
  marketing_creative: 'Marketing',
  business_services: 'Business Services',
  customer_service: 'Customer Service',
};

// Display name mapping for complexity
export const COMPLEXITY_LABELS: Record<string, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};
```

---

## Component Props

### ActivityCard Props

```typescript
interface ActivityCardProps {
  activity: PublicActivity;
  onViewDetails: (activity: PublicActivity) => void;
  onCustomize: (activityId: string) => void;
}
```

### ActivityFilters Props

```typescript
interface ActivityFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onClearFilters: () => void;
  resultCount: number;
}
```

### ActivityDetailModal Props

```typescript
interface ActivityDetailModalProps {
  activity: PublicActivity | null;
  open: boolean;
  onClose: () => void;
  onCustomize: (activityId: string) => void;
}
```

### ActivityGrid Props

```typescript
interface ActivityGridProps {
  activities: PublicActivity[];
  onViewDetails: (activity: PublicActivity) => void;
  onCustomize: (activityId: string) => void;
}
```

### EmptyState Props

```typescript
interface EmptyStateProps {
  type: 'no-results' | 'no-activities' | 'error';
  onClearFilters?: () => void;
  onRetry?: () => void;
  errorMessage?: string;
}
```

---

## Hook Return Types

### useActivities Hook

```typescript
interface UseActivitiesReturn {
  // Data
  activities: PublicActivity[] | undefined;

  // Loading states
  isLoading: boolean;
  isFetching: boolean;

  // Error state
  error: Error | null;

  // Actions
  refetch: () => void;
}
```

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        ActivityLibrary Page                      │
│                                                                  │
│  ┌──────────────────┐    ┌───────────────────────────────────┐  │
│  │ useActivities()  │───▶│ activities: PublicActivity[]      │  │
│  │ TanStack Query   │    │ isLoading, error, refetch         │  │
│  └──────────────────┘    └───────────────────────────────────┘  │
│                                       │                          │
│                                       ▼                          │
│  ┌──────────────────┐    ┌───────────────────────────────────┐  │
│  │ useState(filters)│───▶│ useMemo: filteredActivities       │  │
│  │ FilterState      │    │ Apply category/duration/complexity │  │
│  └──────────────────┘    └───────────────────────────────────┘  │
│           │                           │                          │
│           ▼                           ▼                          │
│  ┌──────────────────┐    ┌───────────────────────────────────┐  │
│  │ ActivityFilters  │    │ ActivityGrid                       │  │
│  │ - Select dropdowns│   │ - Map filtered activities          │  │
│  │ - Clear button    │   │ - Render ActivityCard[]            │  │
│  └──────────────────┘    └───────────────────────────────────┘  │
│                                       │                          │
│                                       ▼                          │
│                          ┌───────────────────────────────────┐  │
│                          │ ActivityDetailModal (on click)     │  │
│                          │ - Full activity details            │  │
│                          │ - Customize button                 │  │
│                          └───────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Query

**Single query - no pagination needed for 45 items**:

```typescript
const fetchPublicActivities = async (): Promise<PublicActivity[]> => {
  const { data, error } = await supabase
    .from('public_activities')
    .select('*')
    .eq('is_active', true)
    .order('category', { ascending: true })
    .order('duration_minutes', { ascending: true });

  if (error) throw error;
  return data ?? [];
};
```

---

## Relationships

```
PublicActivity (Database)
         │
         │ 1:N (via UI navigation)
         ▼
CustomizePlaceholder (Future: CustomizedActivity)
         │
         │ context passed via URL param
         ▼
    /customize/:activityId
```

**Note**: The actual customization relationship (PublicActivity → CustomizedActivity) is handled by Feature 2. This feature only establishes the navigation pattern with activity ID in URL.
