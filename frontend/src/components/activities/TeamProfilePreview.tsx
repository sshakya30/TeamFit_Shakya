/**
 * TeamProfilePreview component for displaying team context
 * Shows team profile information before activity customization
 */

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Briefcase, Building, AlertCircle } from 'lucide-react';
import type { TeamProfilePreviewProps } from '@/types';

export function TeamProfilePreview({
  profile,
  isLoading,
  teamName,
  onSetupProfile,
}: TeamProfilePreviewProps) {
  if (isLoading) {
    return (
      <div className="p-4 border rounded-lg space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  // No profile found - show setup prompt
  if (!profile) {
    return (
      <div className="p-4 border border-dashed rounded-lg bg-muted/50">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
          <div className="space-y-2">
            <p className="text-sm font-medium">Team profile not set up</p>
            <p className="text-sm text-muted-foreground">
              Set up your team profile to get better customized activities that
              match your team's needs and preferences.
            </p>
            {onSetupProfile && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSetupProfile}
                className="mt-2"
              >
                Set Up Profile
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg space-y-3">
      <p className="text-sm font-medium text-muted-foreground">Team Context</p>

      <div className="space-y-2">
        {/* Team name */}
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{teamName}</span>
          {profile.team_size && (
            <span className="text-xs text-muted-foreground">
              ({profile.team_size} members)
            </span>
          )}
        </div>

        {/* Industry sector */}
        {profile.industry_sector && (
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{profile.industry_sector}</span>
          </div>
        )}

        {/* Team role description */}
        {profile.team_role_description && (
          <div className="flex items-start gap-2">
            <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5" />
            <span className="text-sm text-muted-foreground line-clamp-2">
              {profile.team_role_description}
            </span>
          </div>
        )}
      </div>

      {/* Past activities summary if available */}
      {profile.past_activities_summary && (
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Recent activities:</span>{' '}
            {profile.past_activities_summary}
          </p>
        </div>
      )}
    </div>
  );
}
