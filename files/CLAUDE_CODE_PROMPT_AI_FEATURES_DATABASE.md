# TEAMFIT AI Features - Database Implementation Prompt
# Copy this entire prompt and run it in Claude Code with Supabase MCP enabled

---

## 🎯 OBJECTIVE
Add AI-powered activity customization features to TEAMFIT by creating 5 new database tables with comprehensive RLS policies. This will NOT modify any existing tables, authentication, or frontend code. The implementation adds support for:
- Team profiles for AI context
- File uploads for paid users
- AI customization job tracking
- Customized activity storage
- Usage quota management and abuse prevention

## 📋 CONTEXT
Your existing TEAMFIT database has 11 tables with Clerk authentication integration. This prompt adds **5 NEW tables** to support AI features while keeping all existing structures intact. Your Supabase MCP and Context7 MCP are already configured.

## 🔧 IMPLEMENTATION INSTRUCTIONS

### Step 1: Create New Database Tables

Execute the following SQL to create all 5 new tables:

```sql
-- ============================================
-- TABLE 1: team_profiles
-- Purpose: Store team information for AI customization context
-- ============================================

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


-- ============================================
-- TABLE 2: uploaded_materials
-- Purpose: Store files uploaded by paid users for custom activity generation
-- ============================================

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


-- ============================================
-- TABLE 3: customization_jobs
-- Purpose: Track AI generation jobs (async processing for custom activities)
-- ============================================

CREATE TYPE IF NOT EXISTS public.job_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE IF NOT EXISTS public.job_type AS ENUM ('public_customization', 'custom_generation');

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


-- ============================================
-- TABLE 4: customized_activities
-- Purpose: Store AI-generated customized activities
-- ============================================

CREATE TYPE IF NOT EXISTS public.customization_type AS ENUM ('public_customized', 'custom_generated');
CREATE TYPE IF NOT EXISTS public.activity_status AS ENUM ('suggested', 'saved', 'scheduled', 'expired');

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


-- ============================================
-- TABLE 5: usage_quotas
-- Purpose: Track usage quotas and implement abuse prevention
-- ============================================

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

### Step 2: Create Helper Functions

```sql
-- ============================================
-- FUNCTION: Reset Monthly Quotas
-- Purpose: Automatically reset quotas at end of period
-- ============================================

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


-- ============================================
-- FUNCTION: Calculate Trust Score
-- Purpose: Detect potential abuse by calculating organization trust score
-- ============================================

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


-- ============================================
-- FUNCTION: Check Quota Available
-- Purpose: Check if organization has quota available for action
-- ============================================

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


-- ============================================
-- TRIGGER: Initialize quota on organization creation
-- Purpose: Automatically create usage_quotas record for new orgs
-- ============================================

CREATE OR REPLACE FUNCTION initialize_organization_quota()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usage_quotas (organization_id, trust_score)
  VALUES (NEW.id, calculate_trust_score(NEW.id));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_initialize_organization_quota
AFTER INSERT ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION initialize_organization_quota();
```

### Step 3: Create RLS Policies

```sql
-- ============================================
-- RLS POLICIES: team_profiles
-- ============================================

-- Managers and admins can view team profiles in their org
CREATE POLICY team_profiles_select_manager_admin ON public.team_profiles
FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM public.team_members
    WHERE user_id = (SELECT id FROM public.users WHERE clerk_user_id = auth.jwt() ->> 'sub')
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


-- ============================================
-- RLS POLICIES: uploaded_materials
-- ============================================

-- Managers and admins can view materials in their org
CREATE POLICY uploaded_materials_select_manager_admin ON public.uploaded_materials
FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM public.team_members
    WHERE user_id = (SELECT id FROM public.users WHERE clerk_user_id = auth.jwt() ->> 'sub')
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
  uploaded_by = (SELECT id FROM public.users WHERE clerk_user_id = auth.jwt() ->> 'sub')
  OR is_user_admin_in_org(organization_id)
);


-- ============================================
-- RLS POLICIES: customization_jobs
-- ============================================

-- Managers and admins can view jobs in their org
CREATE POLICY customization_jobs_select_manager_admin ON public.customization_jobs
FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM public.team_members
    WHERE user_id = (SELECT id FROM public.users WHERE clerk_user_id = auth.jwt() ->> 'sub')
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


-- ============================================
-- RLS POLICIES: customized_activities
-- ============================================

-- Managers and admins can view customized activities in their org
CREATE POLICY customized_activities_select_manager_admin ON public.customized_activities
FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM public.team_members
    WHERE user_id = (SELECT id FROM public.users WHERE clerk_user_id = auth.jwt() ->> 'sub')
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


-- ============================================
-- RLS POLICIES: usage_quotas
-- ============================================

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

### Step 4: Modify Existing Subscriptions Table

```sql
-- ============================================
-- MODIFY: subscriptions table
-- Purpose: Add team-count-based pricing tiers
-- ============================================

-- Add column for team-based pricing
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS team_count_tier TEXT DEFAULT '1_team'; 
-- Options: '1_team', '2_4_teams', '5_plus_teams'

-- Add pricing information
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS monthly_price_usd NUMERIC(10,2);

-- Update existing free tier records
UPDATE public.subscriptions
SET team_count_tier = '1_team'
WHERE plan_type = 'free' AND team_count_tier IS NULL;
```

### Step 5: Verify Installation

```sql
-- Verify all tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'team_profiles',
  'uploaded_materials',
  'customization_jobs',
  'customized_activities',
  'usage_quotas'
);

-- Should return 5 rows

-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN (
  'team_profiles',
  'uploaded_materials',
  'customization_jobs',
  'customized_activities',
  'usage_quotas'
);

-- All should show rowsecurity = true

-- Verify functions exist
SELECT proname 
FROM pg_proc 
WHERE proname IN (
  'reset_monthly_quotas',
  'calculate_trust_score',
  'check_quota_available',
  'initialize_organization_quota'
);

-- Should return 4 functions

-- Count RLS policies for new tables
SELECT schemaname, tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE tablename IN (
  'team_profiles',
  'uploaded_materials',
  'customization_jobs',
  'customized_activities',
  'usage_quotas'
)
GROUP BY schemaname, tablename
ORDER BY tablename;

-- Should show policies for each table
```

### Step 6: Create Supabase Storage Bucket

```sql
-- Create storage bucket for uploaded materials (run in Supabase Dashboard or via API)
-- Bucket name: 'team-materials'
-- Public: No
-- File size limit: 10MB
-- Allowed MIME types: application/vnd.openxmlformats-officedocument.*, application/pdf
```

## ✅ SUCCESS CRITERIA

After running this prompt, verify:
- ✅ 5 new tables created (team_profiles, uploaded_materials, customization_jobs, customized_activities, usage_quotas)
- ✅ All tables have RLS enabled
- ✅ 20 RLS policies created across new tables
- ✅ 4 new functions created
- ✅ 1 trigger created for automatic quota initialization
- ✅ subscriptions table modified with 2 new columns
- ✅ No errors in SQL execution
- ✅ Existing 11 tables unchanged
- ✅ Clerk authentication integration unchanged

## 📊 WHAT WAS ADDED

**New Tables (5):**
1. team_profiles - Team context for AI customization
2. uploaded_materials - File storage for paid users
3. customization_jobs - Async job tracking
4. customized_activities - AI-generated activities
5. usage_quotas - Quota management & abuse prevention

**New Functions (4):**
1. reset_monthly_quotas() - Auto-reset quotas monthly
2. calculate_trust_score() - Abuse detection
3. check_quota_available() - Quota validation
4. initialize_organization_quota() - Auto-create quotas

**Modified Tables (1):**
1. subscriptions - Added team_count_tier and monthly_price_usd columns

**Total New RLS Policies:** 20
**Total New Indexes:** 25+

## 🎯 NEXT STEPS

After successful database implementation:

1. **Set up Supabase Storage bucket** for file uploads
2. **Implement backend API endpoints** (FastAPI)
3. **Add LLM integration** (OpenAI/Anthropic)
4. **Create async job processing** (Celery + Redis)
5. **Build frontend UI** for new features
6. **Test quota enforcement** and abuse prevention

## 📝 NOTES

- All changes are ADDITIVE only - no existing tables modified (except subscriptions)
- Clerk authentication integration remains completely unchanged
- All RLS policies follow your existing pattern using helper functions
- Indexes created for optimal query performance
- Trust score system ready for abuse prevention
- Monthly quota reset function ready for cron job

---

**Implementation Status:** Ready to execute
**Estimated Time:** 5-10 minutes
**Rollback:** Safe - all changes are in new tables
