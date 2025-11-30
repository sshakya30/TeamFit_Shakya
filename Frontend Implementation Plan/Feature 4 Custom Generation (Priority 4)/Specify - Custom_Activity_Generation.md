/specify

Feature: Custom Activity Generation

## Overview
Allow users to generate completely new activities based on their uploaded materials and requirements. This is an async job that takes 30-60 seconds.

## User Stories
1. As a user, I want to enter requirements for custom activities
2. As a user, I want to select which uploaded materials to use
3. As a user, I want to see job progress while AI generates activities
4. As a user, I want to view generated activities when complete
5. As a user, I want to save generated activities to my library

## Technical Requirements

### Backend API Endpoints
1. POST /api/activities/generate-custom
   - Request: { team_id, organization_id, requirements, material_ids? }
   - Returns: { job_id, status: "pending" }

2. GET /api/jobs/{job_id}
   - Returns: { status, activities[] } when complete

### UI Components Needed
1. GenerateActivityPage (src/pages/GenerateActivity.tsx)
2. RequirementsForm (src/components/generate/RequirementsForm.tsx)
3. MaterialSelector (src/components/generate/MaterialSelector.tsx)
4. JobProgressTracker (src/components/generate/JobProgressTracker.tsx)
5. GeneratedActivitiesList (src/components/generate/GeneratedActivitiesList.tsx)

### Job Status Polling
- Poll GET /api/jobs/{job_id} every 5 seconds
- Status: pending → processing → completed/failed
- Stop polling when completed or failed

### Routes
- /generate

### Design Requirements
- Multi-step form wizard
- Material selection with checkboxes
- Textarea for requirements
- Animated progress indicator
- Success celebration when complete
- Display 3 generated activities

## Acceptance Criteria
1. Can enter requirements text
2. Can select materials (optional)
3. Submit creates job and shows progress
4. Progress polls every 5 seconds
5. Completed shows generated activities
6. Can save activities to library
7. Error handling for failures