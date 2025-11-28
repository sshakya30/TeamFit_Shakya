/**
 * Create Organization step component
 * Allows admin to create their organization
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCreateOrganization } from '@/hooks/useCreateOrganization';

interface CreateOrganizationStepProps {
  onSuccess: (organizationId: string) => void;
  onBack: () => void;
}

export function CreateOrganizationStep({ onSuccess, onBack }: CreateOrganizationStepProps) {
  const [name, setName] = useState('');
  const createOrganization = useCreateOrganization();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    try {
      const result = await createOrganization.mutateAsync({ name: name.trim() });
      if (result.success && result.organization) {
        onSuccess(result.organization.id);
      }
    } catch (error) {
      // Error is handled by the mutation
      console.error('Failed to create organization:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="org-name">Organization Name</Label>
          <Input
            id="org-name"
            type="text"
            placeholder="e.g., Acme Corporation"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={createOrganization.isPending}
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            This is typically your company or department name.
          </p>
        </div>
      </div>

      {createOrganization.error && (
        <Alert variant="destructive">
          <AlertDescription>
            {createOrganization.error.message}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={createOrganization.isPending}
          className="w-full sm:w-auto"
        >
          Back
        </Button>
        <Button
          type="submit"
          disabled={!name.trim() || createOrganization.isPending}
          className="w-full sm:w-auto sm:ml-auto"
        >
          {createOrganization.isPending ? 'Creating...' : 'Create Organization'}
        </Button>
      </div>
    </form>
  );
}
