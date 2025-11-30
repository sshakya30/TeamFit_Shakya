/**
 * TeamProfileCard component displays a summary of the team profile
 * Shows industry sector, team size, and role description preview
 * Includes CTA to complete or edit the profile
 *
 * @example
 * <TeamProfileCard teamId={teamId} teamName="Engineering" />
 */

import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useTeamProfile } from '@/hooks/useTeamProfile';

interface TeamProfileCardProps {
  /** Team ID to fetch profile for */
  teamId: string | null;
  /** Team name for display */
  teamName: string;
}

/**
 * Formats team size from number to readable string
 */
function formatTeamSize(size: number | null): string {
  if (!size) return 'Not specified';
  if (size <= 5) return `${size} members (Small)`;
  if (size <= 15) return `${size} members (Medium)`;
  return `${size} members (Large)`;
}

/**
 * Formats industry sector for display
 */
function formatIndustrySector(sector: string | null): string {
  if (!sector) return 'Not specified';
  return sector
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Truncates text to a max length with ellipsis
 */
function truncateText(text: string | null, maxLength: number): string {
  if (!text) return 'Not specified';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

/**
 * Loading skeleton for team profile card
 */
function TeamProfileSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-4 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Empty state when no profile exists
 */
function EmptyProfileState({ teamId }: { teamId: string | null }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Team Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-4">
          <div className="text-3xl mb-2">&#128221;</div>
          <p className="text-sm text-muted-foreground mb-4">
            Complete your team profile to get personalized activity recommendations
          </p>
          {teamId && (
            <Link to={`/team/${teamId}/manage`}>
              <Button size="sm">Complete Profile</Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Profile info row component
 */
function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}

export function TeamProfileCard({ teamId, teamName }: TeamProfileCardProps) {
  const { data: profile, isLoading } = useTeamProfile(teamId);

  // Loading state
  if (isLoading) {
    return <TeamProfileSkeleton />;
  }

  // Empty state - no profile or incomplete
  if (!profile || (!profile.industry_sector && !profile.team_size && !profile.team_role_description)) {
    return <EmptyProfileState teamId={teamId} />;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Team Profile</CardTitle>
          {teamId && (
            <Link to={`/team/${teamId}/manage`}>
              <Button variant="ghost" size="sm" className="text-xs">
                Edit
              </Button>
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <ProfileRow
          label="Industry"
          value={formatIndustrySector(profile.industry_sector)}
        />
        <ProfileRow
          label="Team Size"
          value={formatTeamSize(profile.team_size)}
        />
        <ProfileRow
          label="Role Description"
          value={truncateText(profile.team_role_description, 100)}
        />
      </CardContent>
    </Card>
  );
}
