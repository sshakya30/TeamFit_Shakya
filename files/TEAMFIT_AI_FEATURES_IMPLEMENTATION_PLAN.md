# TEAMFIT AI-Powered Customization - Complete Implementation Plan

## 📋 Executive Summary

This document provides the complete implementation plan for adding AI-powered activity customization to TEAMFIT, including:
- **5 new database tables** (minimal changes to existing structure)
- **LLM integration architecture** with async job processing
- **File upload pipeline** for paid users
- **Smart abuse prevention system** with progressive trust
- **Complete backend API endpoints** with FastAPI
- **Cost optimization** strategies to stay within $3.50/user/month budget

---

## 🎯 Feature Overview

### **Free Tier - AI-Customized Public Activities**
- **Quota:** 5 customizations per organization per month
- **Input:** Text-only team descriptions (no file uploads)
- **AI Model:** GPT-4o-mini ($0.150 per 1M input tokens, $0.600 per 1M output tokens)
- **Processing:** Real-time generation (10-30 seconds)
- **Output:** Customized version of ANY of the 15 public activity templates

### **Paid Tier - Enhanced Features**
1. **Unlimited Public Activity Customization**
   - Same as free but unlimited monthly quota
   - Premium AI model (GPT-4o or Claude Sonnet 4.5)
   
2. **Custom Activity Generation** (NEW!)
   - **Quota:** 10 custom generations per organization per month
   - **Input:** Detailed team info + uploaded files (PPT, DOCX, PDF, XLSX)
   - **Processing:** Async job queue (background processing)
   - **Output:** 3 AI-generated custom activities per request
   - **Features:** Save suggestions, edit before scheduling, 30-day expiration

---

## 💰 Cost Analysis & Optimization

### Per-User Monthly AI Cost Breakdown

**Free User (5 customizations):**
- Input: ~2,000 tokens per request × 5 = 10,000 tokens
- Output: ~1,500 tokens per request × 5 = 7,500 tokens
- Cost: (10K × $0.15/1M) + (7.5K × $0.60/1M) = **$0.0060/month**

**Paid User (Unlimited public + 10 custom):**
- Public: ~30 customizations/month = $0.036
- Custom: 10 generations × 3 outputs = 30 activities
  - Input: ~5,000 tokens (with file context) × 10 = 50,000 tokens  
  - Output: ~2,500 tokens × 30 = 75,000 tokens
  - Cost: (50K × $0.15/1M) + (75K × $0.60/1M) = $0.0525
- **Total: ~$0.09/month** (well under $3.50 budget!)

### Cost Optimization Strategies
1. **Caching:** Cache team profiles to avoid re-sending context
2. **Summarization:** Summarize uploaded files before sending to LLM
3. **Smart Context:** Only send relevant portions of documents
4. **Model Selection:** Use GPT-4o-mini for simple customizations

---

## 🗄️ NEW Database Tables (5 Total)

### **Table 1: team_profiles**
Stores team information for AI customization context.

```sql
CREATE TABLE IF NOT EXISTS public.team_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID UNIQUE NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Team Context for AI
  team_role_description TEXT, -- What the team does
  member_responsibilities TEXT, -- Job responsibilities
  past_activities_summary TEXT, -- Brief summary of past activities (free tier)
  industry_sector TEXT, -- One of the 5 sectors or 'other'
  team_size INTEGER, -- Number of team members
  
  -- Learning & Optimization
  successful_activity_patterns JSONB DEFAULT '{}', -- Track what works
  preferences JSONB DEFAULT '{}', -- Team preferences
  
  -- Metadata
  last_updated_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_team_profiles_team_id ON public.team_profiles(team_id);
CREATE INDEX idx_team_profiles_organization_id ON public.team_profiles(organization_id);

ALTER TABLE public.team_profiles ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_team_profiles_updated_at BEFORE UPDATE ON public.team_profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**RLS Policies:**
```sql
-- Managers and admins can view team profiles in their org
CREATE POLICY team_profiles_select_manager_admin ON public.team_profiles
FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM public.team_members
    WHERE user_id = current_user_id()
    AND role IN ('manager', 'admin')
  )
);

-- Only managers of the team and admins can update
CREATE POLICY team_profiles_update_manager_admin ON public.team_profiles
FOR UPDATE
TO authenticated
USING (
  is_user_manager_of_team(team_id) OR is_user_admin_in_org(organization_id)
);

-- Managers and admins can insert
CREATE POLICY team_profiles_insert_manager_admin ON public.team_profiles
FOR INSERT
TO authenticated
WITH CHECK (
  is_user_manager_of_team(team_id) OR is_user_admin_in_org(organization_id)
);

-- Admins can delete
CREATE POLICY team_profiles_delete_admin ON public.team_profiles
FOR DELETE
TO authenticated
USING (
  is_user_admin_in_org(organization_id)
);
```

---

### **Table 2: uploaded_materials**
Stores files uploaded by paid users for custom activity generation.

```sql
CREATE TABLE IF NOT EXISTS public.uploaded_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- File Information
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL, -- pptx, docx, pdf, xlsx
  file_size_bytes INTEGER NOT NULL,
  file_url TEXT NOT NULL, -- Supabase Storage URL
  
  -- Extracted Content
  extracted_text TEXT, -- Full text extraction
  content_summary TEXT, -- AI-generated summary for context efficiency
  
  -- Metadata
  uploaded_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT check_file_size CHECK (file_size_bytes <= 10485760), -- 10MB max
  CONSTRAINT check_file_type CHECK (file_type IN ('pptx', 'docx', 'pdf', 'xlsx'))
);

CREATE INDEX idx_uploaded_materials_team_id ON public.uploaded_materials(team_id);
CREATE INDEX idx_uploaded_materials_organization_id ON public.uploaded_materials(organization_id);
CREATE INDEX idx_uploaded_materials_uploaded_by ON public.uploaded_materials(uploaded_by);

ALTER TABLE public.uploaded_materials ENABLE ROW LEVEL SECURITY;
```

**RLS Policies:**
```sql
-- Managers and admins can view materials in their org
CREATE POLICY uploaded_materials_select_manager_admin ON public.uploaded_materials
FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM public.team_members
    WHERE user_id = current_user_id()
    AND role IN ('manager', 'admin')
  )
);

-- Managers of the team and admins can insert
CREATE POLICY uploaded_materials_insert_manager_admin ON public.uploaded_materials
FOR INSERT
TO authenticated
WITH CHECK (
  is_user_manager_of_team(team_id) OR is_user_admin_in_org(organization_id)
);

-- Only uploader and admins can delete
CREATE POLICY uploaded_materials_delete_owner_admin ON public.uploaded_materials
FOR DELETE
TO authenticated
USING (
  uploaded_by = current_user_id() OR is_user_admin_in_org(organization_id)
);
```

---

### **Table 3: customization_jobs**
Tracks AI generation jobs (async processing for custom activities).

```sql
CREATE TYPE public.job_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE public.job_type AS ENUM ('public_customization', 'custom_generation');

CREATE TABLE IF NOT EXISTS public.customization_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Job Details
  job_type public.job_type NOT NULL,
  status public.job_status DEFAULT 'pending',
  
  -- Input Data
  source_activity_id UUID REFERENCES public.public_activities(id), -- For customization
  input_context JSONB NOT NULL, -- Team info, prompts, etc.
  
  -- Output Data
  result_data JSONB, -- Generated activities
  error_message TEXT, -- If failed
  
  -- AI Metadata
  ai_model_used TEXT, -- gpt-4o-mini, claude-sonnet-4, etc.
  tokens_used INTEGER, -- For cost tracking
  processing_time_ms INTEGER, -- Performance tracking
  
  -- Metadata
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT check_result_status CHECK (
    (status = 'completed' AND result_data IS NOT NULL) OR
    (status = 'failed' AND error_message IS NOT NULL) OR
    (status IN ('pending', 'processing'))
  )
);

CREATE INDEX idx_customization_jobs_team_id ON public.customization_jobs(team_id);
CREATE INDEX idx_customization_jobs_organization_id ON public.customization_jobs(organization_id);
CREATE INDEX idx_customization_jobs_created_by ON public.customization_jobs(created_by);
CREATE INDEX idx_customization_jobs_status ON public.customization_jobs(status);
CREATE INDEX idx_customization_jobs_created_at ON public.customization_jobs(created_at);

ALTER TABLE public.customization_jobs ENABLE ROW LEVEL SECURITY;
```

**RLS Policies:**
```sql
-- Managers and admins can view jobs in their org
CREATE POLICY customization_jobs_select_manager_admin ON public.customization_jobs
FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM public.team_members
    WHERE user_id = current_user_id()
    AND role IN ('manager', 'admin')
  )
);

-- Managers of the team can insert jobs
CREATE POLICY customization_jobs_insert_manager_admin ON public.customization_jobs
FOR INSERT
TO authenticated
WITH CHECK (
  is_user_manager_of_team(team_id) OR is_user_admin_in_org(organization_id)
);

-- System (service role) can update job status
CREATE POLICY customization_jobs_update_system ON public.customization_jobs
FOR UPDATE
TO service_role
USING (true);
```

---

### **Table 4: customized_activities**
Stores AI-generated customized activities (both public customizations and custom generations).

```sql
CREATE TYPE public.customization_type AS ENUM ('public_customized', 'custom_generated');
CREATE TYPE public.activity_status AS ENUM ('suggested', 'saved', 'scheduled', 'expired');

CREATE TABLE IF NOT EXISTS public.customized_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.customization_jobs(id), -- Reference to generation job
  
  -- Activity Type
  customization_type public.customization_type NOT NULL,
  status public.activity_status DEFAULT 'suggested',
  
  -- Source Reference (if customized from public template)
  source_public_activity_id UUID REFERENCES public.public_activities(id),
  
  -- Batch Information (for custom generation that produces 3 suggestions)
  generation_batch_id UUID, -- Groups the 3 suggestions together
  suggestion_number INTEGER CHECK (suggestion_number BETWEEN 1 AND 3),
  
  -- Activity Content (AI-generated)
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  duration_minutes INTEGER,
  complexity TEXT,
  required_tools TEXT[],
  instructions TEXT,
  customization_notes TEXT, -- What was changed and why
  
  -- Scheduling (when activity is scheduled)
  scheduled_event_id UUID REFERENCES public.scheduled_events(id),
  
  -- Metadata
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customized_activities_team_id ON public.customized_activities(team_id);
CREATE INDEX idx_customized_activities_organization_id ON public.customized_activities(organization_id);
CREATE INDEX idx_customized_activities_job_id ON public.customized_activities(job_id);
CREATE INDEX idx_customized_activities_status ON public.customized_activities(status);
CREATE INDEX idx_customized_activities_generation_batch_id ON public.customized_activities(generation_batch_id);
CREATE INDEX idx_customized_activities_expires_at ON public.customized_activities(expires_at);

ALTER TABLE public.customized_activities ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_customized_activities_updated_at BEFORE UPDATE ON public.customized_activities
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**RLS Policies:**
```sql
-- Managers and admins can view customized activities in their org
CREATE POLICY customized_activities_select_manager_admin ON public.customized_activities
FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM public.team_members
    WHERE user_id = current_user_id()
    AND role IN ('manager', 'admin')
  )
);

-- Managers of the team and admins can update
CREATE POLICY customized_activities_update_manager_admin ON public.customized_activities
FOR UPDATE
TO authenticated
USING (
  is_user_manager_of_team(team_id) OR is_user_admin_in_org(organization_id)
);

-- Managers and admins can insert
CREATE POLICY customized_activities_insert_manager_admin ON public.customized_activities
FOR INSERT
TO authenticated
WITH CHECK (
  is_user_manager_of_team(team_id) OR is_user_admin_in_org(organization_id)
);

-- Admins can delete
CREATE POLICY customized_activities_delete_admin ON public.customized_activities
FOR DELETE
TO authenticated
USING (
  is_user_admin_in_org(organization_id)
);
```

---

### **Table 5: usage_quotas**
Tracks usage quotas and implements abuse prevention.

```sql
CREATE TABLE IF NOT EXISTS public.usage_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID UNIQUE NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Quota Tracking
  public_customizations_used INTEGER DEFAULT 0,
  public_customizations_limit INTEGER DEFAULT 5, -- Free tier limit
  custom_generations_used INTEGER DEFAULT 0,
  custom_generations_limit INTEGER DEFAULT 0, -- 0 for free, 10 for paid
  
  -- Reset Tracking
  quota_period_start TIMESTAMPTZ DEFAULT NOW(),
  quota_period_end TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 month'),
  
  -- Abuse Prevention Signals
  trust_score NUMERIC(3,2) DEFAULT 1.00, -- 0.00 to 1.00 (higher = more trusted)
  requires_verification BOOLEAN DEFAULT FALSE,
  verification_type TEXT, -- email, phone, payment_method
  
  -- Metadata
  last_reset_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_usage_quotas_organization_id ON public.usage_quotas(organization_id);
CREATE INDEX idx_usage_quotas_trust_score ON public.usage_quotas(trust_score);

ALTER TABLE public.usage_quotas ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_usage_quotas_updated_at BEFORE UPDATE ON public.usage_quotas
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**RLS Policies:**
```sql
-- Admins can view quotas for their org
CREATE POLICY usage_quotas_select_admin ON public.usage_quotas
FOR SELECT
TO authenticated
USING (
  is_user_admin_in_org(organization_id)
);

-- System (service role) can update quotas
CREATE POLICY usage_quotas_update_system ON public.usage_quotas
FOR UPDATE
TO service_role
USING (true);

-- System can insert quotas
CREATE POLICY usage_quotas_insert_system ON public.usage_quotas
FOR INSERT
TO service_role
WITH CHECK (true);
```

---

## 🔧 Database Functions & Triggers

### **Function: Reset Monthly Quotas**
```sql
CREATE OR REPLACE FUNCTION reset_monthly_quotas()
RETURNS void AS $$
BEGIN
  UPDATE public.usage_quotas
  SET 
    public_customizations_used = 0,
    custom_generations_used = 0,
    quota_period_start = NOW(),
    quota_period_end = NOW() + INTERVAL '1 month',
    last_reset_at = NOW()
  WHERE quota_period_end < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### **Function: Calculate Trust Score**
```sql
CREATE OR REPLACE FUNCTION calculate_trust_score(org_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  org_age_days INTEGER;
  team_count INTEGER;
  member_count INTEGER;
  trust_score NUMERIC := 1.00;
BEGIN
  -- Get organization age
  SELECT EXTRACT(DAY FROM NOW() - created_at) INTO org_age_days
  FROM public.organizations WHERE id = org_id;
  
  -- Get team and member counts
  SELECT COUNT(*) INTO team_count
  FROM public.teams WHERE organization_id = org_id;
  
  SELECT COUNT(DISTINCT user_id) INTO member_count
  FROM public.team_members WHERE organization_id = org_id;
  
  -- Calculate trust score (lower score for suspicious patterns)
  IF org_age_days < 1 THEN trust_score := trust_score - 0.30; END IF;
  IF org_age_days < 7 THEN trust_score := trust_score - 0.20; END IF;
  IF team_count = 0 THEN trust_score := trust_score - 0.25; END IF;
  IF member_count <= 1 THEN trust_score := trust_score - 0.25; END IF;
  
  RETURN GREATEST(trust_score, 0.00);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### **Function: Check Quota Available**
```sql
CREATE OR REPLACE FUNCTION check_quota_available(
  org_id UUID,
  quota_type TEXT -- 'public' or 'custom'
)
RETURNS BOOLEAN AS $$
DECLARE
  quota_record RECORD;
BEGIN
  SELECT * INTO quota_record FROM public.usage_quotas WHERE organization_id = org_id;
  
  IF quota_record IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Reset quota if period expired
  IF quota_record.quota_period_end < NOW() THEN
    PERFORM reset_monthly_quotas();
    SELECT * INTO quota_record FROM public.usage_quotas WHERE organization_id = org_id;
  END IF;
  
  IF quota_type = 'public' THEN
    RETURN quota_record.public_customizations_used < quota_record.public_customizations_limit;
  ELSIF quota_type = 'custom' THEN
    RETURN quota_record.custom_generations_used < quota_record.custom_generations_limit;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 📊 Modified Existing Tables

### **subscriptions table - Add team_count based pricing**
```sql
-- Add column for team-based pricing
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS team_count_tier TEXT DEFAULT '1_team'; 
-- Options: '1_team', '2_4_teams', '5_plus_teams'

-- Add pricing information
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS monthly_price_usd NUMERIC(10,2);

-- Update existing data
UPDATE public.subscriptions
SET team_count_tier = CASE
  WHEN (SELECT COUNT(*) FROM public.teams WHERE organization_id = subscriptions.organization_id) = 1 
    THEN '1_team'
  WHEN (SELECT COUNT(*) FROM public.teams WHERE organization_id = subscriptions.organization_id) BETWEEN 2 AND 4 
    THEN '2_4_teams'
  ELSE '5_plus_teams'
END;
```

---

## 🚀 Backend Implementation

### **File Upload Endpoint**
```python
# /api/materials/upload
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from supabase import create_client
import os
from typing import List

router = APIRouter()

ALLOWED_EXTENSIONS = {'.pptx', '.docx', '.pdf', '.xlsx'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

async def extract_text_from_file(file_path: str, file_type: str) -> str:
    """Extract text from uploaded file"""
    if file_type == 'pdf':
        # Use pypdf or pdfplumber
        import pdfplumber
        with pdfplumber.open(file_path) as pdf:
            return '\n'.join([page.extract_text() for page in pdf.pages])
    
    elif file_type == 'docx':
        # Use python-docx
        from docx import Document
        doc = Document(file_path)
        return '\n'.join([para.text for para in doc.paragraphs])
    
    elif file_type == 'pptx':
        # Use python-pptx
        from pptx import Presentation
        prs = Presentation(file_path)
        text = []
        for slide in prs.slides:
            for shape in slide.shapes:
                if hasattr(shape, "text"):
                    text.append(shape.text)
        return '\n'.join(text)
    
    elif file_type == 'xlsx':
        # Use openpyxl
        import openpyxl
        wb = openpyxl.load_workbook(file_path)
        text = []
        for sheet in wb:
            for row in sheet.iter_rows(values_only=True):
                text.append(' '.join([str(cell) for cell in row if cell]))
        return '\n'.join(text)
    
    return ""

@router.post("/upload")
async def upload_material(
    team_id: str,
    file: UploadFile = File(...),
    current_user = Depends(get_current_user),
    supabase_client = Depends(get_supabase_client)
):
    """Upload activity material file for paid users"""
    
    # 1. Validate subscription status
    org = await get_user_organization(current_user.id)
    subscription = await get_subscription(org.id)
    
    if subscription.plan_type == 'free':
        raise HTTPException(403, "File upload requires paid subscription")
    
    # 2. Validate file
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"File type {file_ext} not allowed")
    
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(400, f"File size exceeds 10MB limit")
    
    # 3. Check total storage limit (50MB per team)
    total_size = await get_team_storage_used(team_id)
    if total_size + len(content) > 50 * 1024 * 1024:
        raise HTTPException(400, "Team storage limit (50MB) exceeded")
    
    # 4. Upload to Supabase Storage
    storage_path = f"{org.id}/{team_id}/{file.filename}"
    supabase_client.storage.from_('team-materials').upload(
        storage_path,
        content,
        {'content-type': file.content_type}
    )
    
    # 5. Extract text
    temp_path = f"/tmp/{file.filename}"
    with open(temp_path, 'wb') as f:
        f.write(content)
    
    extracted_text = await extract_text_from_file(temp_path, file_ext[1:])
    os.remove(temp_path)
    
    # 6. Generate summary (using cheap GPT-4o-mini)
    summary = await generate_content_summary(extracted_text)
    
    # 7. Save to database
    material = supabase_client.table('uploaded_materials').insert({
        'team_id': team_id,
        'organization_id': org.id,
        'file_name': file.filename,
        'file_type': file_ext[1:],
        'file_size_bytes': len(content),
        'file_url': storage_path,
        'extracted_text': extracted_text,
        'content_summary': summary,
        'uploaded_by': current_user.id
    }).execute()
    
    return {
        "success": True,
        "material_id": material.data[0]['id'],
        "file_name": file.filename,
        "size_bytes": len(content),
        "summary": summary
    }
```

---

### **Public Activity Customization Endpoint**
```python
# /api/activities/customize
from openai import AsyncOpenAI
from anthropic import AsyncAnthropic

@router.post("/customize")
async def customize_public_activity(
    request: CustomizeActivityRequest,
    current_user = Depends(get_current_user),
    supabase_client = Depends(get_supabase_client)
):
    """Customize a public activity for a specific team"""
    
    # 1. Check quota
    quota_available = await check_quota(
        request.organization_id,
        'public',
        current_user
    )
    if not quota_available:
        raise HTTPException(429, "Monthly customization quota exceeded")
    
    # 2. Get team profile
    team_profile = await get_team_profile(request.team_id)
    if not team_profile:
        raise HTTPException(404, "Team profile not found. Please create team profile first.")
    
    # 3. Get source activity
    source_activity = await get_public_activity(request.public_activity_id)
    
    # 4. Build AI prompt
    prompt = build_customization_prompt(
        activity=source_activity,
        team_profile=team_profile,
        duration=request.duration_minutes
    )
    
    # 5. Select AI model based on subscription
    subscription = await get_subscription(request.organization_id)
    if subscription.plan_type == 'free':
        model = "gpt-4o-mini"
        client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    else:
        model = "gpt-4o"
        client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
    # 6. Generate customization
    try:
        response = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are an expert team-building facilitator."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            max_tokens=2000
        )
        
        result = json.loads(response.choices[0].message.content)
        
        # 7. Save customized activity
        customized = supabase_client.table('customized_activities').insert({
            'team_id': request.team_id,
            'organization_id': request.organization_id,
            'customization_type': 'public_customized',
            'source_public_activity_id': request.public_activity_id,
            'title': result['customized_title'],
            'description': result['customized_description'],
            'category': source_activity.category,
            'duration_minutes': request.duration_minutes,
            'complexity': source_activity.complexity,
            'required_tools': result.get('required_tools', source_activity.required_tools),
            'instructions': result['customized_instructions'],
            'customization_notes': result.get('customization_notes', ''),
            'created_by': current_user.id,
            'status': 'suggested'
        }).execute()
        
        # 8. Increment quota
        await increment_quota(request.organization_id, 'public')
        
        # 9. Log analytics
        await log_analytics_event({
            'event_type': 'activity_customized',
            'organization_id': request.organization_id,
            'team_id': request.team_id,
            'user_id': current_user.id,
            'metadata': {
                'source_activity_id': request.public_activity_id,
                'model_used': model,
                'tokens_used': response.usage.total_tokens
            }
        })
        
        return {
            "success": True,
            "activity_id": customized.data[0]['id'],
            "activity": customized.data[0],
            "quotas_remaining": await get_remaining_quotas(request.organization_id)
        }
        
    except Exception as e:
        raise HTTPException(500, f"Customization failed: {str(e)}")
```

---

### **Custom Activity Generation Endpoint (Async)**
```python
# /api/activities/generate-custom
from celery import Celery

celery_app = Celery('teamfit', broker='redis://localhost:6379/0')

@router.post("/generate-custom")
async def generate_custom_activities(
    request: GenerateCustomRequest,
    current_user = Depends(get_current_user),
    supabase_client = Depends(get_supabase_client)
):
    """Generate 3 custom activities for a team (async job)"""
    
    # 1. Check subscription (custom generation is paid-only)
    subscription = await get_subscription(request.organization_id)
    if subscription.plan_type == 'free':
        raise HTTPException(403, "Custom activity generation requires paid subscription")
    
    # 2. Check quota
    quota_available = await check_quota(
        request.organization_id,
        'custom',
        current_user
    )
    if not quota_available:
        raise HTTPException(429, "Monthly custom generation quota exceeded")
    
    # 3. Get team profile and materials
    team_profile = await get_team_profile(request.team_id)
    materials = await get_team_materials(request.team_id)
    
    if not team_profile:
        raise HTTPException(404, "Team profile required for custom generation")
    
    # 4. Create job record
    job = supabase_client.table('customization_jobs').insert({
        'team_id': request.team_id,
        'organization_id': request.organization_id,
        'job_type': 'custom_generation',
        'status': 'pending',
        'input_context': {
            'team_profile': team_profile,
            'materials_count': len(materials),
            'requirements': request.requirements
        },
        'created_by': current_user.id
    }).execute()
    
    job_id = job.data[0]['id']
    
    # 5. Queue async task
    celery_app.send_task(
        'tasks.generate_custom_activities',
        args=[job_id, request.team_id, request.organization_id],
        kwargs={'materials': materials, 'team_profile': team_profile}
    )
    
    return {
        "success": True,
        "job_id": job_id,
        "status": "processing",
        "message": "Custom activities are being generated. Check status with /api/jobs/{job_id}"
    }

@router.get("/jobs/{job_id}")
async def get_job_status(
    job_id: str,
    current_user = Depends(get_current_user),
    supabase_client = Depends(get_supabase_client)
):
    """Check status of custom generation job"""
    
    job = supabase_client.table('customization_jobs').select('*').eq('id', job_id).single().execute()
    
    if job.data['status'] == 'completed':
        # Get generated activities
        activities = supabase_client.table('customized_activities')\
            .select('*')\
            .eq('job_id', job_id)\
            .execute()
        
        return {
            "status": "completed",
            "job": job.data,
            "activities": activities.data
        }
    elif job.data['status'] == 'failed':
        return {
            "status": "failed",
            "error": job.data.get('error_message')
        }
    else:
        return {
            "status": job.data['status'],
            "message": "Still processing..."
        }
```

---

### **Celery Task for Custom Generation**
```python
# tasks/generate_custom_activities.py
from celery import Celery
from openai import AsyncOpenAI
import asyncio

celery_app = Celery('teamfit')

@celery_app.task
def generate_custom_activities(job_id, team_id, organization_id, materials, team_profile):
    """Background task to generate 3 custom activities"""
    
    try:
        # 1. Update job status
        update_job_status(job_id, 'processing')
        
        # 2. Build comprehensive context
        context = build_custom_generation_context(
            team_profile=team_profile,
            materials=materials
        )
        
        # 3. Generate 3 activities
        client = AsyncOpenAI()
        generation_batch_id = str(uuid.uuid4())
        
        activities = []
        for i in range(1, 4):
            prompt = build_custom_activity_prompt(
                context=context,
                activity_number=i,
                previous_activities=activities
            )
            
            response = await client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are an expert team-building activity designer."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                max_tokens=3000
            )
            
            activity_data = json.loads(response.choices[0].message.content)
            activities.append(activity_data)
            
            # Save to database
            save_customized_activity({
                **activity_data,
                'team_id': team_id,
                'organization_id': organization_id,
                'job_id': job_id,
                'customization_type': 'custom_generated',
                'generation_batch_id': generation_batch_id,
                'suggestion_number': i,
                'status': 'suggested'
            })
        
        # 4. Update job as completed
        update_job_status(job_id, 'completed', result_data={'activities': activities})
        
        # 5. Increment quota
        increment_quota(organization_id, 'custom')
        
    except Exception as e:
        update_job_status(job_id, 'failed', error_message=str(e))
        raise
```

---

## 🛡️ Abuse Prevention Implementation

### **Progressive Trust System**
```python
async def calculate_organization_trust_score(org_id: str) -> float:
    """Calculate trust score to detect potential abuse"""
    
    signals = {
        'org_age_days': get_org_age(org_id),
        'team_count': get_team_count(org_id),
        'member_count': get_member_count(org_id),
        'email_domain': get_org_email_domain(org_id),
        'payment_method_added': has_payment_method(org_id),
        'usage_pattern': analyze_usage_pattern(org_id)
    }
    
    trust_score = 1.00
    
    # New organization penalty
    if signals['org_age_days'] < 1:
        trust_score -= 0.30
    elif signals['org_age_days'] < 7:
        trust_score -= 0.15
    
    # Suspicious team structure
    if signals['team_count'] == 0:
        trust_score -= 0.25
    if signals['member_count'] <= 1:
        trust_score -= 0.20
    
    # Disposable email penalty
    if is_disposable_email(signals['email_domain']):
        trust_score -= 0.40
    
    # Payment method adds trust
    if signals['payment_method_added']:
        trust_score += 0.15
    
    # Abnormal usage pattern
    if signals['usage_pattern'] == 'suspicious':
        trust_score -= 0.30
    
    return max(0.00, min(1.00, trust_score))


async def apply_quota_based_on_trust(org_id: str):
    """Adjust quotas based on trust score"""
    
    trust_score = await calculate_organization_trust_score(org_id)
    subscription = await get_subscription(org_id)
    
    if subscription.plan_type == 'free':
        if trust_score >= 0.80:
            # High trust: Full quota
            limit = 5
        elif trust_score >= 0.60:
            # Medium trust: Reduced quota
            limit = 3
        else:
            # Low trust: Minimal quota + verification required
            limit = 1
            await set_verification_required(org_id, 'email')
    
    await update_quota_limit(org_id, 'public', limit)


async def check_and_enforce_verification(org_id: str, user_id: str):
    """Enforce verification requirements for low-trust organizations"""
    
    quota = await get_usage_quota(org_id)
    
    if quota.requires_verification:
        verification_status = await get_verification_status(org_id, user_id)
        
        if not verification_status.verified:
            raise HTTPException(
                403,
                f"{quota.verification_type} verification required before continuing"
            )
```

---

## 🔒 Security Checklist

- ✅ **RLS Policies:** All new tables have comprehensive RLS
- ✅ **File Validation:** Size limits, type restrictions enforced
- ✅ **Quota Enforcement:** Usage tracking prevents abuse
- ✅ **Trust Scoring:** Progressive system identifies suspicious behavior
- ✅ **Input Sanitization:** All user inputs validated
- ✅ **Error Handling:** No sensitive data in error messages
- ✅ **Rate Limiting:** API endpoints have rate limits
- ✅ **Audit Logging:** All actions logged in analytics_events

---

## 📊 Monitoring & Analytics

### **Key Metrics to Track**
1. **AI Costs:** Total tokens used per day/month
2. **Quota Usage:** % of users hitting limits
3. **Generation Success Rate:** % of successful vs failed jobs
4. **Trust Score Distribution:** How many orgs in each trust tier
5. **Activity Feedback:** Which customizations get scheduled
6. **Performance:** Average generation time
7. **Abuse Detection:** Number of flagged organizations

### **Dashboard Queries**
```sql
-- Daily AI cost tracking
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_generations,
  SUM(tokens_used) as total_tokens,
  AVG(tokens_used) as avg_tokens,
  SUM(tokens_used) * 0.15 / 1000000 as estimated_cost_usd
FROM customization_jobs
WHERE status = 'completed'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Quota usage by org
SELECT 
  o.name,
  uq.public_customizations_used,
  uq.public_customizations_limit,
  uq.custom_generations_used,
  uq.custom_generations_limit,
  uq.trust_score,
  s.plan_type
FROM usage_quotas uq
JOIN organizations o ON o.id = uq.organization_id
JOIN subscriptions s ON s.organization_id = o.id
ORDER BY uq.trust_score ASC;

-- Most successful activities
SELECT 
  ca.title,
  ca.category,
  COUNT(DISTINCT ca.scheduled_event_id) as times_scheduled,
  AVG(f.rating) as avg_rating
FROM customized_activities ca
LEFT JOIN scheduled_events se ON se.id = ca.scheduled_event_id
LEFT JOIN feedback f ON f.event_id = se.id
WHERE ca.status = 'scheduled'
GROUP BY ca.id, ca.title, ca.category
HAVING COUNT(DISTINCT ca.scheduled_event_id) > 0
ORDER BY times_scheduled DESC, avg_rating DESC
LIMIT 20;
```

---

## 🧪 Testing Strategy

### **Unit Tests**
- File upload validation
- Text extraction from each file type
- Quota calculation logic
- Trust score calculation
- Prompt generation

### **Integration Tests**
- End-to-end customization flow
- Custom generation job processing
- Quota enforcement
- Subscription tier differences
- RLS policy verification

### **Load Tests**
- Concurrent customization requests
- Large file uploads
- Multiple organizations hitting quotas
- Job queue performance

---

## 📝 Next Steps for Implementation

1. **Phase 1: Database Setup** (You're here!)
   - Create 5 new tables
   - Add helper functions
   - Set up RLS policies
   
2. **Phase 2: File Upload Pipeline**
   - Supabase Storage bucket setup
   - File extraction utilities
   - Upload API endpoint
   
3. **Phase 3: LLM Integration**
   - OpenAI/Anthropic API setup
   - Prompt engineering & testing
   - Response parsing & validation
   
4. **Phase 4: Async Job Queue**
   - Redis + Celery setup
   - Background worker tasks
   - Job status polling
   
5. **Phase 5: Abuse Prevention**
   - Trust score calculation
   - Quota enforcement
   - Verification flows
   
6. **Phase 6: Frontend Integration**
   - Activity customization UI
   - File upload interface
   - Job status tracking
   - Activity management

---

## 💵 Pricing Strategy Recommendation

Based on your requirements and cost analysis:

### **Free Tier**
- **Price:** $0/month
- **Features:**
  - 5 public activity customizations per month
  - Text-only team profile input
  - Basic AI model (GPT-4o-mini)
  - Access to 15 public activity templates

### **Pro Tier (1 Team)**
- **Price:** $29/month
- **Features:**
  - Unlimited public activity customizations
  - 10 custom activity generations per month
  - File upload support (50MB storage)
  - Premium AI model (GPT-4o/Claude Sonnet)
  - Priority support
  - Advanced analytics

### **Pro Tier (2-4 Teams)**
- **Price:** $79/month (saves $37 vs individual)
- **Features:**
  - All Pro features × 2-4 teams
  - 200MB total storage
  - Shared analytics dashboard

### **Enterprise Tier (5+ Teams)**
- **Price:** $199/month (saves $146 vs individual)
- **Features:**
  - All Pro features × unlimited teams
  - 500MB storage
  - Dedicated success manager
  - Custom AI training on team data
  - API access

**Estimated Margins:**
- Pro (1 Team): $29 - $3 AI cost - $5 infrastructure = **$21 profit/month (72%)**
- Pro (2-4 Teams): $79 - $12 AI - $10 infrastructure = **$57 profit/month (72%)**
- Enterprise: $199 - $30 AI - $25 infrastructure = **$144 profit/month (72%)**

---

**End of Implementation Plan**

Total New Tables: 5
Total New RLS Policies: ~20
Total New Functions: 3
Estimated Implementation Time: 2-3 weeks
AI Cost per User: Well under $3.50/month budget ✅
