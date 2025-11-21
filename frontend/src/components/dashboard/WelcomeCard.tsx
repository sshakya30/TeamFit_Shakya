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
