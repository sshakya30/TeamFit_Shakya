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
