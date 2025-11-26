# TEAMFIT Phase 2 - Backend Implementation Guide

## 📋 Overview

This guide will help you implement the complete FastAPI backend for TEAMFIT's AI-powered features in ~2-3 days.

**What you'll build:**
- File upload endpoint with validation
- Text extraction from documents
- AI activity customization (real-time)
- Custom activity generation (async)
- Quota enforcement system
- Trust scoring for abuse prevention

---

## 📁 Project Structure

Add these files to your existing FastAPI project:

```
your-fastapi-backend/
├── app/
│   ├── __init__.py
│   ├── main.py                      # ← Existing FastAPI app
│   ├── config.py                    # ← NEW: Environment config
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py              # ← NEW: Pydantic models
│   ├── services/
│   │   ├── __init__.py
│   │   ├── file_service.py         # ← NEW: File processing
│   │   ├── ai_service.py           # ← NEW: LLM integration
│   │   ├── quota_service.py        # ← NEW: Quota management
│   │   └── trust_service.py        # ← NEW: Abuse prevention
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── materials.py            # ← NEW: File upload endpoints
│   │   ├── activities.py           # ← NEW: AI customization endpoints
│   │   └── jobs.py                 # ← NEW: Job status endpoints
│   ├── tasks/
│   │   ├── __init__.py
│   │   └── generation_tasks.py     # ← NEW: Celery background tasks
│   └── utils/
│       ├── __init__.py
│       ├── supabase_client.py      # ← NEW: Supabase helper
│       └── prompts.py              # ← NEW: LLM prompt templates
├── requirements.txt                 # ← UPDATE: Add new dependencies
├── .env                            # ← UPDATE: Add API keys
└── celery_worker.py                # ← NEW: Celery worker entry point
```

---

## 🔧 Step 1: Install Dependencies

Add these to your `requirements.txt`:

```txt
# Existing dependencies
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-multipart==0.0.6
pydantic==2.5.0
supabase==2.0.3

# NEW: AI & LLM
openai==1.3.5
anthropic==0.7.0

# NEW: File processing
pypdf==3.17.1
pdfplumber==0.10.3
python-docx==1.1.0
python-pptx==0.6.23
openpyxl==3.1.2

# NEW: Async processing
celery==5.3.4
redis==5.0.1

# NEW: HTTP client
httpx==0.25.2
```

Install all:
```bash
pip install -r requirements.txt --break-system-packages
```

---

## 🔑 Step 2: Environment Variables

Update your `.env` file:

```bash
# Existing Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Existing Clerk
CLERK_SECRET_KEY=your_clerk_secret_key

# NEW: OpenAI (choose one)
OPENAI_API_KEY=sk-...

# OR NEW: Anthropic (choose one)
ANTHROPIC_API_KEY=sk-ant-...

# NEW: Redis for Celery
REDIS_URL=redis://localhost:6379/0

# NEW: Storage
STORAGE_BUCKET_NAME=team-materials

# NEW: AI Configuration
FREE_TIER_AI_MODEL=gpt-4o-mini
PAID_TIER_AI_MODEL=gpt-4o
MAX_TOKENS_PUBLIC_CUSTOMIZATION=2000
MAX_TOKENS_CUSTOM_GENERATION=3000
```

---

## 📝 Step 3: Create Configuration File

**File: `app/config.py`**

```python
"""
Application configuration
Loads environment variables and provides typed config access
"""

from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # Supabase
    supabase_url: str
    supabase_key: str
    supabase_service_key: str
    
    # Clerk
    clerk_secret_key: str
    
    # AI/LLM
    openai_api_key: str | None = None
    anthropic_api_key: str | None = None
    free_tier_ai_model: str = "gpt-4o-mini"
    paid_tier_ai_model: str = "gpt-4o"
    max_tokens_public_customization: int = 2000
    max_tokens_custom_generation: int = 3000
    
    # Redis
    redis_url: str = "redis://localhost:6379/0"
    
    # Storage
    storage_bucket_name: str = "team-materials"
    max_file_size_mb: int = 10
    max_team_storage_mb: int = 50
    
    # Quotas
    free_tier_monthly_limit: int = 5
    paid_tier_custom_limit: int = 10
    
    class Config:
        env_file = ".env"
        case_sensitive = False

@lru_cache()
def get_settings() -> Settings:
    return Settings()
```

---

## 🗃️ Step 4: Supabase Client Helper

**File: `app/utils/supabase_client.py`**

```python
"""
Supabase client utility
Provides authenticated and service role clients
"""

from supabase import create_client, Client
from app.config import get_settings

settings = get_settings()

def get_supabase_client() -> Client:
    """Get Supabase client with anon key (for RLS-protected queries)"""
    return create_client(settings.supabase_url, settings.supabase_key)

def get_supabase_service_client() -> Client:
    """Get Supabase client with service key (bypasses RLS)"""
    return create_client(settings.supabase_url, settings.supabase_service_key)
```

---

## 📦 Step 5: Pydantic Models

**File: `app/models/schemas.py`**

```python
"""
Pydantic models for request/response validation
"""

from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime

# ============================================
# File Upload Models
# ============================================

class FileUploadResponse(BaseModel):
    success: bool
    material_id: str
    file_name: str
    size_bytes: int
    summary: Optional[str] = None

class MaterialListItem(BaseModel):
    id: str
    file_name: str
    file_type: str
    file_size_bytes: int
    uploaded_by: str
    created_at: datetime

# ============================================
# Activity Customization Models
# ============================================

class CustomizeActivityRequest(BaseModel):
    team_id: str
    organization_id: str
    public_activity_id: str
    duration_minutes: Literal[15, 30, 45]
    additional_context: Optional[str] = None

class CustomizedActivityResponse(BaseModel):
    success: bool
    activity_id: str
    activity: dict
    quotas_remaining: dict

# ============================================
# Custom Generation Models
# ============================================

class GenerateCustomRequest(BaseModel):
    team_id: str
    organization_id: str
    requirements: Optional[str] = None

class GenerateCustomResponse(BaseModel):
    success: bool
    job_id: str
    status: str
    message: str

class JobStatusResponse(BaseModel):
    status: Literal["pending", "processing", "completed", "failed"]
    job: Optional[dict] = None
    activities: Optional[list] = None
    error: Optional[str] = None
    message: Optional[str] = None

# ============================================
# Team Profile Models
# ============================================

class CreateTeamProfileRequest(BaseModel):
    team_id: str
    organization_id: str
    team_role_description: str = Field(..., min_length=10, max_length=500)
    member_responsibilities: str = Field(..., min_length=10, max_length=500)
    past_activities_summary: Optional[str] = Field(None, max_length=1000)
    industry_sector: Optional[str] = None
    team_size: Optional[int] = Field(None, gt=0, le=1000)

class TeamProfileResponse(BaseModel):
    success: bool
    profile: dict

# ============================================
# Quota Models
# ============================================

class QuotaStatusResponse(BaseModel):
    public_customizations_used: int
    public_customizations_limit: int
    custom_generations_used: int
    custom_generations_limit: int
    trust_score: float
    requires_verification: bool
    verification_type: Optional[str] = None
```

---

## 📤 Step 6: File Service

**File: `app/services/file_service.py`**

```python
"""
File processing service
Handles file uploads, validation, and text extraction
"""

import os
import tempfile
from typing import BinaryIO, Tuple
from fastapi import UploadFile, HTTPException

# Text extraction libraries
import pdfplumber
from docx import Document
from pptx import Presentation
import openpyxl

class FileService:
    ALLOWED_TYPES = {'.pptx', '.docx', '.pdf', '.xlsx'}
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    
    @staticmethod
    def validate_file(file: UploadFile) -> Tuple[str, int]:
        """
        Validate uploaded file
        Returns: (file_extension, file_size)
        """
        # Check filename
        if not file.filename:
            raise HTTPException(400, "No filename provided")
        
        # Check extension
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in FileService.ALLOWED_TYPES:
            raise HTTPException(
                400, 
                f"File type {file_ext} not allowed. Allowed: {', '.join(FileService.ALLOWED_TYPES)}"
            )
        
        # Check file size (if available)
        if hasattr(file, 'size') and file.size:
            if file.size > FileService.MAX_FILE_SIZE:
                raise HTTPException(400, f"File size exceeds 10MB limit")
        
        return file_ext, file.size if hasattr(file, 'size') else 0
    
    @staticmethod
    async def extract_text(file_path: str, file_type: str) -> str:
        """
        Extract text from uploaded file
        """
        try:
            if file_type == '.pdf':
                return FileService._extract_pdf(file_path)
            elif file_type == '.docx':
                return FileService._extract_docx(file_path)
            elif file_type == '.pptx':
                return FileService._extract_pptx(file_path)
            elif file_type == '.xlsx':
                return FileService._extract_xlsx(file_path)
            else:
                raise ValueError(f"Unsupported file type: {file_type}")
        except Exception as e:
            raise HTTPException(500, f"Text extraction failed: {str(e)}")
    
    @staticmethod
    def _extract_pdf(file_path: str) -> str:
        """Extract text from PDF"""
        text = []
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text.append(page_text)
        return '\n'.join(text)
    
    @staticmethod
    def _extract_docx(file_path: str) -> str:
        """Extract text from DOCX"""
        doc = Document(file_path)
        return '\n'.join([para.text for para in doc.paragraphs if para.text])
    
    @staticmethod
    def _extract_pptx(file_path: str) -> str:
        """Extract text from PPTX"""
        prs = Presentation(file_path)
        text = []
        for slide in prs.slides:
            for shape in slide.shapes:
                if hasattr(shape, "text") and shape.text:
                    text.append(shape.text)
        return '\n'.join(text)
    
    @staticmethod
    def _extract_xlsx(file_path: str) -> str:
        """Extract text from XLSX"""
        wb = openpyxl.load_workbook(file_path)
        text = []
        for sheet in wb:
            for row in sheet.iter_rows(values_only=True):
                row_text = ' '.join([str(cell) for cell in row if cell])
                if row_text:
                    text.append(row_text)
        return '\n'.join(text)
    
    @staticmethod
    async def save_temp_file(file: UploadFile) -> str:
        """Save uploaded file to temporary location"""
        temp_file = tempfile.NamedTemporaryFile(delete=False)
        try:
            content = await file.read()
            temp_file.write(content)
            temp_file.close()
            return temp_file.name
        except Exception as e:
            os.unlink(temp_file.name)
            raise HTTPException(500, f"Failed to save file: {str(e)}")
```

---

## 🧠 Step 7: AI Service with LLM Integration

**File: `app/services/ai_service.py`**

```python
"""
AI service for activity generation
Handles OpenAI/Anthropic API calls
"""

import json
from typing import Dict, List
from openai import AsyncOpenAI
from anthropic import AsyncAnthropic
from app.config import get_settings
from app.utils.prompts import CUSTOMIZATION_PROMPT, CUSTOM_GENERATION_PROMPT

settings = get_settings()

class AIService:
    def __init__(self):
        self.openai_client = None
        self.anthropic_client = None
        
        if settings.openai_api_key:
            self.openai_client = AsyncOpenAI(api_key=settings.openai_api_key)
        
        if settings.anthropic_api_key:
            self.anthropic_client = AsyncAnthropic(api_key=settings.anthropic_api_key)
    
    async def customize_public_activity(
        self,
        source_activity: Dict,
        team_profile: Dict,
        duration: int,
        is_paid_tier: bool = False
    ) -> Dict:
        """
        Customize a public activity for a specific team
        """
        model = settings.paid_tier_ai_model if is_paid_tier else settings.free_tier_ai_model
        
        prompt = CUSTOMIZATION_PROMPT.format(
            activity_title=source_activity['title'],
            activity_description=source_activity['description'],
            activity_category=source_activity['category'],
            activity_instructions=source_activity['instructions'],
            team_role=team_profile.get('team_role_description', 'General team'),
            responsibilities=team_profile.get('member_responsibilities', 'Various responsibilities'),
            past_activities=team_profile.get('past_activities_summary', 'No past activities recorded'),
            sector=team_profile.get('industry_sector', 'general'),
            duration=duration
        )
        
        if self.openai_client:
            response = await self.openai_client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "You are an expert team-building facilitator."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                max_tokens=settings.max_tokens_public_customization
            )
            
            result = json.loads(response.choices[0].message.content)
            return {
                **result,
                'tokens_used': response.usage.total_tokens,
                'model_used': model
            }
        
        raise Exception("No AI provider configured")
    
    async def generate_custom_activities(
        self,
        team_profile: Dict,
        materials_summary: str,
        requirements: str = ""
    ) -> List[Dict]:
        """
        Generate 3 custom activities based on team profile and materials
        """
        model = settings.paid_tier_ai_model
        activities = []
        
        for i in range(1, 4):
            prompt = CUSTOM_GENERATION_PROMPT.format(
                activity_number=i,
                team_role=team_profile.get('team_role_description', 'General team'),
                responsibilities=team_profile.get('member_responsibilities', 'Various responsibilities'),
                materials_summary=materials_summary[:2000],  # Limit context
                requirements=requirements or "No specific requirements",
                previous_titles=', '.join([a['title'] for a in activities]) if activities else 'None'
            )
            
            if self.openai_client:
                response = await self.openai_client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": "You are an expert team-building activity designer."},
                        {"role": "user", "content": prompt}
                    ],
                    response_format={"type": "json_object"},
                    max_tokens=settings.max_tokens_custom_generation
                )
                
                activity = json.loads(response.choices[0].message.content)
                activity['tokens_used'] = response.usage.total_tokens
                activity['model_used'] = model
                activities.append(activity)
        
        return activities
    
    async def summarize_content(self, text: str, max_length: int = 500) -> str:
        """
        Create a concise summary of document content
        """
        if len(text) <= max_length:
            return text
        
        prompt = f"""Summarize the following content in {max_length} characters or less, focusing on key points relevant to team-building activities:

{text[:5000]}

Summary:"""
        
        if self.openai_client:
            response = await self.openai_client.chat.completions.create(
                model=settings.free_tier_ai_model,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                max_tokens=200
            )
            
            return response.choices[0].message.content.strip()
        
        # Fallback: simple truncation
        return text[:max_length] + "..."
```

---

## 📊 Step 8: Quota Service

**File: `app/services/quota_service.py`**

```python
"""
Quota management service
Tracks and enforces usage limits
"""

from typing import Dict, Tuple
from datetime import datetime
from fastapi import HTTPException
from app.utils.supabase_client import get_supabase_service_client
from app.config import get_settings

settings = get_settings()

class QuotaService:
    @staticmethod
    async def check_quota_available(
        organization_id: str,
        quota_type: str  # 'public' or 'custom'
    ) -> Tuple[bool, Dict]:
        """
        Check if organization has quota available
        Returns: (has_quota, quota_info)
        """
        supabase = get_supabase_service_client()
        
        # Get quota record
        response = supabase.table('usage_quotas')\
            .select('*')\
            .eq('organization_id', organization_id)\
            .single()\
            .execute()
        
        if not response.data:
            raise HTTPException(404, "Quota record not found")
        
        quota = response.data
        
        # Check if period expired
        if datetime.fromisoformat(quota['quota_period_end'].replace('Z', '+00:00')) < datetime.now():
            await QuotaService._reset_quota(organization_id)
            # Fetch again after reset
            response = supabase.table('usage_quotas')\
                .select('*')\
                .eq('organization_id', organization_id)\
                .single()\
                .execute()
            quota = response.data
        
        # Check availability
        if quota_type == 'public':
            has_quota = quota['public_customizations_used'] < quota['public_customizations_limit']
        elif quota_type == 'custom':
            has_quota = quota['custom_generations_used'] < quota['custom_generations_limit']
        else:
            raise ValueError(f"Invalid quota type: {quota_type}")
        
        return has_quota, quota
    
    @staticmethod
    async def increment_quota(
        organization_id: str,
        quota_type: str
    ):
        """Increment usage counter"""
        supabase = get_supabase_service_client()
        
        if quota_type == 'public':
            supabase.rpc('increment_public_customizations', {
                'org_id': organization_id
            }).execute()
        elif quota_type == 'custom':
            supabase.rpc('increment_custom_generations', {
                'org_id': organization_id
            }).execute()
    
    @staticmethod
    async def _reset_quota(organization_id: str):
        """Reset monthly quota"""
        supabase = get_supabase_service_client()
        
        supabase.rpc('reset_monthly_quotas').execute()
    
    @staticmethod
    async def get_quota_status(organization_id: str) -> Dict:
        """Get current quota status"""
        supabase = get_supabase_service_client()
        
        response = supabase.table('usage_quotas')\
            .select('*')\
            .eq('organization_id', organization_id)\
            .single()\
            .execute()
        
        if not response.data:
            raise HTTPException(404, "Quota not found")
        
        return response.data
```

---

This is getting long. Let me create the remaining services and endpoints in the next file...

Continue to **PHASE_2_BACKEND_PART2.md** for the rest of the implementation! 

Would you like me to create Part 2 now with:
- Trust Service (abuse prevention)
- API Endpoints (routers)
- Celery Tasks (async processing)
- Prompt Templates
- Testing guide

Let me know and I'll continue! 🚀
