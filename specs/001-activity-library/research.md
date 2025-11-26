# Research: Activity Library Page

**Feature**: 001-activity-library
**Date**: 2025-11-26
**Purpose**: Resolve technical decisions and best practices before implementation

## 1. shadcn/ui Component Patterns

### Decision: Use shadcn/ui components via CLI installation

**Rationale**:
- Project already has `components.json` configured with `@/components` alias
- Two components already installed (Button, Card) following the pattern
- CLI installation (`npx shadcn-ui@latest add [component]`) ensures consistency
- Components are copied to source, allowing customization

**Components to Add**:

| Component | Purpose | Installation |
|-----------|---------|--------------|
| Dialog | Activity detail modal | `npx shadcn-ui@latest add dialog` |
| Select | Filter dropdowns | `npx shadcn-ui@latest add select` |
| Badge | Category/complexity tags | `npx shadcn-ui@latest add badge` |
| Skeleton | Loading placeholders | `npx shadcn-ui@latest add skeleton` |

**Alternatives Considered**:
- Headless UI: More manual styling required
- Radix primitives directly: shadcn already wraps Radix
- Custom components: Unnecessary given shadcn availability

---

## 2. TanStack Query Caching Strategy

### Decision: Use `staleTime: Infinity` for public activities

**Rationale**:
- Public activities are static system data (rarely changes)
- 45 activities is a small dataset (~10KB)
- Single fetch on page load, cache indefinitely during session
- No need for background refetching or polling

**Implementation**:
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['public-activities'],
  queryFn: fetchPublicActivities,
  staleTime: Infinity,  // Never refetch automatically
  gcTime: 1000 * 60 * 30,  // Keep in cache 30 minutes
  retry: 2,
});
```

**Alternatives Considered**:
- Default staleTime (5 min): Unnecessary refetches for static data
- No caching: Poor UX when navigating back to page
- Local storage persistence: Over-engineering for 45 items

---

## 3. Client-Side Filtering Best Practices

### Decision: Use `useMemo` for filtered results

**Rationale**:
- 45 activities is small enough for instant filtering
- Filter state changes frequently (user interaction)
- Memoization prevents unnecessary recalculations
- Array filter/map operations are O(n) - acceptable for small n

**Implementation Pattern**:
```typescript
const filteredActivities = useMemo(() => {
  return activities?.filter(activity => {
    const matchesCategory = !filters.category || activity.category === filters.category;
    const matchesDuration = !filters.duration || activity.duration_minutes === filters.duration;
    const matchesComplexity = !filters.complexity || activity.complexity === filters.complexity;
    return matchesCategory && matchesDuration && matchesComplexity;
  });
}, [activities, filters.category, filters.duration, filters.complexity]);
```

**Alternatives Considered**:
- Server-side filtering: Adds latency, unnecessary for 45 items
- No memoization: Risk of performance degradation on rapid filter changes
- Debounced filtering: Not needed for instant client-side operations

---

## 4. Filter State Management

### Decision: Use `useState` with object state

**Rationale**:
- Simple filter state (3 fields)
- No complex state transitions
- Co-located with component using it
- No need for global state (filters reset on page leave)

**Implementation**:
```typescript
interface FilterState {
  category: string | null;
  duration: number | null;
  complexity: string | null;
}

const [filters, setFilters] = useState<FilterState>({
  category: null,
  duration: null,
  complexity: null,
});
```

**Alternatives Considered**:
- URL params: Over-engineering, filters don't need to be shareable
- Zustand/Redux: Overkill for 3 filter values
- useReducer: Unnecessary complexity for simple state

---

## 5. Modal Implementation

### Decision: Use shadcn Dialog with controlled state

**Rationale**:
- Dialog component handles accessibility (focus trap, escape key)
- Controlled state allows programmatic open/close
- Supports backdrop click to close
- Renders in portal (avoids z-index issues)

**Implementation**:
```typescript
const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

<Dialog open={!!selectedActivity} onOpenChange={() => setSelectedActivity(null)}>
  <DialogContent>
    {selectedActivity && <ActivityDetails activity={selectedActivity} />}
  </DialogContent>
</Dialog>
```

**Alternatives Considered**:
- Separate route (/activities/:id): Over-engineering for quick preview
- Slide-over panel: Less common UX pattern
- Inline expansion: Poor mobile experience

---

## 6. Responsive Grid Strategy

### Decision: CSS Grid with Tailwind responsive classes

**Rationale**:
- Tailwind's grid utilities are well-documented
- Easy breakpoint management (sm, md, lg)
- No JS-based calculations needed
- Consistent with existing Tailwind patterns in codebase

**Implementation**:
```typescript
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  {activities.map(activity => <ActivityCard key={activity.id} {...activity} />)}
</div>
```

**Breakpoints**:
- Mobile (<640px): 1 column
- Tablet (640-1024px): 2 columns
- Desktop (>1024px): 3 columns

---

## 7. Category Display Names

### Decision: Map database values to human-readable labels

**Database Values** → **Display Labels**:
| Database | Display |
|----------|---------|
| tech_it | Tech/IT |
| finance_accounting | Finance |
| marketing_creative | Marketing |
| business_services | Business Services |
| customer_service | Customer Service |

**Implementation**:
```typescript
const CATEGORY_LABELS: Record<string, string> = {
  tech_it: 'Tech/IT',
  finance_accounting: 'Finance',
  marketing_creative: 'Marketing',
  business_services: 'Business Services',
  customer_service: 'Customer Service',
};
```

---

## 8. Error Handling Strategy

### Decision: Three-tier error handling

**Rationale**:
- TanStack Query handles retries automatically
- UI shows user-friendly message with retry action
- Console logs detailed error for debugging

**Tiers**:
1. **Query Level**: 2 automatic retries with exponential backoff
2. **UI Level**: Error state component with retry button
3. **Logging**: Console error with full error object

**Implementation**:
```typescript
if (error) {
  return (
    <ErrorState
      message="Failed to load activities"
      onRetry={() => refetch()}
    />
  );
}
```

---

## 9. Navigation Flow

### Decision: Button navigation to placeholder route

**Routes to Add**:
- `/activities` → ActivityLibrary page
- `/customize/:activityId` → CustomizePlaceholder page

**Navigation**:
- Navbar: Add "Activities" link
- Card: "Customize" button → `/customize/{id}`
- Modal: "Customize for My Team" button → `/customize/{id}`
- Placeholder: "Back to Library" link → `/activities`

---

## Summary of Decisions

| Topic | Decision | Key Reason |
|-------|----------|------------|
| UI Components | shadcn/ui CLI | Consistency with existing setup |
| Data Caching | staleTime: Infinity | Static data, no refetch needed |
| Filtering | useMemo client-side | 45 items, instant filtering |
| Filter State | useState object | Simple, co-located state |
| Modal | shadcn Dialog | Accessibility, portal rendering |
| Grid Layout | Tailwind CSS Grid | Consistent with existing patterns |
| Categories | Label mapping | Human-readable display |
| Errors | 3-tier handling | Query retry + UI + logging |
| Navigation | React Router | Existing pattern |

All research items resolved. Ready for Phase 1 design.
