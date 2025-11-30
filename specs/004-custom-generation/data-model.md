# Data Model: Custom Activity Generation

**Feature**: 004-custom-generation
**Date**: 2025-11-30

## Overview

This document defines the TypeScript interfaces and data flow for the Custom Activity Generation feature. All types extend the existing type system in `frontend/src/types/index.ts`.

---

## New Types to Add

### Generation Request/Response Types

```typescript
// ============================================================================
// Custom Generation Types
// ============================================================================

/**
 * Request payload for generating custom activities
 * Sent to POST /api/activities/generate-custom
 */
export interface GenerateCustomActivitiesRequest {
  team_id: string;
  organization_id: string;
  requirements: string;
  material_ids?: string[];
}

/**
 * Response from custom generation endpoint
 * Returns job_id for status polling
 */
export interface GenerateCustomActivitiesResponse {
  success: boolean;
  job_id: string;
  status: 'pending' | 'processing';
  message: string;
}

/**
 * Job status response from GET /api/jobs/{job_id}
 */
export interface JobStatusResponse {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  job: CustomizationJob;
  activities?: CustomizedActivity[];
  error?: string;
}

/**
 * Customization job record from database
 */
export interface CustomizationJob {
  id: string;
  team_id: string;
  organization_id: string;
  job_type: 'custom_generation' | 'public_customization';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_by: string;
  input_context: {
    team_profile: TeamProfile;
    requirements: string;
    materials_count: number;
  };
  result_data?: {
    activity_ids: string[];
  };
  error_message?: string;
  created_at: string;
  completed_at?: string;
}
```

### Page State Types

```typescript
/**
 * Page state for GenerateActivity page
 * Discriminated union for type-safe state handling
 */
export type GenerationPageState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'polling'; jobId: string; startTime: number }
  | { status: 'completed'; jobId: string; activities: CustomizedActivity[] }
  | { status: 'error'; errorType: GenerationErrorType; message: string };

/**
 * Error types for generation failures
 */
export type GenerationErrorType = 'timeout' | 'failed' | 'network' | 'quota' | 'validation';

/**
 * Form state for requirements and material selection
 */
export interface GenerationFormState {
  requirements: string;
  selectedMaterialIds: string[];
}
```

### Component Props Types

```typescript
/**
 * Props for RequirementsSection component
 */
export interface RequirementsSectionProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
}

/**
 * Props for MaterialsSection component
 */
export interface MaterialsSectionProps {
  teamId: string;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  disabled?: boolean;
}

/**
 * Props for GenerationProgress component
 */
export interface GenerationProgressProps {
  status: 'pending' | 'processing';
  startTime: number;
  onCancel?: () => void;
}

/**
 * Props for GeneratedActivityCard component
 */
export interface GeneratedActivityCardProps {
  activity: CustomizedActivity;
  onSave: () => void;
  isSaving?: boolean;
  isSaved?: boolean;
}

/**
 * Props for GenerationResults component
 */
export interface GenerationResultsProps {
  activities: CustomizedActivity[];
  onSaveActivity: (activityId: string) => Promise<void>;
  onGenerateMore: () => void;
  savedActivityIds: Set<string>;
}
```

### Hook Return Types

```typescript
/**
 * Return type for useGenerateActivities hook
 */
export interface UseGenerateActivitiesReturn {
  mutate: (request: GenerateCustomActivitiesRequest) => void;
  mutateAsync: (request: GenerateCustomActivitiesRequest) => Promise<GenerateCustomActivitiesResponse>;
  data: GenerateCustomActivitiesResponse | undefined;
  error: Error | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  reset: () => void;
}

/**
 * Return type for useJobStatus hook
 */
export interface UseJobStatusReturn {
  data: JobStatusResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isPolling: boolean;
}
```

---

## Existing Types (Reused)

The following types already exist and will be reused:

### From `frontend/src/types/index.ts`

```typescript
// Already defined - no changes needed
interface CustomizedActivity {
  id: string;
  team_id: string;
  organization_id: string;
  title: string;
  description: string | null;
  category: string | null;
  duration_minutes: number | null;
  complexity: string | null;
  required_tools: string[] | null;
  instructions: string | null;
  customization_notes: string | null;
  customization_type: 'public_customized' | 'custom_generated';
  source_public_activity_id: string | null;
  status: 'suggested' | 'saved' | 'scheduled' | 'expired';
  created_at: string | null;
  expires_at: string | null;
}

interface Material {
  id: string;
  team_id: string;
  organization_id: string;
  file_name: string;
  file_type: 'pdf' | 'docx' | 'pptx' | 'xlsx';
  file_size_bytes: number;
  file_url: string;
  storage_path: string | null;
  extracted_text: string | null;
  content_summary: string | null;
  uploaded_by: string;
  created_at: string | null;
}

interface QuotaInfo {
  public_used: number;
  public_limit: number;
  custom_used: number;
  custom_limit: number;
}

interface TeamProfile {
  id: string;
  team_id: string;
  organization_id: string;
  team_role_description: string | null;
  member_responsibilities: string | null;
  past_activities_summary: string | null;
  industry_sector: string | null;
  team_size: number | null;
  preferences: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
}
```

---

## Data Flow

### Generation Flow

```
┌─────────────────┐
│ GenerateActivity│
│     Page        │
└────────┬────────┘
         │
         │ 1. Submit form
         ▼
┌─────────────────┐     ┌─────────────────┐
│useGenerateActivi│────▶│POST /activities/│
│     ties        │     │generate-custom  │
└────────┬────────┘     └────────┬────────┘
         │                       │
         │ 2. Receive job_id     │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│ useJobStatus    │────▶│GET /jobs/{id}   │
│ (polling)       │     │(every 5s)       │
└────────┬────────┘     └────────┬────────┘
         │                       │
         │ 3. Status updates     │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│GenerationResults│◀────│activities[]     │
│  (display)      │     │(when completed) │
└────────┬────────┘     └─────────────────┘
         │
         │ 4. Save activity
         ▼
┌─────────────────┐     ┌─────────────────┐
│ useSaveActivity │────▶│PATCH /activities│
│                 │     │/{id}/status     │
└─────────────────┘     └─────────────────┘
```

### State Transitions

```
                    ┌──────────────────┐
                    │      idle        │
                    └────────┬─────────┘
                             │ submit
                             ▼
                    ┌──────────────────┐
           ┌───────│    submitting    │───────┐
           │ error └────────┬─────────┘       │ success
           ▼                │                 ▼
┌──────────────────┐        │        ┌──────────────────┐
│      error       │        │        │     polling      │──┐
│  (submission)    │        │        │                  │  │ poll
└────────┬─────────┘        │        └────────┬─────────┘◀─┘
         │ retry            │                 │
         └──────────────────┴─────────────────┤
                                              │ completed
                                              ▼
                                     ┌──────────────────┐
                                     │    completed     │
                                     │  (activities[])  │
                                     └────────┬─────────┘
                                              │ generate more
                                              ▼
                                     ┌──────────────────┐
                                     │      idle        │
                                     └──────────────────┘
```

---

## Validation Rules

### Requirements Input

| Field | Rule | Error Message |
|-------|------|---------------|
| requirements | Required | "Please describe your activity requirements" |
| requirements | Min 10 chars | "Requirements must be at least 10 characters" |
| requirements | Max 2000 chars | "Requirements must be less than 2000 characters" |

### Form Submission

| Condition | Action |
|-----------|--------|
| requirements.length < 10 | Prevent submit, show error |
| requirements.length > 2000 | Prevent submit, show error |
| quota.custom_used >= quota.custom_limit | Prevent submit, show quota error |
| No team_id | Prevent submit (should not happen with auth) |

---

## API Contract Summary

### POST /api/activities/generate-custom

**Request:**
```json
{
  "team_id": "uuid",
  "organization_id": "uuid",
  "requirements": "string (10-2000 chars)",
  "material_ids": ["uuid"] // optional
}
```

**Response (success):**
```json
{
  "success": true,
  "job_id": "uuid",
  "status": "processing",
  "message": "Custom activities are being generated..."
}
```

**Response (error):**
```json
{
  "detail": "Error message"
}
```

### GET /api/jobs/{job_id}

**Response (pending/processing):**
```json
{
  "status": "processing",
  "job": { /* job details */ }
}
```

**Response (completed):**
```json
{
  "status": "completed",
  "job": { /* job details */ },
  "activities": [
    { /* CustomizedActivity */ },
    { /* CustomizedActivity */ },
    { /* CustomizedActivity */ }
  ]
}
```

**Response (failed):**
```json
{
  "status": "failed",
  "job": { /* job details */ },
  "error": "Error message"
}
```
