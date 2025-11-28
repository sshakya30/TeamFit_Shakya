/specify

Feature: Activity Customization Flow

## Overview
Allow users to customize a public activity for their team using AI. This connects to the FastAPI backend endpoint POST /api/activities/customize.

## User Stories
1. As a user, I want to select a duration (15, 30, or 45 min) for the activity
2. As a user, I want to see my team profile info before customizing
3. As a user, I want to submit customization request and see a loading state
4. As a user, I want to see the AI-customized activity result
5. As a user, I want to save the customized activity or try again

## Technical Requirements

### Backend API Endpoint
POST http://localhost:8000/api/activities/customize
Request:
```json
{
  "team_id": "uuid",
  "organization_id": "uuid",
  "public_activity_id": "uuid",
  "duration_minutes": 30
}
```
Response:
```json
{
  "success": true,
  "activity_id": "uuid",
  "activity": {
    "title": "...",
    "description": "...",
    "customized_instructions": "...",
    "duration_minutes": 30
  },
  "quotas_remaining": {
    "public_used": 1,
    "public_limit": 5
  }
}
```

### UI Components Needed
1. CustomizeActivityPage (src/pages/CustomizeActivity.tsx)
2. DurationSelector (src/components/activities/DurationSelector.tsx)
3. TeamProfilePreview (src/components/activities/TeamProfilePreview.tsx)
4. CustomizationResult (src/components/activities/CustomizationResult.tsx)
5. QuotaDisplay (src/components/activities/QuotaDisplay.tsx)

### Flow
1. User clicks "Customize" on ActivityCard → navigates to /activities/customize/:activityId
2. Page loads activity details and user's team profile
3. User selects duration (15/30/45 min)
4. User clicks "Generate Customization"
5. Loading state shows (10-30 seconds for AI)
6. Result displays with customized activity
7. User can "Save to My Activities" or "Back to Library"

### State Management
- Use TanStack Query useMutation for API call
- Track: selectedDuration, isCustomizing, customizationResult, error

### Routes
- /activities/customize/:activityId

### Design Requirements
- Step-by-step wizard feel
- Clear loading indicator during AI processing
- Success state with confetti or celebration
- Error state with retry option
- Show quota usage after completion

## Acceptance Criteria
1. Can select activity duration
2. Shows team profile preview
3. Submit triggers API call with loading state
4. Displays customized result
5. Shows remaining quota
6. Error handling with retry
7. Can navigate back to library