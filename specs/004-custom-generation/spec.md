# Feature Specification: Custom Activity Generation

**Feature Branch**: `004-custom-generation`
**Created**: 2025-11-30
**Status**: Draft
**Input**: User description: "Allow users to generate completely new activities based on uploaded materials and requirements via async AI job"

## Clarifications

### Session 2025-11-30

- Q: Should the Generate Activity page use a multi-step wizard or single-page layout? → A: Single-page layout with collapsible/expandable sections for requirements and materials

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Generate Custom Activities (Priority: P1)

As a team manager or admin with a paid subscription, I want to describe my activity requirements and generate new AI-powered activities so that I can get unique team-building activities tailored to my specific needs.

**Why this priority**: This is the core functionality of the feature. Without the ability to submit requirements and trigger generation, the entire feature has no value. This enables the primary value proposition of creating custom activities beyond the public library.

**Independent Test**: Can be fully tested by entering requirements text, optionally selecting materials, and clicking generate. Delivers immediate value by creating 3 unique AI-generated activities.

**Acceptance Scenarios**:

1. **Given** I am on the Generate Activity page as an authenticated manager/admin with a paid subscription, **When** I enter my activity requirements in the text area and click Generate, **Then** the system should create a generation job and show me progress status
2. **Given** I have entered valid requirements, **When** I click Generate, **Then** I should see a progress indicator showing the job is being processed
3. **Given** the generation job is in progress, **When** I remain on the page, **Then** the progress should update automatically every 5 seconds until completion or failure

---

### User Story 2 - View Generated Activities (Priority: P1)

As a user who has submitted a generation request, I want to view the resulting activities when generation completes so that I can review what the AI created.

**Why this priority**: Equal priority to generation because without displaying results, the generation has no visible outcome. Users must see the activities to derive value from the feature.

**Independent Test**: Can be tested by completing a generation job and verifying 3 activities are displayed with their full details (title, description, duration, instructions).

**Acceptance Scenarios**:

1. **Given** a generation job has completed successfully, **When** the status becomes "completed", **Then** I should see 3 generated activities displayed as cards with title, description, duration, complexity, and instructions
2. **Given** activities are displayed after generation, **When** I review the activity details, **Then** each activity should show complete information including title, description, duration, complexity, required tools, and step-by-step instructions
3. **Given** generation has completed, **When** viewing the results, **Then** I should see a celebration/success message indicating activities are ready

---

### User Story 3 - Select Materials for Context (Priority: P2)

As a user generating custom activities, I want to optionally select from my team's uploaded materials so that the AI can use specific documents as context for generation.

**Why this priority**: Material selection enhances generation quality but is optional. The feature works without materials, making this a P2 enhancement to the core P1 functionality.

**Independent Test**: Can be tested by navigating to the materials selection step, checking one or more materials, and verifying they are included in the generation request.

**Acceptance Scenarios**:

1. **Given** I am on the Generate Activity page, **When** my team has uploaded materials, **Then** I should see a list of available materials with checkboxes
2. **Given** the materials list is displayed, **When** I check one or more materials, **Then** those materials should be visually selected and included in my generation request
3. **Given** no materials have been uploaded, **When** I view the materials selection section, **Then** I should see a message indicating no materials are available with an optional link to upload materials

---

### User Story 4 - Save Generated Activities (Priority: P2)

As a user who has reviewed generated activities, I want to save activities I like to my team's activity library so that I can use them for future team events.

**Why this priority**: Saving activities preserves the value of generation, but users can still view and manually note down activities. This extends the feature's utility beyond single-session use.

**Independent Test**: Can be tested by clicking Save on a generated activity and verifying it appears in the team's saved activities.

**Acceptance Scenarios**:

1. **Given** I am viewing generated activities, **When** I click the Save button on an activity, **Then** the activity should be saved to my team's activity library with status "saved"
2. **Given** I have saved an activity, **When** the save completes, **Then** I should see a success confirmation and the Save button should indicate the activity has been saved
3. **Given** I am viewing generated activities, **When** I choose not to save an activity, **Then** the activity should remain visible for the session but not persist beyond the generation job

---

### User Story 5 - Handle Generation Errors (Priority: P2)

As a user, I want clear feedback when generation fails or times out so that I understand what happened and can try again.

**Why this priority**: Error handling is essential for user experience but is a supporting function to the core generation flow. Users need to understand failures to make informed decisions.

**Independent Test**: Can be tested by simulating a job failure and verifying appropriate error messages are displayed with retry options.

**Acceptance Scenarios**:

1. **Given** a generation job fails, **When** the job status becomes "failed", **Then** I should see a clear error message explaining what went wrong
2. **Given** a generation job exceeds the expected time (2 minutes), **When** the timeout is reached, **Then** I should see a timeout message with an option to retry
3. **Given** an error has occurred, **When** I click Retry, **Then** a new generation job should be created with the same requirements

---

### Edge Cases

- What happens when user navigates away during job processing? Job continues in background; user can return to check status or start fresh
- How does system handle generation job timeout? Display timeout error after 2 minutes of no completion, offer retry option
- What happens if AI generates fewer than 3 activities? Display whatever activities were generated with a note about partial results
- How does system handle quota exceeded? Display quota limit message before generation starts, show remaining quota count
- What happens when user submits empty requirements? Prevent submission with validation error requiring minimum 10 characters
- How does system handle network interruption during polling? Auto-retry polling 3 times, then show reconnection error with manual retry
- What happens if selected materials were deleted between selection and submission? Validate materials exist at submission time, show error if materials no longer available

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a dedicated single-page layout for custom activity generation with collapsible/expandable sections for requirements and materials selection
- **FR-002**: System MUST display a text area for users to enter activity requirements (minimum 10 characters, maximum 2000 characters)
- **FR-003**: System MUST display a list of team's uploaded materials as selectable options (checkboxes)
- **FR-004**: System MUST validate that requirements are not empty before allowing generation submission
- **FR-005**: System MUST create an async generation job upon submission and return a job ID
- **FR-006**: System MUST poll the job status endpoint every 5 seconds until job completes or fails
- **FR-007**: System MUST display a progress indicator while generation is in progress (pending → processing → completed/failed states)
- **FR-008**: System MUST display 3 generated activities upon successful job completion
- **FR-009**: System MUST display each generated activity with: title, description, duration, complexity, required tools, and instructions
- **FR-010**: System MUST allow users to save individual generated activities to their team library
- **FR-011**: System MUST display clear error messages for job failures with retry option
- **FR-012**: System MUST implement a 2-minute timeout for generation jobs with appropriate user feedback
- **FR-013**: System MUST restrict generation capability to users with manager or admin roles
- **FR-014**: System MUST restrict generation capability to users with a paid subscription plan
- **FR-015**: System MUST display current quota usage and remaining generations available
- **FR-016**: System MUST prevent generation submission when custom generation quota is exhausted
- **FR-017**: System MUST stop polling when job status reaches "completed" or "failed"
- **FR-018**: System MUST display a success celebration when generation completes successfully
- **FR-019**: System MUST provide a way to start a new generation after viewing results

### Key Entities

- **Generation Job**: Represents an async AI generation task. Key attributes: job ID, status (pending/processing/completed/failed), team association, created timestamp, completion timestamp, generated activities
- **Custom Activity**: An AI-generated activity. Key attributes: title, description, duration, complexity, required tools, instructions, team association, generation source, save status
- **Material**: Reference to uploaded team materials selected for generation context. Existing entity from Feature 3
- **Usage Quota**: Tracks custom generation usage limits per organization. Key attributes: generations used, generation limit, quota period

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can submit generation requirements and see progress indicator within 3 seconds of submission
- **SC-002**: 90% of generation jobs complete successfully within 60 seconds
- **SC-003**: Users can view all 3 generated activities with full details within 5 seconds of job completion
- **SC-004**: Users can save generated activities to their library in under 3 seconds per activity
- **SC-005**: Error messages appear within 5 seconds of job failure with clear explanation
- **SC-006**: Material selection loads and displays within 2 seconds of page load
- **SC-007**: Quota information displays accurately reflecting current usage state
- **SC-008**: 95% of users successfully complete the generation workflow on first attempt

## Assumptions

- The backend API endpoints (POST /api/activities/generate-custom, GET /api/jobs/{job_id}) already exist and are functional
- AI generation is handled asynchronously by the backend via Celery + Redis
- Users must be authenticated and have an active session to access the Generate Activity page
- The Generate Activity page will be accessible from the main navigation (Activity Library or Dashboard) for users with appropriate roles
- Custom generation quota limits are enforced by the backend
- Generated activities default to "suggested" status until explicitly saved
- The existing Materials hooks (useTeamMaterials) can be reused for material selection
- The existing QuotaInfo type and useQuota hook can be reused for quota display

## Dependencies

- Existing authentication system (Clerk)
- Existing team and organization data structure
- Existing materials system (Feature 3 - for material selection)
- Backend generation API endpoints
- Backend jobs API endpoint
- AI processing pipeline (Celery + Redis)
- Existing quota management system

## Out of Scope

- Editing generated activities before saving
- Regenerating a single activity (must regenerate all 3)
- Scheduling generated activities directly from results
- Sharing generated activities across teams
- Activity preview/simulation
- Rating or feedback on generated activities
- Generation history/log view
- Customizing the number of activities generated (always 3)
