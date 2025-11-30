/specify

Feature: Enhanced Dashboard with Quota & Recent Activities

## Overview
Enhance the existing Dashboard page to show quota usage, recent customized activities, and quick actions.

## User Stories
1. As a user, I want to see my quota usage (X of Y customizations used)
2. As a user, I want to see my recent customized activities
3. As a user, I want quick access to Activity Library and Generate
4. As a user, I want to see my team profile summary

## Technical Requirements

### Data to Display
1. Quota information from usage_quotas table
2. Recent customized_activities (last 5)
3. Team profile from team_profiles table
4. Quick action buttons

### UI Components Needed
1. QuotaCard (src/components/dashboard/QuotaCard.tsx)
2. RecentActivities (src/components/dashboard/RecentActivities.tsx)
3. QuickActions (src/components/dashboard/QuickActions.tsx)

### Existing Components to Enhance
- Dashboard.tsx - Add new sections
- WelcomeCard.tsx - Keep as-is
- TeamInfoCard.tsx - Keep as-is

### Design Requirements
- Stats cards at top (quota usage)
- Recent activities list
- Quick action buttons
- Maintain clean, minimal design

## Acceptance Criteria
1. Shows quota usage with visual progress bar
2. Lists last 5 customized activities
3. Quick action buttons work
4. Responsive layout
5. Loading states for each section