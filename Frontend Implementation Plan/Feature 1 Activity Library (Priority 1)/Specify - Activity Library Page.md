/specify

Feature: Activity Library Page

## Overview
Create an Activity Library page that displays all public team-building activities from the database. Users can browse, filter, and select activities to customize for their team.

## User Stories
1. As a user, I want to see all available public activities so I can choose ones suitable for my team
2. As a user, I want to filter activities by sector (Tech/IT, Healthcare, Finance, Education, Marketing) so I can find industry-relevant activities
3. As a user, I want to filter activities by duration (15, 30, 45 minutes) so I can fit activities into my schedule
4. As a user, I want to see activity details (title, description, objectives, participant count) before customizing
5. As a user, I want to click "Customize" to start the AI customization flow

## Technical Requirements

### Database Query
- Fetch from `public_activities` table in Supabase
- Fields: id, title, description, objectives, default_duration_minutes, min_participants, max_participants, materials_needed, sector_tags, difficulty_level
- No RLS restrictions (public read access)

### UI Components Needed
1. ActivityLibraryPage (src/pages/ActivityLibrary.tsx)
2. ActivityCard component (src/components/activities/ActivityCard.tsx)
3. ActivityFilters component (src/components/activities/ActivityFilters.tsx)
4. ActivityDetailModal component (src/components/activities/ActivityDetailModal.tsx)

### Existing Tech Stack
- React + TypeScript + Vite
- TanStack Query v5 for data fetching
- shadcn/ui (Button, Card already installed)
- Tailwind CSS for styling
- Supabase client in src/lib/supabase.ts
- React Router v6

### Routes
- Add route: /activities → ActivityLibraryPage

### Design Requirements
- Clean & minimal design (like Notion/Linear)
- Responsive grid layout (1 col mobile, 2 cols tablet, 3 cols desktop)
- Card-based activity display
- Sidebar or top filters
- Empty state when no results

### Data Shape (from database)
```typescript
interface PublicActivity {
  id: string;
  title: string;
  description: string;
  objectives: string[];
  default_duration_minutes: number;
  min_participants: number;
  max_participants: number;
  materials_needed: string[];
  sector_tags: string[];
  difficulty_level: 'easy' | 'medium' | 'hard';
  created_at: string;
}
```

### Filter Options
- Sector: All, Tech/IT, Healthcare, Finance, Education, Marketing
- Duration: All, 15 min, 30 min, 45 min
- Difficulty: All, Easy, Medium, Hard

### Actions
- "View Details" → Opens modal with full activity info
- "Customize for My Team" → Navigates to customization flow (Feature 2)

## Acceptance Criteria
1. Page loads and displays activities in grid
2. Filters work and update results in real-time
3. Activity cards show key info (title, description preview, duration, participants)
4. Modal shows full activity details
5. "Customize" button is visible and clickable
6. Loading state shown while fetching
7. Empty state shown when no activities match filters
8. Responsive on mobile/tablet/desktop