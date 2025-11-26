/**
 * Placeholder page for activity customization
 * Shows "Coming Soon" message with navigation back to library
 */

import { Link, useParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useActivities } from '@/hooks/useActivities';

export function CustomizePlaceholder() {
  const { activityId } = useParams<{ activityId: string }>();
  const { data: activities } = useActivities();

  const activity = activities?.find((a) => a.id === activityId);

  return (
    <ProtectedRoute>
      <Layout>
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Coming Soon</CardTitle>
              <CardDescription>
                Activity customization is currently under development
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              {activity && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Selected Activity:</p>
                  <p className="font-semibold">{activity.title}</p>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-muted-foreground">
                  Soon you'll be able to customize this activity for your team's specific needs,
                  including adjusting duration, complexity, and instructions.
                </p>
              </div>

              <Link to="/activities">
                <Button variant="outline">
                  Back to Activity Library
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
