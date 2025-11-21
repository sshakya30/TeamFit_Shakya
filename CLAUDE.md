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

Start the FastAPI development server:
```bash
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

For production:
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Frontend Development Server

Start the React + Vite development server:
```bash
cd frontend
npm run dev
```

Frontend available at: http://localhost:5173

### Install Dependencies

**Backend:**
```bash
cd backend
pip install --break-system-packages -r requirements.txt
```

**Frontend:**
```bash
cd frontend
npm install
```

### Running Full Stack

**Terminal setup for local development:**
```bash
# Terminal 1: Backend
cd backend
python -m uvicorn app.main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend
npm run dev

# Terminal 3: ngrok (for webhook testing only)
ngrok http 8000
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

## Architecture Overview

### Backend Structure

```
backend/app/
├── main.py              # FastAPI app, CORS, router registration
├── routers/
│   └── webhooks.py      # Clerk webhook endpoints (user.created/updated/deleted)
└── utils/
    ├── supabase_client.py   # Service role & user-authenticated clients
    └── user_sync.py         # User CRUD from Clerk webhook events
```

**Key Pattern:** Separation between service role client (webhooks, bypasses RLS) and user client (frontend queries, respects RLS).

**CORS Configuration:** `allow_origins=["*"]` to permit Clerk webhooks (which originate from Clerk servers, not frontend). Security is handled via Svix signature verification.

### Frontend Structure

```
frontend/src/
├── components/
│   ├── ui/              # shadcn/ui components (Button, Card)
│   ├── layout/          # Navbar, Layout, ProtectedRoute
│   └── dashboard/       # WelcomeCard, TeamInfoCard
├── pages/               # Landing, SignIn, SignUp, Dashboard, Profile
├── hooks/               # useUser (TanStack Query for user data)
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

**11 Tables with Role-Based Access:**
- `users` - Synced from Clerk (clerk_user_id is external identifier)
- `organizations` - Multi-tenant isolation point
- `teams` - Belongs to organizations
- `team_members` - Junction table with role enum (member/manager/admin)
- `activities`, `public_activities` - Custom vs system-managed activities
- `scheduled_events` - Team events with activity references
- `feedback` - Immutable event feedback (1-5 ratings)
- `activity_recommendations` - AI suggestions with confidence scores
- `subscriptions` - Stripe-ready billing
- `analytics_events` - Immutable event logs

**46 RLS Policies** enforce role-based access at the database level. All policies use helper functions like `current_user_id()` which extracts clerk_user_id from JWT.

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
# Terminal 1: Start backend
cd backend
python -m uvicorn app.main:app --reload --port 8000

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
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
SUPABASE_URL=https://....supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
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

All keys are pre-configured. **Never commit `.env` or `.env.local` to git** (already in `.gitignore`).

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

**Completed:**
- ✅ Database schema with RLS (11 tables, 46 policies)
- ✅ FastAPI backend structure
- ✅ Clerk webhook integration
- ✅ User synchronization from Clerk
- ✅ TypeScript type generation
- ✅ Service role vs user client separation
- ✅ Frontend (React + Vite + TypeScript)
- ✅ Clerk authentication UI (sign-in/sign-up)
- ✅ Dashboard with team info and welcome states
- ✅ User profile page
- ✅ Direct Supabase queries with RLS
- ✅ shadcn/ui component library
- ✅ Test infrastructure (Vitest)

**Not Yet Implemented:**
- ⏭️ Additional API endpoints (teams, activities, events, feedback)
- ⏭️ Backend test suite (pytest)
- ⏭️ Deployment configuration (Docker, CI/CD)
- ⏭️ Activity recommendation engine
- ⏭️ Analytics dashboard
- ⏭️ Team management CRUD UI
- ⏭️ Event scheduling UI
- ⏭️ Feedback submission UI

## Key Documentation Files

- `DATABASE_IMPLEMENTATION_SUMMARY.md` - Complete database schema details
- `CLERK_SUPABASE_INTEGRATION_COMPLETE.md` - Backend implementation guide
- `WEBHOOK_FIX_DOCUMENTATION.md` - Clerk webhook empty email array fix
- `WEBHOOK_TROUBLESHOOTING_GUIDE.md` - Ngrok and webhook debugging guide
- `frontend/README.md` - Frontend setup and architecture details
- `PROMPT_*.md` - Implementation specifications for each phase

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
