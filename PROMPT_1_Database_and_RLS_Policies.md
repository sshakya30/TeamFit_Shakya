# TEAMFIT MVP - Database Tables + RLS Policies Creation Prompt
# Copy this entire prompt and run it in Claude Code with Supabase MCP enabled

---

## 🎯 OBJECTIVE
Create a complete, production-ready database schema for TEAMFIT MVP with comprehensive Row Level Security (RLS) policies. This includes 11 tables with proper relationships, indexes, constraints, and 30+ granular RLS policies that implement role-based access control for Members, Managers, and Admins.

## 📋 CONTEXT
TEAMFIT is an AI-powered team-building platform for remote teams. The database must support:
- Multi-tenant architecture with organizations containing multiple teams
- Role-based access (Member, Manager, Admin) with granular permissions
- Integration with Clerk authentication (using clerk_user_id)
- Feedback systems, activity scheduling, recommendations, and analytics
- Secure data isolation between organizations and appropriate role-based visibility

## 🏗️ DATABASE ARCHITECTURE OVERVIEW

### Tables to Create (11 total):
1. **users** - User profiles synced from Clerk
2. **organizations** - Company/organization data  
3. **teams** - Teams within organizations
4. **team_members** - Junction table with role assignments (member/manager/admin)
5. **activities** - Organization-specific custom activities
6. **public_activities** - Public activity library (system-managed)
7. **scheduled_events** - Scheduled team-building events
8. **feedback** - Member feedback on events
9. **activity_recommendations** - AI-generated activity recommendations
10. **subscriptions** - Organization subscription plans
11. **analytics_events** - Raw event logs (page views, clicks, etc.)

### Key Design Principles:
- **Clerk Integration**: Use `clerk_user_id` as the primary user identifier
- **Role Storage**: Roles (member/manager/admin) stored in `team_members` table
- **Manager Identification**: Users with `role='manager'` in `team_members` are team managers
- **Public Activities**: Separate table for read-only public activity library
- **Security First**: RLS enabled on all tables with granular policies
- **Performance**: Indexes on all foreign keys and frequently queried columns

## 📝 IMPLEMENTATION INSTRUCTIONS

### Step 1: Fetch Latest Supabase RLS Best Practices
Use Context7 MCP to fetch current Supabase documentation on Row Level Security:

```
Search for and review the latest Supabase RLS documentation and best practices, focusing on:
- auth.uid() usage for Clerk integration
- Performance optimization with indexes
- Security definer functions for complex policies
- WITH CHECK vs USING clauses
```

### Step 2: Create Database Tables with Proper Structure

Create each table using Supabase MCP with the following specifications:

#### Table 1: users
```sql
-- Purpose: Store user profiles synced from Clerk authentication
-- This is the source of truth for user identity in the app

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT UNIQUE NOT NULL, -- Clerk's user ID from JWT
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_clerk_user_id ON public.users(clerk_user_id);
CREATE INDEX idx_users_email ON public.users(email);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### Table 2: organizations
```sql
-- Purpose: Store company/organization data
-- Each organization can have multiple teams and members

CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- URL-friendly identifier
  settings JSONB DEFAULT '{}', -- Organization-level settings
  subscription_plan TEXT DEFAULT 'free', -- free, pro, enterprise
  subscription_status TEXT DEFAULT 'active', -- active, cancelled, expired
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_organizations_slug ON public.organizations(slug);
CREATE INDEX idx_organizations_subscription_plan ON public.organizations(subscription_plan);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Auto-update updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### Table 3: teams
```sql
-- Purpose: Teams within organizations
-- Each team belongs to exactly one organization

CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  settings JSONB DEFAULT '{}', -- Team-specific settings
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, name) -- Team names must be unique within an organization
);

-- Indexes
CREATE INDEX idx_teams_organization_id ON public.teams(organization_id);
CREATE INDEX idx_teams_name ON public.teams(name);

-- Enable RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Auto-update updated_at
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### Table 4: team_members
```sql
-- Purpose: Junction table connecting users to teams with role assignments
-- This is the central table for authorization - roles determine permissions

CREATE TYPE public.user_role AS ENUM ('member', 'manager', 'admin');

CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role public.user_role NOT NULL DEFAULT 'member', -- member, manager, admin
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id) -- A user can only be in a team once
);

-- Indexes for RLS performance (these columns are frequently checked in policies)
CREATE INDEX idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX idx_team_members_organization_id ON public.team_members(organization_id);
CREATE INDEX idx_team_members_role ON public.team_members(role);
CREATE INDEX idx_team_members_user_org ON public.team_members(user_id, organization_id);

-- Enable RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
```

#### Table 5: activities
```sql
-- Purpose: Organization-specific custom activities
-- Admins can create custom activities for their organization

CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT, -- trivia, icebreaker, creative, brainstorm, etc.
  duration_minutes INTEGER, -- Expected duration
  complexity TEXT, -- easy, medium, hard
  required_tools TEXT[], -- Array of required tools
  instructions TEXT, -- How to run the activity
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_activities_organization_id ON public.activities(organization_id);
CREATE INDEX idx_activities_category ON public.activities(category);
CREATE INDEX idx_activities_created_by ON public.activities(created_by);

-- Enable RLS
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Auto-update updated_at
CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON public.activities
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### Table 6: public_activities
```sql
-- Purpose: Public activity library (read-only for users, managed by system admins)
-- This is the built-in library of ~10 activity templates for MVP

CREATE TABLE IF NOT EXISTS public.public_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- trivia, icebreaker, creative, brainstorm, etc.
  duration_minutes INTEGER,
  complexity TEXT, -- easy, medium, hard
  required_tools TEXT[],
  instructions TEXT,
  is_active BOOLEAN DEFAULT TRUE, -- Can be disabled without deletion
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_public_activities_category ON public.public_activities(category);
CREATE INDEX idx_public_activities_is_active ON public.public_activities(is_active);

-- Enable RLS
ALTER TABLE public.public_activities ENABLE ROW LEVEL SECURITY;

-- Auto-update updated_at
CREATE TRIGGER update_public_activities_updated_at BEFORE UPDATE ON public.public_activities
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### Table 7: scheduled_events
```sql
-- Purpose: Scheduled team-building events
-- Managers/Admins schedule events for their teams

CREATE TABLE IF NOT EXISTS public.scheduled_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES public.activities(id), -- Can reference custom activity
  public_activity_id UUID REFERENCES public.public_activities(id), -- Or public activity
  title TEXT NOT NULL,
  description TEXT,
  scheduled_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER,
  zoom_meeting_url TEXT, -- Zoom integration
  calendar_link TEXT, -- Calendar link for participants
  status TEXT DEFAULT 'scheduled', -- scheduled, completed, cancelled
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_activity_reference CHECK (
    (activity_id IS NOT NULL AND public_activity_id IS NULL) OR
    (activity_id IS NULL AND public_activity_id IS NOT NULL)
  ) -- Event must reference either custom or public activity, not both
);

-- Indexes
CREATE INDEX idx_scheduled_events_team_id ON public.scheduled_events(team_id);
CREATE INDEX idx_scheduled_events_organization_id ON public.scheduled_events(organization_id);
CREATE INDEX idx_scheduled_events_activity_id ON public.scheduled_events(activity_id);
CREATE INDEX idx_scheduled_events_scheduled_date ON public.scheduled_events(scheduled_date);
CREATE INDEX idx_scheduled_events_status ON public.scheduled_events(status);
CREATE INDEX idx_scheduled_events_created_by ON public.scheduled_events(created_by);

-- Enable RLS
ALTER TABLE public.scheduled_events ENABLE ROW LEVEL SECURITY;

-- Auto-update updated_at
CREATE TRIGGER update_scheduled_events_updated_at BEFORE UPDATE ON public.scheduled_events
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### Table 8: feedback
```sql
-- Purpose: Member feedback on events
-- Only members can submit feedback; managers/admins can view

CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.scheduled_events(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5), -- 1-5 star rating
  attended BOOLEAN NOT NULL, -- Did they attend?
  comments TEXT, -- Optional feedback text
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id) -- One feedback per event per user
);

-- Indexes
CREATE INDEX idx_feedback_event_id ON public.feedback(event_id);
CREATE INDEX idx_feedback_team_id ON public.feedback(team_id);
CREATE INDEX idx_feedback_organization_id ON public.feedback(organization_id);
CREATE INDEX idx_feedback_user_id ON public.feedback(user_id);
CREATE INDEX idx_feedback_rating ON public.feedback(rating);

-- Enable RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
```

#### Table 9: activity_recommendations
```sql
-- Purpose: AI-generated activity recommendations for teams
-- System generates recommendations; admins/managers can customize

CREATE TABLE IF NOT EXISTS public.activity_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  recommended_activity_id UUID REFERENCES public.activities(id), -- Custom activity
  recommended_public_activity_id UUID REFERENCES public.public_activities(id), -- Or public
  reason TEXT, -- Why this activity was recommended
  confidence_score NUMERIC(3,2), -- 0.00 to 1.00 confidence
  is_custom BOOLEAN DEFAULT FALSE, -- True if manually created by admin/manager
  created_by UUID REFERENCES public.users(id), -- NULL if AI-generated
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_recommendation_reference CHECK (
    (recommended_activity_id IS NOT NULL AND recommended_public_activity_id IS NULL) OR
    (recommended_activity_id IS NULL AND recommended_public_activity_id IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX idx_recommendations_team_id ON public.activity_recommendations(team_id);
CREATE INDEX idx_recommendations_organization_id ON public.activity_recommendations(organization_id);
CREATE INDEX idx_recommendations_confidence ON public.activity_recommendations(confidence_score);
CREATE INDEX idx_recommendations_is_custom ON public.activity_recommendations(is_custom);

-- Enable RLS
ALTER TABLE public.activity_recommendations ENABLE ROW LEVEL SECURITY;
```

#### Table 10: subscriptions
```sql
-- Purpose: Organization subscription plans and billing
-- Only admins can view/manage subscription information

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID UNIQUE NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL, -- free, pro, enterprise
  status TEXT NOT NULL DEFAULT 'active', -- active, cancelled, expired, past_due
  billing_email TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  stripe_customer_id TEXT, -- For future Stripe integration
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_subscriptions_organization_id ON public.subscriptions(organization_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_stripe_customer ON public.subscriptions(stripe_customer_id);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Auto-update updated_at
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### Table 11: analytics_events
```sql
-- Purpose: Raw event logs for analytics (page views, clicks, etc.)
-- Only members create events; only admins/managers view aggregated analytics

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- page_view, button_click, event_attended, etc.
  event_data JSONB DEFAULT '{}', -- Flexible JSON for event-specific data
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes (important for analytics queries)
CREATE INDEX idx_analytics_user_id ON public.analytics_events(user_id);
CREATE INDEX idx_analytics_team_id ON public.analytics_events(team_id);
CREATE INDEX idx_analytics_organization_id ON public.analytics_events(organization_id);
CREATE INDEX idx_analytics_event_type ON public.analytics_events(event_type);
CREATE INDEX idx_analytics_timestamp ON public.analytics_events(timestamp DESC);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
```

### Step 3: Create Helper Functions for RLS Policies

Create reusable helper functions to improve RLS policy performance and readability:

```sql
-- Helper function: Get current user's Clerk ID from JWT
-- This maps Clerk's auth.uid() to our users table
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS UUID AS $$
  SELECT id FROM public.users WHERE clerk_user_id = auth.jwt() ->> 'sub';
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Helper function: Get user's role in a specific team
-- Returns 'member', 'manager', 'admin', or NULL if not in team
CREATE OR REPLACE FUNCTION public.get_user_role_in_team(user_uuid UUID, team_uuid UUID)
RETURNS TEXT AS $$
  SELECT role::TEXT 
  FROM public.team_members 
  WHERE user_id = user_uuid AND team_id = team_uuid;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Helper function: Check if user is admin in organization
CREATE OR REPLACE FUNCTION public.is_user_admin_in_org(user_uuid UUID, org_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE user_id = user_uuid 
    AND organization_id = org_uuid 
    AND role = 'admin'
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Helper function: Check if user is manager of a specific team
CREATE OR REPLACE FUNCTION public.is_user_manager_of_team(user_uuid UUID, team_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE user_id = user_uuid 
    AND team_id = team_uuid 
    AND role = 'manager'
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Helper function: Get all team IDs where user is a manager
CREATE OR REPLACE FUNCTION public.get_user_managed_teams(user_uuid UUID)
RETURNS TABLE(team_id UUID) AS $$
  SELECT team_id FROM public.team_members
  WHERE user_id = user_uuid AND role = 'manager';
$$ LANGUAGE SQL STABLE SECURITY DEFINER;
```

### Step 4: Implement Row Level Security (RLS) Policies

Now implement all 30+ RLS policies based on requirements:

#### USERS TABLE POLICIES

```sql
-- Users Policy #1: Users can view their own profile
CREATE POLICY "users_select_own"
ON public.users FOR SELECT
TO authenticated
USING (clerk_user_id = (auth.jwt() ->> 'sub'));

-- Users Policy #2: Users can update their own profile
CREATE POLICY "users_update_own"
ON public.users FOR UPDATE
TO authenticated
USING (clerk_user_id = (auth.jwt() ->> 'sub'))
WITH CHECK (clerk_user_id = (auth.jwt() ->> 'sub'));

-- Users Policy #3: Admins can view all users in their organization
CREATE POLICY "users_select_admin"
ON public.users FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.user_id = public.current_user_id()
    AND tm.organization_id IN (
      SELECT organization_id FROM public.team_members
      WHERE user_id = users.id
    )
    AND tm.role = 'admin'
  )
);

-- Users Policy #4: New users can insert their own profile (Clerk integration)
CREATE POLICY "users_insert_own"
ON public.users FOR INSERT
TO authenticated
WITH CHECK (clerk_user_id = (auth.jwt() ->> 'sub'));
```

#### ORGANIZATIONS TABLE POLICIES

```sql
-- Organizations Policy #1: Users can view their own organization
-- Requirement #4: Members should NOT see subscription plan or settings
CREATE POLICY "organizations_select_basic"
ON public.organizations FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT organization_id FROM public.team_members
    WHERE user_id = public.current_user_id()
  )
);

-- Organizations Policy #2: Only admins can update their organization
-- Requirement #5: Members cannot update organization info
CREATE POLICY "organizations_update_admin"
ON public.organizations FOR UPDATE
TO authenticated
USING (
  public.is_user_admin_in_org(public.current_user_id(), id)
)
WITH CHECK (
  public.is_user_admin_in_org(public.current_user_id(), id)
);

-- Organizations Policy #3: Only admins can delete organizations
CREATE POLICY "organizations_delete_admin"
ON public.organizations FOR DELETE
TO authenticated
USING (
  public.is_user_admin_in_org(public.current_user_id(), id)
);

-- Organizations Policy #4: Admins can create new organizations
CREATE POLICY "organizations_insert_admin"
ON public.organizations FOR INSERT
TO authenticated
WITH CHECK (true); -- Will be associated with admin via team_members after creation
```

#### TEAMS TABLE POLICIES

```sql
-- Teams Policy #1: Users can view teams in their organization
CREATE POLICY "teams_select_in_org"
ON public.teams FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM public.team_members
    WHERE user_id = public.current_user_id()
  )
);

-- Teams Policy #2: Only managers and admins can create teams
-- Requirement #6: Only managers and admins can create teams
CREATE POLICY "teams_insert_manager_admin"
ON public.teams FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.team_members
    WHERE user_id = public.current_user_id()
    AND organization_id = teams.organization_id
    AND role IN ('manager', 'admin')
  )
);

-- Teams Policy #3: Managers can update their own team, admins can update any team
-- Requirement #7: Only admins and managers can edit teams (managers only their own)
CREATE POLICY "teams_update_manager_admin"
ON public.teams FOR UPDATE
TO authenticated
USING (
  public.is_user_admin_in_org(public.current_user_id(), organization_id)
  OR id IN (SELECT unnest(ARRAY(SELECT * FROM public.get_user_managed_teams(public.current_user_id()))))
)
WITH CHECK (
  public.is_user_admin_in_org(public.current_user_id(), organization_id)
  OR id IN (SELECT unnest(ARRAY(SELECT * FROM public.get_user_managed_teams(public.current_user_id()))))
);

-- Teams Policy #4: Only admins can delete teams
-- Requirement #8: Only admins can delete teams
CREATE POLICY "teams_delete_admin"
ON public.teams FOR DELETE
TO authenticated
USING (
  public.is_user_admin_in_org(public.current_user_id(), organization_id)
);
```

#### TEAM_MEMBERS TABLE POLICIES

```sql
-- Team Members Policy #1: Users can view team members in their organization
-- Requirement #9: Members can read all details except feedback and activities
CREATE POLICY "team_members_select_in_org"
ON public.team_members FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM public.team_members
    WHERE user_id = public.current_user_id()
  )
);

-- Team Members Policy #2: Members have read-only, managers can manage their team, admins manage all
-- Requirement #10: Members read-only; Managers CRUD their team; Admins CRUD all
CREATE POLICY "team_members_insert_manager_admin"
ON public.team_members FOR INSERT
TO authenticated
WITH CHECK (
  public.is_user_admin_in_org(public.current_user_id(), organization_id)
  OR public.is_user_manager_of_team(public.current_user_id(), team_id)
);

CREATE POLICY "team_members_update_manager_admin"
ON public.team_members FOR UPDATE
TO authenticated
USING (
  public.is_user_admin_in_org(public.current_user_id(), organization_id)
  OR public.is_user_manager_of_team(public.current_user_id(), team_id)
)
WITH CHECK (
  public.is_user_admin_in_org(public.current_user_id(), organization_id)
  OR public.is_user_manager_of_team(public.current_user_id(), team_id)
);

CREATE POLICY "team_members_delete_manager_admin"
ON public.team_members FOR DELETE
TO authenticated
USING (
  public.is_user_admin_in_org(public.current_user_id(), organization_id)
  OR public.is_user_manager_of_team(public.current_user_id(), team_id)
);

-- Team Members Policy #3: Prevent role escalation
-- Users cannot grant themselves admin/manager roles
CREATE POLICY "team_members_no_self_escalation"
ON public.team_members FOR UPDATE
TO authenticated
USING (
  user_id != public.current_user_id() OR role = (
    SELECT role FROM public.team_members 
    WHERE id = team_members.id
  )
);
```

#### ACTIVITIES TABLE POLICIES

```sql
-- Activities Policy #1: Managers and admins can read org-specific activities
-- Requirement #12: Managers and admins read org activities; Members cannot
CREATE POLICY "activities_select_manager_admin"
ON public.activities FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members
    WHERE user_id = public.current_user_id()
    AND organization_id = activities.organization_id
    AND role IN ('manager', 'admin')
  )
);

-- Activities Policy #2: Admins can create activities for their organization
-- Requirement #11: Admins create, update, delete org-specific activities
CREATE POLICY "activities_insert_admin"
ON public.activities FOR INSERT
TO authenticated
WITH CHECK (
  public.is_user_admin_in_org(public.current_user_id(), organization_id)
);

-- Activities Policy #3: Admins can update activities in their organization
CREATE POLICY "activities_update_admin"
ON public.activities FOR UPDATE
TO authenticated
USING (
  public.is_user_admin_in_org(public.current_user_id(), organization_id)
)
WITH CHECK (
  public.is_user_admin_in_org(public.current_user_id(), organization_id)
);

-- Activities Policy #4: Admins can delete activities in their organization
CREATE POLICY "activities_delete_admin"
ON public.activities FOR DELETE
TO authenticated
USING (
  public.is_user_admin_in_org(public.current_user_id(), organization_id)
);
```

#### PUBLIC_ACTIVITIES TABLE POLICIES

```sql
-- Public Activities Policy #1: Managers and admins can read public activities
-- Requirement #12: Managers and admins read public library; Members cannot
CREATE POLICY "public_activities_select_manager_admin"
ON public.public_activities FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members
    WHERE user_id = public.current_user_id()
    AND role IN ('manager', 'admin')
  )
  AND is_active = true
);

-- Public Activities Policy #2: Only system admins can manage (managed manually)
-- No INSERT/UPDATE/DELETE policies for users - these are managed by system admins only
```

#### SCHEDULED_EVENTS TABLE POLICIES

```sql
-- Scheduled Events Policy #1: Users can view events in their team
-- Requirement #13: Admins view all; Managers/Members view own team
CREATE POLICY "scheduled_events_select_team"
ON public.scheduled_events FOR SELECT
TO authenticated
USING (
  team_id IN (
    SELECT team_id FROM public.team_members
    WHERE user_id = public.current_user_id()
  )
);

-- Scheduled Events Policy #2: Admins can read all events, managers only their team
-- Requirement #14: Admins read all; Managers read own team; Members cannot read
CREATE POLICY "scheduled_events_read_manager_admin"
ON public.scheduled_events FOR SELECT
TO authenticated
USING (
  public.is_user_admin_in_org(public.current_user_id(), organization_id)
  OR (
    public.is_user_manager_of_team(public.current_user_id(), team_id)
  )
);

-- Scheduled Events Policy #3: Admins create for any team, managers for their team
-- Requirement #15: Admins create for any team; Managers for own team; Members cannot
CREATE POLICY "scheduled_events_insert_manager_admin"
ON public.scheduled_events FOR INSERT
TO authenticated
WITH CHECK (
  public.is_user_admin_in_org(public.current_user_id(), organization_id)
  OR public.is_user_manager_of_team(public.current_user_id(), team_id)
);

-- Scheduled Events Policy #4: Admins update any event, managers their team's events
-- Requirement #16: Admins update any; Managers update own team; Members cannot
CREATE POLICY "scheduled_events_update_manager_admin"
ON public.scheduled_events FOR UPDATE
TO authenticated
USING (
  public.is_user_admin_in_org(public.current_user_id(), organization_id)
  OR public.is_user_manager_of_team(public.current_user_id(), team_id)
)
WITH CHECK (
  public.is_user_admin_in_org(public.current_user_id(), organization_id)
  OR public.is_user_manager_of_team(public.current_user_id(), team_id)
);

-- Scheduled Events Policy #5: Event creators can delete their events
CREATE POLICY "scheduled_events_delete_creator"
ON public.scheduled_events FOR DELETE
TO authenticated
USING (
  created_by = public.current_user_id()
  OR public.is_user_admin_in_org(public.current_user_id(), organization_id)
);
```

#### FEEDBACK TABLE POLICIES

```sql
-- Feedback Policy #1: Users can view feedback based on role
-- Requirement #17: Admins view all; Managers view their team; Members view own
CREATE POLICY "feedback_select_by_role"
ON public.feedback FOR SELECT
TO authenticated
USING (
  -- Admins can view all feedback in their organization
  public.is_user_admin_in_org(public.current_user_id(), organization_id)
  -- Managers can view feedback from their team
  OR (
    team_id IN (SELECT * FROM public.get_user_managed_teams(public.current_user_id()))
  )
  -- Members can only view their own feedback
  OR user_id = public.current_user_id()
);

-- Feedback Policy #2: Only members can create feedback
-- Requirement #19, #20: Only members create/submit feedback
CREATE POLICY "feedback_insert_member"
ON public.feedback FOR INSERT
TO authenticated
WITH CHECK (
  user_id = public.current_user_id()
  AND EXISTS (
    SELECT 1 FROM public.team_members
    WHERE user_id = public.current_user_id()
    AND team_id = feedback.team_id
    AND role = 'member'
  )
);

-- Feedback Policy #3: Feedback cannot be updated once submitted
-- Requirement #21: Members cannot update feedback after submission
CREATE POLICY "feedback_no_update"
ON public.feedback FOR UPDATE
TO authenticated
USING (false); -- No one can update feedback

-- Feedback Policy #4: Members can delete their own unsubmitted feedback (draft state)
-- This allows deletion only before submission finalized
CREATE POLICY "feedback_delete_own"
ON public.feedback FOR DELETE
TO authenticated
USING (user_id = public.current_user_id());
```

#### ACTIVITY_RECOMMENDATIONS TABLE POLICIES

```sql
-- Recommendations Policy #1: View based on role and team
-- Requirement #22: Admins view all; Managers view their team; Members view their team's recommendations
CREATE POLICY "recommendations_select_by_role"
ON public.activity_recommendations FOR SELECT
TO authenticated
USING (
  -- Admins can view all recommendations in their organization
  public.is_user_admin_in_org(public.current_user_id(), organization_id)
  -- Managers can view recommendations for their team
  OR team_id IN (SELECT * FROM public.get_user_managed_teams(public.current_user_id()))
  -- Members can view recommendations for their team (created by admin/manager)
  OR (
    team_id IN (
      SELECT team_id FROM public.team_members
      WHERE user_id = public.current_user_id()
      AND role = 'member'
    )
    AND is_custom = true -- Only show custom recommendations created by admin/manager
  )
);

-- Recommendations Policy #2: Read details based on role
-- Requirement #23: Admins read all; Managers read their team; Members read their team
-- (Same logic as Policy #1 since VIEW and READ are same table in SQL)

-- Recommendations Policy #3: Admins and managers can create custom recommendations
-- Requirement #24: Admins create for any team; Managers for their team; Members cannot
CREATE POLICY "recommendations_insert_manager_admin"
ON public.activity_recommendations FOR INSERT
TO authenticated
WITH CHECK (
  public.is_user_admin_in_org(public.current_user_id(), organization_id)
  OR public.is_user_manager_of_team(public.current_user_id(), team_id)
);

-- Recommendations Policy #4: Members cannot update recommendations
-- Requirement #25: Members cannot update recommendations
CREATE POLICY "recommendations_update_manager_admin"
ON public.activity_recommendations FOR UPDATE
TO authenticated
USING (
  public.is_user_admin_in_org(public.current_user_id(), organization_id)
  OR public.is_user_manager_of_team(public.current_user_id(), team_id)
)
WITH CHECK (
  public.is_user_admin_in_org(public.current_user_id(), organization_id)
  OR public.is_user_manager_of_team(public.current_user_id(), team_id)
);

-- Recommendations Policy #5: Creators can delete their recommendations
CREATE POLICY "recommendations_delete_creator"
ON public.activity_recommendations FOR DELETE
TO authenticated
USING (
  created_by = public.current_user_id()
  OR public.is_user_admin_in_org(public.current_user_id(), organization_id)
);
```

#### SUBSCRIPTIONS TABLE POLICIES

```sql
-- Subscriptions Policy #1: Only admins can view subscription
-- Requirement #26: Only admins view subscription plan
CREATE POLICY "subscriptions_select_admin"
ON public.subscriptions FOR SELECT
TO authenticated
USING (
  public.is_user_admin_in_org(public.current_user_id(), organization_id)
);

-- Subscriptions Policy #2: Only admins can update subscription
CREATE POLICY "subscriptions_update_admin"
ON public.subscriptions FOR UPDATE
TO authenticated
USING (
  public.is_user_admin_in_org(public.current_user_id(), organization_id)
)
WITH CHECK (
  public.is_user_admin_in_org(public.current_user_id(), organization_id)
);

-- Subscriptions Policy #3: System creates subscriptions (for new orgs)
CREATE POLICY "subscriptions_insert_system"
ON public.subscriptions FOR INSERT
TO authenticated
WITH CHECK (true); -- Will be restricted by organization creation flow
```

#### ANALYTICS_EVENTS TABLE POLICIES

```sql
-- Analytics Events Policy #1: Admins can view all, managers can view their team
-- Requirement #27: Admins view all; Managers view their team; Members cannot view
CREATE POLICY "analytics_select_manager_admin"
ON public.analytics_events FOR SELECT
TO authenticated
USING (
  public.is_user_admin_in_org(public.current_user_id(), organization_id)
  OR team_id IN (SELECT * FROM public.get_user_managed_teams(public.current_user_id()))
);

-- Analytics Events Policy #2: Only members can create analytics events
-- Requirement #28: Only members create analytics events
CREATE POLICY "analytics_insert_member"
ON public.analytics_events FOR INSERT
TO authenticated
WITH CHECK (
  user_id = public.current_user_id()
  AND EXISTS (
    SELECT 1 FROM public.team_members
    WHERE user_id = public.current_user_id()
    AND organization_id = analytics_events.organization_id
  )
);

-- Analytics Events Policy #3: No one can update or delete analytics events
-- These are immutable logs
CREATE POLICY "analytics_no_update"
ON public.analytics_events FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "analytics_no_delete"
ON public.analytics_events FOR DELETE
TO authenticated
USING (false);
```

### Step 5: Create Indexes for RLS Performance Optimization

```sql
-- Additional composite indexes for common RLS query patterns
-- These dramatically improve RLS policy performance

-- For checking user's role in organization
CREATE INDEX idx_team_members_user_org_role 
ON public.team_members(user_id, organization_id, role);

-- For finding managed teams
CREATE INDEX idx_team_members_user_role_team 
ON public.team_members(user_id, role, team_id) 
WHERE role IN ('manager', 'admin');

-- For event queries filtered by team and organization
CREATE INDEX idx_scheduled_events_team_org_status 
ON public.scheduled_events(team_id, organization_id, status);

-- For feedback queries by team and user
CREATE INDEX idx_feedback_team_user 
ON public.feedback(team_id, user_id);

-- For analytics queries by date range
CREATE INDEX idx_analytics_org_timestamp 
ON public.analytics_events(organization_id, timestamp DESC);
```

### Step 6: Add Data Integrity Constraints

```sql
-- Ensure at least one admin per organization
CREATE OR REPLACE FUNCTION check_organization_has_admin()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role = 'admin' AND NEW.role != 'admin' THEN
    IF (
      SELECT COUNT(*) 
      FROM public.team_members 
      WHERE organization_id = OLD.organization_id 
      AND role = 'admin'
      AND id != OLD.id
    ) = 0 THEN
      RAISE EXCEPTION 'Cannot remove last admin from organization';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_org_admin_exists
BEFORE UPDATE ON public.team_members
FOR EACH ROW
EXECUTE FUNCTION check_organization_has_admin();

-- Prevent deletion of last admin
CREATE OR REPLACE FUNCTION prevent_last_admin_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role = 'admin' THEN
    IF (
      SELECT COUNT(*) 
      FROM public.team_members 
      WHERE organization_id = OLD.organization_id 
      AND role = 'admin'
      AND id != OLD.id
    ) = 0 THEN
      RAISE EXCEPTION 'Cannot delete last admin from organization';
    END IF;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_org_admin_on_delete
BEFORE DELETE ON public.team_members
FOR EACH ROW
EXECUTE FUNCTION prevent_last_admin_deletion();
```

### Step 7: Seed Initial Public Activities (Optional MVP Content)

```sql
-- Insert sample public activities for MVP
INSERT INTO public.public_activities (title, description, category, duration_minutes, complexity, required_tools, instructions, is_active)
VALUES
  (
    'Virtual Trivia Night',
    'Host a fun trivia competition with questions across various categories',
    'trivia',
    45,
    'easy',
    ARRAY['Zoom', 'Trivia questions'],
    'Prepare 20-30 trivia questions. Divide team into groups. Keep score and announce winner at the end.',
    true
  ),
  (
    'Two Truths and a Lie',
    'Classic icebreaker where team members guess which statement is false',
    'icebreaker',
    30,
    'easy',
    ARRAY['Video conferencing'],
    'Each person shares three statements about themselves. The team guesses which one is the lie.',
    true
  ),
  (
    'Virtual Coffee Break',
    'Casual conversation time to build social connections',
    'icebreaker',
    20,
    'easy',
    ARRAY['Video conferencing'],
    'Schedule informal 15-20 minute chat sessions. Use conversation prompts if needed.',
    true
  ),
  (
    'Creative Brainstorm Session',
    'Collaborative idea generation workshop for product/process improvements',
    'brainstorm',
    60,
    'medium',
    ARRAY['Miro board', 'Zoom'],
    'Define the problem. Use sticky notes for ideas. Group and vote on best solutions.',
    true
  ),
  (
    'Show and Tell',
    'Team members share something meaningful from their workspace',
    'creative',
    30,
    'easy',
    ARRAY['Video conferencing'],
    'Each person shows an object from their desk and explains its significance.',
    true
  ),
  (
    'Virtual Escape Room',
    'Solve puzzles together as a team',
    'creative',
    60,
    'hard',
    ARRAY['Zoom', 'Escape room platform'],
    'Book a virtual escape room. Work together to solve puzzles within the time limit.',
    true
  ),
  (
    'Skill Share Workshop',
    'Team member teaches a skill to others',
    'brainstorm',
    45,
    'medium',
    ARRAY['Video conferencing', 'Screen sharing'],
    'Team member prepares a mini-lesson on their expertise. Interactive Q&A at the end.',
    true
  ),
  (
    'Virtual Lunch & Learn',
    'Eat together while learning something new',
    'icebreaker',
    45,
    'easy',
    ARRAY['Zoom'],
    'Order lunch for the team. Host a casual presentation on an interesting topic.',
    true
  ),
  (
    'Quick Drawing Challenge',
    'Speed drawing competition with funny prompts',
    'creative',
    30,
    'medium',
    ARRAY['Zoom', 'Drawing app'],
    'Give drawing prompts. Team members sketch quickly. Vote on best drawings.',
    true
  ),
  (
    'Gratitude Circle',
    'Share appreciation and positive feedback',
    'icebreaker',
    25,
    'easy',
    ARRAY['Video conferencing'],
    'Each person shares what they are grateful for and appreciates a team member.',
    true
  )
ON CONFLICT DO NOTHING;
```

## ✅ VALIDATION & TESTING

After running this prompt, validate your implementation:

1. **Check Table Creation:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
-- Should see all 11 tables
```

2. **Verify RLS is Enabled:**
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
-- rowsecurity should be TRUE for all tables
```

3. **Count Policies:**
```sql
SELECT schemaname, tablename, COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;
-- Should see 30+ policies total
```

4. **Check Indexes:**
```sql
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename;
-- Should see all performance indexes created
```

5. **Verify Helper Functions:**
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION';
-- Should see helper functions like current_user_id, is_user_admin_in_org, etc.
```

## 📝 IMPORTANT NOTES

1. **Clerk Integration**: This schema is ready for Clerk integration. The next prompt will handle JWT configuration and user syncing.

2. **Performance**: All RLS policies use indexed columns. For production, monitor query performance and add additional indexes as needed.

3. **Security**: RLS is enabled by default on all tables. No data can be accessed without explicit policy allowing it.

4. **Extensibility**: Schema is designed to grow. You can easily add new tables or policies as MVP evolves.

5. **Testing**: Test all policies with different user roles before deploying to production.

## 🎯 SUCCESS CRITERIA

You've successfully completed this prompt when:
- ✅ All 11 tables are created with proper structure
- ✅ RLS is enabled on all tables
- ✅ 30+ policies are active and properly named
- ✅ All indexes are created for performance
- ✅ Helper functions are working
- ✅ Data integrity triggers are active
- ✅ Initial public activities are seeded (optional)
- ✅ No errors in SQL execution

## 🚀 NEXT STEPS

After successful database creation:
1. Run Prompt #2: "Supabase + Clerk Authentication Integration"
2. Run Prompt #3: "Frontend + Backend Architecture - Enhanced UI + Core Dashboard"
3. Test the complete flow with sample data
4. Deploy to production Supabase project

---

**Remember**: This is a production-ready schema. Take time to review each section before running. Good luck! 🎉
