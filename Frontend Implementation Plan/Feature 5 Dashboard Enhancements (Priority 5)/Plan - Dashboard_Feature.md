/plan

Based on the Enhanced Dashboard specification, create an implementation plan.

## Key Integration Points
1. Supabase query: usage_quotas table (for quota info)
2. Supabase query: customized_activities table (for recent activities)
3. Existing team_profiles query from useUser hook
4. Enhance existing Dashboard.tsx page

## Data Queries Needed
```typescript
// Quota query
const { data: quota } = await supabase
  .from('usage_quotas')
  .select('*')
  .eq('organization_id', orgId)
  .single();

// Recent activities query
const { data: recentActivities } = await supabase
  .from('customized_activities')
  .select('id, title, description, duration_minutes, created_at')
  .eq('team_id', teamId)
  .order('created_at', { ascending: false })
  .limit(5);
```

## Required shadcn/ui Components to Add
- Progress (for quota progress bar)
- Separator (for section dividers)

## File Structure (Enhancing Existing)
src/
├── pages/
│   └── Dashboard.tsx (enhance existing)
├── components/
│   └── dashboard/
│       ├── WelcomeCard.tsx (existing - keep)
│       ├── TeamInfoCard.tsx (existing - keep)
│       ├── QuotaCard.tsx (new)
│       ├── RecentActivities.tsx (new)
│       └── QuickActions.tsx (new)
├── hooks/
│   ├── useUser.ts (existing - may enhance)
│   ├── useQuota.ts (new)
│   └── useRecentActivities.ts (new)
└── types/
    └── dashboard.ts (new - dashboard interfaces)

## TypeScript Interfaces
```typescript
interface QuotaInfo {
  id: string;
  organization_id: string;
  public_customizations_used: number;
  public_customizations_limit: number;
  custom_generations_used: number;
  custom_generations_limit: number;
  trust_score: number;
  quota_period_start: string;
  quota_period_end: string;
}

interface RecentActivity {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  created_at: string;
}
```

## Implementation Order
1. Add required shadcn/ui components (Progress, Separator)
2. Create TypeScript interfaces in src/types/dashboard.ts
3. Create useQuota hook
4. Create useRecentActivities hook
5. Build QuotaCard component
6. Build RecentActivities component
7. Build QuickActions component
8. Enhance Dashboard.tsx layout to include new components
9. Add loading skeletons for each section
10. Test responsive layout

## Dashboard Layout Structure
```tsx
<div className="container mx-auto p-6">
  {/* Row 1: Welcome + Quick Actions */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
    <WelcomeCard className="md:col-span-2" />
    <QuickActions />
  </div>
  
  {/* Row 2: Quota Cards */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
    <QuotaCard 
      title="Activity Customizations" 
      used={quota.public_customizations_used}
      limit={quota.public_customizations_limit}
    />
    <QuotaCard 
      title="Custom Generations" 
      used={quota.custom_generations_used}
      limit={quota.custom_generations_limit}
    />
  </div>
  
  {/* Row 3: Recent Activities + Team Info */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <RecentActivities activities={recentActivities} />
    <TeamInfoCard team={team} />
  </div>
</div>
```

## Component Responsibilities
- QuotaCard: Display usage/limit with progress bar, period dates
- RecentActivities: List 5 recent activities with links to view
- QuickActions: Buttons for "Browse Activities", "Generate Custom", "Upload Materials"
- Enhanced Dashboard: Orchestrate layout, fetch all data, handle loading states

## Quick Action Buttons
```typescript
const quickActions = [
  { label: 'Browse Activities', href: '/activities', icon: Library },
  { label: 'Generate Custom', href: '/generate', icon: Sparkles },
  { label: 'Upload Materials', href: '/materials', icon: Upload }
];
```