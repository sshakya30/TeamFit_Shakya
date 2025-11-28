/**
 * Organization Settings Tab Component
 * Allows admins to view and edit organization details
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { updateOrganization } from '@/lib/api';
import type { Organization } from '@/types';

interface OrganizationSettingsTabProps {
  organization: Organization | null;
  isAdmin: boolean;
}

export function OrganizationSettingsTab({ organization, isAdmin }: OrganizationSettingsTabProps) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [orgName, setOrgName] = useState(organization?.name || '');
  const [error, setError] = useState<string | null>(null);

  // Update local state when organization prop changes
  useEffect(() => {
    if (organization) {
      setOrgName(organization.name);
    }
  }, [organization]);

  const updateOrgMutation = useMutation({
    mutationFn: async (name: string) => {
      const token = await getToken();
      if (!token || !organization) throw new Error('Not authenticated');
      return updateOrganization(token, organization.id, { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-dashboard'] });
      setIsEditing(false);
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
    }
  });

  const handleSave = () => {
    if (!orgName.trim()) {
      setError('Organization name is required');
      return;
    }
    updateOrgMutation.mutate(orgName.trim());
  };

  const handleCancel = () => {
    setOrgName(organization?.name || '');
    setIsEditing(false);
    setError(null);
  };

  if (!organization) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No organization found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Organization Details</CardTitle>
              <CardDescription>
                {isAdmin ? 'Manage your organization settings' : 'View organization information'}
              </CardDescription>
            </div>
            <Badge variant={organization.subscription_status === 'active' ? 'default' : 'secondary'}>
              {organization.subscription_plan || 'Free'} Plan
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="org-name">Organization Name</Label>
                <Input
                  id="org-name"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  disabled={updateOrgMutation.isPending}
                  placeholder="Enter organization name"
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={updateOrgMutation.isPending}
                >
                  {updateOrgMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={updateOrgMutation.isPending}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm font-medium">Name</span>
                <span className="text-sm text-muted-foreground">{organization.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm font-medium">Slug</span>
                <span className="text-sm text-muted-foreground">{organization.slug}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm font-medium">Created</span>
                <span className="text-sm text-muted-foreground">
                  {new Date(organization.created_at).toLocaleDateString()}
                </span>
              </div>

              {isAdmin && (
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  Edit Organization
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {!isAdmin && (
        <Alert>
          <AlertDescription>
            Only organization admins can edit organization settings.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
