# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TEAMFIT MVP is an AI-powered team-building platform for remote teams. The tech stack consists of:
- **Backend:** FastAPI (Python) with Clerk authentication
- **Database:** Supabase (PostgreSQL) with comprehensive RLS policies
- **Frontend:** React + Vite + TypeScript with Clerk auth and TanStack Query
- **Auth:** Clerk (third-party) with webhook-based user sync

## Development Commands

### Backend Server

Start the FastAPI development server (using UV):
```bash
cd backend
uv run uvicorn app.main:app --reload --port 8000
```

For production:
```bash
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Celery Worker (Required for AI Features)

Start Celery worker for async task processing:
```bash
cd backend
uv run celery -A celery_worker worker --loglevel=info
```

### Redis (Required for Celery)

Start Redis server (message broker for Celery):
```bash
redis-server
```

### Frontend Development Server

Start the React + Vite development server:
```bash
cd frontend
npm run dev
```

Frontend available at: http://localhost:5173

### Install Dependencies

**Backend (using UV - recommended):**
```bash
cd backend
uv sync
```

**Frontend:**
```bash
cd frontend
npm install
```

**Note:** UV is the recommended package manager for Python. It's significantly faster than pip and provides better dependency resolution.

### Running Full Stack (4 Terminals)

```bash
# Terminal 1: Redis (message broker)
redis-server

# Terminal 2: Celery Worker (async tasks)
cd backend
uv run celery -A celery_worker worker --loglevel=info

# Terminal 3: FastAPI Backend
cd backend
uv run uvicorn app.main:app --reload --port 8000

# Terminal 4: Frontend
cd frontend
npm run dev
```

### Testing Commands

**Backend:**
```bash
# Health check
curl http://localhost:8000/health

# Webhook health
curl http://localhost:8000/api/webhooks/clerk/health

# Test ngrok connection
curl https://your-ngrok-url.ngrok-free.dev/health
```

**Frontend:**
```bash
cd frontend

# Run tests
npm run test

# Run tests with UI
npm run test:ui

# Run linter
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

### Database Queries

Access Supabase SQL Editor for validation:
```sql
-- View recent users
SELECT * FROM public.users ORDER BY created_at DESC LIMIT 5;

-- Check RLS function (returns NULL without auth)
SELECT public.current_user_id();

-- Verify webhook-synced users
SELECT id, clerk_user_id, email, full_name, created_at
FROM public.users
WHERE created_at > NOW() - INTERVAL '1 hour';
```

## UV Package Manager

This project uses **UV** (https://github.com/astral-sh/uv) for Python package management. UV is an extremely fast Python package installer and resolver written in Rust.

### Why UV?

- **Speed:** 10-100x faster than pip
- **Better dependency resolution:** Resolves complex dependency trees correctly
- **Virtual environment management:** Automatically manages `.venv`
- **Modern tooling:** Uses `pyproject.toml` standard

### Common UV Commands

```bash
# Install UV globally (one-time setup)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Sync dependencies (creates .venv and installs packages)
cd backend
uv sync

# Add a new dependency
uv add package-name

# Add a development dependency
uv add --dev pytest

# Remove a dependency
uv remove package-name

# Run a command in the virtual environment
uv run uvicorn app.main:app --reload

# Update all dependencies
uv lock --upgrade

# Show installed packages
uv pip list
```

### Project Files

- **pyproject.toml** - Main dependency configuration (replaces requirements.txt)
- **uv.lock** - Lockfile with exact versions (auto-generated, commit to git)
- **.venv/** - Virtual environment (auto-created, in .gitignore)

### Migration Notes

The project maintains **both** `requirements.txt` (legacy) and `pyproject.toml` (UV) for compatibility. New dependencies should be added to `pyproject.toml` using `uv add package-name`.

## Architecture Overview

### Backend Structure

```
backend/
├── celery_worker.py         # Celery worker entry point
└── app/
    ├── main.py              # FastAPI app, CORS, router registration
    ├── config.py            # Pydantic settings (env vars)
    ├── routers/
    │   ├── webhooks.py      # Clerk webhook endpoints
    │   ├── activities.py    # AI activity customization/generation
    │   ├── materials.py     # File upload and management
    │   └── jobs.py          # Async job status polling
    ├── services/
    │   ├── ai_service.py    # OpenAI integration
    │   ├── file_service.py  # File validation and text extraction
    │   ├── quota_service.py # Usage quota enforcement
    │   └── trust_service.py # Organization trust scoring
    ├── tasks/
    │   └── generation_tasks.py  # Celery async tasks
    └── utils/
        ├── supabase_client.py   # Service role & user clients
        ├── user_sync.py         # User CRUD from webhooks
        └── prompts.py           # AI prompt templates
```

**Key Patterns:**
- Service role client (bypasses RLS) vs user client (respects RLS)
- Celery + Redis for async AI generation tasks
- Trust scoring for abuse prevention
- Quota enforcement (free: 5/month, paid: 10 custom generations)

**CORS Configuration:** `allow_origins=["*"]` to permit Clerk webhooks (which originate from Clerk servers, not frontend). Security is handled via Svix signature verification.

### Frontend Structure

```
frontend/src/
├── components/
│   ├── ui/              # shadcn/ui components (Button, Card, Dialog, Select, Badge, Skeleton)
│   ├── layout/          # Navbar, Layout, ProtectedRoute
│   ├── dashboard/       # WelcomeCard, TeamInfoCard
│   └── activities/      # ActivityCard, ActivityGrid, ActivityFilters, ActivityDetailModal, EmptyState
├── pages/               # Landing, SignIn, SignUp, Dashboard, Profile, ActivityLibrary
├── hooks/               # useUser, useActivities (TanStack Query hooks)
├── lib/                 # Supabase client (with Clerk JWT), utils
├── types/               # TypeScript interfaces matching database schema
├── App.tsx              # Routing (React Router), providers (Clerk, TanStack Query)
└── main.tsx             # Entry point
```

**Key Patterns:**
- Direct Supabase queries (no backend API middleware) with Clerk JWT
- TanStack Query for data fetching, caching, and loading states
- Protected routes redirect unauthenticated users to sign-in
- Conditional rendering based on team membership status

### Database Architecture (Supabase)

**Core Tables:**
- `users` - Synced from Clerk (clerk_user_id is external identifier)
- `organizations` - Multi-tenant isolation point
- `teams` - Belongs to organizations
- `team_members` - Junction table with role enum (member/manager/admin)
- `subscriptions` - Stripe-ready billing

**AI Feature Tables:**
- `public_activities` - System-managed activity library (45 activities)
- `customized_activities` - Team-specific customizations with enums:
  - `customization_type`: `public_customized` | `custom_generated`
  - `status`: `suggested` | `saved` | `scheduled` | `expired`
- `team_profiles` - Team context for AI personalization
- `uploaded_materials` - Files for custom generation (PDF, DOCX, PPTX, XLSX)
- `customization_jobs` - Async job tracking for Celery tasks
- `usage_quotas` - Trust scores and usage limits per organization

**Event Tables:**
- `scheduled_events` - Team events with activity references
- `feedback` - Immutable event feedback (1-5 ratings)
- `analytics_events` - Immutable event logs

**RLS Policies** enforce role-based access using `current_user_id()` which extracts clerk_user_id from JWT.

**Critical Design Decision:** Users are NOT stored in Supabase Auth. Clerk handles authentication, webhooks sync to `users` table, and RLS policies use JWT claims (`auth.jwt() ->> 'sub'`) to map to clerk_user_id.

### Authentication Flow

```
User Sign-Up (Browser)
    ↓
Clerk (generates JWT, sends webhook)
    ↓
POST /api/webhooks/clerk (FastAPI)
    ├─ Verify Svix signature
    ├─ Extract user data
    └─ Use service role client → Supabase (bypasses RLS)

User Query (Browser)
    ↓
Clerk JWT → Direct to Supabase
    ├─ Anon key + JWT in Authorization header
    ├─ RLS policies extract clerk_user_id from JWT
    └─ Filter data by user's organization/team/role
```

### Supabase Client Usage

**Service Role Client** (webhooks only):
```python
from app.utils.supabase_client import get_supabase_service_client
supabase = get_supabase_service_client()  # Bypasses ALL RLS policies
```

**User Client** (frontend queries):
```python
from app.utils.supabase_client import get_supabase_user_client
supabase = get_supabase_user_client(clerk_jwt)  # Respects RLS policies
```

**Never expose service role key to frontend.**

**Frontend Supabase Client** (with Clerk JWT):
```typescript
import { useSupabaseClient } from '@/lib/supabase';
const supabase = useSupabaseClient(); // Automatically includes Clerk JWT
const { data } = await supabase.from('teams').select('*');
```

## Important Implementation Details

### Clerk Webhook Processing

**Endpoint:** `POST /api/webhooks/clerk`

**Supported Events:**
- `user.created` → Creates user in Supabase
- `user.updated` → Updates user profile
- `user.deleted` → Cascade deletes user and related records

**Security:** Svix signature verification with headers: `svix-id`, `svix-timestamp`, `svix-signature`

**Known Issue:** Clerk Dashboard test webhooks send empty `email_addresses: []` array. This is handled with validation:
```python
email_addresses = clerk_user_data.get("email_addresses", [])
email = email_addresses[0].get("email_address") if email_addresses else None
if not email:
    raise ValueError("Email address is required...")
```

Real user signups always include email, so production webhooks work correctly.

### RLS Helper Functions

**Located in:** Supabase database (public schema)

**Key Function:** `public.current_user_id()`
```sql
-- Extracts Clerk user ID from JWT and returns internal UUID
SELECT id FROM public.users WHERE clerk_user_id = auth.jwt() ->> 'sub';
```

Used by all 46 RLS policies to enforce access control. Returns NULL if no JWT or user not found.

**Other Helpers:**
- `is_user_admin_in_org(user_uuid, org_uuid)` → boolean
- `is_user_manager_of_team(user_uuid, team_uuid)` → boolean
- `get_user_managed_teams(user_uuid)` → table of team_ids

### Role-Based Access Control

**Roles:** member, manager, admin (stored in `team_members.role` enum)

**Access Levels:**
- **Members:** Own profile, submit feedback, create analytics events
- **Managers:** + Manage assigned teams, create events, view team feedback, access activity library
- **Admins:** + Full organization access, manage all teams, subscriptions, custom activities

**Anti-Escalation Policy:** Users cannot grant themselves higher roles (enforced in `team_members` UPDATE policy).

## Common Development Tasks

### Adding New API Endpoints

1. Create router in `backend/app/routers/`
2. Register in `main.py`: `app.include_router(router, prefix="/api/...", tags=["..."])`
3. Use appropriate Supabase client (service vs user)
4. Test with curl or Postman

### Modifying User Sync Logic

Edit `backend/app/utils/user_sync.py`. The server auto-reloads with `--reload` flag.

**Pattern for safe field extraction:**
```python
# Handle optional/array fields safely
field = data.get("field", [])
value = field[0].get("value") if field else None
```

### Database Schema Changes

1. Create migration in Supabase SQL Editor or via Supabase MCP tool
2. Update `database-types.ts` by regenerating with `mcp__supabase__generate_typescript_types`
3. Update RLS policies if access patterns change
4. Test with different role levels (member/manager/admin)

### Webhook Testing

**Local Testing with ngrok:**
```bash
# Terminal 1: Start backend (using UV)
cd backend
uv run uvicorn app.main:app --reload --port 8000

# Terminal 2: Start ngrok (IMPORTANT: Use port 8000, NOT 80!)
ngrok http 8000

# Terminal 3: Monitor ngrok requests
# Visit http://127.0.0.1:4040 for real-time request inspection

# Update Clerk Dashboard webhook URL to: https://your-ngrok-url.ngrok-free.dev/api/webhooks/clerk
# Test with real user signup
```

**Common Webhook Issues:**
- **502 Bad Gateway** → ngrok forwarding to wrong port (use `ngrok http 8000`)
- **403 Forbidden** → CORS blocking (already fixed with `allow_origins=["*"]`)
- **401 Unauthorized** → Webhook secret mismatch in `.env`

**Do NOT use Clerk Dashboard test webhooks** - they send invalid mock data (empty email array). See `WEBHOOK_TROUBLESHOOTING_GUIDE.md` for detailed debugging steps.

## Environment Configuration

**Required in `backend/.env`:**
```env
# Clerk
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Supabase
SUPABASE_URL=https://....supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenAI
OPENAI_API_KEY=sk-proj-...
FREE_TIER_AI_MODEL=gpt-4o-mini
PAID_TIER_AI_MODEL=gpt-4o

# Redis/Celery
REDIS_URL=redis://localhost:6379/0

# Storage
STORAGE_BUCKET_NAME=team-materials
MAX_FILE_SIZE_MB=10
MAX_TEAM_STORAGE_MB=50

# Quotas
FREE_TIER_MONTHLY_LIMIT=5
PAID_TIER_CUSTOM_LIMIT=10

# Application
SUPER_ADMIN_EMAIL=shakyasupernicecrunch@gmail.com
FRONTEND_URL=http://localhost:5173
```

**Required in `frontend/.env.local`:**
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_SUPABASE_URL=https://rbwnbfodovzwqajuiyxl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_URL=http://localhost:8000
```

**Never commit `.env` or `.env.local` to git** (already in `.gitignore`).

## TypeScript Types

**Location:** `database-types.ts` (auto-generated)

**Usage in Frontend:**
```typescript
import { Database, Tables } from './database-types'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient<Database>(url, anonKey, {
  global: { headers: { Authorization: `Bearer ${clerkJwt}` } }
})

type Team = Tables<'teams'>
const { data } = await supabase.from('teams').select('*')
```

Types include Row, Insert, Update, and Relationships for all 11 tables.

## Project Status

**Phase 1 - Foundation (Completed):**
- ✅ Database schema with RLS policies
- ✅ FastAPI backend with Clerk webhooks
- ✅ User synchronization from Clerk
- ✅ Frontend (React + Vite + TypeScript)
- ✅ Clerk authentication UI
- ✅ Dashboard with team info
- ✅ shadcn/ui component library

**Phase 2 - AI Features (Completed):**
- ✅ OpenAI integration (gpt-4o-mini / gpt-4o)
- ✅ Public activity customization (real-time)
- ✅ Custom activity generation (async via Celery)
- ✅ File upload with text extraction (PDF, DOCX, PPTX, XLSX)
- ✅ Quota management (free tier limits)
- ✅ Trust scoring for abuse prevention
- ✅ Celery + Redis async processing
- ✅ Team profile management
- ✅ Supabase Storage integration

**Phase 3 - Frontend UI (In Progress):**
- ✅ Activity Library page with filtering (category, duration, complexity)
- ✅ Activity cards with detail modal
- ✅ Customization placeholder page (/customize/:activityId)
- ⏭️ Activity customization UI (LLM integration)
- ⏭️ Event scheduling UI
- ⏭️ Feedback submission UI
- ⏭️ Analytics dashboard

**Not Yet Implemented:**
- ⏭️ Deployment configuration (Docker, CI/CD)
- ⏭️ Backend test suite (pytest)

## AI Features API Endpoints

**Materials (paid subscription only):**
- `POST /api/materials/upload` - Upload file (PDF, DOCX, PPTX, XLSX)
- `GET /api/materials/{team_id}` - List team materials
- `DELETE /api/materials/{material_id}` - Delete material

**Activities:**
- `POST /api/activities/customize` - Customize public activity (real-time)
- `POST /api/activities/generate-custom` - Generate 3 custom activities (async via Celery)
- `POST /api/activities/team-profile` - Create/update team profile
- `GET /api/activities/team/{team_id}` - List customized activities
- `PATCH /api/activities/{activity_id}/status` - Update activity status

**Jobs (for async task polling):**
- `GET /api/jobs/{job_id}` - Get job status and results
- `GET /api/jobs/team/{team_id}` - List team jobs

**Async Flow:**
1. `POST /api/activities/generate-custom` → Returns `job_id`
2. Celery worker processes task in background
3. Frontend polls `GET /api/jobs/{job_id}` until `status: "completed"`
4. Response includes generated activities

## Key Documentation Files

- `CELERY_REDIS_SETUP.md` - Celery + Redis setup and usage guide
- `PHASE_2_IMPLEMENTATION_COMPLETE.md` - AI features implementation (Part 1)
- `PHASE_2_PART2_IMPLEMENTATION_COMPLETE.md` - Trust scoring and table alignment
- `DATABASE_IMPLEMENTATION_SUMMARY.md` - Complete database schema details
- `WEBHOOK_TROUBLESHOOTING_GUIDE.md` - Ngrok and webhook debugging guide
- `frontend/README.md` - Frontend setup and architecture details

## Constitution Principles (Mandatory)

This project follows the TEAMFIT Constitution (`.specify/memory/constitution.md`). All development must comply with:

| Principle | Key Requirements |
|-----------|-----------------|
| I. Event-Driven Architecture | Use Celery + Redis for async/long-running operations |
| II. Product Robustness | Error handling with retry logic, circuit breakers, fallbacks |
| III. Security Implementation | Clerk auth, Supabase RLS, Svix webhook verification |
| IV. Separation of Concerns | Routers→Services→Utils (backend), Components→Hooks→Pages (frontend) |
| V. Logging System | Structured logging, no PII in logs |
| VI. Input Validation | Pydantic models, type checking, file validation |
| VII. Code Simplicity | Max ~50 lines/function, cyclomatic complexity ≤10 |
| VIII. Code Documentation | Docstrings, type hints, inline comments for complex logic |

**User Permission Required Before:**
- Database migrations with data changes
- Dependency version upgrades
- Architectural changes
- File/data deletion
- Push to remote repositories

## Security Notes

1. **Service role key** only in backend, never frontend
2. **Webhook signatures** verified before processing (Svix)
3. **RLS policies** enforce multi-tenant isolation at database level
4. **JWT validation** handled by Supabase, not backend
5. **CORS** restricted to configured frontend URL
6. **Environment variables** never committed to repository

## Super Admin Setup

Email `shakyasupernicecrunch@gmail.com` is configured as super admin. When this user signs up:
1. User is created in `users` table via webhook
2. Manually create first organization and team
3. Manually insert `team_members` record with `role='admin'`
4. All subsequent admins can be assigned through the application

## MCP Integration

Supabase MCP server is configured for direct database operations:
- `mcp__supabase__list_tables` - List all tables
- `mcp__supabase__execute_sql` - Run queries
- `mcp__supabase__apply_migration` - Create migrations
- `mcp__supabase__generate_typescript_types` - Regenerate types

MCP endpoint: `https://mcp.supabase.com/mcp?project_ref=rbwnbfodovzwqajuiyxl`

## Feature Development Workflow (Speckit)

Features are developed using the speckit workflow. Specs are stored in `specs/[###-feature-name]/`:

```bash
/speckit.specify   # Create feature specification (spec.md)
/speckit.clarify   # Resolve ambiguities via Q&A
/speckit.plan      # Create implementation plan (plan.md, research.md, data-model.md)
/speckit.tasks     # Generate task checklist (tasks.md)
/speckit.analyze   # Cross-artifact consistency check
/speckit.implement # Execute implementation
```

**Feature spec structure:**
```
specs/001-activity-library/
├── spec.md          # Requirements, user stories, acceptance criteria
├── plan.md          # Technical context, architecture decisions
├── tasks.md         # Actionable task checklist with [X] progress
├── research.md      # Technical decisions and alternatives
├── data-model.md    # TypeScript interfaces and data flow
└── quickstart.md    # Implementation steps and verification
```
