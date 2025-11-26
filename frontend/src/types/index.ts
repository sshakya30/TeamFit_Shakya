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

// Activity Library types
export interface FilterState {
  category: string | null;
  duration: number | null;
  complexity: string | null;
}

export const CATEGORY_OPTIONS = [
  { value: 'tech_it', label: 'Tech/IT' },
  { value: 'finance_accounting', label: 'Finance' },
  { value: 'marketing_creative', label: 'Marketing' },
  { value: 'business_services', label: 'Business Services' },
  { value: 'customer_service', label: 'Customer Service' },
] as const;

export const DURATION_OPTIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
] as const;

export const COMPLEXITY_OPTIONS = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
] as const;

export const CATEGORY_LABELS: Record<string, string> = {
  tech_it: 'Tech/IT',
  finance_accounting: 'Finance',
  marketing_creative: 'Marketing',
  business_services: 'Business Services',
  customer_service: 'Customer Service',
};

export const COMPLEXITY_LABELS: Record<string, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};
