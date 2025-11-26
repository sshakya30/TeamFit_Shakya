# TEAMFIT Phase 2 - Backend Implementation Part 2

**Continue from Part 1** (PHASE_2_BACKEND_IMPLEMENTATION.md)

---

## 🛡️ Step 9: Trust Service (Abuse Prevention)

**File: `app/services/trust_service.py`**

```python
"""
Trust scoring service for abuse prevention
Calculates organization trust scores based on multiple signals
"""

from datetime import datetime, timedelta
from app.utils.supabase_client import get_supabase_service_client

class TrustService:
    # Disposable email domains (add more as needed)
    DISPOSABLE_DOMAINS = {
        'tempmail.com', 'guerrillamail.com', '10minutemail.com',
        'throwaway.email', 'temp-mail.org', 'fakeinbox.com'
    }
    
    @staticmethod
    async def calculate_trust_score(organization_id: str) -> float:
        """
        Calculate trust score for an organization
        Returns: float between 0.00 (no trust) and 1.00 (full trust)
        """
        supabase = get_supabase_service_client()
        
        # Get organization data
        org_response = supabase.table('organizations')\
            .select('created_at, settings')\
            .eq('id', organization_id)\
            .single()\
            .execute()
        
        if not org_response.data:
            return 0.00
        
        org = org_response.data
        
        # Calculate org age
        created_at = datetime.fromisoformat(org['created_at'].replace('Z', '+00:00'))
        org_age_days = (datetime.now() - created_at).days
        
        # Get team count
        teams_response = supabase.table('teams')\
            .select('id', count='exact')\
            .eq('organization_id', organization_id)\
            .execute()
        team_count = teams_response.count or 0
        
        # Get member count
        members_response = supabase.table('team_members')\
            .select('user_id', count='exact')\
            .eq('organization_id', organization_id)\
            .execute()
        member_count = members_response.count or 0
        
        # Get subscription info
        sub_response = supabase.table('subscriptions')\
            .select('plan_type, status')\
            .eq('organization_id', organization_id)\
            .single()\
            .execute()
        
        has_payment = False
        if sub_response.data:
            has_payment = sub_response.data.get('plan_type') != 'free'
        
        # Calculate trust score
        trust_score = 1.00
        
        # Age penalties
        if org_age_days < 1:
            trust_score -= 0.30
        elif org_age_days < 7:
            trust_score -= 0.20
        
        # Structure penalties
        if team_count == 0:
            trust_score -= 0.25
        if member_count <= 1:
            trust_score -= 0.25
        
        # Payment method bonus
        if has_payment:
            trust_score += 0.15
        
        # Age bonus
        if org_age_days > 30:
            trust_score += 0.10
        
        return max(0.00, min(1.00, trust_score))
    
    @staticmethod
    async def update_trust_score(organization_id: str):
        """Calculate and update trust score in database"""
        supabase = get_supabase_service_client()
        
        score = await TrustService.calculate_trust_score(organization_id)
        
        # Determine if verification required
        requires_verification = score < 0.60
        verification_type = None
        
        if requires_verification:
            if score < 0.40:
                verification_type = 'phone'
            else:
                verification_type = 'email'
        
        # Update quota record
        supabase.table('usage_quotas')\
            .update({
                'trust_score': score,
                'requires_verification': requires_verification,
                'verification_type': verification_type
            })\
            .eq('organization_id', organization_id)\
            .execute()
        
        return score
    
    @staticmethod
    def is_disposable_email(email: str) -> bool:
        """Check if email is from disposable provider"""
        domain = email.split('@')[-1].lower()
        return domain in TrustService.DISPOSABLE_DOMAINS
```

---

## 📝 Step 10: LLM Prompt Templates

**File: `app/utils/prompts.py`**

```python
"""
LLM prompt templates for activity generation
"""

CUSTOMIZATION_PROMPT = """You are an expert team-building facilitator customizing activities for remote teams.

ORIGINAL ACTIVITY:
- Title: {activity_title}
- Description: {activity_description}
- Category: {activity_category}
- Instructions: {activity_instructions}

TEAM CONTEXT:
- Team Role: {team_role}
- Responsibilities: {responsibilities}
- Past Activities: {past_activities}
- Industry Sector: {sector}
- Desired Duration: {duration} minutes

TASK:
Customize this activity specifically for this team. Make it relevant to their work, responsibilities, and industry.

REQUIREMENTS:
1. Keep it 100% remote-friendly (no physical components)
2. Adjust difficulty based on team's experience
3. Use industry-specific examples and terminology
4. Make instructions crystal clear and actionable
5. Ensure duration matches {duration} minutes exactly
6. Keep the core concept but personalize everything else

OUTPUT FORMAT (JSON):
{{
  "customized_title": "Activity title tailored to this team",
  "customized_description": "Description using team-specific language",
  "customized_instructions": "Step-by-step instructions with team-relevant examples",
  "required_tools": ["Tool 1", "Tool 2"],
  "customization_notes": "Brief explanation of what was customized and why"
}}

Be creative and specific. This should feel like it was designed specifically for this team!
"""

CUSTOM_GENERATION_PROMPT = """You are an expert team-building activity designer creating custom activities for remote teams.

ACTIVITY #{activity_number} OF 3

TEAM PROFILE:
- Team Role: {team_role}
- Responsibilities: {responsibilities}
- Additional Materials Summary: {materials_summary}
- Special Requirements: {requirements}

PREVIOUS ACTIVITIES IN THIS BATCH:
{previous_titles}

TASK:
Design a completely new, original team-building activity for this remote team.

REQUIREMENTS:
1. Must be 100% remote-friendly (video conferencing only)
2. Duration: Choose between 15, 30, or 45 minutes
3. Must be relevant to team's actual work and responsibilities
4. Should be FUN and ENGAGING (not just work tasks)
5. Must be DIFFERENT from previous activities in this batch
6. Include clear, step-by-step facilitation instructions
7. Consider their specific materials and context

ACTIVITY CATEGORIES (choose one):
- icebreaker: Getting to know each other better
- trivia: Knowledge-based competition
- creative: Design/build/create something
- brainstorm: Problem-solving and ideation
- collaborative: Team coordination challenges
- social: Bonding and relationship building

OUTPUT FORMAT (JSON):
{{
  "title": "Catchy activity name (be creative!)",
  "description": "2-3 sentence overview of what the activity is",
  "category": "One of the categories above",
  "duration_minutes": 15 or 30 or 45,
  "complexity": "easy" or "medium" or "hard",
  "required_tools": ["Video conferencing", "Other tools needed"],
  "instructions": "Detailed step-by-step facilitation guide with timing",
  "why_this_works": "1-2 sentences explaining why this activity is perfect for THIS team"
}}

Make it creative, engaging, and specifically relevant to this team's work!
"""

SUMMARIZATION_PROMPT = """Summarize the following document content in {max_chars} characters or less.

Focus on:
- Key themes and topics
- Important details about team activities, processes, or culture
- Anything relevant for designing team-building activities

Document content:
{content}

Summary:"""
```

---

## 🚀 Step 11: API Routers

### Router 1: File Upload

**File: `app/routers/materials.py`**

```python
"""
File upload and material management endpoints
"""

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from typing import List
import uuid
from app.models.schemas import FileUploadResponse, MaterialListItem
from app.services.file_service import FileService
from app.services.ai_service import AIService
from app.utils.supabase_client import get_supabase_service_client, get_supabase_client
from app.config import get_settings

router = APIRouter(prefix="/api/materials", tags=["materials"])
settings = get_settings()
file_service = FileService()
ai_service = AIService()

@router.post("/upload", response_model=FileUploadResponse)
async def upload_material(
    team_id: str,
    organization_id: str,
    file: UploadFile = File(...)
):
    """
    Upload activity material file (paid users only)
    Supports: .pptx, .docx, .pdf, .xlsx
    Max size: 10MB per file
    """
    supabase = get_supabase_service_client()
    
    # 1. Validate subscription
    sub_response = supabase.table('subscriptions')\
        .select('plan_type')\
        .eq('organization_id', organization_id)\
        .single()\
        .execute()
    
    if not sub_response.data or sub_response.data.get('plan_type') == 'free':
        raise HTTPException(403, "File upload requires paid subscription")
    
    # 2. Validate file
    file_ext, file_size = file_service.validate_file(file)
    
    # 3. Check team storage limit
    storage_response = supabase.table('uploaded_materials')\
        .select('file_size_bytes')\
        .eq('team_id', team_id)\
        .execute()
    
    total_size = sum([m['file_size_bytes'] for m in storage_response.data])
    max_size = settings.max_team_storage_mb * 1024 * 1024
    
    if total_size + file_size > max_size:
        raise HTTPException(
            400, 
            f"Team storage limit ({settings.max_team_storage_mb}MB) exceeded"
        )
    
    # 4. Save temporary file
    temp_path = await file_service.save_temp_file(file)
    
    try:
        # 5. Extract text
        extracted_text = await file_service.extract_text(temp_path, file_ext)
        
        # 6. Generate summary
        summary = await ai_service.summarize_content(extracted_text, max_length=500)
        
        # 7. Upload to Supabase Storage
        storage_path = f"{organization_id}/{team_id}/{uuid.uuid4()}{file_ext}"
        
        with open(temp_path, 'rb') as f:
            supabase.storage.from_(settings.storage_bucket_name).upload(
                storage_path,
                f,
                {'content-type': file.content_type or 'application/octet-stream'}
            )
        
        # 8. Save to database
        material_data = {
            'team_id': team_id,
            'organization_id': organization_id,
            'file_name': file.filename,
            'file_type': file_ext[1:],  # Remove leading dot
            'file_size_bytes': file_size,
            'file_url': storage_path,
            'extracted_text': extracted_text,
            'content_summary': summary,
            'uploaded_by': 'current_user_id'  # TODO: Get from auth
        }
        
        response = supabase.table('uploaded_materials')\
            .insert(material_data)\
            .execute()
        
        return FileUploadResponse(
            success=True,
            material_id=response.data[0]['id'],
            file_name=file.filename,
            size_bytes=file_size,
            summary=summary
        )
    
    finally:
        # Cleanup temp file
        import os
        if os.path.exists(temp_path):
            os.unlink(temp_path)

@router.get("/team/{team_id}", response_model=List[MaterialListItem])
async def list_team_materials(team_id: str):
    """List all materials uploaded for a team"""
    supabase = get_supabase_client()
    
    response = supabase.table('uploaded_materials')\
        .select('id, file_name, file_type, file_size_bytes, uploaded_by, created_at')\
        .eq('team_id', team_id)\
        .order('created_at', desc=True)\
        .execute()
    
    return response.data

@router.delete("/{material_id}")
async def delete_material(material_id: str):
    """Delete uploaded material"""
    supabase = get_supabase_service_client()
    
    # Get material info
    response = supabase.table('uploaded_materials')\
        .select('file_url')\
        .eq('id', material_id)\
        .single()\
        .execute()
    
    if not response.data:
        raise HTTPException(404, "Material not found")
    
    # Delete from storage
    supabase.storage.from_(settings.storage_bucket_name).remove([response.data['file_url']])
    
    # Delete from database
    supabase.table('uploaded_materials').delete().eq('id', material_id).execute()
    
    return {"success": True, "message": "Material deleted"}
```

### Router 2: Activity Customization

**File: `app/routers/activities.py`**

```python
"""
Activity customization and generation endpoints
"""

from fastapi import APIRouter, HTTPException
from app.models.schemas import (
    CustomizeActivityRequest,
    CustomizedActivityResponse,
    GenerateCustomRequest,
    GenerateCustomResponse,
    CreateTeamProfileRequest,
    TeamProfileResponse
)
from app.services.ai_service import AIService
from app.services.quota_service import QuotaService
from app.utils.supabase_client import get_supabase_service_client
import uuid

router = APIRouter(prefix="/api/activities", tags=["activities"])
ai_service = AIService()
quota_service = QuotaService()

@router.post("/customize", response_model=CustomizedActivityResponse)
async def customize_public_activity(request: CustomizeActivityRequest):
    """
    Customize a public activity for a specific team (real-time)
    """
    supabase = get_supabase_service_client()
    
    # 1. Check quota
    has_quota, quota_info = await quota_service.check_quota_available(
        request.organization_id,
        'public'
    )
    
    if not has_quota:
        raise HTTPException(
            429,
            f"Monthly customization quota exceeded. Used: {quota_info['public_customizations_used']}/{quota_info['public_customizations_limit']}"
        )
    
    # 2. Get team profile
    profile_response = supabase.table('team_profiles')\
        .select('*')\
        .eq('team_id', request.team_id)\
        .single()\
        .execute()
    
    if not profile_response.data:
        raise HTTPException(
            404, 
            "Team profile not found. Please create team profile first."
        )
    
    team_profile = profile_response.data
    
    # 3. Get source activity
    activity_response = supabase.table('public_activities')\
        .select('*')\
        .eq('id', request.public_activity_id)\
        .single()\
        .execute()
    
    if not activity_response.data:
        raise HTTPException(404, "Public activity not found")
    
    source_activity = activity_response.data
    
    # 4. Check if paid tier
    sub_response = supabase.table('subscriptions')\
        .select('plan_type')\
        .eq('organization_id', request.organization_id)\
        .single()\
        .execute()
    
    is_paid = sub_response.data and sub_response.data.get('plan_type') != 'free'
    
    # 5. Generate customization
    try:
        result = await ai_service.customize_public_activity(
            source_activity=source_activity,
            team_profile=team_profile,
            duration=request.duration_minutes,
            is_paid_tier=is_paid
        )
        
        # 6. Save customized activity
        customized_data = {
            'team_id': request.team_id,
            'organization_id': request.organization_id,
            'customization_type': 'public_customized',
            'source_public_activity_id': request.public_activity_id,
            'title': result['customized_title'],
            'description': result['customized_description'],
            'category': source_activity['category'],
            'duration_minutes': request.duration_minutes,
            'complexity': source_activity['complexity'],
            'required_tools': result.get('required_tools', source_activity['required_tools']),
            'instructions': result['customized_instructions'],
            'customization_notes': result.get('customization_notes', ''),
            'created_by': 'current_user_id',  # TODO: Get from auth
            'status': 'suggested'
        }
        
        save_response = supabase.table('customized_activities')\
            .insert(customized_data)\
            .execute()
        
        # 7. Increment quota
        await quota_service.increment_quota(request.organization_id, 'public')
        
        # 8. Get updated quotas
        updated_quotas = await quota_service.get_quota_status(request.organization_id)
        
        return CustomizedActivityResponse(
            success=True,
            activity_id=save_response.data[0]['id'],
            activity=save_response.data[0],
            quotas_remaining={
                'public_used': updated_quotas['public_customizations_used'],
                'public_limit': updated_quotas['public_customizations_limit'],
                'custom_used': updated_quotas['custom_generations_used'],
                'custom_limit': updated_quotas['custom_generations_limit']
            }
        )
        
    except Exception as e:
        raise HTTPException(500, f"Customization failed: {str(e)}")

@router.post("/generate-custom", response_model=GenerateCustomResponse)
async def generate_custom_activities(request: GenerateCustomRequest):
    """
    Generate 3 custom activities (async job - paid only)
    """
    supabase = get_supabase_service_client()
    
    # 1. Check subscription
    sub_response = supabase.table('subscriptions')\
        .select('plan_type')\
        .eq('organization_id', request.organization_id)\
        .single()\
        .execute()
    
    if not sub_response.data or sub_response.data.get('plan_type') == 'free':
        raise HTTPException(403, "Custom activity generation requires paid subscription")
    
    # 2. Check quota
    has_quota, quota_info = await quota_service.check_quota_available(
        request.organization_id,
        'custom'
    )
    
    if not has_quota:
        raise HTTPException(
            429,
            f"Monthly custom generation quota exceeded. Used: {quota_info['custom_generations_used']}/{quota_info['custom_generations_limit']}"
        )
    
    # 3. Get team profile
    profile_response = supabase.table('team_profiles')\
        .select('*')\
        .eq('team_id', request.team_id)\
        .single()\
        .execute()
    
    if not profile_response.data:
        raise HTTPException(404, "Team profile required for custom generation")
    
    # 4. Create job record
    job_data = {
        'team_id': request.team_id,
        'organization_id': request.organization_id,
        'job_type': 'custom_generation',
        'status': 'pending',
        'input_context': {
            'team_profile': profile_response.data,
            'requirements': request.requirements
        },
        'created_by': 'current_user_id'  # TODO: Get from auth
    }
    
    job_response = supabase.table('customization_jobs')\
        .insert(job_data)\
        .execute()
    
    job_id = job_response.data[0]['id']
    
    # 5. Queue async task
    from app.tasks.generation_tasks import generate_custom_activities_task
    generate_custom_activities_task.delay(
        job_id,
        request.team_id,
        request.organization_id
    )
    
    return GenerateCustomResponse(
        success=True,
        job_id=job_id,
        status="processing",
        message="Custom activities are being generated. Check status with /api/jobs/{job_id}"
    )

@router.post("/team-profile", response_model=TeamProfileResponse)
async def create_team_profile(request: CreateTeamProfileRequest):
    """Create or update team profile"""
    supabase = get_supabase_service_client()
    
    profile_data = request.dict()
    profile_data['last_updated_by'] = 'current_user_id'  # TODO: Get from auth
    
    # Upsert (insert or update)
    response = supabase.table('team_profiles')\
        .upsert(profile_data, on_conflict='team_id')\
        .execute()
    
    return TeamProfileResponse(
        success=True,
        profile=response.data[0]
    )
```

### Router 3: Job Status

**File: `app/routers/jobs.py`**

```python
"""
Job status tracking endpoints
"""

from fastapi import APIRouter, HTTPException
from app.models.schemas import JobStatusResponse
from app.utils.supabase_client import get_supabase_client

router = APIRouter(prefix="/api/jobs", tags=["jobs"])

@router.get("/{job_id}", response_model=JobStatusResponse)
async def get_job_status(job_id: str):
    """
    Check status of custom generation job
    """
    supabase = get_supabase_client()
    
    # Get job
    job_response = supabase.table('customization_jobs')\
        .select('*')\
        .eq('id', job_id)\
        .single()\
        .execute()
    
    if not job_response.data:
        raise HTTPException(404, "Job not found")
    
    job = job_response.data
    
    if job['status'] == 'completed':
        # Get generated activities
        activities_response = supabase.table('customized_activities')\
            .select('*')\
            .eq('job_id', job_id)\
            .execute()
        
        return JobStatusResponse(
            status="completed",
            job=job,
            activities=activities_response.data
        )
    
    elif job['status'] == 'failed':
        return JobStatusResponse(
            status="failed",
            error=job.get('error_message')
        )
    
    else:
        return JobStatusResponse(
            status=job['status'],
            message="Still processing..."
        )
```

---

## ⚙️ Step 12: Celery Background Tasks

**File: `app/tasks/generation_tasks.py`**

```python
"""
Celery tasks for async activity generation
"""

from celery import Celery
from app.config import get_settings
from app.services.ai_service import AIService
from app.services.quota_service import QuotaService
from app.utils.supabase_client import get_supabase_service_client
import uuid
from datetime import datetime

settings = get_settings()

# Initialize Celery
celery_app = Celery('teamfit', broker=settings.redis_url)

@celery_app.task
def generate_custom_activities_task(job_id: str, team_id: str, organization_id: str):
    """
    Background task to generate 3 custom activities
    """
    supabase = get_supabase_service_client()
    ai_service = AIService()
    
    try:
        # Update job status
        supabase.table('customization_jobs')\
            .update({'status': 'processing'})\
            .eq('id', job_id)\
            .execute()
        
        # Get job context
        job_response = supabase.table('customization_jobs')\
            .select('input_context')\
            .eq('id', job_id)\
            .single()\
            .execute()
        
        context = job_response.data['input_context']
        team_profile = context['team_profile']
        requirements = context.get('requirements', '')
        
        # Get uploaded materials
        materials_response = supabase.table('uploaded_materials')\
            .select('content_summary')\
            .eq('team_id', team_id)\
            .execute()
        
        materials_summary = '\n'.join([
            m['content_summary'] for m in materials_response.data
        ]) if materials_response.data else "No uploaded materials"
        
        # Generate 3 activities
        activities = ai_service.generate_custom_activities(
            team_profile=team_profile,
            materials_summary=materials_summary,
            requirements=requirements
        )
        
        # Save activities
        generation_batch_id = str(uuid.uuid4())
        
        for i, activity in enumerate(activities, 1):
            activity_data = {
                'team_id': team_id,
                'organization_id': organization_id,
                'job_id': job_id,
                'customization_type': 'custom_generated',
                'generation_batch_id': generation_batch_id,
                'suggestion_number': i,
                'title': activity['title'],
                'description': activity['description'],
                'category': activity['category'],
                'duration_minutes': activity['duration_minutes'],
                'complexity': activity['complexity'],
                'required_tools': activity['required_tools'],
                'instructions': activity['instructions'],
                'customization_notes': activity.get('why_this_works', ''),
                'created_by': context.get('created_by'),
                'status': 'suggested'
            }
            
            supabase.table('customized_activities')\
                .insert(activity_data)\
                .execute()
        
        # Update job as completed
        supabase.table('customization_jobs')\
            .update({
                'status': 'completed',
                'completed_at': datetime.utcnow().isoformat(),
                'result_data': {'activities': activities}
            })\
            .eq('id', job_id)\
            .execute()
        
        # Increment quota
        quota_service = QuotaService()
        quota_service.increment_quota(organization_id, 'custom')
        
    except Exception as e:
        # Mark job as failed
        supabase.table('customization_jobs')\
            .update({
                'status': 'failed',
                'error_message': str(e)
            })\
            .eq('id', job_id)\
            .execute()
        
        raise
```

**File: `celery_worker.py`** (root level)

```python
"""
Celery worker entry point
Run with: celery -A celery_worker worker --loglevel=info
"""

from app.tasks.generation_tasks import celery_app

if __name__ == '__main__':
    celery_app.start()
```

---

## 🚦 Step 13: Update Main FastAPI App

**Update `app/main.py`:**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import materials, activities, jobs

app = FastAPI(title="TEAMFIT API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Your React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(materials.router)
app.include_router(activities.router)
app.include_router(jobs.router)

@app.get("/")
def root():
    return {"message": "TEAMFIT API v1.0"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
```

---

## 🧪 Step 14: Testing

### Start Services

**Terminal 1 - Redis:**
```bash
redis-server
```

**Terminal 2 - Celery Worker:**
```bash
celery -A celery_worker worker --loglevel=info
```

**Terminal 3 - FastAPI Server:**
```bash
uvicorn app.main:app --reload --port 8000
```

### Test Endpoints

```bash
# Test health
curl http://localhost:8000/health

# Test file upload (replace with actual IDs and file)
curl -X POST http://localhost:8000/api/materials/upload \
  -F "team_id=your-team-id" \
  -F "organization_id=your-org-id" \
  -F "file=@sample.pdf"

# Test activity customization
curl -X POST http://localhost:8000/api/activities/customize \
  -H "Content-Type: application/json" \
  -d '{
    "team_id": "your-team-id",
    "organization_id": "your-org-id",
    "public_activity_id": "activity-id",
    "duration_minutes": 30
  }'
```

---

## ✅ Phase 2 Complete Checklist

- [ ] All dependencies installed
- [ ] Environment variables configured
- [ ] All service files created
- [ ] All router files created
- [ ] Celery worker configured
- [ ] Redis running
- [ ] FastAPI server starts without errors
- [ ] File upload endpoint tested
- [ ] Activity customization tested
- [ ] Async job processing tested
- [ ] Quota enforcement verified

---

## 🎉 Phase 2 Complete!

You now have a fully functional backend with:
- ✅ File upload and processing
- ✅ AI-powered activity customization
- ✅ Async custom activity generation
- ✅ Quota management and enforcement
- ✅ Trust scoring for abuse prevention

**Next: Phase 3 - Frontend Integration**

Tell me when Phase 2 is complete and tested, and I'll provide the React frontend components! 🚀
