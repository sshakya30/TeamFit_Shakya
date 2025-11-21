# TEAMFIT MVP - Frontend + Backend Architecture: Enhanced UI + Core Dashboard
# Prompt #3: Copy this entire prompt and run it in Claude Code

---

## 🎯 OBJECTIVE
Build the frontend application for TEAMFIT MVP with Clerk authentication, protected routing, and a core dashboard. This includes sign-in/sign-up flows, a minimal dashboard showing user/team information, and user profile management.

## 📋 CONTEXT
You have already:
- ✅ Created database schema with RLS policies (Prompt #1)
- ✅ Integrated Clerk with Supabase webhooks (Prompt #2)
- ✅ Users sync from Clerk to Supabase automatically

Now we'll build:
- Frontend authentication with Clerk
- Protected routes
- Dashboard for authenticated users
- User profile page
- Clean navigation structure

**Tech Stack:**
- React 18 + TypeScript
- Vite (build tool)
- React Router (routing)
- Clerk React (authentication)
- Supabase JS (database queries)
- TanStack Query (data fetching/caching)
- Tailwind CSS + shadcn/ui (styling)
- Vitest (testing)

## 🏗️ ARCHITECTURE OVERVIEW

### File Structure
```
frontend/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── layout/
│   │   ├── dashboard/
│   │   └── shared/
│   ├── pages/           # Page components
│   │   ├── Landing.tsx
│   │   ├── SignIn.tsx
│   │   ├── SignUp.tsx
│   │   ├── Dashboard.tsx
│   │   └── Profile.tsx
│   ├── hooks/           # Custom React hooks
│   │   └── useUser.ts
│   ├── lib/             # Utilities and configs
│   │   ├── supabase.ts
│   │   └── clerk.ts
│   ├── types/           # TypeScript types
│   │   └── index.ts
│   ├── App.tsx          # Main app with routing
│   └── main.tsx         # Entry point
├── .env                 # Environment variables
├── .env.example         # Template
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

### Data Flow
```
User Action (Browser)
    ↓
Clerk Authentication (JWT)
    ↓
React Component (with useQuery)
    ↓
Supabase Client (with Clerk JWT in header)
    ↓
Supabase Database (RLS validates JWT)
    ↓
Data returned to React Component
    ↓
UI Updates
```

## 🔧 IMPLEMENTATION

### Step 1: Install Frontend Dependencies

Navigate to your frontend directory and install required packages:

```bash
cd frontend

# Core dependencies
npm install react-router-dom @clerk/clerk-react @supabase/supabase-js @tanstack/react-query

# UI dependencies (shadcn/ui prerequisites)
npm install class-variance-authority clsx tailwind-merge lucide-react

# Dev dependencies
npm install -D @types/node vitest @testing-library/react @testing-library/jest-dom jsdom
```

### Step 2: Create Environment Variables

Create `frontend/.env`:

```env
# Clerk Configuration
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here

# Supabase Configuration  
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# API Configuration (for future FastAPI calls)
VITE_API_URL=http://localhost:8000
```

Create `frontend/.env.example` (template for others):

```env
# Clerk Configuration
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here

# Supabase Configuration  
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# API Configuration
VITE_API_URL=http://localhost:8000
```

**Where to get these values:**
- `VITE_CLERK_PUBLISHABLE_KEY`: Clerk Dashboard → API Keys → Publishable Key
- `VITE_SUPABASE_URL`: Supabase Dashboard → Project Settings → API → Project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase Dashboard → Project Settings → API → anon public key

### Step 3: Configure Vite

Update `frontend/vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
```

### Step 4: Update Tailwind Configuration

Update `frontend/tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

Install the animate plugin:
```bash
npm install -D tailwindcss-animate
```

### Step 5: Add Global CSS Variables

Update `frontend/src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

### Step 6: Create TypeScript Types

Create `frontend/src/types/index.ts`:

```typescript
/**
 * TypeScript types for TEAMFIT application
 * These match the Supabase database schema
 */

export type UserRole = 'member' | 'manager' | 'admin';

export interface User {
  id: string;
  clerk_user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  settings: Record<string, any>;
  subscription_plan: string;
  subscription_status: string;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  organization_id: string;
  role: UserRole;
  joined_at: string;
}

// Extended types for UI
export interface UserWithTeam extends User {
  team_member?: TeamMember;
  team?: Team;
  organization?: Organization;
}

export interface DashboardData {
  user: User;
  teamMember: TeamMember | null;
  team: Team | null;
  organization: Organization | null;
  teamMembersCount: number;
  upcomingEventsCount: number;
}
```

### Step 7: Create Supabase Client

Create `frontend/src/lib/supabase.ts`:

```typescript
/**
 * Supabase client configuration for TEAMFIT
 * Integrates with Clerk authentication
 */

import { createClient } from '@supabase/supabase-js';
import { useSession } from '@clerk/clerk-react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

/**
 * Create Supabase client authenticated with Clerk JWT
 * Use this in components that need to query Supabase
 */
export function useSupabaseClient() {
  const { session } = useSession();

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: async () => {
        const token = await session?.getToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
    },
  });
}

/**
 * Base Supabase client (without auth)
 * Use only for public data queries
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Step 8: Create Custom Hooks

Create `frontend/src/hooks/useUser.ts`:

```typescript
/**
 * Custom hook to fetch user data from Supabase
 * Includes team membership and organization info
 */

import { useQuery } from '@tanstack/react-query';
import { useUser as useClerkUser } from '@clerk/clerk-react';
import { useSupabaseClient } from '@/lib/supabase';
import type { User, TeamMember, Team, Organization, DashboardData } from '@/types';

export function useUser() {
  const { user: clerkUser } = useClerkUser();
  const supabase = useSupabaseClient();

  return useQuery<DashboardData | null>({
    queryKey: ['user-dashboard', clerkUser?.id],
    queryFn: async () => {
      if (!clerkUser) return null;

      // Fetch user from Supabase
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('clerk_user_id', clerkUser.id)
        .single();

      if (userError || !user) {
        console.error('Error fetching user:', userError);
        return null;
      }

      // Fetch team membership
      const { data: teamMember, error: teamMemberError } = await supabase
        .from('team_members')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // If no team membership, return user only
      if (teamMemberError || !teamMember) {
        return {
          user,
          teamMember: null,
          team: null,
          organization: null,
          teamMembersCount: 0,
          upcomingEventsCount: 0,
        };
      }

      // Fetch team
      const { data: team } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamMember.team_id)
        .single();

      // Fetch organization
      const { data: organization } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', teamMember.organization_id)
        .single();

      // Get team member count
      const { count: teamMembersCount } = await supabase
        .from('team_members')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', teamMember.team_id);

      // Get upcoming events count
      const { count: upcomingEventsCount } = await supabase
        .from('scheduled_events')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', teamMember.team_id)
        .eq('status', 'scheduled')
        .gte('scheduled_date', new Date().toISOString());

      return {
        user,
        teamMember,
        team: team || null,
        organization: organization || null,
        teamMembersCount: teamMembersCount || 0,
        upcomingEventsCount: upcomingEventsCount || 0,
      };
    },
    enabled: !!clerkUser,
  });
}
```

### Step 9: Create shadcn/ui Components

Install Button component:

```bash
npx shadcn-ui@latest init
# When prompted, use defaults or customize as needed

npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
```

This will create:
- `frontend/src/components/ui/button.tsx`
- `frontend/src/components/ui/card.tsx`
- `frontend/src/lib/utils.ts`

### Step 10: Create Layout Components

Create `frontend/src/components/layout/Navbar.tsx`:

```typescript
/**
 * Main navigation bar component
 * Shows different options based on authentication status
 */

import { Link } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton, useUser } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';

export function Navbar() {
  const { user } = useUser();

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold text-primary">
          TEAMFIT
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-4">
          <SignedOut>
            <Link to="/sign-in">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/sign-up">
              <Button>Get Started</Button>
            </Link>
          </SignedOut>

          <SignedIn>
            <Link to="/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
            <Link to="/profile">
              <Button variant="ghost">Profile</Button>
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {user?.firstName || user?.emailAddresses[0]?.emailAddress}
              </span>
              <UserButton afterSignOutUrl="/" />
            </div>
          </SignedIn>
        </div>
      </div>
    </nav>
  );
}
```

Create `frontend/src/components/layout/Layout.tsx`:

```typescript
/**
 * Main layout wrapper component
 * Includes navigation and footer
 */

import { Navbar } from './Navbar';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <p>© 2025 TEAMFIT. Built for remote teams.</p>
      </footer>
    </div>
  );
}
```

Create `frontend/src/components/layout/ProtectedRoute.tsx`:

```typescript
/**
 * Protected route wrapper
 * Redirects to sign-in if not authenticated
 */

import { useAuth } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isLoaded, isSignedIn } = useAuth();

  // Show loading while checking auth status
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to sign-in if not authenticated
  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  return <>{children}</>;
}
```

### Step 11: Create Dashboard Components

Create `frontend/src/components/dashboard/WelcomeCard.tsx`:

```typescript
/**
 * Welcome card for new users (no team assigned)
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export function WelcomeCard() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-blue-500" />
          <CardTitle>Welcome to TEAMFIT!</CardTitle>
        </div>
        <CardDescription>
          Get started by joining a team
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          You're not currently assigned to any team. Contact your organization
          administrator to be added to a team and start participating in
          team-building activities.
        </p>
        <div className="bg-muted p-4 rounded-md">
          <p className="text-sm font-medium">What happens next?</p>
          <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
            <li>Your admin will add you to a team</li>
            <li>You'll be able to view team activities</li>
            <li>You can participate in events and provide feedback</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
```

Create `frontend/src/components/dashboard/TeamInfoCard.tsx`:

```typescript
/**
 * Team information card for existing team members
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Calendar } from 'lucide-react';
import type { DashboardData } from '@/types';

interface TeamInfoCardProps {
  data: DashboardData;
}

export function TeamInfoCard({ data }: TeamInfoCardProps) {
  const { team, organization, teamMembersCount, upcomingEventsCount } = data;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Team</CardTitle>
        <CardDescription>{organization?.name}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Team Name */}
        <div>
          <h3 className="font-semibold text-lg">{team?.name}</h3>
          {team?.description && (
            <p className="text-sm text-muted-foreground mt-1">
              {team.description}
            </p>
          )}
        </div>

        {/* Team Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{teamMembersCount}</p>
              <p className="text-xs text-muted-foreground">Team Members</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
            <Calendar className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{upcomingEventsCount}</p>
              <p className="text-xs text-muted-foreground">Upcoming Events</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" disabled>
            View Team
          </Button>
          <Button variant="outline" className="flex-1" disabled>
            View Events
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Full features coming soon via GitHub Spec-Kit
        </p>
      </CardContent>
    </Card>
  );
}
```

### Step 12: Create Pages

Create `frontend/src/pages/Landing.tsx`:

```typescript
/**
 * Landing page - public homepage
 */

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';

export function Landing() {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center">
        <h1 className="text-5xl font-bold mb-4">
          Build Stronger Remote Teams
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
          AI-powered team-building activities tailored to your team's
          personality, work style, and preferences. Say goodbye to generic
          icebreakers.
        </p>
        <div className="flex gap-4">
          <Link to="/sign-up">
            <Button size="lg">Get Started Free</Button>
          </Link>
          <Link to="/sign-in">
            <Button size="lg" variant="outline">
              Sign In
            </Button>
          </Link>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-4xl">
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold text-lg mb-2">AI-Powered Matching</h3>
            <p className="text-sm text-muted-foreground">
              Activities tailored to your team's unique dynamics
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold text-lg mb-2">Easy Scheduling</h3>
            <p className="text-sm text-muted-foreground">
              Zoom integration and automated reminders
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold text-lg mb-2">Track Engagement</h3>
            <p className="text-sm text-muted-foreground">
              Analytics to improve team satisfaction
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
```

Create `frontend/src/pages/SignIn.tsx`:

```typescript
/**
 * Sign-in page using Clerk components
 */

import { SignIn as ClerkSignIn } from '@clerk/clerk-react';
import { Layout } from '@/components/layout/Layout';

export function SignIn() {
  return (
    <Layout>
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <ClerkSignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          redirectUrl="/dashboard"
        />
      </div>
    </Layout>
  );
}
```

Create `frontend/src/pages/SignUp.tsx`:

```typescript
/**
 * Sign-up page using Clerk components
 */

import { SignUp as ClerkSignUp } from '@clerk/clerk-react';
import { Layout } from '@/components/layout/Layout';

export function SignUp() {
  return (
    <Layout>
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <ClerkSignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          redirectUrl="/dashboard"
        />
      </div>
    </Layout>
  );
}
```

Create `frontend/src/pages/Dashboard.tsx`:

```typescript
/**
 * Main dashboard page
 * Shows different content based on whether user has team assignment
 */

import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { WelcomeCard } from '@/components/dashboard/WelcomeCard';
import { TeamInfoCard } from '@/components/dashboard/TeamInfoCard';
import { useUser as useClerkUser } from '@clerk/clerk-react';
import { useUser } from '@/hooks/useUser';

export function Dashboard() {
  const { user: clerkUser } = useClerkUser();
  const { data: dashboardData, isLoading, error } = useUser();

  return (
    <ProtectedRoute>
      <Layout>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold">
              Welcome back, {clerkUser?.firstName || 'there'}!
            </h1>
            <p className="text-muted-foreground">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading your dashboard...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-md">
              <p>Error loading dashboard data. Please try refreshing the page.</p>
            </div>
          )}

          {/* Dashboard Content */}
          {dashboardData && !isLoading && (
            <div className="space-y-6">
              {/* Show WelcomeCard if no team, TeamInfoCard if has team */}
              {!dashboardData.teamMember ? (
                <WelcomeCard />
              ) : (
                <TeamInfoCard data={dashboardData} />
              )}

              {/* Quick Actions Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 border rounded-lg">
                  <h3 className="font-semibold mb-2">Recent Activity</h3>
                  <p className="text-sm text-muted-foreground">
                    No recent activities yet. Check back after your first event!
                  </p>
                </div>
                <div className="p-6 border rounded-lg">
                  <h3 className="font-semibold mb-2">Your Feedback</h3>
                  <p className="text-sm text-muted-foreground">
                    You haven't submitted any feedback yet.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
```

Create `frontend/src/pages/Profile.tsx`:

```typescript
/**
 * User profile page
 * Shows user information from Clerk and Supabase
 */

import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUser as useClerkUser } from '@clerk/clerk-react';
import { useUser } from '@/hooks/useUser';

export function Profile() {
  const { user: clerkUser } = useClerkUser();
  const { data: dashboardData } = useUser();

  return (
    <ProtectedRoute>
      <Layout>
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Your Profile</h1>

          {/* User Info Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Your TEAMFIT profile details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <img
                  src={clerkUser?.imageUrl}
                  alt={clerkUser?.fullName || 'User'}
                  className="w-16 h-16 rounded-full"
                />
                <div>
                  <p className="font-semibold text-lg">
                    {clerkUser?.fullName || 'No name set'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {clerkUser?.emailAddresses[0]?.emailAddress}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm font-medium">Member Since</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(clerkUser?.createdAt || '').toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm font-medium">Team</span>
                  <span className="text-sm text-muted-foreground">
                    {dashboardData?.team?.name || 'Not assigned'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm font-medium">Role</span>
                  <span className="text-sm text-muted-foreground capitalize">
                    {dashboardData?.teamMember?.role || 'None'}
                  </span>
                </div>
              </div>

              <Button variant="outline" className="w-full" disabled>
                Edit Profile (Coming Soon)
              </Button>
            </CardContent>
          </Card>

          {/* Account Settings Card */}
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your account preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Account settings and preferences will be available in a future update.
              </p>
              <Button variant="outline" disabled>
                Manage Settings (Coming Soon)
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
```

### Step 13: Create Main App Component

Create `frontend/src/App.tsx`:

```typescript
/**
 * Main App component with routing
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { Landing } from './pages/Landing';
import { SignIn } from './pages/SignIn';
import { SignUp } from './pages/SignUp';
import { Dashboard } from './pages/Dashboard';
import { Profile } from './pages/Profile';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY');
}

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/sign-in/*" element={<SignIn />} />
            <Route path="/sign-up/*" element={<SignUp />} />

            {/* Protected routes */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />

            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default App;
```

### Step 14: Update Main Entry Point

Update `frontend/src/main.tsx`:

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### Step 15: Create Basic Tests

Create `frontend/src/test/setup.ts`:

```typescript
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

afterEach(() => {
  cleanup();
});
```

Create `frontend/src/components/dashboard/__tests__/WelcomeCard.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WelcomeCard } from '../WelcomeCard';

describe('WelcomeCard', () => {
  it('renders welcome message', () => {
    render(<WelcomeCard />);
    expect(screen.getByText('Welcome to TEAMFIT!')).toBeInTheDocument();
  });

  it('shows instructions for new users', () => {
    render(<WelcomeCard />);
    expect(
      screen.getByText(/not currently assigned to any team/i)
    ).toBeInTheDocument();
  });
});
```

### Step 16: Update Package.json Scripts

Add to `frontend/package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui"
  }
}
```

## ✅ TESTING YOUR FRONTEND

### Step 1: Start Development Server

```bash
cd frontend
npm run dev
```

Visit `http://localhost:5173` - you should see the landing page!

### Step 2: Test Authentication Flow

1. Click "Get Started" or "Sign In"
2. Sign in with your test user (the one you created in Clerk)
3. Should redirect to `/dashboard`

### Step 3: Test Dashboard

**If user has team assignment:**
- Should see TeamInfoCard with team name
- Should see team member count
- Should see upcoming events count (0 initially)

**If user has NO team assignment:**
- Should see WelcomeCard
- Should see message to contact admin

### Step 4: Test Profile Page

1. Click "Profile" in nav
2. Should see user info from Clerk
3. Should see team/role info if assigned

### Step 5: Run Tests

```bash
npm run test
```

## 🧪 VALIDATION CHECKLIST

- [ ] ✅ Landing page loads at `http://localhost:5173`
- [ ] ✅ Sign-in page works and redirects to dashboard
- [ ] ✅ Dashboard shows correct content based on team assignment
- [ ] ✅ Profile page displays user information
- [ ] ✅ Navigation works between pages
- [ ] ✅ Protected routes redirect unauthenticated users
- [ ] ✅ User button (Clerk) shows in navbar when signed in
- [ ] ✅ Clerk JWT successfully authenticates Supabase queries
- [ ] ✅ Team data loads from Supabase (if user assigned)
- [ ] ✅ Tests pass

## 🎯 SUCCESS CRITERIA

You've successfully completed this prompt when:
- ✅ All pages render without errors
- ✅ Authentication flow works (sign-in → dashboard)
- ✅ Dashboard shows appropriate content per user state
- ✅ Supabase queries work with Clerk JWT
- ✅ RLS policies are respected (users see only their data)
- ✅ Navigation is functional
- ✅ UI is clean and responsive
- ✅ No console errors

## 🚀 NEXT STEPS

After frontend is working:
1. Test with multiple user accounts (different roles)
2. Verify RLS policies work correctly
3. Use GitHub Spec-Kit to add remaining MVP features:
   - Team management CRUD
   - Activity library
   - Event scheduling
   - Feedback system
4. Deploy to DigitalOcean

## 📝 IMPORTANT NOTES

### What's Implemented:
- ✅ Authentication (Clerk)
- ✅ Protected routing
- ✅ Dashboard (minimal MVP)
- ✅ Profile page
- ✅ Direct Supabase queries with RLS
- ✅ Clean, readable code
- ✅ Type safety (TypeScript)

### What's Coming via Spec-Kit:
- ⏭️ Team CRUD operations
- ⏭️ Activity scheduling
- ⏭️ Event management
- ⏭️ Feedback submission
- ⏭️ Analytics dashboards

---

**Remember:** This is your Enhanced UI + Core Dashboard foundation. You'll use GitHub Spec-Kit commands to add full CRUD functionality for teams, activities, and events!

**GOOD LUCK!** 🎉
