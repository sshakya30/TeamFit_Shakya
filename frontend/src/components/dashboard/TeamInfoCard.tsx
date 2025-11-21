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
