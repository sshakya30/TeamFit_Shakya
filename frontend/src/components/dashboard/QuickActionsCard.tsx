/**
 * Quick actions card showing role-based action buttons
 * Managers and admins see management options
 * Members see participation-focused options
 */

import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface QuickActionsCardProps {
  isManagerOrAdmin: boolean;
  isAdmin: boolean;
  teamId: string | null;
  organizationId: string | null;
}

export function QuickActionsCard({
  isManagerOrAdmin,
  isAdmin,
  teamId,
  organizationId
}: QuickActionsCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* All roles can browse activities */}
          <Link to="/activities">
            <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-1">
              <span className="text-lg">&#128218;</span>
              <span className="text-xs">Browse Activities</span>
            </Button>
          </Link>

          {/* Manager/Admin actions */}
          {isManagerOrAdmin && (
            <>
              <Link to={teamId ? `/team/${teamId}/manage` : '#'}>
                <Button
                  variant="outline"
                  className="w-full h-auto py-4 flex flex-col gap-1"
                  disabled={!teamId}
                >
                  <span className="text-lg">&#128101;</span>
                  <span className="text-xs">Manage Team</span>
                </Button>
              </Link>

              <Link to={teamId ? `/team/${teamId}/invite` : '#'}>
                <Button
                  variant="outline"
                  className="w-full h-auto py-4 flex flex-col gap-1"
                  disabled={!teamId}
                >
                  <span className="text-lg">&#10133;</span>
                  <span className="text-xs">Invite Members</span>
                </Button>
              </Link>
            </>
          )}

          {/* Admin-only actions */}
          {isAdmin && (
            <Link to={organizationId ? `/organization/${organizationId}/settings` : '#'}>
              <Button
                variant="outline"
                className="w-full h-auto py-4 flex flex-col gap-1"
                disabled={!organizationId}
              >
                <span className="text-lg">&#9881;</span>
                <span className="text-xs">Org Settings</span>
              </Button>
            </Link>
          )}

          {/* Member-only actions */}
          {!isManagerOrAdmin && (
            <>
              <Button
                variant="outline"
                className="w-full h-auto py-4 flex flex-col gap-1"
                disabled
              >
                <span className="text-lg">&#128197;</span>
                <span className="text-xs">My Events</span>
              </Button>

              <Button
                variant="outline"
                className="w-full h-auto py-4 flex flex-col gap-1"
                disabled
              >
                <span className="text-lg">&#128172;</span>
                <span className="text-xs">Give Feedback</span>
              </Button>
            </>
          )}
        </div>

        {/* Coming soon notice for disabled features */}
        <p className="text-xs text-muted-foreground text-center mt-4">
          Some features are coming soon. Stay tuned!
        </p>
      </CardContent>
    </Card>
  );
}
