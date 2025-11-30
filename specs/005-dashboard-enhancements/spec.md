# Feature Specification: Dashboard Enhancements - Quota & Recent Activities

**Feature Branch**: `005-dashboard-enhancements`
**Created**: 2025-11-30
**Status**: Draft
**Input**: User description: "Enhance the existing Dashboard page to show quota usage, recent customized activities, and quick actions. Users want to see their quota usage (X of Y customizations used), recent customized activities, quick access to Activity Library and Generate, and team profile summary."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Quota Usage (Priority: P1)

As a team manager or admin, I want to see my organization's current quota usage at a glance on the dashboard so I can understand how many customizations I have remaining before needing to upgrade or wait for quota reset.

**Why this priority**: Quota visibility is critical for user decision-making. Without knowing remaining quota, users may attempt customizations that fail, leading to frustration. This directly impacts user experience and prevents wasted effort.

**Independent Test**: Can be fully tested by loading the dashboard and verifying the quota card displays current usage count vs. limit with a visual progress indicator.

**Acceptance Scenarios**:

1. **Given** a user is authenticated and on the dashboard, **When** the page loads, **Then** they see a quota card showing "X of Y customizations used" with a visual progress bar
2. **Given** a user has used some of their quota, **When** they view the quota card, **Then** the progress bar reflects the percentage used with appropriate color coding (green < 70%, yellow 70-90%, red > 90%)
3. **Given** quota data is loading, **When** the dashboard is displayed, **Then** the quota section shows a loading skeleton placeholder
4. **Given** a user has a free tier subscription, **When** they view the quota card, **Then** they see their free tier limits (e.g., "3 of 5 public customizations")
5. **Given** a user has a paid subscription, **When** they view the quota card, **Then** they see their paid tier limits with both public and custom generation quotas displayed

---

### User Story 2 - View Recent Customized Activities (Priority: P2)

As a team manager, I want to see my most recent customized activities on the dashboard so I can quickly access activities I've worked on and track my team's activity customization history.

**Why this priority**: Recent activities provide quick access to ongoing work and help users remember context from previous sessions. This reduces navigation time and improves workflow continuity.

**Independent Test**: Can be fully tested by viewing the dashboard after creating customized activities and verifying the most recent 5 activities appear in a list.

**Acceptance Scenarios**:

1. **Given** a user has customized activities, **When** they view the dashboard, **Then** they see a list of their 5 most recent customized activities with title, type (customized/generated), and creation date
2. **Given** a user clicks on a recent activity, **When** the activity card is clicked, **Then** they are navigated to view that activity's details
3. **Given** a user has no customized activities, **When** they view the dashboard, **Then** they see an empty state with a message encouraging them to browse the Activity Library
4. **Given** recent activities are loading, **When** the dashboard is displayed, **Then** the section shows loading skeleton placeholders
5. **Given** a user has activities with different statuses, **When** they view recent activities, **Then** each activity shows its current status (suggested, saved, scheduled)

---

### User Story 3 - Quick Access to Key Features (Priority: P3)

As a user, I want prominent quick action buttons on my dashboard so I can navigate directly to the Activity Library, Generate Activities page, or Materials page without going through multiple menus.

**Why this priority**: Quick actions reduce friction for common tasks. Users frequently switch between dashboard and key features, so reducing clicks improves overall efficiency.

**Independent Test**: Can be fully tested by clicking each quick action button and verifying navigation to the correct page.

**Acceptance Scenarios**:

1. **Given** a user is on the dashboard, **When** they view the quick actions section, **Then** they see prominent buttons for "Browse Activities" and "Generate Activities"
2. **Given** a manager/admin with paid subscription, **When** they view quick actions, **Then** they also see a "Manage Materials" button
3. **Given** a user clicks "Browse Activities", **When** the button is clicked, **Then** they are navigated to `/activities`
4. **Given** a manager/admin clicks "Generate Activities", **When** the button is clicked, **Then** they are navigated to the activity generation page
5. **Given** quick actions are displayed, **When** a user views them, **Then** each button has clear iconography and labels

---

### User Story 4 - View Team Profile Summary (Priority: P4)

As a team manager, I want to see a summary of my team's profile on the dashboard so I can verify the AI has the correct context for personalizing activities and easily access the profile to make updates.

**Why this priority**: Team profile context is important for AI customization quality, but users don't need to see it every time. A summary with edit access is sufficient for occasional verification.

**Independent Test**: Can be fully tested by viewing the dashboard with a completed team profile and verifying the summary displays key profile information with an edit link.

**Acceptance Scenarios**:

1. **Given** a user's team has a completed profile, **When** they view the dashboard, **Then** they see a compact summary showing industry sector, team size, and role description preview
2. **Given** a user clicks "Edit Profile" on the summary, **When** the button is clicked, **Then** they are navigated to the team profile editing page
3. **Given** a user's team has no profile, **When** they view the dashboard, **Then** they see a prompt to complete the team profile with a setup button
4. **Given** team profile data is loading, **When** the dashboard is displayed, **Then** the section shows a loading skeleton placeholder

---

### Edge Cases

- What happens when quota API fails to load? Display the dashboard without the quota card, showing an error message in that section with a retry button.
- What happens when the user belongs to multiple teams? Display quota and activities for the user's primary team (the team they are currently viewing in context).
- What happens when all quotas are exhausted (0 remaining)? Show the quota card with 100% filled progress bar in red, with a message about quota reset date or upgrade options.
- What happens when the quota period resets? The quota card should reflect the new period with reset usage counts.
- What happens on mobile devices? All dashboard sections should stack vertically and remain fully usable on small screens.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a quota usage card showing public customizations used vs. limit (e.g., "3 of 5 used")
- **FR-002**: System MUST display a visual progress bar for quota usage with color coding based on percentage (green < 70%, yellow 70-90%, red > 90%)
- **FR-003**: System MUST display the 5 most recent customized activities for the user's team
- **FR-004**: System MUST show activity title, customization type badge (public_customized or custom_generated), status badge, and creation date for each recent activity
- **FR-005**: System MUST make recent activity items clickable to navigate to activity details
- **FR-006**: System MUST display an empty state with call-to-action when no customized activities exist
- **FR-007**: System MUST display quick action buttons for "Browse Activities" and "Generate Activities"
- **FR-008**: System MUST conditionally show "Manage Materials" quick action for managers/admins with paid subscriptions
- **FR-009**: System MUST display a team profile summary showing industry sector, team size, and role description
- **FR-010**: System MUST provide an "Edit Profile" action to navigate to team profile management
- **FR-011**: System MUST display a "Complete Profile" prompt when team profile is incomplete or missing
- **FR-012**: System MUST show loading skeletons for each section while data is being fetched
- **FR-013**: System MUST handle API errors gracefully with error messages and retry options per section
- **FR-014**: System MUST maintain responsive layout with sections stacking appropriately on mobile devices
- **FR-015**: System MUST preserve existing dashboard functionality (welcome header, team info card, role badge)

### Key Entities

- **Usage Quota**: Organization-level usage tracking with public customizations used/limit and custom generations used/limit, linked to quota periods.
- **Customized Activity**: Team-specific activity with customization type (public_customized or custom_generated), status (suggested/saved/scheduled/expired), and source reference.
- **Team Profile**: AI context information including industry sector, team size, role description, and member responsibilities.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can see their remaining quota within 1 second of dashboard load
- **SC-002**: Users can navigate from dashboard to any key feature (Activity Library, Generate, Materials) in a single click
- **SC-003**: Users can access their 5 most recent activities directly from the dashboard
- **SC-004**: Dashboard remains usable and performant when individual data sections fail to load
- **SC-005**: Dashboard sections load and display content within 2 seconds on standard connections
- **SC-006**: 95% of users can understand their quota status from the visual progress indicator without reading helper text

## Assumptions

- The existing `usage_quotas` table contains current quota data for the user's organization
- The existing `customized_activities` table can be queried for recent team activities
- The existing `team_profiles` table contains team context information
- The user's primary team context is determined by the `useUser` hook's `teamMember` data
- Existing dashboard components (WelcomeCard, TeamInfoCard, QuickActionsCard) will be preserved
- The subscription plan information is available in the organization data to determine paid vs. free tier
- Color coding thresholds (70%, 90%) are appropriate for quota visualization
- Showing 5 recent activities is sufficient for the dashboard preview (users can access full list elsewhere if needed)
