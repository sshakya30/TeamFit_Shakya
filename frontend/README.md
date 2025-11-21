# TEAMFIT Frontend

React + Vite + TypeScript frontend for the TEAMFIT MVP application with Clerk authentication and Supabase integration.

## Prerequisites

- Node.js 18+ and npm
- Backend server running (for webhooks)
- Environment variables configured

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Verify environment variables:**

   Check that [.env.local](frontend/.env.local) contains:
   ```env
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
   VITE_SUPABASE_URL=https://rbwnbfodovzwqajuiyxl.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   VITE_API_URL=http://localhost:8000
   ```

## Development

Start the development server:

```bash
npm run dev
```

The app will be available at [http://localhost:5173](http://localhost:5173)

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui components (Button, Card)
│   │   ├── layout/          # Layout components (Navbar, Layout, ProtectedRoute)
│   │   └── dashboard/       # Dashboard components (WelcomeCard, TeamInfoCard)
│   ├── pages/               # Route components
│   │   ├── Landing.tsx      # Public homepage
│   │   ├── SignIn.tsx       # Clerk sign-in
│   │   ├── SignUp.tsx       # Clerk sign-up
│   │   ├── Dashboard.tsx    # Main dashboard
│   │   └── Profile.tsx      # User profile
│   ├── hooks/               # Custom React hooks
│   │   └── useUser.ts       # Fetch user data from Supabase
│   ├── lib/                 # Utilities and configs
│   │   ├── supabase.ts      # Supabase client with Clerk JWT
│   │   └── utils.ts         # Utility functions (cn helper)
│   ├── types/               # TypeScript types
│   │   └── index.ts         # Database types and interfaces
│   ├── test/                # Test utilities
│   │   └── setup.ts         # Vitest configuration
│   ├── App.tsx              # Main app with routing
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
├── index.html               # HTML entry point
├── package.json             # Dependencies and scripts
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript configuration
├── tailwind.config.js       # Tailwind CSS configuration
└── components.json          # shadcn/ui configuration
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests with Vitest
- `npm run test:ui` - Run tests with UI
- `npm run lint` - Run ESLint

## Architecture

### Authentication Flow

1. User signs in/up via Clerk
2. Clerk generates JWT token
3. Clerk sends webhook to backend → Creates user in Supabase
4. Frontend queries Supabase directly with Clerk JWT
5. RLS policies validate JWT and filter data

### Data Fetching

- **TanStack Query** for caching and loading states
- **Direct Supabase queries** (no backend API middleware)
- **RLS policies** handle access control at database level

### Component Library

- **shadcn/ui** - Copy-paste components built on Radix UI
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Icon library

## Testing the Application

### 1. Start Backend Server

In a separate terminal:

```bash
cd ../backend
python -m uvicorn app.main:app --reload --port 8000
```

### 2. Start Frontend

```bash
npm run dev
```

### 3. Test Authentication

1. Visit [http://localhost:5173](http://localhost:5173)
2. Click "Get Started" or "Sign In"
3. Create a test account or sign in
4. Should redirect to `/dashboard`

### 4. Test Dashboard

**If user has team assignment:**
- Shows TeamInfoCard with team name, member count, upcoming events

**If user has NO team assignment:**
- Shows WelcomeCard with instructions to contact admin

### 5. Test Profile

1. Click "Profile" in navbar
2. Should show user info from Clerk
3. Should show team/role info if assigned

### 6. Run Automated Tests

```bash
npm run test
```

## Key Features

### ✅ Implemented

- Clerk authentication (sign-in/sign-up)
- Protected routing
- Dashboard with conditional rendering
- User profile page
- Direct Supabase queries with RLS
- Team and organization display
- Responsive design with Tailwind CSS
- Type-safe TypeScript throughout

### ⏭️ Coming Soon (via GitHub Spec-Kit)

- Team management CRUD
- Activity library
- Event scheduling
- Feedback submission
- Analytics dashboard

## Troubleshooting

### Issue: "Missing Supabase environment variables"

**Solution:** Check that [.env.local](frontend/.env.local) exists and contains valid Supabase credentials.

### Issue: "Missing VITE_CLERK_PUBLISHABLE_KEY"

**Solution:** Verify Clerk publishable key is set in [.env.local](frontend/.env.local)

### Issue: Dashboard shows error loading data

**Solutions:**
1. Verify backend is running at `http://localhost:8000`
2. Check that user was synced to Supabase via webhook
3. Verify RLS policies are enabled in Supabase
4. Check browser console for specific errors

### Issue: User sees "Not assigned to team" message

**Expected behavior:** New users must be manually added to a team by an admin. This is handled via:

```sql
-- Example: Add user to team as member
INSERT INTO team_members (user_id, team_id, organization_id, role)
VALUES ('user-uuid', 'team-uuid', 'org-uuid', 'member');
```

## Environment Variables

All environment variables must be prefixed with `VITE_` to be exposed to the frontend:

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key | `pk_test_...` |
| `VITE_SUPABASE_URL` | Supabase project URL | `https://xyz.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGciOiJIUzI1NiIs...` |
| `VITE_API_URL` | Backend API URL | `http://localhost:8000` |

**Note:** Never commit `.env.local` to git. Use `.env.example` as a template.

## Production Build

```bash
npm run build
```

Outputs to `dist/` directory. Serve with:

```bash
npm run preview
```

## Next Steps

After confirming the frontend works:

1. Test with multiple user accounts (different roles)
2. Verify RLS policies work correctly
3. Use GitHub Spec-Kit to add remaining MVP features
4. Deploy to production (DigitalOcean, Vercel, etc.)

## Support

For issues or questions:
- Check [CLAUDE.md](../CLAUDE.md) for project documentation
- Review [PROMPT_3_Frontend_Dashboard.md](../PROMPT_3_Frontend_Dashboard.md) for implementation details
- Check Supabase logs for RLS policy errors
- Check Clerk Dashboard for webhook delivery status
