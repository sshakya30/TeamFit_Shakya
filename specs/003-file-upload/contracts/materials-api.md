# API Contract: Materials

**Feature**: 003-file-upload
**Date**: 2025-11-28
**Base URL**: `/api/materials`

---

## POST /upload

Upload a team material file.

### Request

**Content-Type**: `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| team_id | string (UUID) | Yes | Team ID |
| organization_id | string (UUID) | Yes | Organization ID |
| file | File | Yes | File to upload |

**File Constraints:**
- Allowed types: PDF, DOCX, PPTX, XLSX
- Max size: 10MB
- Must have extractable text content

### Response

**Status**: `200 OK`

```json
{
  "material_id": "550e8400-e29b-41d4-a716-446655440000",
  "file_name": "quarterly-report.pdf",
  "content_summary": "This quarterly report covers Q3 2024 financials including revenue growth of 15% and expansion into new markets.",
  "storage_url": "https://rbwnbfodovzwqajuiyxl.supabase.co/storage/v1/object/public/team-materials/org_id/team_id/quarterly-report.pdf",
  "file_size_bytes": 2456789
}
```

### Error Responses

**400 Bad Request** - Invalid file

```json
{
  "detail": "File type .exe is not supported. Allowed types: PDF, DOCX, PPTX, XLSX"
}
```

```json
{
  "detail": "File size exceeds 10MB limit"
}
```

```json
{
  "detail": "File appears to be empty or has insufficient content"
}
```

```json
{
  "detail": "Team storage limit (50MB) exceeded. Current: 45MB, Uploading: 8MB"
}
```

**403 Forbidden** - No subscription

```json
{
  "detail": "File upload requires paid subscription"
}
```

**500 Internal Server Error** - Upload failed

```json
{
  "detail": "Upload failed: Storage service unavailable"
}
```

---

## GET /{team_id}

Get all materials for a team.

### Request

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| team_id | string (UUID) | Yes | Team ID |

### Response

**Status**: `200 OK`

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "team_id": "660e8400-e29b-41d4-a716-446655440001",
    "organization_id": "770e8400-e29b-41d4-a716-446655440002",
    "file_name": "quarterly-report.pdf",
    "file_type": "pdf",
    "file_size_bytes": 2456789,
    "file_url": "https://rbwnbfodovzwqajuiyxl.supabase.co/storage/v1/object/public/team-materials/org_id/team_id/quarterly-report.pdf",
    "storage_path": "770e8400.../660e8400.../quarterly-report.pdf",
    "extracted_text": "Quarterly Financial Report Q3 2024...",
    "content_summary": "This quarterly report covers Q3 2024 financials including revenue growth of 15% and expansion into new markets.",
    "uploaded_by": "880e8400-e29b-41d4-a716-446655440003",
    "created_at": "2025-11-28T10:30:00.000Z"
  }
]
```

**Empty State**: Returns empty array `[]` when no materials exist.

---

## DELETE /{material_id}

Delete a material file.

### Request

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| material_id | string (UUID) | Yes | Material ID |

### Response

**Status**: `200 OK`

```json
{
  "message": "Material deleted successfully"
}
```

### Error Responses

**404 Not Found**

```json
{
  "detail": "Material not found"
}
```

**500 Internal Server Error**

```json
{
  "detail": "Deletion failed: Storage service unavailable"
}
```

---

## Authentication

All endpoints require Bearer token authentication:

```
Authorization: Bearer <clerk_jwt>
```

---

## Access Control

| Endpoint | Role Required | Subscription |
|----------|---------------|--------------|
| POST /upload | manager, admin | Paid only |
| GET /{team_id} | manager, admin | Any |
| DELETE /{material_id} | manager, admin | Any |

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| POST /upload | 10 requests/minute |
| GET /{team_id} | 60 requests/minute |
| DELETE /{material_id} | 30 requests/minute |

---

## Notes

1. **AI Summary**: Summaries are generated synchronously during upload (not async like custom activities)
2. **Storage**: Files are stored in Supabase Storage bucket `team-materials`
3. **Text Extraction**: Supported via PyPDF2, python-docx, python-pptx, openpyxl
4. **Quota**: 50MB total storage per team (enforced server-side)
