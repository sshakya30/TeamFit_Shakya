/specify

Feature: Team Materials Upload

## Overview
Allow users to upload team materials (PDF, DOCX, PPTX, XLSX) that will be used by AI to generate custom activities. Connects to POST /api/materials/upload.

## User Stories
1. As a user, I want to drag & drop files to upload
2. As a user, I want to see upload progress
3. As a user, I want to see a list of my uploaded materials
4. As a user, I want to see AI-generated summaries of my materials
5. As a user, I want to delete materials I no longer need

## Technical Requirements

### Backend API Endpoints
1. POST /api/materials/upload (multipart/form-data)
   - Fields: team_id, organization_id, file
   - Returns: material_id, filename, summary

2. GET /api/materials/team/{team_id}
   - Returns: list of materials with summaries

### UI Components Needed
1. MaterialsPage (src/pages/Materials.tsx)
2. FileDropzone (src/components/materials/FileDropzone.tsx)
3. UploadProgress (src/components/materials/UploadProgress.tsx)
4. MaterialsList (src/components/materials/MaterialsList.tsx)
5. MaterialCard (src/components/materials/MaterialCard.tsx)

### Supported File Types
- PDF (.pdf)
- Word (.docx)
- PowerPoint (.pptx)
- Excel (.xlsx)
- Max size: 10MB per file

### Routes
- /materials

### Design Requirements
- Large dropzone area with dashed border
- File type icons (PDF icon, Word icon, etc.)
- Progress bar during upload
- Card-based list of uploaded materials
- Summary preview on each card
- Delete button with confirmation

## Acceptance Criteria
1. Drag & drop works
2. Click to browse works
3. File type validation
4. File size validation
5. Upload progress shown
6. Success shows new material in list
7. Materials list shows all uploads
8. AI summary displayed on cards
9. Can delete materials